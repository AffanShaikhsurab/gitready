'use client'

import { useState } from 'react'
import { useAppStore, GitHubRepo } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Download, Share2, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { GeneratedContentModal } from '@/components/generated-content-modal'
import { generateTests, generateCI } from '@/lib/content-generators'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { RepositoryHealthSection } from '@/components/repository-health-section'
import { DeepAnalysisSection } from '@/components/deep-analysis-section'
import { rankReposByImportance } from '@/lib/deep-analyzer-service'
import { ApiKeyModal, ApiKeyManageModal, ApiKeyStatus, useGeminiApiKey } from '@/components/api-key-modal'

export function ReportView() {
  const {
    userData,
    analysisResult,
    resetAnalysis,
    repos,
    role,
    seniority,
    deepAnalysisResults,
    isDeepAnalyzing,
    deepAnalysisProgress,
    setDeepAnalysisResult,
    setIsDeepAnalyzing,
    setDeepAnalysisProgress
  } = useAppStore()

  // Gemini API key management
  const { apiKey: geminiApiKey, hasKey: hasGeminiKey, saveKey: saveGeminiKey, clearKey: clearGeminiKey, isLoaded: isApiKeyLoaded } = useGeminiApiKey()
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showApiKeyManageModal, setShowApiKeyManageModal] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalDesc, setModalDesc] = useState('')
  const [modalContent, setModalContent] = useState('')
  const [modalFilename, setModalFilename] = useState('')
  const [autoPRSubmitting, setAutoPRSubmitting] = useState(false)
  const [currentAction, setCurrentAction] = useState<"readme" | "tests" | "ci" | null>(null)
  const [autoPRStatusText, setAutoPRStatusText] = useState<string | undefined>(undefined)
  const [autoPRStatusType, setAutoPRStatusType] = useState<'success' | 'error' | undefined>(undefined)
  const [isGhAuthenticated, setIsGhAuthenticated] = useState<boolean | null>(null)
  const [modalRepo, setModalRepo] = useState<GitHubRepo | null>(null)  // Track which repo we're generating for
  const handleAuth = () => {
    try {
      // Space-delimited scopes per GitHub OAuth requirements
      const scope = encodeURIComponent('public_repo user:email workflow')
      const returnTo = encodeURIComponent(window.location.href)
      window.location.href = `/api/auth/github/login?scope=${scope}&returnTo=${returnTo}`
    } catch (e) {
      console.error('Failed to start GitHub OAuth:', e)
    }
  }

  console.log('[ReportView] Rendering with:', {
    hasUserData: !!userData,
    hasAnalysisResult: !!analysisResult,
    userData,
    analysisResult
  })

  // Check GitHub auth status once on mount
  if (typeof window !== 'undefined' && isGhAuthenticated === null) {
    (async () => {
      try {
        const res = await fetch('/api/auth/status')
        if (res.ok) {
          const data = await res.json()
          setIsGhAuthenticated(!!data?.authenticated)
        } else {
          setIsGhAuthenticated(false)
        }
      } catch {
        setIsGhAuthenticated(false)
      }
    })()
  }

  if (!userData || !analysisResult) {
    console.warn('[ReportView] Missing required data:', { userData, analysisResult })
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 max-w-md">
          <h2 className="text-xl font-bold mb-4">No Analysis Data</h2>
          <p className="text-muted-foreground mb-4">
            It looks like the analysis data is missing. Please try analyzing again.
          </p>
          <Button onClick={resetAnalysis} className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        </Card>
      </div>
    )
  }

  // Repo selection: default to first repo missing README, otherwise first repo
  const defaultRepo = repos?.find(r => !r.has_readme) || (repos && repos[0]) || null
  const [selectedRepo, setSelectedRepo] = useState(defaultRepo)

  // Helper to get owner/repo from a repo object
  const getOwnerRepo = (repo: GitHubRepo | null) => {
    if (!repo) return { owner: '', repoName: '' }
    const [owner, repoName] = repo.full_name.split('/')
    return { owner, repoName }
  }

  const openModalFor = async (action: 'readme' | 'tests' | 'ci', targetRepo?: GitHubRepo) => {
    const repo = targetRepo || selectedRepo
    if (!repo) return

    // Preflight: require OAuth before generating content/PRs
    try {
      const status = await fetch('/api/auth/status', { method: 'GET' })
      if (status.ok) {
        const data = await status.json()
        if (!data?.authenticated) {
          handleAuth()
          return
        }
      }
    } catch (e) {
      console.warn('Auth status check failed, proceeding to auth:', e)
      handleAuth()
      return
    }

    // Store which repo we're working on
    setModalRepo(repo)
    setCurrentAction(action)

    const { owner, repoName } = getOwnerRepo(repo)
    const language = repo.language || 'JavaScript'

    if (action === 'readme') {
      setModalTitle(`README.md for ${repo.name}`)
      setModalDesc('Auto-generated README covering What/Why/How and setup.')
      try {
        const res = await fetch('/api/generate/readme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ owner, repo: repoName, language })
        })
        if (res.ok) {
          const data = await res.json()
          setModalContent(data?.content || '')
        } else {
          const err = await res.json().catch(() => ({ error: 'Failed to generate README' }))
          setModalContent(err?.error || 'Failed to generate README')
        }
      } catch (e: any) {
        setModalContent(e?.message || 'Failed to generate README')
      }
      setModalFilename('README.md')
    } else if (action === 'tests') {
      setModalTitle(`Tests for ${repo.name}`)
      setModalDesc('Language-appropriate starter tests to establish coverage.')
      setModalContent(generateTests(repoName, language))
      if (/TypeScript/i.test(language)) setModalFilename('tests/example.test.ts')
      else if (/Python/i.test(language)) setModalFilename('tests/test_example.py')
      else setModalFilename('tests/example.test.js')
    } else {
      setModalTitle(`CI Workflow for ${repo.name}`)
      setModalDesc('GitHub Actions CI pipeline for install, test, and build.')
      setModalContent(generateCI(repoName))
      setModalFilename('.github/workflows/ci.yml')
    }
    setModalOpen(true)
    setAutoPRStatusText(undefined)
    setAutoPRStatusType(undefined)
  }

  const handleAutoPR = async () => {
    const { owner, repoName } = getOwnerRepo(modalRepo)
    if (!currentAction || !owner || !repoName) return
    try {
      setAutoPRSubmitting(true)
      setAutoPRStatusText(undefined)
      setAutoPRStatusType(undefined)
      const language = modalRepo?.language || 'JavaScript'
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo: repoName, action: currentAction, language }),
      })
      const data = await res.json()
      if (!res.ok) {
        const hint = data?.details?.hint ? `\n${data.details.hint}` : ''
        setAutoPRStatusType('error')
        setAutoPRStatusText((data?.error || 'Failed to open PR') + hint)
        return
      }
      if (data?.pr_url) {
        window.open(data.pr_url, '_blank')
        setAutoPRStatusType('success')
        setAutoPRStatusText('Pull request opened successfully.')
      }
    } catch (e: any) {
      setAutoPRStatusType('error')
      setAutoPRStatusText(e?.message || 'Auto-PR failed')
    } finally {
      setAutoPRSubmitting(false)
    }
  }

  // Start deep analysis for top 3 repos
  const handleStartDeepAnalysis = async () => {
    if (isDeepAnalyzing || repos.length === 0) return

    // Check if API key is set - if not, prompt user to add one
    if (!geminiApiKey) {
      setShowApiKeyModal(true)
      return
    }

    // Rank repos by importance and get top 3
    const rankedRepos = rankReposByImportance(repos, role || 'Fullstack', 3)
    const reposToAnalyze = rankedRepos.map(r => r.repo)

    console.log('[ReportView] Starting deep analysis for:', reposToAnalyze.map(r => r.name))

    setIsDeepAnalyzing(true)
    setDeepAnalysisProgress({ current: 0, total: reposToAnalyze.length, currentRepo: null })

    for (let i = 0; i < reposToAnalyze.length; i++) {
      const repo = reposToAnalyze[i]
      const [owner, repoName] = repo.full_name.split('/')

      setDeepAnalysisProgress({
        current: i,
        total: reposToAnalyze.length,
        currentRepo: repo.name
      })

      try {
        const res = await fetch('/api/analyze/deep', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner,
            repo: repoName,
            role: role || 'Fullstack',
            seniority: seniority || 'Junior',
            description: repo.description,
            geminiApiKey  // Pass user's API key
          })
        })

        if (res.ok) {
          const data = await res.json()
          setDeepAnalysisResult(repo.name, {
            repo_name: repo.name,
            ...data.analysis,
            files_analyzed: data.files_analyzed,
            total_files: data.total_files
          })
        } else {
          console.error(`[ReportView] Deep analysis failed for ${repo.name}`)
        }
      } catch (error) {
        console.error(`[ReportView] Deep analysis error for ${repo.name}:`, error)
      }
    }

    setDeepAnalysisProgress({
      current: reposToAnalyze.length,
      total: reposToAnalyze.length,
      currentRepo: null
    })
    setIsDeepAnalyzing(false)
  }

  // Handle API key set from modal - then start deep analysis
  const handleApiKeySet = (key: string) => {
    saveGeminiKey(key)
    // Trigger deep analysis after key is saved
    setTimeout(() => {
      handleStartDeepAnalysis()
    }, 100)
  }

  return (
    <>
      {/* Header */}
      <header className="w-full max-w-[1200px] mx-auto flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6">
        <Image
          src="/ic_launcher-web.png"
          alt="GitReady"
          width={32}
          height={32}
          unoptimized
          className="rounded"
        />
        <nav className="hidden md:flex gap-6">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
            How It Works
          </a>
        </nav>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 sm:gap-8">
          {/* Main Content */}
          <main className="space-y-8 animate-fadeIn" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            {/* Score Header */}
            <Card className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center">
              <div className="text-center md:text-left">
                <p className="text-base font-semibold text-muted-foreground mb-1">Employability Score</p>
                <div className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-none bg-gradient-to-br from-green-400 to-blue-500 bg-clip-text text-transparent">
                  {analysisResult.score}
                </div>
                <p className="text-base font-medium text-purple-400 mt-2">{analysisResult.tier}</p>
              </div>
              <div className="md:border-l-2 md:border-border md:pl-8">
                <p className="text-base leading-relaxed">
                  <strong className="text-green-400">Here&apos;s the verdict:</strong> {analysisResult.summary}
                </p>
              </div>
            </Card>

            {/* Auth status indicators */}
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
              {/* Gemini API Key Status */}
              <ApiKeyStatus
                hasKey={hasGeminiKey}
                onManage={() => hasGeminiKey ? setShowApiKeyManageModal(true) : setShowApiKeyModal(true)}
              />

              {/* GitHub Auth Status */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${isGhAuthenticated ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                <span className={`w-2 h-2 rounded-full ${isGhAuthenticated ? 'bg-green-500' : 'bg-yellow-500'}`} />
                {isGhAuthenticated ? 'GitHub Connected' : 'GitHub: Not authenticated'}
              </span>
            </div>

            {/* Signal Strength */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-5">Your Signal Strength</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {analysisResult.signals && analysisResult.signals.length > 0 ? (
                  analysisResult.signals.map((signal, index) => {
                    console.log('[ReportView] Rendering signal:', signal)
                    return (
                      <Card key={index} className="p-5">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-4">{signal.title}</h3>
                        <div className="flex gap-1 h-20 items-end">
                          {Array.from({ length: signal.max || 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`flex-1 rounded-sm origin-bottom animate-barRaise ${i < signal.value
                                ? 'bg-gradient-to-t from-green-600 to-green-400'
                                : 'bg-border'
                                }`}
                              style={{
                                animationDelay: `${i * 100}ms`,
                                height: `${((i + 1) / (signal.max || 5)) * 100}%`,
                              }}
                            />
                          ))}
                        </div>
                        <div className="mt-3 text-center">
                          <span className="text-2xl font-bold text-foreground">{signal.value}</span>
                          <span className="text-sm text-muted-foreground">/{signal.max || 5}</span>
                        </div>
                      </Card>
                    )
                  })
                ) : (
                  <p className="text-muted-foreground col-span-3">No signal data available</p>
                )}
              </div>
            </section>

            {/* Repository Health - Shows which repos need what */}
            <RepositoryHealthSection
              repos={repos}
              onGenerateReadme={(repo) => openModalFor('readme', repo)}
              onGenerateTests={(repo) => openModalFor('tests', repo)}
              onGenerateCI={(repo) => openModalFor('ci', repo)}
            />

            {/* Deep Analysis - Code-level review of top projects */}
            <DeepAnalysisSection
              repos={repos}
              deepAnalysisResults={deepAnalysisResults}
              isDeepAnalyzing={isDeepAnalyzing}
              deepAnalysisProgress={deepAnalysisProgress}
              onStartDeepAnalysis={handleStartDeepAnalysis}
              onGenerateForRepo={(repo, action) => openModalFor(action, repo)}
            />

            {/* 3 PRs to 3x Your Interview Rate - Actual Repos */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">3 PRs to 3x Your Interview Rate</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-5">Quick wins on your actual repos that will make the biggest difference to recruiters.</p>
              <div className="space-y-4">
                {(() => {
                  // Build prioritized list of actionable repos
                  const actionableRepos: Array<{
                    repo: GitHubRepo
                    action: 'readme' | 'tests' | 'ci'
                    title: string
                    description: string
                    effort: string
                    icon: string
                  }> = []

                  // Priority 1: Repos without README (most impactful)
                  repos.filter(r => !r.has_readme).slice(0, 3).forEach(repo => {
                    if (actionableRepos.length < 3) {
                      actionableRepos.push({
                        repo,
                        action: 'readme',
                        title: `Add README to ${repo.name}`,
                        description: `Your ${repo.language || 'project'} repo has no documentation. A good README is the #1 thing recruiters check.`,
                        effort: '☕ 15 min',
                        icon: '📝'
                      })
                    }
                  })

                  // Priority 2: Repos without tests
                  repos.filter(r => !r.has_tests && r.has_readme).slice(0, 3).forEach(repo => {
                    if (actionableRepos.length < 3) {
                      actionableRepos.push({
                        repo,
                        action: 'tests',
                        title: `Add tests to ${repo.name}`,
                        description: `Show you write tested code. Even 2-3 test cases for ${repo.name} signals professionalism.`,
                        effort: '☕☕ 30 min',
                        icon: '✅'
                      })
                    }
                  })

                  // Priority 3: Repos without CI
                  repos.filter(r => !r.has_ci && r.has_readme && r.has_tests).slice(0, 3).forEach(repo => {
                    if (actionableRepos.length < 3) {
                      actionableRepos.push({
                        repo,
                        action: 'ci',
                        title: `Add CI/CD to ${repo.name}`,
                        description: `${repo.name} has tests but no automation. A GitHub Actions workflow shows DevOps awareness.`,
                        effort: '☕ 15 min',
                        icon: '🚀'
                      })
                    }
                  })

                  if (actionableRepos.length === 0) {
                    return (
                      <Card className="p-6 text-center border-green-500/30 bg-green-500/5">
                        <div className="text-4xl mb-3">🎉</div>
                        <h3 className="text-lg font-semibold text-green-400">You're All Set!</h3>
                        <p className="text-sm text-muted-foreground mt-2">All your repos have README, tests, and CI. Great job!</p>
                      </Card>
                    )
                  }

                  return actionableRepos.map((item, index) => (
                    <Card
                      key={`${item.repo.id}-${item.action}`}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start hover:-translate-y-1 hover:border-blue-500 transition-all duration-200"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xl sm:text-2xl font-bold text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                        <span className="text-xl sm:text-2xl">{item.icon}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                          {item.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                            {item.effort}
                          </span>
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => openModalFor(item.action, item.repo)}
                          >
                            Generate & PR →
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={item.repo.html_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                              View Repo <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                })()}
              </div>
            </section>
          </main>

          {/* Sidebar */}
          <aside className="animate-fadeIn lg:sticky lg:top-6 lg:self-start" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            {/* Profile Card */}
            <Card className="p-4 sm:p-5 text-center">
              <div className="flex flex-row sm:flex-col items-center sm:items-center gap-4 sm:gap-0">
                <Image
                  src={userData.avatar_url}
                  alt={userData.login}
                  width={64}
                  height={64}
                  className="rounded-full w-12 h-12 sm:w-16 sm:h-16 sm:mx-auto sm:mb-4 flex-shrink-0"
                />
                <div className="flex-1 sm:w-full">
                  <h3 className="text-base sm:text-lg font-semibold text-left sm:text-center">{userData.name || userData.login}</h3>
                  <p className="text-sm text-muted-foreground sm:mb-4 text-left sm:text-center">@{userData.login}</p>
                  <div className="hidden sm:flex justify-around text-sm text-muted-foreground">
                    <div>
                      <strong className="block text-base font-semibold text-foreground">
                        {analysisResult.topLanguage}
                      </strong>
                      <span>Top Language</span>
                    </div>
                    <div>
                      <strong className="block text-base font-semibold text-foreground">
                        {userData.followers}
                      </strong>
                      <span>Followers</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="mt-6 space-y-2">
              {/* Repo Selector */}
              {repos && repos.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Target Repository</div>
                  <Select
                    value={selectedRepo?.full_name || ''}
                    onValueChange={(val) => {
                      const next = repos.find(r => r.full_name === val) || null
                      setSelectedRepo(next!)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select repository" />
                    </SelectTrigger>
                    <SelectContent>
                      {repos.map((r) => (
                        <SelectItem key={r.id} value={r.full_name}>
                          {r.full_name}{!r.has_readme ? ' — Missing README' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={resetAnalysis}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Over
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Share2 className="w-4 h-4 mr-2" />
                Share Results
              </Button>
            </div>
          </aside>
        </div>
      </div>

      <GeneratedContentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        description={modalDesc}
        content={modalContent}
        filename={modalFilename}
        onAutoPR={modalRepo ? handleAutoPR : undefined}
        autoPRLabel={currentAction ? `Auto-PR ${currentAction.toUpperCase()}` : undefined}
        isSubmitting={autoPRSubmitting}
        statusText={autoPRStatusText}
        statusType={autoPRStatusType}
        onAuth={autoPRStatusType === 'error' ? handleAuth : undefined}
        authLabel={'Authenticate with GitHub'}
      />
      {/* API Key Modals */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onKeySet={(key) => {
          handleApiKeySet(key)
        }}
      />

      <ApiKeyManageModal
        isOpen={showApiKeyManageModal}
        onClose={() => setShowApiKeyManageModal(false)}
        onClear={clearGeminiKey}
        onUpdate={() => {
          setShowApiKeyManageModal(false)
          setShowApiKeyModal(true)
        }}
      />
    </>
  )
}
