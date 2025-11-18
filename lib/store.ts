import { create } from 'zustand'

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  fork: boolean
  stargazers_count: number
  forks_count: number
  language: string | null
  pushed_at: string
  topics: string[]
  has_readme: boolean
  readme_length: number
  commit_count: number
  has_tests: boolean
  has_ci: boolean
  technologies?: string[]
}

export interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
  bio: string | null
  public_repos: number
  followers: number
  following: number
  created_at: string
}

export interface AnalysisResult {
  score: number
  tier: string
  summary: string
  signals: {
    title: string
    value: number
    max: number
  }[]
  issues: {
    title: string
    evidence: string
    why: string
    confidence: 'High' | 'Medium' | 'Low'
    fix: string
  }[]
  actions: {
    number: string
    title: string
    description: string
    effort: string
    link: string
  }[]
  topLanguage: string
  domainRecommendation?: { domain: string; confidence: number }[]
  improvementPlan?: string[]
  projectIdeas?: { title: string; outline: string; targetSkills: string[] }[]
  techUsage?: { technology: string; usageScore: number }[]
  jobGaps?: { requirement: string; status: 'missing' | 'partial' | 'met'; suggestion: string }[]
  repoRecommendations?: {
    repo: string
    decision: 'improve' | 'new'
    reasons: string[]
    improvements?: string[]
    newProjectIdea?: { title: string; outline: string; targetUsers: string; differentiation: string }
    growthPlan?: string[]
  }[]
}

interface AppState {
  // Form inputs
  username: string
  role: string
  seniority: string
  
  // Data
  userData: GitHubUser | null
  repos: GitHubRepo[]
  analysisResult: AnalysisResult | null
  
  // UI states
  isAnalyzing: boolean
  error: string | null
  currentView: 'landing' | 'analyzing' | 'report'
  
  // Actions
  setUsername: (username: string) => void
  setRole: (role: string) => void
  setSeniority: (seniority: string) => void
  setUserData: (data: GitHubUser) => void
  setRepos: (repos: GitHubRepo[]) => void
  setAnalysisResult: (result: AnalysisResult) => void
  setIsAnalyzing: (isAnalyzing: boolean) => void
  setError: (error: string | null) => void
  setCurrentView: (view: 'landing' | 'analyzing' | 'report') => void
  resetAnalysis: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  username: '',
  role: 'Front Web',
  seniority: 'Junior',
  userData: null,
  repos: [],
  analysisResult: null,
  isAnalyzing: false,
  error: null,
  currentView: 'landing',
  
  // Actions
  setUsername: (username) => set({ username }),
  setRole: (role) => set({ role }),
  setSeniority: (seniority) => set({ seniority }),
  setUserData: (data) => set({ userData: data }),
  setRepos: (repos) => set({ repos }),
  setAnalysisResult: (result) => set({ analysisResult: result }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setError: (error) => set({ error }),
  setCurrentView: (view) => set({ currentView: view }),
  resetAnalysis: () => set({
    userData: null,
    repos: [],
    analysisResult: null,
    isAnalyzing: false,
    error: null,
    currentView: 'landing'
  }),
}))
