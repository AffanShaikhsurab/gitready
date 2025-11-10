'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { LandingView } from '@/components/landing-view'
import { AnalyzingView } from '@/components/analyzing-view'
import { ReportView } from '@/components/report-view'

export default function Home() {
  const { currentView, setCurrentView, setUserData, setRepos, setAnalysisResult, setError } = useAppStore()
  const [loadingJoke, setLoadingJoke] = useState('')

  const loadingJokes = [
    "Deserializing your potential...",
    "Consulting the rubber duck...",
    "Resolving merge conflicts in your career...",
    "Grepping for opportunities...",
    "Warming up the AI hamster wheel...",
    "Reticulating splines...",
    "Asking the rubber duck...",
    "Asserting your dominance...",
    "Compiling your future...",
    "Fetching your destiny...",
    "Parsing your brilliance...",
    "git pull-ing your resume...",
    "Checking if tests pass (lol)...",
    "Running npm install on your career...",
    "Deploying to production (YOLO)...",
  ]

  const handleAnalyze = async (username: string, role: string, seniority: string) => {
    console.log('[Page] Starting analysis for:', { username, role, seniority })
    
    setError(null)
    setCurrentView('analyzing')

    // Start rotating jokes
    let jokeIndex = 0
    setLoadingJoke(loadingJokes[jokeIndex])
    const jokeInterval = setInterval(() => {
      jokeIndex = (jokeIndex + 1) % loadingJokes.length
      setLoadingJoke(loadingJokes[jokeIndex])
    }, 1800)

    try {
      console.log('[Page] Calling API...')
      // Call API route instead of direct GitHub service
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, role, seniority }),
      })

      console.log('[Page] API response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[Page] API error:', errorData)
        throw new Error(errorData.error || 'Analysis failed')
      }

      const data = await response.json()
      console.log('[Page] API response data:', {
        hasUserData: !!data.userData,
        hasRepos: !!data.repos,
        repoCount: data.repos?.length,
        hasAnalysis: !!data.analysis,
        analysisScore: data.analysis?.score
      })

      // Edge case: Validate response data
      if (!data.userData) {
        console.error('[Page] Missing userData in response')
        throw new Error('Invalid response: missing user data')
      }
      if (!data.repos) {
        console.error('[Page] Missing repos in response')
        throw new Error('Invalid response: missing repositories')
      }
      if (!data.analysis) {
        console.error('[Page] Missing analysis in response')
        throw new Error('Invalid response: missing analysis')
      }

      const { userData, repos, analysis } = data

      // Update store with results
      console.log('[Page] Updating store...')
      setUserData(userData)
      setRepos(repos)
      setAnalysisResult(analysis)

      clearInterval(jokeInterval)
      
      console.log('[Page] Analysis complete, showing report')
      setTimeout(() => {
        setCurrentView('report')
      }, 1000)
    } catch (error: any) {
      console.error('[Page] Analysis failed:', error)
      clearInterval(jokeInterval)
      setError(error.message || 'Something went wrong. Try again?')
      setCurrentView('landing')
    }
  }

  return (
    <div className="min-h-screen">
      {currentView === 'landing' && <LandingView onAnalyze={handleAnalyze} />}
      {currentView === 'analyzing' && <AnalyzingView loadingJoke={loadingJoke} />}
      {currentView === 'report' && <ReportView />}
    </div>
  )
}
