'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GitHubRepo } from '@/lib/store'
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  TestTube2, 
  GitBranch,
  Sparkles,
  ExternalLink
} from 'lucide-react'

interface RepositoryHealthSectionProps {
  repos: GitHubRepo[]
  onGenerateReadme: (repo: GitHubRepo) => void
  onGenerateTests: (repo: GitHubRepo) => void
  onGenerateCI: (repo: GitHubRepo) => void
}

interface IssueCategory {
  id: 'readme' | 'tests' | 'ci'
  title: string
  icon: React.ReactNode
  description: string
  affectedRepos: GitHubRepo[]
  actionLabel: string
  onAction: (repo: GitHubRepo) => void
}

export function RepositoryHealthSection({
  repos,
  onGenerateReadme,
  onGenerateTests,
  onGenerateCI
}: RepositoryHealthSectionProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['readme']))

  // Categorize repos by missing features
  const reposMissingReadme = repos.filter(r => !r.has_readme)
  const reposMissingTests = repos.filter(r => !r.has_tests)
  const reposMissingCI = repos.filter(r => !r.has_ci)

  const categories: IssueCategory[] = [
    {
      id: 'readme',
      title: 'Missing README',
      icon: <FileText className="w-5 h-5" />,
      description: 'READMEs are the first thing recruiters see. No README = "this developer doesn\'t document their work."',
      affectedRepos: reposMissingReadme,
      actionLabel: 'Generate README',
      onAction: onGenerateReadme
    },
    {
      id: 'tests',
      title: 'No Tests Found',
      icon: <TestTube2 className="w-5 h-5" />,
      description: 'Tests show you care about code quality. Untested code raises red flags in interviews.',
      affectedRepos: reposMissingTests,
      actionLabel: 'Generate Tests',
      onAction: onGenerateTests
    },
    {
      id: 'ci',
      title: 'No CI/CD Workflows',
      icon: <GitBranch className="w-5 h-5" />,
      description: 'CI/CD shows professional development practices. It\'s expected at any serious dev job.',
      affectedRepos: reposMissingCI,
      actionLabel: 'Generate CI',
      onAction: onGenerateCI
    }
  ]

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Only show categories that have affected repos
  const activeCategories = categories.filter(c => c.affectedRepos.length > 0)

  if (activeCategories.length === 0) {
    return (
      <section>
        <h2 className="text-2xl font-bold mb-5 flex items-center gap-2">
          <span className="text-green-500">✓</span> Repository Health
        </h2>
        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🎉</div>
            <div>
              <h3 className="text-xl font-bold text-foreground">All Systems Go!</h3>
              <p className="text-muted-foreground">
                All your repositories have README, tests, and CI/CD. You&apos;re already ahead of 90% of candidates!
              </p>
            </div>
          </div>
        </Card>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-2xl font-bold mb-5">Repository Health Check</h2>
      <p className="text-muted-foreground mb-6">
        Here&apos;s exactly what&apos;s missing from your repos — and how to fix it in one click.
      </p>
      
      <div className="space-y-4">
        {activeCategories.map((category) => {
          const isExpanded = expandedSections.has(category.id)
          const count = category.affectedRepos.length
          
          return (
            <Card key={category.id} className="overflow-hidden">
              {/* Header - Clickable to expand/collapse */}
              <button
                onClick={() => toggleSection(category.id)}
                className="w-full p-4 sm:p-5 flex items-center gap-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-yellow-500/20 text-yellow-500 flex items-center justify-center">
                  {category.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold text-foreground">
                      {category.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                      {count} {count === 1 ? 'repo' : 'repos'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {category.description}
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
              
              {/* Expanded Content - Repository List */}
              {isExpanded && (
                <div className="border-t border-border">
                  <div className="p-4 sm:p-5 space-y-3">
                    {category.affectedRepos.map((repo) => (
                      <div 
                        key={repo.id}
                        className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground truncate">
                              {repo.name}
                            </span>
                            {repo.stargazers_count > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ⭐ {repo.stargazers_count}
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {repo.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {repo.language && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {repo.language}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 gap-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              category.onAction(repo)
                            }}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span className="hidden sm:inline">{category.actionLabel}</span>
                            <span className="sm:hidden">Generate</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="px-2"
                            asChild
                          >
                            <a 
                              href={repo.html_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Bulk action hint */}
                  {category.affectedRepos.length > 2 && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                      <p className="text-xs text-muted-foreground text-center">
                        💡 Tip: Start with your most starred repo — that&apos;s the one recruiters will look at first!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </section>
  )
}
