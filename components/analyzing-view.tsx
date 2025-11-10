'use client'

import { Loader2 } from 'lucide-react'

interface AnalyzingViewProps {
  loadingJoke: string
}

export function AnalyzingView({ loadingJoke }: AnalyzingViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="max-w-[680px] w-full text-center">
        <div className="flex flex-col items-center gap-6 animate-fadeIn">
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
          <div>
            <h2 className="text-2xl font-bold mb-2">Analyzing your GitHub...</h2>
            <p className="text-lg text-muted-foreground italic">{loadingJoke}</p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground mt-4">
            <p>✓ Checking your activity</p>
            <p>✓ Scanning repos (excluding forks, we&apos;re not fooled)</p>
            <p>✓ Reading README files</p>
            <p>✓ Evaluating commit quality</p>
            <p>✓ Consulting the AI overlords</p>
          </div>
        </div>
      </div>
    </div>
  )
}
