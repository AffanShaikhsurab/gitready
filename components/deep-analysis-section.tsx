'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DeepRepoAnalysis, GitHubRepo } from '@/lib/store'
import {
    ChevronDown,
    ChevronRight,
    Star,
    Zap,
    AlertTriangle,
    CheckCircle2,
    Sparkles,
    Loader2,
    ExternalLink
} from 'lucide-react'

interface DeepAnalysisSectionProps {
    repos: GitHubRepo[]
    deepAnalysisResults: Record<string, DeepRepoAnalysis>
    isDeepAnalyzing: boolean
    deepAnalysisProgress: {
        current: number
        total: number
        currentRepo: string | null
    }
    onStartDeepAnalysis: () => void
    onGenerateForRepo: (repo: GitHubRepo, action: 'readme' | 'tests' | 'ci') => void
}

const RATING_CONFIG = {
    'Excellent': { color: 'text-green-400', bg: 'bg-green-500/20', icon: Star },
    'Good': { color: 'text-blue-400', bg: 'bg-blue-500/20', icon: CheckCircle2 },
    'Needs Improvement': { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: AlertTriangle },
    'Poor': { color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertTriangle }
}

const EFFORT_CONFIG = {
    'Quick Win': { color: 'text-green-400', label: '⚡ Quick Win' },
    'Medium': { color: 'text-yellow-400', label: '🔧 Medium' },
    'Significant': { color: 'text-orange-400', label: '🏗️ Significant' }
}

const PRIORITY_CONFIG = {
    'High': { color: 'bg-red-500/20 text-red-400' },
    'Medium': { color: 'bg-yellow-500/20 text-yellow-400' },
    'Low': { color: 'bg-gray-500/20 text-gray-400' }
}

function QualityBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
    const percentage = (value / max) * 100
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}/{max}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}

function RepoAnalysisCard({
    analysis,
    repo,
    onGenerate
}: {
    analysis: DeepRepoAnalysis
    repo?: GitHubRepo
    onGenerate: (action: 'readme' | 'tests' | 'ci') => void
}) {
    const [isExpanded, setIsExpanded] = useState(true)
    const ratingConfig = RATING_CONFIG[analysis.overall_rating]
    const RatingIcon = ratingConfig.icon

    return (
        <Card className="overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 sm:p-5 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left"
            >
                <div className={`flex-shrink-0 px-3 py-1.5 rounded-lg ${ratingConfig.bg} ${ratingConfig.color} flex items-center gap-1.5`}>
                    <RatingIcon className="w-4 h-4" />
                    <span className="text-sm font-semibold">{analysis.overall_rating}</span>
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground truncate">
                        {analysis.repo_name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                        {analysis.recruiter_summary}
                    </p>
                </div>

                <div className="flex-shrink-0 text-muted-foreground">
                    {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                    ) : (
                        <ChevronRight className="w-5 h-5" />
                    )}
                </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="border-t border-border p-4 sm:p-5 space-y-6">
                    {/* Recruiter Summary */}
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                        <p className="text-sm italic text-muted-foreground">
                            &ldquo;{analysis.recruiter_summary}&rdquo;
                        </p>
                    </div>

                    {/* Quality Signals */}
                    <div>
                        <h4 className="text-sm font-semibold text-foreground mb-3">Code Quality Signals</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <QualityBar label="Structure" value={analysis.code_quality_signals.structure} />
                            <QualityBar label="Documentation" value={analysis.code_quality_signals.documentation} />
                            <QualityBar label="Testing" value={analysis.code_quality_signals.testing} />
                            <QualityBar label="Best Practices" value={analysis.code_quality_signals.best_practices} />
                        </div>
                    </div>

                    {/* Strengths */}
                    {analysis.strengths.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                Strengths
                            </h4>
                            <div className="space-y-2">
                                {analysis.strengths.map((strength, idx) => (
                                    <div key={idx} className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                        <p className="text-sm font-medium text-foreground">{strength.area}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{strength.evidence}</p>
                                        <p className="text-xs text-green-400 mt-1">{strength.recruiter_impact}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Improvements */}
                    {analysis.improvements.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-500" />
                                Recommended Improvements
                            </h4>
                            <div className="space-y-3">
                                {analysis.improvements.map((improvement, idx) => {
                                    const effortConfig = EFFORT_CONFIG[improvement.effort_level]
                                    const priorityConfig = PRIORITY_CONFIG[improvement.priority]

                                    // Determine if we can auto-generate for this improvement
                                    const canGenerate =
                                        improvement.area.toLowerCase().includes('readme') ||
                                        improvement.area.toLowerCase().includes('documentation') ||
                                        improvement.area.toLowerCase().includes('test') ||
                                        improvement.area.toLowerCase().includes('ci') ||
                                        improvement.area.toLowerCase().includes('workflow')

                                    const generateAction =
                                        improvement.area.toLowerCase().includes('readme') ||
                                            improvement.area.toLowerCase().includes('documentation') ? 'readme' :
                                            improvement.area.toLowerCase().includes('test') ? 'tests' :
                                                improvement.area.toLowerCase().includes('ci') ||
                                                    improvement.area.toLowerCase().includes('workflow') ? 'ci' : null

                                    return (
                                        <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-medium text-foreground">{improvement.area}</span>
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${priorityConfig.color}`}>
                                                            {improvement.priority}
                                                        </span>
                                                        <span className={`text-xs ${effortConfig.color}`}>
                                                            {effortConfig.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        <span className="font-medium">Current:</span> {improvement.current_state}
                                                    </p>
                                                    <p className="text-xs text-foreground mt-1">
                                                        <span className="font-medium">Action:</span> {improvement.recommended_action}
                                                    </p>
                                                </div>

                                                {canGenerate && generateAction && repo && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-shrink-0 gap-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onGenerate(generateAction)
                                                        }}
                                                    >
                                                        <Sparkles className="w-3 h-3" />
                                                        Fix
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Files analyzed info */}
                    {analysis.files_analyzed && (
                        <p className="text-xs text-muted-foreground text-center">
                            Analyzed {analysis.files_analyzed} of {analysis.total_files} files
                        </p>
                    )}
                </div>
            )}
        </Card>
    )
}

export function DeepAnalysisSection({
    repos,
    deepAnalysisResults,
    isDeepAnalyzing,
    deepAnalysisProgress,
    onStartDeepAnalysis,
    onGenerateForRepo
}: DeepAnalysisSectionProps) {
    const analysisKeys = Object.keys(deepAnalysisResults)
    const hasResults = analysisKeys.length > 0

    // Find repo objects for each analysis
    const repoMap: Record<string, GitHubRepo | undefined> = {}
    for (const repoName of analysisKeys) {
        repoMap[repoName] = repos.find(r => r.name === repoName)
    }

    return (
        <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <h2 className="text-xl sm:text-2xl font-bold">🔬 Deep Project Analysis</h2>

                {!hasResults && !isDeepAnalyzing && (
                    <Button
                        onClick={onStartDeepAnalysis}
                        className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                        <Sparkles className="w-4 h-4" />
                        Analyze Top Projects
                    </Button>
                )}
            </div>

            {!hasResults && !isDeepAnalyzing && (
                <Card className="p-6 text-center">
                    <div className="max-w-md mx-auto">
                        <div className="text-4xl mb-4">🎯</div>
                        <h3 className="text-lg font-semibold mb-2">Get Recruiter-Level Insights</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            We&apos;ll analyze your top 3 most important projects by reading the actual code and
                            providing detailed feedback from a recruiter&apos;s perspective.
                        </p>
                        <Button
                            onClick={onStartDeepAnalysis}
                            className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                            <Sparkles className="w-4 h-4" />
                            Start Deep Analysis
                        </Button>
                    </div>
                </Card>
            )}

            {isDeepAnalyzing && (
                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                        <div className="flex-1">
                            <p className="font-medium">
                                Analyzing {deepAnalysisProgress.currentRepo || 'repositories'}...
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {deepAnalysisProgress.current} of {deepAnalysisProgress.total} complete
                            </p>
                            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all duration-500"
                                    style={{ width: `${(deepAnalysisProgress.current / Math.max(deepAnalysisProgress.total, 1)) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {hasResults && (
                <div className="space-y-4">
                    {analysisKeys.map((repoName) => {
                        const analysis = deepAnalysisResults[repoName]
                        const repo = repoMap[repoName]
                        return (
                            <RepoAnalysisCard
                                key={repoName}
                                analysis={analysis}
                                repo={repo}
                                onGenerate={(action) => {
                                    if (repo) onGenerateForRepo(repo, action)
                                }}
                            />
                        )
                    })}
                </div>
            )}
        </section>
    )
}
