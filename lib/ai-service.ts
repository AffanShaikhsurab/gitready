import { GoogleGenerativeAI } from '@google/generative-ai'
import { GitHubUser, GitHubRepo, AnalysisResult } from './store'

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

      const prompt = this.buildPrompt(user, repos, role, seniority)
      
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

  private buildPrompt(user: GitHubUser, repos: GitHubRepo[], role: string, seniority: string): string {
    const repoSummary = repos.map(r => ({
      name: r.name,
      language: r.language,
      stars: r.stargazers_count,
      has_readme: r.has_readme,
      has_tests: r.has_tests,
      has_ci: r.has_ci,
      commits: r.commit_count,
    }))

    return `You are a brutally honest but funny tech recruiter analyzing a GitHub profile. Be witty, use developer jokes, and reference common GitHub/coding culture.

User: ${user.name || user.login}
Bio: ${user.bio || 'No bio (mysterious... or just lazy?)'}
Repos: ${user.public_repos}
Followers: ${user.followers}
Target Role: ${role}
Seniority: ${seniority}

Repositories (non-forks only):
${JSON.stringify(repoSummary, null, 2)}

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
    {
      "title": <issue title with pun>,
      "evidence": <specific data point>,
      "why": <why employers care>,
      "confidence": <"High" | "Medium" | "Low">,
      "fix": <one-line actionable fix>
    }
  ],
  "actions": [
    {
      "number": "01",
      "title": <action with emoji>,
      "description": <why this matters, be funny>,
      "effort": <"☕" | "☕☕" | "☕☕☕" | "🧠">,
      "link": "#"
    }
  ]
}

Be specific, reference actual repo data, and make it fun!`
  }

  private formatAnalysisResult(data: any, user: GitHubUser, repos: GitHubRepo[]): AnalysisResult {
    console.log('[AIService] Formatting analysis result...')
    
    // Edge case: Ensure data is valid
    if (!data || typeof data !== 'object') {
      console.warn('[AIService] Invalid analysis data, using defaults')
      data = {}
    }

    const topLanguage = this.getTopLanguage(repos)
    
    // Ensure signals array is properly formatted with 'max' property
    const signals = (data.signals || []).map((signal: any) => ({
      title: signal.title || 'Unknown',
      value: Math.min(Math.max(signal.value || 0, 0), 5),
      max: signal.max || 5
    }))

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

    const result = {
      score: Math.min(Math.max(data.score || 75, 0), 100),
      tier: data.tier || 'Strong Signal',
      summary: data.summary || "You're on the right track!",
      signals,
      issues,
      actions,
      topLanguage,
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
      }
    }

    const topLanguage = this.getTopLanguage(repos)
    const hasReadmes = repos.filter(r => r.has_readme).length
    const hasTests = repos.filter(r => r.has_tests).length
    const hasCI = repos.filter(r => r.has_ci).length
    const totalCommits = repos.reduce((sum, r) => sum + r.commit_count, 0)

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

    const result = {
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
    }

    console.log('[AIService] Mock analysis complete:', result)
    return result
  }
}

export const aiService = new AIService()
