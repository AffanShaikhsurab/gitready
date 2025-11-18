'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Copy, Download, Check } from 'lucide-react'

interface GeneratedContentModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  content: string
  filename: string
  onAutoPR?: () => Promise<void> | void
  autoPRLabel?: string
  isSubmitting?: boolean
  statusText?: string
  statusType?: 'success' | 'error'
  onAuth?: () => void
  authLabel?: string
}

export function GeneratedContentModal({
  isOpen,
  onClose,
  title,
  description,
  content,
  filename,
  onAutoPR,
  autoPRLabel,
  isSubmitting,
  statusText,
  statusType,
  onAuth,
  authLabel,
}: GeneratedContentModalProps) {
  const [copied, setCopied] = useState(false)
  let parsed: any = null
  try {
    parsed = JSON.parse(content)
  } catch {}
  const isStructured = parsed && (parsed.job_alignment || parsed.capability_gaps || parsed.feature_recommendations || parsed.quality_upgrades || parsed.ux_improvements || parsed.adoption_plan || parsed.metrics || parsed.prioritization || parsed.improvements || parsed.architecture || parsed.product_opportunities)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-3xl max-w-[95vw] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/50 rounded-lg p-3 sm:p-4">
          {isStructured ? (
            <div className="space-y-6 text-sm">
              {parsed.job_alignment && parsed.job_alignment.length > 0 && (
                <section>
                  <h3 className="text-base font-semibold mb-2">Job Alignment</h3>
                  <ul className="list-disc ml-5">
                    {parsed.job_alignment.map((it: string, i: number) => (<li key={i}>{it}</li>))}
                  </ul>
                </section>
              )}
              {parsed.capability_gaps && parsed.capability_gaps.length > 0 && (
                <section>
                  <h3 className="text-base font-semibold mb-2">Capability Gaps</h3>
                  <ul className="list-disc ml-5">
                    {parsed.capability_gaps.map((it: string, i: number) => (<li key={i}>{it}</li>))}
                  </ul>
                </section>
              )}
              {parsed.feature_recommendations && parsed.feature_recommendations.length > 0 && (
                <section>
                  <h3 className="text-base font-semibold mb-2">Feature Recommendations</h3>
                  <div className="space-y-3">
                    {parsed.feature_recommendations.map((f: any, i: number) => (
                      <div key={i} className="p-3 border rounded">
                        <div className="font-semibold">{f.title}</div>
                        <div className="text-muted-foreground mt-1">{f.rationale}</div>
                        {f.steps && f.steps.length > 0 && (
                          <ul className="list-decimal ml-5 mt-2">
                            {f.steps.map((s: string, j: number) => (<li key={j}>{s}</li>))}
                          </ul>
                        )}
                        {f.target_users && (
                          <div className="text-xs mt-2">Target users: {f.target_users}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {parsed.quality_upgrades && parsed.quality_upgrades.length > 0 && (
                <section>
                  <h3 className="text-base font-semibold mb-2">Quality Upgrades</h3>
                  <ul className="list-disc ml-5">
                    {parsed.quality_upgrades.map((it: string, i: number) => (<li key={i}>{it}</li>))}
                  </ul>
                </section>
              )}
              {parsed.ux_improvements && parsed.ux_improvements.length > 0 && (
                <section>
                  <h3 className="text-base font-semibold mb-2">UX Improvements</h3>
                  <ul className="list-disc ml-5">
                    {parsed.ux_improvements.map((it: string, i: number) => (<li key={i}>{it}</li>))}
                  </ul>
                </section>
              )}
              {parsed.adoption_plan && parsed.adoption_plan.length > 0 && (
                <section>
                  <h3 className="text-base font-semibold mb-2">Adoption Plan</h3>
                  <ul className="list-disc ml-5">
                    {parsed.adoption_plan.map((it: string, i: number) => (<li key={i}>{it}</li>))}
                  </ul>
                </section>
              )}
              {parsed.metrics && parsed.metrics.length > 0 && (
                <section>
                  <h3 className="text-base font-semibold mb-2">Metrics</h3>
                  <div className="flex flex-wrap gap-2">
                    {parsed.metrics.map((it: string, i: number) => (
                      <span key={i} className="px-2 py-1 text-xs bg-secondary rounded">{it}</span>
                    ))}
                  </div>
                </section>
              )}
              {parsed.prioritization && parsed.prioritization.length > 0 && (
                <section>
                  <h3 className="text-base font-semibold mb-2">Prioritization</h3>
                  <ol className="list-decimal ml-5">
                    {parsed.prioritization.map((it: string, i: number) => (<li key={i}>{it}</li>))}
                  </ol>
                </section>
              )}
              {parsed.improvements && parsed.improvements.length > 0 && (
                <section>
                  <h3 className="text-base font-semibold mb-2">Improvements</h3>
                  <ul className="list-disc ml-5">
                    {parsed.improvements.map((it: string, i: number) => (<li key={i}>{it}</li>))}
                  </ul>
                </section>
              )}
              {parsed.architecture && parsed.architecture.length > 0 && (
                <section>
                  <h3 className="text-base font-semibold mb-2">Architecture</h3>
                  <ul className="list-disc ml-5">
                    {parsed.architecture.map((it: string, i: number) => (<li key={i}>{it}</li>))}
                  </ul>
                </section>
              )}
              {parsed.product_opportunities && parsed.product_opportunities.length > 0 && (
                <section>
                  <h3 className="text-base font-semibold mb-2">Product Opportunities</h3>
                  <ul className="list-disc ml-5">
                    {parsed.product_opportunities.map((it: string, i: number) => (<li key={i}>{it}</li>))}
                  </ul>
                </section>
              )}
            </div>
          ) : (
            <pre className="font-mono whitespace-pre-wrap text-xs sm:text-sm">{content}</pre>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button onClick={handleCopy} variant="outline" className="flex-1">
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </>
            )}
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Download {filename}
          </Button>
          {onAutoPR && (
            <Button onClick={onAutoPR} className="flex-1" disabled={!!isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                <span>{autoPRLabel || 'Open Auto-PR'}</span>
              )}
            </Button>
          )}
          {statusType === 'error' && onAuth && (
            <Button onClick={onAuth} variant="secondary" className="flex-1">
              {authLabel || 'Authenticate with GitHub'}
            </Button>
          )}
        </div>
        {statusText && (
          <div
            className={`mt-2 text-sm ${
              statusType === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {statusText}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
