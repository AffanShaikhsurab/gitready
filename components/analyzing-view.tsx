'use client'

import { useEffect, useMemo, useState } from 'react'

interface AnalyzingViewProps {
  loadingJoke: string
}

export function AnalyzingView({ loadingJoke }: AnalyzingViewProps) {
  const steps = useMemo(
    () => [
      {
        main: 'Authenticating with GitHub...',
        sub: 'ssh -T git@github.com',
        step: 'Checking your activity heatmap',
        delay: 1500,
      },
      {
        main: 'Fetching repository list...',
        sub: 'gh repo list --limit 1000',
        step: "Categorizing repos (ignoring forks, we're not fooled)",
        delay: 1800,
      },
      {
        main: 'Indexing project files...',
        sub: 'find . -type f | wc -l',
        step: "Analyzing file structures (ignoring node_modules, we're not monsters)",
        delay: 2200,
      },
      {
        main: 'Linting commit history...',
        sub: 'git log --pretty=oneline | lint',
        step: 'Evaluating commit quality',
        delay: 1800,
      },
      {
        main: 'Querying AI model...',
        sub: 'curl -X POST https://api.ai-overlords.com/analyze',
        step: 'Consulting the AI overlords',
        delay: 2500,
      },
      {
        main: 'Generating report...',
        sub: 'build --output=report.json',
        step: 'Finalizing your report...',
        delay: 1000,
      },
    ],
    []
  )

  const [mainStatus, setMainStatus] = useState('Initializing Workflow...')
  const [subStatus, setSubStatus] = useState('\u00A0')
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  useEffect(() => {
    let isMounted = true

    const runSequence = async () => {
      await new Promise((r) => setTimeout(r, 500))
      for (const step of steps) {
        if (!isMounted) return
        setMainStatus(step.main)
        setSubStatus(step.sub)
        setCompletedSteps((prev) => [...prev, step.step])
        await new Promise((r) => setTimeout(r, step.delay))
      }
    }

    runSequence()
    return () => {
      isMounted = false
    }
  }, [steps])

  return (
    <div className="loading-overlay visible" id="loading-view">
      <div className="terminal-window">
        <div className="terminal-header">/.github/workflows/career-analysis.yml</div>
        <div className="terminal-body">
          <div className="spinner-container">
            <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
              <circle cx="25" cy="25" r="20"></circle>
            </svg>
          </div>
          <h2 className="main-status" aria-live="polite">{mainStatus}</h2>
          <p className="sub-status" aria-live="polite">{subStatus}</p>
          <p className="funny-status" aria-live="polite">{loadingJoke}</p>
          <ul className="step-list" aria-label="Analysis steps">
            {completedSteps.map((text, idx) => (
              <li key={idx} style={{ animationDelay: `${idx * 150}ms` }}>
                <svg
                  className="step-icon"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    className="checkmark-path"
                    d="M13.5 4.5L6 12L2.5 8.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <style jsx>{`
        :root {
          --bg-color: #0d1117;
          --border-color: #30363d;
          --card-bg: #010409;
          --text-primary: #e6edf3;
          --text-secondary: #7d8590;
          --green-text: #3fb950;
        }

        .loading-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(13, 17, 23, 0.95);
          backdrop-filter: blur(5px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          font-family: 'Inter', sans-serif;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        @media (min-width: 640px) {
          .loading-overlay { padding: 24px; }
        }
        .loading-overlay.visible { opacity: 1; }

        .terminal-window {
          width: 100%;
          max-width: 680px;
          background-color: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          overflow: hidden;
          animation: fadeInTerminal 0.5s ease-out forwards;
        }
        @media (min-width: 640px) {
          .terminal-window { border-radius: 12px; }
        }
        @keyframes fadeInTerminal {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .terminal-header {
          padding: 10px 12px;
          background-color: #161b22;
          border-bottom: 1px solid var(--border-color);
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @media (min-width: 640px) {
          .terminal-header { padding: 12px 16px; font-size: 13px; }
        }

        .terminal-body {
          padding: 20px 16px;
          text-align: center;
        }
        @media (min-width: 640px) {
          .terminal-body { padding: 32px; }
        }

        .spinner-container { margin-bottom: 16px; }
        @media (min-width: 640px) {
          .spinner-container { margin-bottom: 24px; }
        }
        .spinner { width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @media (min-width: 640px) {
          .spinner { width: 48px; height: 48px; }
        }
        .spinner circle {
          stroke: var(--green-text);
          stroke-width: 4;
          stroke-linecap: round;
          fill: none;
          stroke-dasharray: 125;
          stroke-dashoffset: 40;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .main-status {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 6px;
          word-break: break-word;
        }
        @media (min-width: 640px) {
          .main-status { font-size: 20px; margin-bottom: 8px; }
        }
        .sub-status {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: var(--text-secondary);
          margin-bottom: 12px;
          min-height: 16px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        @media (min-width: 640px) {
          .sub-status { font-size: 14px; margin-bottom: 16px; min-height: 20px; white-space: normal; }
        }
        .funny-status {
          font-size: 12px;
          color: var(--text-secondary);
          font-style: italic;
          margin-bottom: 16px;
          min-height: 16px;
        }
        @media (min-width: 640px) {
          .funny-status { font-size: 14px; margin-bottom: 24px; min-height: 20px; }
        }

        .step-list {
          list-style: none;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        @media (min-width: 640px) {
          .step-list { gap: 12px; }
        }
        .step-list li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 12px;
          color: var(--text-secondary);
          opacity: 0;
          transform: translateY(5px);
          animation: fadeInStep 0.4s ease-out forwards;
        }
        @media (min-width: 640px) {
          .step-list li { gap: 12px; font-size: 14px; align-items: center; }
        }
        @keyframes fadeInStep {
          to { opacity: 1; transform: translateY(0); }
        }

        .step-icon { width: 14px; height: 14px; color: var(--green-text); flex-shrink: 0; margin-top: 2px; }
        @media (min-width: 640px) {
          .step-icon { width: 16px; height: 16px; margin-top: 0; }
        }
        .checkmark-path {
          stroke-dasharray: 24;
          stroke-dashoffset: 24;
          animation: drawCheck 0.3s ease-out forwards;
        }
        @keyframes drawCheck { to { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  )
}
