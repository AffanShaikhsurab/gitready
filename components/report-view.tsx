'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RotateCcw, Download, Share2, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { GeneratedContentModal } from '@/components/generated-content-modal'
import { generateTests, generateCI } from '@/lib/content-generators'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'

export function ReportView() {
  const { userData, analysisResult, resetAnalysis, repos } = useAppStore()

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
  const selectedFullName = selectedRepo?.full_name || ''
  const [owner, repoName] = selectedFullName.split('/')

  const openModalFor = async (action: 'readme' | 'tests' | 'ci') => {
    if (!selectedRepo) return
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
    setCurrentAction(action)
    const language = selectedRepo.language || 'JavaScript'
    if (action === 'readme') {
      setModalTitle('README.md template')
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
      setModalTitle('Basic tests template')
      setModalDesc('Language-appropriate starter tests to establish coverage.')
      setModalContent(generateTests(repoName, language))
      if (/TypeScript/i.test(language)) setModalFilename('tests/example.test.ts')
      else if (/Python/i.test(language)) setModalFilename('tests/test_example.py')
      else setModalFilename('tests/example.test.js')
    } else {
      setModalTitle('CI workflow template')
      setModalDesc('GitHub Actions CI pipeline for install, test, and build.')
      setModalContent(generateCI(repoName))
      setModalFilename('.github/workflows/ci.yml')
    }
    setModalOpen(true)
    setAutoPRStatusText(undefined)
    setAutoPRStatusType(undefined)
  }

  const handleAutoPR = async () => {
    if (!currentAction || !owner || !repoName) return
    try {
      setAutoPRSubmitting(true)
      setAutoPRStatusText(undefined)
      setAutoPRStatusType(undefined)
      const language = selectedRepo?.language || 'JavaScript'
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

            {selectedRepo && (
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                <Button variant="outline" onClick={() => openModalFor('readme')}>Generate README</Button>
                <Button variant="outline" onClick={() => openModalFor('tests')}>Generate Tests</Button>
                <Button variant="outline" onClick={() => openModalFor('ci')}>Generate CI</Button>
                <div className="sm:ml-auto mt-2 sm:mt-0 text-sm text-muted-foreground flex items-center">
                  {isGhAuthenticated ? 'GitHub: Signed in' : 'GitHub: Not authenticated'}
                </div>
              </div>
            )}

            {/* Signal Strength */}
            <section>
              <h2 className="text-2xl font-bold mb-5">Your Signal Strength</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {analysisResult.signals && analysisResult.signals.length > 0 ? (
                  analysisResult.signals.map((signal, index) => {
                    console.log('[ReportView] Rendering signal:', signal)
                    return (
                      <Card key={index} className="p-5">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-4">{signal.title}</h3>
                        <div className="flex gap-1 h-8 items-end">
                          {Array.from({ length: signal.max || 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`flex-1 rounded-sm opacity-0 transform scale-y-0 origin-bottom animate-barRaise ${
                                i < signal.value
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
                      </Card>
                    )
                  })
                ) : (
                  <p className="text-muted-foreground col-span-3">No signal data available</p>
                )}
              </div>
            </section>

            {/* Issues (if any) */}
              {analysisResult.issues && analysisResult.issues.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold mb-5">What&apos;s Holding You Back</h2>
                  <div className="space-y-4">
                    {analysisResult.issues.map((issue, index) => {
                      console.log('[ReportView] Rendering issue:', issue)
                      return (
                        <Card key={index} className="p-6">
                          <div className="flex flex-col sm:flex-row items-start gap-4">
                            <div className="text-3xl">⚠️</div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold mb-2">{issue.title}</h3>
                              <p className="text-sm text-muted-foreground mb-3">
                                <strong>Evidence:</strong> {issue.evidence}
                              </p>
                              <p className="text-sm mb-3">{issue.why}</p>
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                  Confidence: {issue.confidence}
                                </span>
                                <Button variant="outline" size="sm">
                                  {issue.fix} →
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </section>
              )}

            {/* Action Plan */}
            <section>
              <h2 className="text-2xl font-bold mb-5">3 PRs to 3x Your Interview Rate</h2>
              <div className="space-y-6">
                {analysisResult.actions && analysisResult.actions.length > 0 ? (
                  analysisResult.actions.map((action, index) => {
                    console.log('[ReportView] Rendering action:', action)
                    return (
                      <Card
                        key={index}
                        className="p-6 flex flex-col md:flex-row gap-6 items-start hover:-translate-y-1 hover:border-blue-500 transition-all duration-200"
                      >
                        <div className="text-2xl font-bold text-muted-foreground mt-1">{action.number}</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                            {action.description}
                          </p>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <span className="text-sm font-medium text-muted-foreground">
                              Effort: {action.effort}
                            </span>
                            <Button variant="secondary" size="sm" asChild>
                              <a href={action.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                Take Action <ExternalLink className="w-3 h-3" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )
                  })
                ) : (
                  <p className="text-muted-foreground">No actions available</p>
                )}
              </div>
            </section>
          </main>

          {/* Sidebar */}
          <aside className="animate-fadeIn" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            {/* Profile Card */}
            <Card className="p-5 text-center">
              <Image
                src={userData.avatar_url}
                alt={userData.login}
                width={64}
                height={64}
                className="rounded-full mx-auto mb-4"
              />
              <h3 className="text-lg font-semibold">{userData.name || userData.login}</h3>
              <p className="text-sm text-muted-foreground mb-4">@{userData.login}</p>
              <div className="flex justify-around text-sm text-muted-foreground">
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
        onAutoPR={selectedRepo ? handleAutoPR : undefined}
        autoPRLabel={currentAction ? `Auto-PR ${currentAction.toUpperCase()}` : undefined}
        isSubmitting={autoPRSubmitting}
        statusText={autoPRStatusText}
        statusType={autoPRStatusType}
        onAuth={autoPRStatusType === 'error' ? handleAuth : undefined}
        authLabel={'Authenticate with GitHub'}
      />
    </>
  )
}
