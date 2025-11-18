'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/lib/store'

export default function DeepAnalysisPage() {
  const params = useParams() as any
  const owner = params?.owner
  const repo = params?.repo
  const { role, seniority } = useAppStore() as any
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!owner || !repo) return
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/analyze/repo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ owner, repo, role, seniority })
        })
        const json = await res.json()
        try { setData(JSON.parse(json?.content || '{}')) } catch { setData(null) }
      } catch (e: any) {
        setError(e?.message || 'Failed to load analysis')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [owner, repo, role, seniority])

  if (!owner || !repo) return null

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Deep Analysis — {owner}/{repo}</h1>
        <Button variant="outline" onClick={() => history.back()}>Back</Button>
      </div>
      {loading && <div className="text-sm text-muted-foreground">Analyzing repository...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {data && (
        <div className="space-y-6">
          {data.job_alignment && data.job_alignment.length > 0 && (
            <Card className="p-5">
              <h2 className="text-lg font-semibold mb-2">Job Alignment</h2>
              <ul className="list-disc ml-5 text-sm">
                {data.job_alignment.map((it: string, i: number) => (<li key={i}>{it}</li>))}
              </ul>
            </Card>
          )}
          {data.capability_gaps && data.capability_gaps.length > 0 && (
            <Card className="p-5">
              <h2 className="text-lg font-semibold mb-2">Capability Gaps</h2>
              <ul className="list-disc ml-5 text-sm">
                {data.capability_gaps.map((it: string, i: number) => (<li key={i}>{it}</li>))}
              </ul>
            </Card>
          )}
          {data.feature_recommendations && data.feature_recommendations.length > 0 && (
            <Card className="p-5">
              <h2 className="text-lg font-semibold mb-2">Feature Recommendations</h2>
              <div className="space-y-3">
                {data.feature_recommendations.map((f: any, i: number) => (
                  <div key={i} className="p-3 border rounded">
                    <div className="font-semibold">{f.title}</div>
                    <div className="text-muted-foreground mt-1 text-sm">{f.rationale}</div>
                    {f.steps && f.steps.length > 0 && (
                      <ul className="list-decimal ml-5 mt-2 text-sm">
                        {f.steps.map((s: string, j: number) => (<li key={j}>{s}</li>))}
                      </ul>
                    )}
                    {f.target_users && (
                      <div className="text-xs mt-2">Target users: {f.target_users}</div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
          {data.quality_upgrades && data.quality_upgrades.length > 0 && (
            <Card className="p-5">
              <h2 className="text-lg font-semibold mb-2">Quality Upgrades</h2>
              <ul className="list-disc ml-5 text-sm">
                {data.quality_upgrades.map((it: string, i: number) => (<li key={i}>{it}</li>))}
              </ul>
            </Card>
          )}
          {data.ux_improvements && data.ux_improvements.length > 0 && (
            <Card className="p-5">
              <h2 className="text-lg font-semibold mb-2">UX Improvements</h2>
              <ul className="list-disc ml-5 text-sm">
                {data.ux_improvements.map((it: string, i: number) => (<li key={i}>{it}</li>))}
              </ul>
            </Card>
          )}
          {data.adoption_plan && data.adoption_plan.length > 0 && (
            <Card className="p-5">
              <h2 className="text-lg font-semibold mb-2">Adoption Plan</h2>
              <ul className="list-disc ml-5 text-sm">
                {data.adoption_plan.map((it: string, i: number) => (<li key={i}>{it}</li>))}
              </ul>
            </Card>
          )}
          {data.metrics && data.metrics.length > 0 && (
            <Card className="p-5">
              <h2 className="text-lg font-semibold mb-2">Metrics</h2>
              <div className="flex flex-wrap gap-2">
                {data.metrics.map((it: string, i: number) => (
                  <span key={i} className="px-2 py-1 text-xs bg-secondary rounded">{it}</span>
                ))}
              </div>
            </Card>
          )}
          {data.prioritization && data.prioritization.length > 0 && (
            <Card className="p-5">
              <h2 className="text-lg font-semibold mb-2">Prioritization</h2>
              <ol className="list-decimal ml-5 text-sm">
                {data.prioritization.map((it: string, i: number) => (<li key={i}>{it}</li>))}
              </ol>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

