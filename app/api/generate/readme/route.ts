import { NextRequest, NextResponse } from 'next/server'
import { GitHubService, githubService as defaultGithubService } from '@/lib/github-service'
import { generateReadmeProfessional, ReadmeDetails } from '@/lib/content-generators'

export async function POST(request: NextRequest) {
  try {
    const { owner, repo, language }: { owner: string, repo: string, language?: string } = await request.json()
    if (!owner || !repo) {
      return NextResponse.json({ error: 'owner and repo are required' }, { status: 400 })
    }

    const tokenCookie = request.cookies.get('gh_token')?.value
    const svc = tokenCookie ? new GitHubService(tokenCookie) : defaultGithubService

    const details = await svc.getRepoDetails(owner, repo)
    const root = await svc.getRepoContents(owner, repo).catch(() => [])
    const languageName = language || details?.language || 'JavaScript'

    // Determine package manager
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

    // Read package.json (if present)
    let pkgJson: any = null
    let scripts: ReadmeDetails['scripts'] = {}
    const pkgText = await svc.getFileText(owner, repo, 'package.json')
    if (pkgText) {
      try {
        pkgJson = JSON.parse(pkgText)
        const s = pkgJson.scripts || {}
        scripts = {
          dev: s.dev,
          build: s.build,
          start: s.start,
          test: s.test,
          lint: s.lint || s.format || s['lint:fix'] ? 'lint' : undefined,
        }
      } catch {}
    }

    // Detect TypeScript and common frameworks/tools
    const usesTypeScript = names.includes('tsconfig.json') || !!(pkgJson?.devDependencies?.typescript || pkgJson?.dependencies?.typescript)
    const deps = {
      ...pkgJson?.dependencies,
      ...pkgJson?.devDependencies,
    }
    const frameworks: string[] = []
    const maybe = (key: string, label?: string) => {
      if (deps && deps[key]) frameworks.push(label || key)
    }
    maybe('react', 'React')
    maybe('next', 'Next.js')
    maybe('vite', 'Vite')
    maybe('express', 'Express')
    maybe('nestjs', 'NestJS')
    maybe('react-native', 'React Native')
    maybe('svelte', 'Svelte')
    maybe('@angular/core', 'Angular')
    maybe('jest', 'Jest')
    maybe('vitest', 'Vitest')
    maybe('eslint', 'ESLint')
    maybe('prettier', 'Prettier')

    // Determine simple structure and signals
    const structure: string[] = []
    ;['src', 'app', 'server', 'tests', 'lib', 'docs'].forEach((dir) => {
      if (names.includes(dir)) structure.push(`${dir}/`)
    })

    // Tests and CI detection
    const testDirs = ['test', 'tests', '__tests__', 'spec', 'specs']
    const hasTests = names.some((n) => testDirs.includes(String(n).toLowerCase())) || !!(scripts.test)
    let hasCI = false
    try {
      const workflows = await svc.getRepoContents(owner, repo, '.github/workflows')
      hasCI = Array.isArray(workflows) && workflows.length > 0
    } catch {}

    const readmeDetails: ReadmeDetails = {
      repoName: repo,
      language: languageName,
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

    const content = generateReadmeProfessional(readmeDetails)
    return NextResponse.json({ content })
  } catch (error: any) {
    const message = String(error?.message || 'Failed to generate README')
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

