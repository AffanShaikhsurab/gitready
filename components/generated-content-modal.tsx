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

        <div className="flex-1 overflow-auto bg-muted/50 rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm">
          <pre className="whitespace-pre-wrap">{content}</pre>
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
