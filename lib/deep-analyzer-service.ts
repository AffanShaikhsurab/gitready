import { GitHubRepo } from './store'
import { GitHubService } from './github-service'

/**
 * Deep Repository Analyzer Service
 * Performs code-level analysis on important repositories
 * to provide recruiter-perspective feedback
 */

// Directories to skip during analysis (reduce context/noise)
export const SKIP_DIRECTORIES = [
    'node_modules', '.git', 'dist', 'build', 'out', '.next', '.nuxt',
    '__pycache__', '.venv', 'venv', 'env', 'virtualenv',
    'vendor', '.cache', 'coverage', '.nyc_output', 'target',
    '.idea', '.vscode', '.gradle', 'bin', 'obj',
    'public/assets', 'static/assets', '.turbo'
]

// File patterns to skip
export const SKIP_FILE_PATTERNS = [
    /package-lock\.json$/i,
    /yarn\.lock$/i,
    /pnpm-lock\.yaml$/i,
    /\.min\.(js|css)$/i,
    /\.map$/i,
    /\.(woff2?|ttf|eot|otf)$/i,
    /\.(png|jpe?g|gif|svg|ico|webp|avif)$/i,
    /\.(mp[34]|avi|mov|webm)$/i,
    /\.(zip|tar|gz|rar|7z)$/i,
    /\.(pdf|doc|docx|xls|xlsx)$/i,
    /LICENSE(\..*)?$/i,
    /\.gitignore$/i,
    /\.npmrc$/i,
    /\.eslintcache$/i,
    /\.DS_Store$/i,
    /Thumbs\.db$/i,
]

// Important files to prioritize in analysis
export const IMPORTANT_FILE_PATTERNS = [
    /^README\.md$/i,
    /^package\.json$/i,
    /^tsconfig\.json$/i,
    /^setup\.py$/i,
    /^requirements\.txt$/i,
    /^pyproject\.toml$/i,
    /^Cargo\.toml$/i,
    /^go\.mod$/i,
    /^pom\.xml$/i,
    /^build\.gradle(\.kts)?$/i,
    /^Dockerfile$/i,
    /^docker-compose\.ya?ml$/i,
    /^\.github\/workflows\/.+\.ya?ml$/i,
    /^(index|main|app|server)\.(ts|tsx|js|jsx|py)$/i,
    /^src\/(index|main|app|App)\.(ts|tsx|js|jsx)$/i,
]

// Role-specific file patterns
const ROLE_FILE_PATTERNS: Record<string, RegExp[]> = {
    'Frontend': [
        /\.(tsx|jsx|vue|svelte)$/i,
        /\.css$/i,
        /\.scss$/i,
        /tailwind\.config/i,
    ],
    'Backend': [
        /\.(py|go|java|rb|rs|php)$/i,
        /^(server|api|routes|controllers)\//i,
        /\.prisma$/i,
        /schema\.(graphql|gql)$/i,
    ],
    'Fullstack': [
        /\.(tsx|jsx|vue|py|go)$/i,
        /^(server|api|client|frontend|backend)\//i,
    ],
    'DevOps': [
        /^\.github\/workflows\//i,
        /Dockerfile/i,
        /docker-compose/i,
        /\.ya?ml$/i,
        /terraform/i,
        /Jenkinsfile/i,
    ],
    'Data Science': [
        /\.ipynb$/i,
        /\.py$/i,
        /requirements\.txt$/i,
        /^(notebooks|data|models)\//i,
    ],
}

export interface RepoTreeItem {
    path: string
    type: 'blob' | 'tree'
    size?: number
}

export interface DeepRepoAnalysis {
    repo_name: string
    overall_rating: 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor'
    recruiter_summary: string

    strengths: Array<{
        area: string
        evidence: string
        recruiter_impact: string
    }>

    improvements: Array<{
        area: string
        current_state: string
        recommended_action: string
        effort_level: 'Quick Win' | 'Medium' | 'Significant'
        priority: 'High' | 'Medium' | 'Low'
    }>

    code_quality_signals: {
        structure: number       // 0-5
        documentation: number   // 0-5
        testing: number         // 0-5
        best_practices: number  // 0-5
    }
}

export interface ImportantRepoScore {
    repo: GitHubRepo
    score: number
    reasons: string[]
}

/**
 * Calculate importance score for a repository
 * Higher score = more important for deep analysis
 */
export function calculateRepoImportance(repo: GitHubRepo, targetRole: string): ImportantRepoScore {
    let score = 0
    const reasons: string[] = []

    // Stars indicate community interest
    if (repo.stargazers_count >= 10) {
        score += 30
        reasons.push(`${repo.stargazers_count} stars - community validated`)
    } else if (repo.stargazers_count >= 3) {
        score += 15
        reasons.push(`${repo.stargazers_count} stars`)
    }

    // Forks indicate others building on your work
    if (repo.forks_count >= 5) {
        score += 25
        reasons.push(`${repo.forks_count} forks - others are using this`)
    } else if (repo.forks_count >= 2) {
        score += 10
        reasons.push(`${repo.forks_count} forks`)
    }

    // Recent activity shows maintained project
    const pushedDate = new Date(repo.pushed_at)
    const daysSincePush = (Date.now() - pushedDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSincePush < 30) {
        score += 20
        reasons.push('Recently active')
    } else if (daysSincePush < 90) {
        score += 10
        reasons.push('Active in last 3 months')
    }

    // Commit count shows sustained work
    if (repo.commit_count >= 50) {
        score += 20
        reasons.push(`${repo.commit_count} commits - substantial work`)
    } else if (repo.commit_count >= 20) {
        score += 10
        reasons.push(`${repo.commit_count} commits`)
    }

    // Role alignment - boost if language matches target role
    const roleLanguages: Record<string, string[]> = {
        'Frontend': ['TypeScript', 'JavaScript', 'Vue', 'CSS', 'SCSS'],
        'Backend': ['Python', 'Go', 'Java', 'Ruby', 'Rust', 'PHP', 'C#'],
        'Fullstack': ['TypeScript', 'JavaScript', 'Python', 'Go'],
        'DevOps': ['Shell', 'Python', 'Go', 'HCL'],
        'Data Science': ['Python', 'R', 'Jupyter Notebook', 'Julia'],
    }

    if (repo.language && roleLanguages[targetRole]?.includes(repo.language)) {
        score += 15
        reasons.push(`${repo.language} matches ${targetRole} role`)
    }

    // Has README shows documentation care
    if (repo.has_readme) {
        score += 10
        reasons.push('Has README')
    }

    // Has tests shows quality mindset
    if (repo.has_tests) {
        score += 15
        reasons.push('Has tests')
    }

    // Has CI shows DevOps awareness
    if (repo.has_ci) {
        score += 10
        reasons.push('Has CI/CD')
    }

    // Topics show intentional organization
    if (repo.topics && repo.topics.length > 0) {
        score += 5
        reasons.push('Uses topics for organization')
    }

    return { repo, score, reasons }
}

/**
 * Rank repositories by importance for deep analysis
 * Returns top N most important repos
 */
export function rankReposByImportance(
    repos: GitHubRepo[],
    targetRole: string,
    limit: number = 3
): ImportantRepoScore[] {
    const scored = repos.map(repo => calculateRepoImportance(repo, targetRole))
    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, limit)
}

/**
 * Check if a file path should be skipped
 */
export function shouldSkipPath(path: string): boolean {
    // Check directory patterns
    const pathParts = path.split('/')
    for (const part of pathParts) {
        if (SKIP_DIRECTORIES.includes(part)) {
            return true
        }
    }

    // Check file patterns
    const filename = pathParts[pathParts.length - 1]
    for (const pattern of SKIP_FILE_PATTERNS) {
        if (pattern.test(filename) || pattern.test(path)) {
            return true
        }
    }

    return false
}

/**
 * Check if a file is considered important
 */
export function isImportantFile(path: string): boolean {
    for (const pattern of IMPORTANT_FILE_PATTERNS) {
        if (pattern.test(path)) {
            return true
        }
    }
    return false
}

/**
 * Check if a file matches the target role
 */
export function matchesRole(path: string, targetRole: string): boolean {
    const patterns = ROLE_FILE_PATTERNS[targetRole] || []
    for (const pattern of patterns) {
        if (pattern.test(path)) {
            return true
        }
    }
    return false
}

/**
 * Filter and prioritize files from repo tree
 * Returns files sorted by relevance for AI analysis
 */
export function filterAndPrioritizeFiles(
    tree: RepoTreeItem[],
    targetRole: string,
    maxFiles: number = 30
): RepoTreeItem[] {
    // Filter to only relevant files
    const filtered = tree.filter(item => {
        if (item.type !== 'blob') return false
        if (shouldSkipPath(item.path)) return false
        // Skip very large files (> 100KB)
        if (item.size && item.size > 100000) return false
        return true
    })

    // Score and sort files
    const scored = filtered.map(item => {
        let score = 0
        if (isImportantFile(item.path)) score += 100
        if (matchesRole(item.path, targetRole)) score += 50
        // Prefer smaller files (less noise)
        if (item.size && item.size < 5000) score += 20
        // Prefer files in src or lib directories
        if (/^(src|lib|app)\//i.test(item.path)) score += 30
        // Prefer test files
        if (/\.(test|spec)\./i.test(item.path)) score += 25
        return { item, score }
    })

    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, maxFiles).map(s => s.item)
}

/**
 * Fetch tree and important file contents for a repository
 */
export async function fetchRepoForAnalysis(
    service: GitHubService,
    owner: string,
    repo: string,
    targetRole: string
): Promise<{
    tree: RepoTreeItem[]
    files: Array<{ path: string; content: string }>
}> {
    // Note: We'll implement the actual tree fetching in the API route
    // since GitHubService may need enhancement
    return { tree: [], files: [] }
}

/**
 * Build the AI prompt for deep repository analysis
 */
export function buildDeepAnalysisPrompt(
    repoName: string,
    description: string | null,
    targetRole: string,
    seniority: string,
    treeOverview: string,
    fileContents: Array<{ path: string; content: string }>
): string {
    const filesSection = fileContents
        .map(f => `### ${f.path}\n\`\`\`\n${f.content.slice(0, 3000)}\n\`\`\``)
        .join('\n\n')

    return `You are a senior technical recruiter and engineering manager reviewing a candidate's GitHub repository.

**Context:**
- Repository: ${repoName}
- Description: ${description || 'No description provided'}
- Candidate is applying for: ${targetRole} position at ${seniority} level

**Repository Structure:**
${treeOverview}

**Key Files:**
${filesSection}

**Your Task:**
Analyze this repository from a recruiter's perspective. Consider:
1. Would you want to discuss this project in an interview?
2. Does this demonstrate professional engineering practices?
3. What specific improvements would make this more impressive?

**Return a JSON object with this exact structure:**
{
  "overall_rating": "Excellent" | "Good" | "Needs Improvement" | "Poor",
  "recruiter_summary": "<2-3 sentences summarizing your impression as a recruiter>",
  "strengths": [
    {
      "area": "<area name>",
      "evidence": "<specific evidence from the code>",
      "recruiter_impact": "<why this matters in hiring>"
    }
  ],
  "improvements": [
    {
      "area": "<area name>",
      "current_state": "<what exists now>",
      "recommended_action": "<specific action to take>",
      "effort_level": "Quick Win" | "Medium" | "Significant",
      "priority": "High" | "Medium" | "Low"
    }
  ],
  "code_quality_signals": {
    "structure": <0-5>,
    "documentation": <0-5>,
    "testing": <0-5>,
    "best_practices": <0-5>
  }
}

Be specific and reference actual code/files. Be honest but constructive.`
}
