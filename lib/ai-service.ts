import { GoogleGenerativeAI } from '@google/generative-ai'
import { GitHubUser, GitHubRepo, AnalysisResult } from './store'
import { getRequirements } from './job-taxonomy'
import { githubService } from './github-service'

export class AIService {
  private genAI: GoogleGenerativeAI | null = null

  constructor() {
    // Initialize Gemini if API key is available
    // Use server-side environment variable for security
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey)
    }
  }

  async analyzeProfile(
    user: GitHubUser,
    repos: GitHubRepo[],
    role: string,
    seniority: string
  ): Promise<AnalysisResult> {
    console.log('[AIService] Starting analysis with:', {
      username: user.login,
      repoCount: repos.length,
      role,
      seniority,
      hasAPIKey: !!this.genAI
    })

    // Edge case: No repos to analyze
    if (!repos || repos.length === 0) {
      console.warn('[AIService] No repositories found for user')
      return this.getMockAnalysis(user, [], role, seniority)
    }

    // If no API key, return mock data with jokes
    if (!this.genAI) {
      console.log('[AIService] No API key found, using mock analysis')
      return this.getMockAnalysis(user, repos, role, seniority)
    }

    try {
      console.log('[AIService] Calling Gemini API with retry logic...')
      // Use the correct model name according to latest docs
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

      const prompt = await this.buildPrompt(user, repos, role, seniority)
      
      // Generate content with retry logic for handling service unavailability
      const result = await this.generateContentWithRetry(model, prompt)
      const response = result.response
      const text = await response.text()

      console.log('[AIService] Received AI response, parsing...')

      // Parse JSON response from AI
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const analysisData = JSON.parse(jsonMatch[0])
        console.log('[AIService] Successfully parsed AI response')
        return this.formatAnalysisResult(analysisData, user, repos)
      }

      console.warn('[AIService] Could not parse AI response, using mock data')
      return this.getMockAnalysis(user, repos, role, seniority)
    } catch (error) {
      console.error('[AIService] AI analysis failed after retries:', error)
      return this.getMockAnalysis(user, repos, role, seniority)
    }
  }

  private async generateContentWithRetry(model: any, prompt: string, maxRetries: number = 3): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[AIService] API attempt ${attempt}/${maxRetries}`)
        const result = await model.generateContent(prompt)
        return result
      } catch (error: any) {
        console.error(`[AIService] API attempt ${attempt} failed:`, error.message)
        
        // Check if it's a 503 service unavailable error
        const isServiceUnavailable = error.message?.includes('503') ||
                                     error.message?.includes('Service Unavailable') ||
                                     error.message?.includes('overloaded')
        
        // If it's the last attempt or not a service unavailable error, throw the error
        if (attempt === maxRetries || !isServiceUnavailable) {
          throw error
        }
        
        // Calculate exponential backoff delay (1s, 2s, 4s)
        const delayMs = Math.pow(2, attempt - 1) * 1000
        console.log(`[AIService] Retrying in ${delayMs}ms...`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
    
    throw new Error('Max retries exceeded')
  }

  private async buildPrompt(user: GitHubUser, repos: GitHubRepo[], role: string, seniority: string): Promise<string> {
    const repoSummary = repos.map(r => ({
      name: r.name,
      full_name: r.full_name,
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      has_readme: r.has_readme,
      has_tests: r.has_tests,
      has_ci: r.has_ci,
      commits: r.commit_count,
      technologies: r.technologies || [],
      topics: r.topics || [],
      description: r.description || ''
    }))

    const reqs = getRequirements(role as any, (seniority === 'Mid-level' ? 'Mid' : seniority) as any)

    const topWithReadme = repos.filter(r => r.has_readme).slice(0, 3)
    const readmeSnippets: { repo: string; snippet: string }[] = []
    for (const r of topWithReadme) {
      const owner = r.full_name.split('/')[0]
      const text = await githubService.getReadme(owner, r.name)
      const snippet = (text || '').slice(0, 800)
      readmeSnippets.push({ repo: r.full_name, snippet })
    }

    return `You are a brutally honest but funny tech recruiter analyzing a GitHub profile. Be witty, use developer jokes, and reference common GitHub/coding culture.

User: ${user.name || user.login}
Bio: ${user.bio || 'No bio (mysterious... or just lazy?)'}
Repos: ${user.public_repos}
Followers: ${user.followers}
Target Domain: ${role}
Level: ${seniority}

Repositories (non-forks only):
${JSON.stringify(repoSummary, null, 2)}

Target job requirements (domain/level-based):
${JSON.stringify(reqs || { skills: [], frameworks: [], deliverables: [], patterns: [] }, null, 2)}

Top README snippets for context:
${JSON.stringify(readmeSnippets, null, 2)}

Analyze this profile and return a JSON object with:
{
  "score": <number 0-100>,
  "tier": <"Production Ready" | "Strong Signal" | "Needs Work" | "404 Not Found">,
  "summary": <2-3 funny but honest sentences about their employability>,
  "signals": [
    {"title": "Consistency", "value": <0-5>},
    {"title": "Documentation", "value": <0-5>},
    {"title": "Quality Signals", "value": <0-5>}
  ],
  "issues": [
    { "title": <string>, "evidence": <string>, "why": <string>, "confidence": <"High"|"Medium"|"Low">, "fix": <string> }
  ],
  "actions": [
    { "number": "01", "title": <string>, "description": <string>, "effort": <"☕"|"☕☕"|"☕☕☕"|"🧠">, "link": "#" }
  ],
  "domainRecommendation": [ { "domain": <string>, "confidence": <0-1> } ],
  "improvementPlan": [ <string steps focused on current repos> ],
  "projectIdeas": [ { "title": <string>, "outline": <string>, "targetSkills": [<strings>] } ],
  "techUsage": [ { "technology": <string>, "usageScore": <0-1> } ],
  "jobGaps": [ { "requirement": <string>, "status": <"missing"|"partial"|"met">, "suggestion": <string> } ],
  "repoRecommendations": [
    {
      "repo": <string>,
      "decision": <"improve"|"new">,
      "reasons": [<string>],
      "improvements": [<string>],
      "newProjectIdea": { "title": <string>, "outline": <string>, "targetUsers": <string>, "differentiation": <string> },
      "growthPlan": [<string>]
    }
  ]
}

Be specific, reference actual repo data, compare against the provided requirements, and suggest integrating missing tech into existing repos wherever it makes sense. Keep it fun.`
  }

  private formatAnalysisResult(data: any, user: GitHubUser, repos: GitHubRepo[]): AnalysisResult {
    console.log('[AIService] Formatting analysis result...')
    
    // Edge case: Ensure data is valid
    if (!data || typeof data !== 'object') {
      console.warn('[AIService] Invalid analysis data, using defaults')
      data = {}
    }

    const topLanguage = this.getTopLanguage(repos)
    
    // Compute deterministic signals from actual repo data
    const hasReadmes = repos.filter(r => r.has_readme).length
    const hasTests = repos.filter(r => r.has_tests).length
    const hasCI = repos.filter(r => r.has_ci).length
    const totalCommits = repos.reduce((sum, r) => sum + (r.commit_count || 0), 0)
    const signals = [
      { title: 'Consistency (The git log Test)', value: Math.min(Math.floor(totalCommits / 20), 5), max: 5 },
      { title: 'Clarity (The README Test)', value: Math.min(Math.floor(hasReadmes / 2), 5), max: 5 },
      { title: 'Craftsmanship (Code Quality)', value: Math.min(hasTests + hasCI, 5), max: 5 },
    ]

    // Ensure issues array has all required fields
    const issues = (data.issues || []).map((issue: any) => ({
      title: issue.title || 'Issue',
      evidence: issue.evidence || 'No evidence',
      why: issue.why || 'No explanation',
      confidence: (issue.confidence === 'High' || issue.confidence === 'Medium' || issue.confidence === 'Low') 
        ? issue.confidence 
        : 'Medium',
      fix: issue.fix || 'No fix suggested'
    }))

    // Ensure actions array has all required fields
    const actions = (data.actions || []).map((action: any, index: number) => ({
      number: action.number || String(index + 1).padStart(2, '0'),
      title: action.title || 'Action',
      description: action.description || 'No description',
      effort: action.effort || '☕',
      link: action.link || '#'
    }))

    const result: AnalysisResult = {
      score: Math.min(Math.max(data.score || 75, 0), 100),
      tier: data.tier || 'Strong Signal',
      summary: data.summary || "You're on the right track!",
      signals,
      issues,
      actions,
      topLanguage,
      domainRecommendation: (data.domainRecommendation || []).map((d: any) => ({
        domain: String(d.domain || 'Front Web'),
        confidence: Math.max(0, Math.min(1, Number(d.confidence || 0.6)))
      })),
      improvementPlan: Array.isArray(data.improvementPlan) ? data.improvementPlan : [],
      projectIdeas: (data.projectIdeas || []).map((p: any) => ({
        title: String(p.title || 'Project Idea'),
        outline: String(p.outline || ''),
        targetSkills: Array.isArray(p.targetSkills) ? p.targetSkills : []
      })),
      techUsage: (data.techUsage || []).map((t: any) => ({
        technology: String(t.technology || 'Unknown'),
        usageScore: Math.max(0, Math.min(1, Number(t.usageScore || 0)))
      })),
      jobGaps: (data.jobGaps || []).map((g: any) => ({
        requirement: String(g.requirement || ''),
        status: (g.status === 'missing' || g.status === 'partial' || g.status === 'met') ? g.status : 'partial',
        suggestion: String(g.suggestion || '')
      })),
      repoRecommendations: (data.repoRecommendations || []).map((r: any) => ({
        repo: String(r.repo || ''),
        decision: r.decision === 'new' ? 'new' : 'improve',
        reasons: Array.isArray(r.reasons) ? r.reasons : [],
        improvements: Array.isArray(r.improvements) ? r.improvements : [],
        newProjectIdea: r.newProjectIdea ? {
          title: String(r.newProjectIdea.title || ''),
          outline: String(r.newProjectIdea.outline || ''),
          targetUsers: String(r.newProjectIdea.targetUsers || ''),
          differentiation: String(r.newProjectIdea.differentiation || '')
        } : undefined,
        growthPlan: Array.isArray(r.growthPlan) ? r.growthPlan : []
      })),
    }

    console.log('[AIService] Formatted result:', result)
    return result
  }

  private getTopLanguage(repos: GitHubRepo[]): string {
    const languages: Record<string, number> = {}
    repos.forEach(repo => {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1
      }
    })

    const sorted = Object.entries(languages).sort((a, b) => b[1] - a[1])
    return sorted[0]?.[0] || 'JavaScript'
  }

  private getMockAnalysis(user: GitHubUser, repos: GitHubRepo[], role: string, seniority: string): AnalysisResult {
    console.log('[AIService] Generating mock analysis...')
    
    // Edge case: Handle empty repos array
    if (!repos || repos.length === 0) {
      console.warn('[AIService] No repos provided for mock analysis')
      return {
        score: 30,
        tier: '404 Not Found',
        summary: `Hmm, we couldn't find any public repos (that aren't forks). Either you're super secretive or it's time to start pushing some code! 🕵️`,
        signals: [
          { title: 'Consistency (The git log Test)', value: 0, max: 5 },
          { title: 'Clarity (The README Test)', value: 0, max: 5 },
          { title: 'Craftsmanship (Code Quality)', value: 0, max: 5 },
        ],
        issues: [
          {
            title: 'Ghost Profile: 404 Repos Not Found',
            evidence: 'Zero public repositories available',
            why: 'Recruiters need to see your work. An empty profile = invisible developer.',
            confidence: 'High' as const,
            fix: 'Create and push at least 3 portfolio projects'
          }
        ],
        actions: [
          {
            number: '01',
            title: '🚀 Create Your First Project',
            description: 'Start with something simple but complete. A to-do app with tests beats an unfinished rocket ship.',
            effort: '☕☕',
            link: '#'
          },
          {
            number: '02',
            title: '📝 Document Everything',
            description: 'Add READMEs with screenshots, setup instructions, and what you learned.',
            effort: '☕',
            link: '#'
          },
          {
            number: '03',
            title: '🎯 Make It Public',
            description: 'Your best work should be visible. Privacy is great, but not for your portfolio.',
            effort: '☕',
            link: `https://github.com/${user.login}`
          },
        ],
        topLanguage: 'Unknown',
        domainRecommendation: [{ domain: role as any, confidence: 0.5 }],
        improvementPlan: ['Create 3 repos with README, tests, and CI'],
        projectIdeas: [
          { title: `${role} Starter Project`, outline: 'Build a small app demonstrating fundamentals.', targetSkills: ['Git', 'Docs', 'Tests'] }
        ],
        techUsage: [],
        jobGaps: [
          { requirement: 'Basic portfolio projects', status: 'missing', suggestion: 'Start with a simple, complete app and document it.' }
        ],
        repoRecommendations: [
          { repo: '', decision: 'new', reasons: ['No repositories to improve'], improvements: [], newProjectIdea: { title: `${role} Starter Project`, outline: 'Simple but complete app with docs, tests, CI', targetUsers: 'Recruiters and hiring teams', differentiation: 'Demonstrates fundamentals clearly' }, growthPlan: ['Iterate weekly', 'Add tests', 'Ship CI'] }
        ]
      }
    }

    const topLanguage = this.getTopLanguage(repos)
    const hasReadmes = repos.filter(r => r.has_readme).length
    const hasTests = repos.filter(r => r.has_tests).length
    const hasCI = repos.filter(r => r.has_ci).length
    const totalCommits = repos.reduce((sum, r) => sum + r.commit_count, 0)

    // Aggregate technologies usage across repos
    const techCounts: Record<string, number> = {}
    repos.forEach(r => (r.technologies || []).forEach(t => { techCounts[t] = (techCounts[t] || 0) + 1 }))
    const techUsage = Object.entries(techCounts)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 10)
      .map(([technology, count]) => ({ technology, usageScore: Math.min(1, count / repos.length) }))

    const reqs = getRequirements(role as any, (seniority === 'Mid-level' ? 'Mid' : seniority) as any)
    const requiredTech = new Set([...(reqs?.skills || []), ...(reqs?.frameworks || [])].map(s => s.toLowerCase()))
    const userTech = new Set(Object.keys(techCounts).map(s => s.toLowerCase()))
    const gaps: { requirement: string; status: 'missing'|'partial'|'met'; suggestion: string }[] = []
    requiredTech.forEach(req => {
      const met = userTech.has(req)
      gaps.push({ requirement: req, status: met ? 'met' : 'missing', suggestion: met ? 'Already present' : `Integrate ${req} into your main project if relevant` })
    })
    const domainRecommendation = [{ domain: role as any, confidence: Math.min(1, techUsage.length ? techUsage[0].usageScore + 0.3 : 0.6) }]

    console.log('[AIService] Mock analysis stats:', {
      topLanguage,
      hasReadmes,
      hasTests,
      hasCI,
      totalCommits,
      repoCount: repos.length
    })

    let score = 50
    score += Math.min(hasReadmes * 5, 25)
    score += Math.min(hasTests * 8, 20)
    score += Math.min(hasCI * 10, 15)
    score = Math.min(score, 95)

    const tier = score >= 85 ? 'Production Ready' : score >= 70 ? 'Strong Signal' : score >= 50 ? 'Needs Work' : '404 Not Found'

    const result: AnalysisResult = {
      score,
      tier,
      summary: `You've got ${repos.length} repos showing real work (no forks, we checked 👀). Your ${topLanguage} game is showing promise. With a few tweaks, recruiters will be sliding into your DMs faster than a "git push --force" on Friday afternoon.`,
      signals: [
        { title: 'Consistency (The git log Test)', value: Math.min(Math.floor(totalCommits / 20), 5), max: 5 },
        { title: 'Clarity (The README Test)', value: Math.min(Math.floor(hasReadmes / 2), 5), max: 5 },
        { title: 'Craftsmanship (Code Quality)', value: Math.min(hasTests + hasCI, 5), max: 5 },
      ],
      issues: [
        ...(hasReadmes < repos.length ? [{
          title: 'README.md? More like README.404',
          evidence: `${repos.length - hasReadmes} repos are flying blind without documentation`,
          why: 'Recruiters judge a book by its README. No README = "this developer doesn\'t care about others."',
          confidence: 'High' as const,
          fix: 'Add a simple What/Why/How README to your top 3 repos'
        }] : []),
        ...(hasTests === 0 ? [{
          title: 'Tests? We don\'t need no stinking tests!',
          evidence: 'Zero test directories found (yikes)',
          why: 'Senior devs write tests. Junior devs skip them. Which one are you applying as?',
          confidence: 'High' as const,
          fix: 'Add a /tests folder with even basic test cases'
        }] : []),
        ...(hasCI === 0 ? [{
          title: 'CI/CD stands for "Can I? Can\'t Do!"',
          evidence: 'No GitHub Actions workflows detected',
          why: 'Automated testing shows you care about code quality and professional workflows',
          confidence: 'Medium' as const,
          fix: 'Add a simple GitHub Actions workflow for your main project'
        }] : []),
      ],
      actions: [
        {
          number: '01',
          title: '📌 Pin Your Best Work',
          description: `You've got ${repos.length} repos, but recruiters only see your pinned ones. Choose wisely, young padawan.`,
          effort: '☕',
          link: `https://github.com/${user.login}`
        },
        {
          number: '02',
          title: '📝 README Revolution',
          description: 'Every repo without a README is a missed opportunity. Think of it as your elevator pitch, but in Markdown.',
          effort: '☕☕',
          link: '#'
        },
        {
          number: '03',
          title: '✅ Test Like You Mean It',
          description: 'Tests aren\'t just for paranoid developers (they are, but that\'s beside the point). They signal professionalism.',
          effort: '🧠',
          link: '#'
        },
      ],
      topLanguage,
      domainRecommendation,
      improvementPlan: [
        hasReadmes < repos.length ? 'Add README to top repos with setup and screenshots' : 'Keep READMEs updated',
        hasTests === 0 ? 'Introduce basic unit tests in the main project' : 'Increase test coverage',
        hasCI === 0 ? 'Add a simple CI workflow for build and tests' : 'Expand CI with linting'
      ],
      projectIdeas: [
        { title: `${role} Showcase`, outline: 'A polished app demonstrating domain fundamentals and best practices.', targetSkills: Array.from(requiredTech).slice(0,5) },
      ],
      techUsage,
      jobGaps: gaps,
      repoRecommendations: repos.slice(0, 3).map(r => {
        const lacksDocs = !r.has_readme
        const lacksTests = !r.has_tests
        const lacksCI = !r.has_ci
        const lowSignal = (r.stargazers_count + r.forks_count) === 0
        const reasons: string[] = []
        if (lacksDocs) reasons.push('Missing README')
        if (lacksTests) reasons.push('No tests')
        if (lacksCI) reasons.push('No CI')
        if (lowSignal) reasons.push('Low external signal (stars/forks)')
        const decision: 'improve' | 'new' = (lowSignal && lacksDocs && lacksTests) ? 'new' : 'improve'
        const improvements = decision === 'improve' ? [
          lacksDocs ? 'Add README with setup, screenshots, and problem statement' : 'Enhance README with user-centric docs',
          lacksTests ? 'Add unit tests and basic coverage' : 'Increase test coverage and add integration tests',
          lacksCI ? 'Add CI workflow for test/build' : 'Expand CI with lint/lint-staged'
        ] : []
        const newProjectIdea = decision === 'new' ? {
          title: `${role} Problem-Solver App`,
          outline: 'Solve a real pain point with clear scope, metrics, and polish.',
          targetUsers: 'Specific niche users aligned to role',
          differentiation: 'Demonstrates unique approach and measurable outcomes'
        } : undefined
        const growthPlan = [
          'Define target users and success metrics',
          'Collect feedback and iterate weekly',
          'Add analytics and improve onboarding'
        ]
        return { repo: r.full_name, decision, reasons, improvements, newProjectIdea, growthPlan }
      })
    }

    console.log('[AIService] Mock analysis complete:', result)
    return result
  }

  async analyzeRepoCode(
    owner: string,
    repo: string,
    bundle: { manifest: { path: string; size: number }[]; code: string },
    role: string,
    seniority: string
  ): Promise<string> {
    const reqs = getRequirements(role as any, (seniority === 'Mid-level' ? 'Mid' : seniority) as any)
    const manifestText = JSON.stringify(bundle.manifest.slice(0, 100), null, 2)
    const codeText = bundle.code.slice(0, 250_000)

    const prompt = `You are reviewing a GitHub repository's source code to give job-ready improvement guidance.

Target Domain: ${role}
Level: ${seniority}
Job Requirements: ${JSON.stringify(reqs || { skills: [], frameworks: [], deliverables: [], patterns: [] }, null, 2)}

Repository: ${owner}/${repo}
Manifest (subset):
${manifestText}

Code Bundle (truncated):
${codeText}

Return ONLY a valid JSON object (no markdown, no comments) that focuses on holistic, job-description-driven guidance (NOT per-file diffs). Use this exact schema:
{
  "job_alignment": [<how current app aligns to role+level expectations>],
  "capability_gaps": [<missing skills/frameworks/patterns vs requirements>],
  "feature_recommendations": [
    { "title": <string>, "rationale": <string>, "steps": [<string>], "target_users": <string> }
  ],
  "quality_upgrades": [<tests, CI, performance, security, observability>],
  "ux_improvements": [<onboarding, a11y, docs, analytics>],
  "adoption_plan": [<how to attract users: channels, feedback loops>],
  "metrics": [<success metrics to track>],
  "prioritization": [<quick wins → medium → high impact>]
}
`

    if (!this.genAI) {
      const jobAlignment = ['Project demonstrates core functionality but lacks polish expected at this level']
      const gaps = ['Testing discipline', 'CI automation', 'Performance profiling', 'Accessibility']
      const features = [
        { title: 'User Onboarding Flow', rationale: 'Reduce friction and improve activation', steps: ['Add guided tour', 'Seed sample data', 'Improve empty states'], target_users: 'New users' },
        { title: 'Shareable Links/Export', rationale: 'Increase virality and usefulness', steps: ['Add export to CSV/JSON', 'Create shareable public views'], target_users: 'Power users' }
      ]
      const quality = ['Set up unit/integration tests', 'Add CI with lint/test/build', 'Add basic observability (logs/metrics)', 'Security hardening (secrets, inputs)']
      const ux = ['Improve README and in-app docs', 'Add analytics to learn from behavior', 'A11y fixes (labels, keyboard nav)']
      const adoption = ['Post to developer communities', 'Collect feedback via in-app widget', 'Iterate weekly based on metrics']
      const metrics = ['Activation rate', 'DAU/WAU', 'Task completion', 'Error rate']
      const prio = ['Quick wins: README, CI, analytics', 'Medium: onboarding and tests', 'High impact: new features and perf']
      return JSON.stringify({ job_alignment: jobAlignment, capability_gaps: gaps, feature_recommendations: features, quality_upgrades: quality, ux_improvements: ux, adoption_plan: adoption, metrics, prioritization: prio }, null, 2)
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })
      const result = await this.generateContentWithRetry(model, prompt)
      const text = await result.response.text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          return JSON.stringify(JSON.parse(jsonMatch[0]), null, 2)
        } catch {
          return jsonMatch[0]
        }
      }
      return text
    } catch (e: any) {
      return JSON.stringify({ error: e?.message || 'AI review failed' })
    }
  }
}

export const aiService = new AIService()
