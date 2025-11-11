import { NextRequest, NextResponse } from 'next/server'
import { GitHubService, githubService as defaultGithubService } from '@/lib/github-service'
import { generateReadmeProfessional, ReadmeDetails, generateTests, generateCI } from '@/lib/content-generators'

type ActionType = 'readme' | 'tests' | 'ci'

export async function POST(request: NextRequest) {
  try {
    const { owner, repo, action, language }: { owner: string, repo: string, action: ActionType, language?: string } = await request.json()

    if (!owner || !repo || !action) {
      return NextResponse.json({ error: 'owner, repo, and action are required' }, { status: 400 })
    }

    // Prefer per-user OAuth token when available
    const tokenCookie = request.cookies.get('gh_token')?.value
    const svc = tokenCookie ? new GitHubService(tokenCookie) : defaultGithubService

    // Verify repo and get default branch
    const details = await svc.getRepoDetails(owner, repo)
    const baseBranch = details?.default_branch || 'main'
    const branchName = `gitready/${action}`

    // Try direct branch on upstream (requires write permissions)
    let prHeadOwner = owner
    try {
      await svc.createBranch(owner, repo, branchName, baseBranch)
    } catch (err: any) {
      const msg = String(err?.message || '')
      // Fallback to fork if write is not permitted (403)
      if (msg.includes('403')) {
        const me = await svc.getAuthenticatedUser()
        if (!me?.login) throw new Error('Authenticated user not found from token')
        prHeadOwner = me.login
        await svc.forkRepo(owner, repo)
        // Wait until fork is available
        await svc.waitForRepoAvailability(prHeadOwner, repo)
        // Determine default branch of fork (often same as upstream)
        const forkDetails = await svc.getRepoDetails(prHeadOwner, repo)
        const forkBaseBranch = forkDetails?.default_branch || baseBranch
        await svc.createBranch(prHeadOwner, repo, branchName, forkBaseBranch)
      } else {
        throw err
      }
    }

    let path = ''
    let content = ''
    let commitMessage = ''

    switch (action) {
      case 'readme': {
        const lang = language || details?.language || 'JavaScript'
        path = 'README.md'
        // Build repo-aware details
        const root = await svc.getRepoContents(owner, repo).catch(() => [])
        const names = Array.isArray(root) ? root.map((i: any) => i.name) : []
        const pm: ReadmeDetails['packageManager'] = names.includes('pnpm-lock.yaml')
          ? 'pnpm'
          : names.includes('yarn.lock')
          ? 'yarn'
          : names.includes('bun.lockb')
          ? 'bun'
          : names.includes('package-lock.json')
          ? 'npm'
          : names.includes('requirements.txt') || names.includes('pyproject.toml')
          ? 'pip'
          : 'unknown'
        let pkgJson: any = null
        let scripts: ReadmeDetails['scripts'] = {}
        const pkgText = await svc.getFileText(owner, repo, 'package.json')
        if (pkgText) {
          try {
            pkgJson = JSON.parse(pkgText)
            const s = pkgJson.scripts || {}
            scripts = { dev: s.dev, build: s.build, start: s.start, test: s.test, lint: s.lint || s.format || s['lint:fix'] ? 'lint' : undefined }
          } catch {}
        }
        const usesTypeScript = names.includes('tsconfig.json') || !!(pkgJson?.devDependencies?.typescript || pkgJson?.dependencies?.typescript)
        const deps = { ...pkgJson?.dependencies, ...pkgJson?.devDependencies }
        const frameworks: string[] = []
        const maybe = (key: string, label?: string) => { if (deps && deps[key]) frameworks.push(label || key) }
        maybe('react', 'React'); maybe('next', 'Next.js'); maybe('vite', 'Vite'); maybe('express', 'Express'); maybe('nestjs', 'NestJS'); maybe('react-native', 'React Native'); maybe('svelte', 'Svelte'); maybe('@angular/core', 'Angular'); maybe('jest', 'Jest'); maybe('vitest', 'Vitest'); maybe('eslint', 'ESLint'); maybe('prettier', 'Prettier')
        const structure: string[] = []
        ;['src', 'app', 'server', 'tests', 'lib', 'docs'].forEach((dir) => { if (names.includes(dir)) structure.push(`${dir}/`) })
        const testDirs = ['test', 'tests', '__tests__', 'spec', 'specs']
        const hasTests = names.some((n) => testDirs.includes(String(n).toLowerCase())) || !!(scripts.test)
        let hasCI = false
        try { const workflows = await svc.getRepoContents(owner, repo, '.github/workflows'); hasCI = Array.isArray(workflows) && workflows.length > 0 } catch {}
        const readmeDetails: ReadmeDetails = {
          repoName: repo,
          language: lang,
          description: details?.description,
          frameworks,
          usesTypeScript,
          hasTests,
          hasCI,
          topics: details?.topics || [],
          packageManager: pm,
          scripts,
          structure,
        }
        content = generateReadmeProfessional(readmeDetails)
        commitMessage = 'docs: add professional README with setup & usage'
        break
      }
      case 'tests': {
        const lang = language || details?.language || 'JavaScript'
        // Choose a sensible default path based on language
        if (/TypeScript/i.test(lang)) {
          path = 'tests/example.test.ts'
        } else if (/Python/i.test(lang)) {
          path = 'tests/test_example.py'
        } else {
          path = 'tests/example.test.js'
        }
        content = generateTests(repo, lang)
        commitMessage = 'test: add basic example tests'
        break
      }
      case 'ci': {
        path = '.github/workflows/ci.yml'
        content = generateCI(repo)
        commitMessage = 'ci: add GitHub Actions pipeline'
        break
      }
      default:
        return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
    }

    // Create or update file on the new branch
    // Commit to upstream if we have access, otherwise commit to fork
    if (prHeadOwner === owner) {
      await svc.createOrUpdateFile(owner, repo, path, content, branchName, commitMessage)
    } else {
      await svc.createOrUpdateFile(prHeadOwner, repo, path, content, branchName, commitMessage)
    }

    // Open PR
    const prTitle = `chore(${action}): auto-generated ${action} for ${repo}`
    const prBody = `This PR was created automatically to improve ${action.toUpperCase()}.

Changes:
- ${path}

Feel free to edit and merge. 🚀`
    // If head is from fork, use the `owner:branch` syntax
    const headRef = prHeadOwner === owner ? branchName : `${prHeadOwner}:${branchName}`
    const pr = await svc.createPullRequest(owner, repo, headRef, baseBranch, prTitle, prBody)

    return NextResponse.json({ pr_url: pr.html_url, number: pr.number })
  } catch (error: any) {
    const message = String(error?.message || 'Failed to apply changes')
    // Provide structured guidance if the PAT lacks permissions
    if (message.includes('Resource not accessible by personal access token') || message.includes('403')) {
      return NextResponse.json(
        {
          error: 'GitHub token lacks required permissions to write or fork',
          code: 'PAT_SCOPE_INSUFFICIENT',
          details: {
            hint:
              'Use a classic token with repo scope, or a fine-grained token with Contents: Read & write, Pull requests: Read & write, and access to public repos.',
            docs:
              'https://docs.github.com/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token',
          },
          original: message,
        },
        { status: 403 }
      )
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

