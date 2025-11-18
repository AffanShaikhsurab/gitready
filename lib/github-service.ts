import { GitHubUser, GitHubRepo } from './store'

const GITHUB_API_BASE = 'https://api.github.com'

/**
 * GitHub API service with comprehensive endpoint coverage
 * Based on GitHub REST API v2022-11-28
 * @see https://docs.github.com/en/rest
 */
export class GitHubService {
  private token?: string
  private rateLimitCache?: {
    remaining: number
    reset: number
    limit: number
    lastChecked: number
  }
  private readonly RATE_LIMIT_THRESHOLD = 10 // Stop requests if remaining < 10
  private readonly CACHE_TTL = 60000 // Cache rate limit for 60 seconds

  constructor(token?: string) {
    this.token = token
  }

  /**
   * Common headers for all GitHub API requests
   * @see https://docs.github.com/en/rest/using-the-rest-api/getting-started-with-the-rest-api
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    
    return headers
  }

  /**
   * Fetch with retry logic and proper error handling
   */
  private async fetchWithRetry(url: string, retries = 3): Promise<Response> {
    // Check rate limit before making request
    await this.checkRateLimit()

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          headers: this.getHeaders(),
        })

        // Update rate limit cache from response headers
        this.updateRateLimitFromHeaders(response)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Resource not found. Did you spell that right? 🤔')
          }
          if (response.status === 403) {
            const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining')
            if (rateLimitRemaining === '0') {
              const resetTime = response.headers.get('X-RateLimit-Reset')
              const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : null
              throw new Error(`Rate limit exceeded. Resets at ${resetDate?.toLocaleTimeString() || 'unknown'}. Try using a Personal Access Token!`)
            }
            throw new Error('Access forbidden. You might need a Personal Access Token.')
          }
          throw new Error(`GitHub API error: ${response.statusText}`)
        }

        return response
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
    throw new Error('Max retries exceeded')
  }

  /**
   * Generic request with retry support for write operations (POST/PUT)
   */
  private async requestWithRetry(
    url: string,
    options: RequestInit,
    retries = 3
  ): Promise<Response> {
    await this.checkRateLimit()

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...this.getHeaders(),
            ...(options.headers || {}),
          },
        })

        this.updateRateLimitFromHeaders(response)

        if (!response.ok) {
          const text = await response.text().catch(() => '')
          throw new Error(`GitHub API error ${response.status}: ${response.statusText} ${text}`)
        }
        return response
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
    throw new Error('Max retries exceeded')
  }

  /**
   * Check current rate limit status
   * @see https://docs.github.com/en/rest/rate-limit
   */
  async getRateLimit() {
    const response = await fetch(`${GITHUB_API_BASE}/rate_limit`, {
      headers: this.getHeaders(),
    })
    const data = await response.json()
    
    // Update cache
    this.rateLimitCache = {
      remaining: data.rate.remaining,
      reset: data.rate.reset,
      limit: data.rate.limit,
      lastChecked: Date.now(),
    }
    
    return data
  }

  /**
   * Get cached rate limit info without making an API call
   * Returns null if no cache available
   */
  getCachedRateLimit() {
    if (!this.rateLimitCache) return null
    
    const now = Date.now()
    const resetDate = new Date(this.rateLimitCache.reset * 1000)
    const hasReset = now / 1000 > this.rateLimitCache.reset
    
    return {
      remaining: hasReset ? this.rateLimitCache.limit : this.rateLimitCache.remaining,
      limit: this.rateLimitCache.limit,
      reset: resetDate,
      hasReset,
      percentage: ((this.rateLimitCache.remaining / this.rateLimitCache.limit) * 100).toFixed(1),
    }
  }

  /**
   * Check if we're within safe rate limit bounds
   * Updates cache from response headers if available
   */
  private async checkRateLimit(): Promise<void> {
    // Check cache first
    const now = Date.now()
    if (this.rateLimitCache) {
      const { remaining, reset, lastChecked } = this.rateLimitCache
      
      // If cache is still valid
      if (now - lastChecked < this.CACHE_TTL) {
        // Check if reset time has passed
        if (now / 1000 > reset) {
          // Rate limit has reset, clear cache to fetch fresh
          this.rateLimitCache = undefined
        } else if (remaining < this.RATE_LIMIT_THRESHOLD) {
          const resetDate = new Date(reset * 1000)
          throw new Error(
            `⚠️ Rate limit threshold reached! Only ${remaining} requests remaining. ` +
            `Resets at ${resetDate.toLocaleTimeString()}. Please wait or use a Personal Access Token for higher limits.`
          )
        }
        return // Cache is valid and we're within limits
      }
    }

    // Fetch fresh rate limit data
    try {
      await this.getRateLimit()
      
      // Check again after fetching
      if (this.rateLimitCache && this.rateLimitCache.remaining < this.RATE_LIMIT_THRESHOLD) {
        const resetDate = new Date(this.rateLimitCache.reset * 1000)
        throw new Error(
          `⚠️ Rate limit threshold reached! Only ${this.rateLimitCache.remaining} requests remaining. ` +
          `Resets at ${resetDate.toLocaleTimeString()}. Please wait or use a Personal Access Token for higher limits.`
        )
      }
    } catch (error) {
      // If rate limit check fails, log warning but continue (fail open)
      console.warn('Failed to check rate limit:', error)
    }
  }

  /**
   * Update rate limit cache from response headers
   */
  private updateRateLimitFromHeaders(response: Response): void {
    const remaining = response.headers.get('X-RateLimit-Remaining')
    const reset = response.headers.get('X-RateLimit-Reset')
    const limit = response.headers.get('X-RateLimit-Limit')

    if (remaining && reset && limit) {
      this.rateLimitCache = {
        remaining: parseInt(remaining),
        reset: parseInt(reset),
        limit: parseInt(limit),
        lastChecked: Date.now(),
      }
    }
  }

  /**
   * Get user profile (basic info, bio, avatar, follower count)
   * @see https://docs.github.com/en/rest/users
   */
  async getUserData(username: string): Promise<GitHubUser> {
    console.log('[GitHubService] Fetching user data for:', username)
    
    // Edge case: Validate username
    if (!username || !username.trim()) {
      console.error('[GitHubService] Invalid username')
      throw new Error('Username cannot be empty')
    }

    const response = await this.fetchWithRetry(`${GITHUB_API_BASE}/users/${username}`)
    const data = await response.json()
    
    console.log('[GitHubService] User data fetched:', {
      login: data.login,
      public_repos: data.public_repos,
      followers: data.followers
    })

    return {
      login: data.login,
      name: data.name,
      avatar_url: data.avatar_url,
      bio: data.bio,
      public_repos: data.public_repos,
      followers: data.followers,
      following: data.following,
      created_at: data.created_at,
    }
  }

  /**
   * Get public events for a user (activity timeline)
   * @see https://docs.github.com/en/rest/activity/events
   */
  async getUserPublicEvents(username: string, perPage = 100): Promise<any[]> {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/users/${username}/events/public?per_page=${perPage}`
    )
    return await response.json()
  }

  /**
   * List public repositories for a user (with pagination support)
   * @see https://docs.github.com/en/rest/repos/repos
   */
  async getUserRepos(username: string): Promise<GitHubRepo[]> {
    console.log('[GitHubService] Fetching repos for:', username)
    
    // Fetch all public repos (sorted by most recently pushed)
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/users/${username}/repos?per_page=100&sort=pushed`
    )
    const repos = await response.json()

    console.log('[GitHubService] Total repos fetched:', repos.length)

    // Edge case: Check if repos is an array
    if (!Array.isArray(repos)) {
      console.error('[GitHubService] Invalid repos response:', repos)
      throw new Error('Invalid response from GitHub API')
    }

    // IMPORTANT: Filter out forks as they don't represent the user's own code
    const nonForkRepos = repos.filter((repo: any) => !repo.fork)
    
    console.log('[GitHubService] Non-fork repos:', nonForkRepos.length)

    // Edge case: No non-fork repos found
    if (nonForkRepos.length === 0) {
      console.warn('[GitHubService] No non-fork repositories found')
      return []
    }

    // Process each repo to get additional data (limit to top 20 for performance)
    const processedRepos = await Promise.all(
      nonForkRepos.slice(0, 20).map(async (repo: any) => {
        console.log('[GitHubService] Processing repo:', repo.name)
        const repoData: GitHubRepo = {
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          fork: repo.fork,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          language: repo.language,
          pushed_at: repo.pushed_at,
          topics: repo.topics || [],
          has_readme: false,
          readme_length: 0,
          commit_count: 0,
          has_tests: false,
          has_ci: false,
          technologies: [],
        }

        // Try to fetch README
        try {
          const readmeResponse = await this.fetchWithRetry(
            `${GITHUB_API_BASE}/repos/${repo.full_name}/readme`
          )
          const readme = await readmeResponse.json()
          repoData.has_readme = true
          repoData.readme_length = readme.size || 0
        } catch {
          // No README, that's okay (but recruiters will judge 👀)
        }

        // Check for tests (common test directories)
        try {
          const contentsResponse = await this.fetchWithRetry(
            `${GITHUB_API_BASE}/repos/${repo.full_name}/contents`
          )
          const contents = await contentsResponse.json()
          const testDirs = ['test', 'tests', '__tests__', 'spec', 'specs']
          repoData.has_tests = contents.some((item: any) =>
            testDirs.includes(item.name.toLowerCase())
          )

          // Basic technology detection from root contents
          const names = contents.map((c: any) => String(c.name).toLowerCase())
          const has = (n: string) => names.includes(n.toLowerCase())
          if (has('dockerfile')) repoData.technologies!.push('Docker')
          if (has('docker-compose.yml')) repoData.technologies!.push('Docker Compose')
          if (has('package.json')) repoData.technologies!.push('Node.js')
          if (has('vite.config.ts') || has('vite.config.js')) repoData.technologies!.push('Vite')
          if (has('next.config.js') || has('next.config.ts')) repoData.technologies!.push('Next.js')
          if (has('angular.json')) repoData.technologies!.push('Angular')
          if (has('svelte.config.js') || has('svelte.config.ts')) repoData.technologies!.push('Svelte')
          if (has('tailwind.config.js') || has('tailwind.config.ts')) repoData.technologies!.push('Tailwind CSS')
          if (has('build.gradle') || has('settings.gradle') || has('build.gradle.kts')) repoData.technologies!.push('Android')
          if (has('project.godot')) repoData.technologies!.push('Godot')
          if (names.some((n: string) => n.endsWith('.csproj'))) repoData.technologies!.push('C#')
        } catch {
          // Can't determine
        }

        // Check for CI workflows
        try {
          const workflowsResponse = await this.fetchWithRetry(
            `${GITHUB_API_BASE}/repos/${repo.full_name}/contents/.github/workflows`
          )
          const workflows = await workflowsResponse.json()
          repoData.has_ci = Array.isArray(workflows) && workflows.length > 0
          if (repoData.has_ci) repoData.technologies!.push('GitHub Actions')
        } catch {
          // No CI workflows
        }

        // Get commit count by user
        try {
          const commitsResponse = await this.fetchWithRetry(
            `${GITHUB_API_BASE}/repos/${repo.full_name}/commits?author=${username}&per_page=100`
          )
          const commits = await commitsResponse.json()
          repoData.commit_count = commits.length
        } catch {
          repoData.commit_count = 0
        }

        // Parse package.json dependencies for front-end/back-end frameworks
        try {
          const pkgText = await this.getFileText(repo.owner?.login || repo.full_name.split('/')[0], repo.name, 'package.json')
          if (pkgText) {
            const pkg = JSON.parse(pkgText)
            const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
            const depNames = Object.keys(deps).map((d) => d.toLowerCase())
            const addIf = (label: string, predicate: boolean) => { if (predicate) repoData.technologies!.push(label) }
            addIf('React', depNames.includes('react'))
            addIf('Next.js', depNames.includes('next'))
            addIf('Vue', depNames.includes('vue'))
            addIf('Nuxt', depNames.includes('nuxt'))
            addIf('Angular', depNames.includes('@angular/core'))
            addIf('Svelte', depNames.includes('svelte'))
            addIf('Tailwind CSS', depNames.includes('tailwindcss'))
            addIf('Redux', depNames.includes('@reduxjs/toolkit') || depNames.includes('redux'))
            addIf('Express', depNames.includes('express'))
            addIf('NestJS', depNames.includes('@nestjs/core'))
            addIf('TypeScript', depNames.includes('typescript'))
            addIf('Jest', depNames.includes('jest'))
            addIf('Vitest', depNames.includes('vitest'))
          }
        } catch {
          // ignore
        }

        // Python ML detection via requirements.txt
        try {
          const reqText = await this.getFileText(repo.owner?.login || repo.full_name.split('/')[0], repo.name, 'requirements.txt')
          if (reqText) {
            const lower = reqText.toLowerCase()
            const addIf = (label: string, predicate: boolean) => { if (predicate) repoData.technologies!.push(label) }
            addIf('NumPy', lower.includes('numpy'))
            addIf('Pandas', lower.includes('pandas'))
            addIf('scikit-learn', lower.includes('scikit-learn') || lower.includes('sklearn'))
            addIf('TensorFlow', lower.includes('tensorflow'))
            addIf('PyTorch', lower.includes('torch'))
            addIf('FastAPI', lower.includes('fastapi'))
            addIf('Django', lower.includes('django'))
            addIf('Flask', lower.includes('flask'))
          }
        } catch {
          // ignore
        }

        return repoData
      })
    )

    console.log('[GitHubService] Processed repos count:', processedRepos.length)
    return processedRepos
  }

  /**
   * Get repository details (includes fork detection, parent info, topics)
   * @see https://docs.github.com/en/rest/repos/repos
   */
  async getRepoDetails(owner: string, repo: string): Promise<any> {
    const response = await this.fetchWithRetry(`${GITHUB_API_BASE}/repos/${owner}/${repo}`)
    return await response.json()
  }

  /**
   * Get README content (Base64 encoded)
   * @see https://docs.github.com/rest/repos/contents
   */
  async getReadme(owner: string, repo: string): Promise<string | null> {
    try {
      const response = await this.fetchWithRetry(`${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`)
      const data = await response.json()
      // Decode Base64 content
      const content = atob(data.content.replace(/\n/g, ''))
      return content
    } catch {
      return null
    }
  }

  /**
   * Get repository contents at a specific path
   * @see https://docs.github.com/rest/repos/contents
   */
  async getRepoContents(owner: string, repo: string, path = ''): Promise<any[]> {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`
    )
    return await response.json()
  }

  /**
   * Get raw text content of a file from repository contents API
   * Decodes Base64 when type is file; returns null if not found
   * @see https://docs.github.com/rest/repos/contents
   */
  async getFileText(owner: string, repo: string, path: string): Promise<string | null> {
    try {
      const response = await this.fetchWithRetry(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`
      )
      const data = await response.json()
      if (data && data.type === 'file' && data.content) {
        const content = Buffer.from(String(data.content).replace(/\n/g, ''), 'base64').toString('utf-8')
        return content
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * List commits for a repository (optionally filtered by author)
   * @see https://docs.github.com/rest/commits/commits
   */
  async getCommits(owner: string, repo: string, author?: string, perPage = 100): Promise<any[]> {
    const authorParam = author ? `&author=${author}` : ''
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=${perPage}${authorParam}`
    )
    return await response.json()
  }

  /**
   * List pull requests for a repository
   * @see https://docs.github.com/en/rest/pulls/pulls
   */
  async getRepoPullRequests(owner: string, repo: string, state = 'all', perPage = 100): Promise<any[]> {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=${state}&per_page=${perPage}`
    )
    return await response.json()
  }

  /**
   * Search for pull requests authored by a user (site-wide)
   * @see https://docs.github.com/en/rest/search
   */
  async searchUserPullRequests(username: string, perPage = 100): Promise<any> {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/search/issues?q=type:pr+author:${username}&per_page=${perPage}`
    )
    return await response.json()
  }

  /**
   * Get languages breakdown for a repository
   * @see https://docs.github.com/en/rest/repos
   */
  async getRepoLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    const response = await this.fetchWithRetry(`${GITHUB_API_BASE}/repos/${owner}/${repo}/languages`)
    return await response.json()
  }

  /**
   * Get contributors for a repository
   * @see https://docs.github.com/en/rest/repos
   */
  async getRepoContributors(owner: string, repo: string, perPage = 100): Promise<any[]> {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contributors?per_page=${perPage}`
    )
    return await response.json()
  }

  /**
   * List repository branches
   * @see https://docs.github.com/en/rest/branches/branches
   */
  async getRepoBranches(owner: string, repo: string, perPage = 100): Promise<any[]> {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/branches?per_page=${perPage}`
    )
    return await response.json()
  }

  /**
   * List repository releases
   * @see https://docs.github.com/rest/releases/releases
   */
  async getRepoReleases(owner: string, repo: string, perPage = 100): Promise<any[]> {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/releases?per_page=${perPage}`
    )
    return await response.json()
  }

  /**
   * Utility: Extract username from GitHub URL or plain username
   */
  extractUsername(input: string): string {
    console.log('[GitHubService] Extracting username from:', input)
    
    // Edge case: Handle empty or invalid input
    if (!input || typeof input !== 'string') {
      console.error('[GitHubService] Invalid input for username extraction')
      throw new Error('Invalid username input')
    }

    // Remove GitHub URL if present
    const cleaned = input.trim()
      .replace('https://github.com/', '')
      .replace('http://github.com/', '')
      .replace(/\/$/, '') // Remove trailing slash
    
    // Extract just the username
    const username = cleaned.split('/')[0]
    
    // Edge case: Validate extracted username
    if (!username || username.length === 0) {
      console.error('[GitHubService] Could not extract valid username from:', input)
      throw new Error('Could not extract valid username')
    }

    console.log('[GitHubService] Extracted username:', username)
    return username
  }

  /**
   * Branch/Ref helpers
   */
  async getRef(owner: string, repo: string, ref: string): Promise<any> {
    const response = await this.fetchWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/ref/${ref}`
    )
    return await response.json()
  }

  async createBranch(owner: string, repo: string, newBranch: string, fromBranch: string): Promise<void> {
    // Get base branch SHA
    const baseRef = await this.getRef(owner, repo, `heads/${fromBranch}`)
    const sha = baseRef.object?.sha || baseRef.sha

    // Create new ref
    await this.requestWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/refs`,
      {
        method: 'POST',
        body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha }),
      }
    ).catch(async (err: any) => {
      // If branch exists (422), ignore
      const msg = String(err?.message || '')
      if (!msg.includes('422')) throw err
    })
  }

  /**
   * Create or update a file on a branch
   */
  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    branch: string,
    commitMessage: string
  ): Promise<any> {
    // Check if file exists to get sha
    let sha: string | undefined
    try {
      const existing = await this.fetchWithRetry(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`
      )
      const data = await existing.json()
      sha = data.sha
    } catch {
      // Not found
    }

    const b64 = Buffer.from(content, 'utf-8').toString('base64')

    const body = {
      message: commitMessage,
      content: b64,
      branch,
      ...(sha ? { sha } : {}),
    }

    const response = await this.requestWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      }
    )
    return await response.json()
  }

  async createPullRequest(
    owner: string,
    repo: string,
    head: string,
    base: string,
    title: string,
    body: string
  ): Promise<any> {
    const response = await this.requestWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls`,
      {
        method: 'POST',
        body: JSON.stringify({ title, head, base, body }),
      }
    )
    return await response.json()
  }

  /**
   * Get the authenticated user (based on token)
   */
  async getAuthenticatedUser(): Promise<any> {
    const response = await this.requestWithRetry(`${GITHUB_API_BASE}/user`, { method: 'GET' })
    return await response.json()
  }

  /**
   * Fork a repository to the authenticated user's account
   */
  async forkRepo(owner: string, repo: string): Promise<any> {
    const response = await this.requestWithRetry(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/forks`,
      { method: 'POST' }
    )
    return await response.json()
  }

  /**
   * Wait for a repo to be available (useful after fork)
   */
  async waitForRepoAvailability(owner: string, repo: string, timeoutMs = 15000): Promise<any> {
    const start = Date.now()
    let lastError: any
    while (Date.now() - start < timeoutMs) {
      try {
        const details = await this.getRepoDetails(owner, repo)
        if (details && details.full_name) return details
      } catch (e) {
        lastError = e
      }
      await new Promise((r) => setTimeout(r, 1000))
    }
    if (lastError) throw lastError
    throw new Error('Timed out waiting for forked repo availability')
  }

  /**
   * Recursively list repository files and build a bounded code bundle
   * Limits: maxFiles, maxFileSize, allowed extensions
   */
  async getRepoCodeBundle(
    owner: string,
    repo: string,
    options: { maxFiles?: number; maxFileSize?: number; allowExt?: string[] } = {}
  ): Promise<{ manifest: { path: string; size: number }[]; code: string }> {
    const maxFiles = options.maxFiles ?? 60
    const maxFileSize = options.maxFileSize ?? 100_000 // ~100 KB per file
    const allowExt = options.allowExt ?? [
      '.md', '.js', '.ts', '.jsx', '.tsx', '.json', '.yml', '.yaml', '.py', '.java', '.kt', '.cs'
    ]

    const isAllowed = (name: string) => {
      const lower = name.toLowerCase()
      return allowExt.some((ext) => lower.endsWith(ext))
    }

    const queue: string[] = ['']
    const files: { path: string; size: number }[] = []
    let count = 0

    while (queue.length && count < maxFiles) {
      const path = queue.shift() as string
      let items: any[] = []
      try {
        items = await this.getRepoContents(owner, repo, path)
      } catch {
        continue
      }
      for (const it of items) {
        if (count >= maxFiles) break
        if (it.type === 'dir') {
          queue.push(it.path)
        } else if (it.type === 'file') {
          if (!isAllowed(it.name)) continue
          const size = Number(it.size || 0)
          if (size > maxFileSize) continue
          files.push({ path: it.path, size })
          count++
        }
      }
    }

    let code = ''
    for (const f of files) {
      const content = await this.getFileText(owner, repo, f.path)
      if (!content) continue
      const truncated = content.slice(0, maxFileSize)
      code += `\n\n--- ${f.path} (${truncated.length} bytes) ---\n${truncated}\n`
    }

    return { manifest: files, code }
  }
}

/**
 * Singleton instance (can be used without token for basic operations)
 * For authenticated requests, create a new instance: new GitHubService(token)
 */
// IMPORTANT: Do NOT hardcode Personal Access Tokens in source files.
// The service will read a token from the environment at runtime when available.
// Ensure this module is only imported on the server side (Next.js server / API routes)
// so the token is never bundled into client-side code.
export const githubService = new GitHubService(process.env.GITHUB_TOKEN)
