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
}

// Deep analysis result for a single repository
export interface DeepRepoAnalysis {
  repo_name: string
  overall_rating: 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor'
  recruiter_summary: string
  strengths: Array<{
    area: string
    evidence: string
    recruiter_impact: string
  }>
  improvements: Array<{
    area: string
    current_state: string
    recommended_action: string
    effort_level: 'Quick Win' | 'Medium' | 'Significant'
    priority: 'High' | 'Medium' | 'Low'
  }>
  code_quality_signals: {
    structure: number
    documentation: number
    testing: number
    best_practices: number
  }
  files_analyzed?: number
  total_files?: number
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

  // Deep analysis state
  deepAnalysisResults: Record<string, DeepRepoAnalysis>
  isDeepAnalyzing: boolean
  deepAnalysisProgress: {
    current: number
    total: number
    currentRepo: string | null
  }

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

  // Deep analysis actions
  setDeepAnalysisResult: (repoName: string, result: DeepRepoAnalysis) => void
  setIsDeepAnalyzing: (isDeepAnalyzing: boolean) => void
  setDeepAnalysisProgress: (progress: { current: number; total: number; currentRepo: string | null }) => void
  clearDeepAnalysis: () => void

  resetAnalysis: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  username: '',
  role: 'Frontend',
  seniority: 'Junior',
  userData: null,
  repos: [],
  analysisResult: null,
  deepAnalysisResults: {},
  isDeepAnalyzing: false,
  deepAnalysisProgress: { current: 0, total: 0, currentRepo: null },
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

  // Deep analysis actions
  setDeepAnalysisResult: (repoName, result) => set((state) => ({
    deepAnalysisResults: { ...state.deepAnalysisResults, [repoName]: result }
  })),
  setIsDeepAnalyzing: (isDeepAnalyzing) => set({ isDeepAnalyzing }),
  setDeepAnalysisProgress: (progress) => set({ deepAnalysisProgress: progress }),
  clearDeepAnalysis: () => set({
    deepAnalysisResults: {},
    isDeepAnalyzing: false,
    deepAnalysisProgress: { current: 0, total: 0, currentRepo: null }
  }),

  resetAnalysis: () => set({
    userData: null,
    repos: [],
    analysisResult: null,
    deepAnalysisResults: {},
    isDeepAnalyzing: false,
    deepAnalysisProgress: { current: 0, total: 0, currentRepo: null },
    isAnalyzing: false,
    error: null,
    currentView: 'landing'
  }),
}))

