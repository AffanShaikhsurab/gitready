'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Github, Info } from 'lucide-react'
import Image from 'next/image'

interface LandingViewProps {
  onAnalyze: (username: string, role: string, seniority: string) => void
}

export function LandingView({ onAnalyze }: LandingViewProps) {
  const [username, setUsername] = useState('')
  const [role, setRole] = useState('Front Web')
  const [seniority, setSeniority] = useState('Junior')
  const [isLoading, setIsLoading] = useState(false)
  const { error } = useAppStore()

  // Extract username from GitHub URL or use as-is
  const extractUsername = (input: string): string => {
    const trimmed = input.trim()
    
    // Check if it's a GitHub URL
    const urlPatterns = [
      /github\.com\/([^\/\?#]+)/i,  // https://github.com/username or http://github.com/username
      /^@?([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)$/ // Direct username with optional @
    ]
    
    for (const pattern of urlPatterns) {
      const match = trimmed.match(pattern)
      if (match) {
        return match[1].replace(/^@/, '') // Remove @ if present
      }
    }
    
    return trimmed.replace(/^@/, '') // Fallback: just remove @ if present
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return
    
    const cleanUsername = extractUsername(username)
    if (!cleanUsername) return
    
    setIsLoading(true)
    await onAnalyze(cleanUsername, role, seniority)
    setIsLoading(false)
  }

  return (
    <>
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 w-full max-w-[1200px] mx-auto flex items-center px-6 py-6">
        <Image
          src="/ic_launcher-web.png"
          alt="GitReady"
          width={32}
          height={32}
          unoptimized
          className="mr-4 rounded"
        />
        <nav className="flex gap-6">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
            About
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
            How It Works
          </a>
        </nav>
        <a
          href="https://github.com/yourusername/gitready"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 transition-all"
        >
          <Github className="w-4 h-4" />
          Source
        </a>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="max-w-[680px] w-full text-center animate-fadeIn">
          <h1 className="relative text-5xl md:text-6xl font-extrabold leading-tight mb-4">
            Is your GitHub portfolio optimized?
            <Image
              src="/investigator.png"
              alt="Investigator"
              width={160}
              height={160}
              className="absolute right-0 top-1/2 -translate-y-1/2 -z-10 pointer-events-none"
              style={{ transform: 'rotate(20deg)' }}
            />
          </h1>
          <p className="text-lg text-muted-foreground max-w-[580px] mx-auto leading-relaxed mb-10">
            See your profile through an employer&apos;s eyes. Our AI will analyze your commits, repos, and activity against{' '}
            <strong className="text-foreground font-semibold">real job specs</strong> to find where you shine, and what to build next.
          </p>

          {error && (
            <div className="mb-4 text-sm text-red-400">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Username Input */}
              <div className="flex-grow min-w-[250px]">
                <label htmlFor="username" className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-2 text-left">
                  GitHub Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="octocat or https://github.com/octocat"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="text-base"
                />
              </div>

              {/* Role Select */}
              <div className="flex-grow">
                <label htmlFor="role" className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-2 text-left">
                  Target Domain
                </label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Front Web">Front Web</SelectItem>
                    <SelectItem value="Backend">Backend</SelectItem>
                    <SelectItem value="Fullstack">Fullstack</SelectItem>
                    <SelectItem value="Android">Android</SelectItem>
                    <SelectItem value="iOS">iOS</SelectItem>
                    <SelectItem value="AI/ML">AI/ML</SelectItem>
                    <SelectItem value="Data Science">Data Science</SelectItem>
                    <SelectItem value="DevOps">DevOps</SelectItem>
                    <SelectItem value="Game Dev">Game Dev</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Seniority Select */}
              <div className="flex-grow">
                <label htmlFor="seniority" className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-2 text-left">
                  Seniority
                  <div className="group relative inline-block cursor-help">
                    <Info className="w-3.5 h-3.5" />
                    <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 text-xs bg-card border border-border rounded-md shadow-lg z-10">
                      Be honest! This helps us match you to the right kind of job requirements.
                    </div>
                  </div>
                </label>
                <Select value={seniority} onValueChange={setSeniority}>
                  <SelectTrigger id="seniority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fresher">Fresher</SelectItem>
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Mid">Mid</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full relative h-[50px] text-base font-semibold overflow-hidden"
              disabled={isLoading || !username.trim()}
            >
              {!isLoading ? (
                <span className="flex items-center gap-2">
                  Run `git blame` on my career →
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Loading...
                </span>
              )}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-4">
            Don&apos;t worry, we won&apos;t judge your old PHP projects. Much.
          </p>
        </div>
      </main>
    </>
  )
}
