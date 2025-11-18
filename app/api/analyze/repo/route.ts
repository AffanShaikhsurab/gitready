import { NextRequest, NextResponse } from 'next/server'
import { githubService } from '@/lib/github-service'
import { aiService } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const { owner, repo, role, seniority } = await request.json()
    if (!owner || !repo) {
      return NextResponse.json({ error: 'owner and repo are required' }, { status: 400 })
    }

    const bundle = await githubService.getRepoCodeBundle(owner, repo, {
      maxFiles: 60,
      maxFileSize: 100_000,
    })

    const suggestions = await aiService.analyzeRepoCode(owner, repo, bundle, role || 'Front Web', seniority || 'Junior')
    return NextResponse.json({ content: suggestions })
  } catch (error: any) {
    const msg = String(error?.message || '')
    return NextResponse.json({ error: msg || 'Failed to analyze repository code' }, { status: 500 })
  }
}

