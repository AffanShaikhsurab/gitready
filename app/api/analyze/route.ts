import { NextRequest, NextResponse } from 'next/server'
import { githubService } from '@/lib/github-service'
import { aiService } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Received analysis request')
    const { username, role, seniority } = await request.json()

    console.log('[API] Request params:', { username, role, seniority })

    // Edge case: Check for required fields
    if (!username || !username.trim()) {
      console.error('[API] Missing username')
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    // Extract username from URL if needed
    const cleanUsername = githubService.extractUsername(username)
    console.log('[API] Clean username:', cleanUsername)

    // Fetch GitHub data
    console.log('[API] Fetching GitHub user data...')
    const userData = await githubService.getUserData(cleanUsername)
    
    console.log('[API] Fetching user repos...')
    const repos = await githubService.getUserRepos(cleanUsername)
    
    console.log('[API] GitHub data fetched:', { 
      username: userData.login,
      repoCount: repos.length 
    })

    // Run AI analysis
    console.log('[API] Running AI analysis...')
    const analysis = await aiService.analyzeProfile(userData, repos, role || 'Frontend', seniority || 'Junior')
    
    console.log('[API] Analysis complete')

    // Edge case: Verify analysis result
    if (!analysis || !analysis.score) {
      console.error('[API] Invalid analysis result:', analysis)
      throw new Error('Analysis failed to generate valid results')
    }

    const response = {
      userData,
      repos,
      analysis
    }

    console.log('[API] Sending response:', {
      hasUserData: !!response.userData,
      repoCount: response.repos.length,
      hasAnalysis: !!response.analysis,
      score: response.analysis.score
    })

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[API] Analysis error:', error)
    return NextResponse.json(
      { error: error.message || 'Something went wrong. Try again?' },
      { status: 500 }
    )
  }
}