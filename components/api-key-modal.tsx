'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Key, ExternalLink, Check, AlertCircle, Trash2 } from 'lucide-react'

const GEMINI_KEY_STORAGE = 'gitready_gemini_api_key'

interface ApiKeyModalProps {
    isOpen: boolean
    onClose: () => void
    onKeySet: (key: string) => void
}

export function ApiKeyModal({ isOpen, onClose, onKeySet }: ApiKeyModalProps) {
    const [apiKey, setApiKey] = useState('')
    const [error, setError] = useState('')
    const [isValidating, setIsValidating] = useState(false)

    const handleSubmit = async () => {
        if (!apiKey.trim()) {
            setError('Please enter an API key')
            return
        }

        // Basic validation - Gemini keys typically start with 'AI'
        if (!apiKey.trim().startsWith('AI')) {
            setError('Invalid API key format. Gemini keys typically start with "AI"')
            return
        }

        setIsValidating(true)
        setError('')

        // Store in localStorage
        try {
            localStorage.setItem(GEMINI_KEY_STORAGE, apiKey.trim())
            onKeySet(apiKey.trim())
            onClose()
        } catch (e) {
            setError('Failed to save API key')
        } finally {
            setIsValidating(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-purple-500" />
                        Add Your Gemini API Key
                    </DialogTitle>
                    <DialogDescription>
                        Deep analysis requires a Gemini API key. Your key is stored locally in your browser and never sent to our servers.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Instructions */}
                    <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                        <p className="text-sm font-medium">How to get your free API key:</p>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                            <li>Go to Google AI Studio</li>
                            <li>Sign in with your Google account</li>
                            <li>Click &quot;Get API Key&quot; → &quot;Create API key&quot;</li>
                            <li>Copy the key and paste it below</li>
                        </ol>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            asChild
                        >
                            <a
                                href="https://aistudio.google.com/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Open Google AI Studio
                            </a>
                        </Button>
                    </div>

                    {/* API Key Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Your Gemini API Key</label>
                        <Input
                            type="password"
                            placeholder="AIza..."
                            value={apiKey}
                            onChange={(e) => {
                                setApiKey(e.target.value)
                                setError('')
                            }}
                            className="font-mono"
                        />
                        {error && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Privacy note */}
                    <p className="text-xs text-muted-foreground">
                        🔒 Your API key is stored only in your browser&apos;s local storage.
                        It is never sent to GitReady servers - we pass it directly to Google&apos;s API.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
                        disabled={isValidating}
                    >
                        {isValidating ? 'Validating...' : 'Save & Continue'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

/**
 * Hook to manage Gemini API key from localStorage
 */
export function useGeminiApiKey() {
    const [apiKey, setApiKey] = useState<string | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        // Load from localStorage on mount
        const stored = localStorage.getItem(GEMINI_KEY_STORAGE)
        setApiKey(stored)
        setIsLoaded(true)
    }, [])

    const saveKey = (key: string) => {
        localStorage.setItem(GEMINI_KEY_STORAGE, key)
        setApiKey(key)
    }

    const clearKey = () => {
        localStorage.removeItem(GEMINI_KEY_STORAGE)
        setApiKey(null)
    }

    return {
        apiKey,
        hasKey: !!apiKey,
        isLoaded,
        saveKey,
        clearKey
    }
}

/**
 * Small indicator component showing API key status
 */
export function ApiKeyStatus({
    hasKey,
    onManage
}: {
    hasKey: boolean
    onManage: () => void
}) {
    return (
        <button
            onClick={onManage}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${hasKey
                    ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                }`}
        >
            {hasKey ? (
                <>
                    <Check className="w-3 h-3" />
                    API Key Set
                </>
            ) : (
                <>
                    <Key className="w-3 h-3" />
                    Add API Key
                </>
            )}
        </button>
    )
}

/**
 * Modal for managing existing API key
 */
interface ApiKeyManageModalProps {
    isOpen: boolean
    onClose: () => void
    onClear: () => void
    onUpdate: () => void
}

export function ApiKeyManageModal({ isOpen, onClose, onClear, onUpdate }: ApiKeyManageModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-green-500" />
                        API Key Settings
                    </DialogTitle>
                    <DialogDescription>
                        Your Gemini API key is stored locally in your browser.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2 text-green-400">
                            <Check className="w-5 h-5" />
                            <span className="font-medium">API Key Active</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Your key is being used for AI-powered analysis.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onUpdate} className="flex-1">
                            Update Key
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                onClear()
                                onClose()
                            }}
                            className="flex-1"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove Key
                        </Button>
                    </div>
                </div>

                <Button variant="ghost" onClick={onClose} className="w-full">
                    Close
                </Button>
            </DialogContent>
        </Dialog>
    )
}
