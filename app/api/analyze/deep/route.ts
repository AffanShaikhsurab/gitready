import { NextRequest, NextResponse } from 'next/server'
import { GitHubService } from '@/lib/github-service'
import { aiService } from '@/lib/ai-service'
import {
    filterAndPrioritizeFiles,
    shouldSkipPath,
    RepoTreeItem
} from '@/lib/deep-analyzer-service'

/**
 * Deep Analysis API Endpoint
 * Performs code-level analysis on a single repository
 * Returns recruiter-perspective feedback
 */
export async function POST(request: NextRequest) {
    try {
        console.log('[DeepAnalysis API] Received request')

        const { owner, repo, role, seniority, description, geminiApiKey } = await request.json()

        // Validate required fields
        if (!owner || !repo) {
            return NextResponse.json(
                { error: 'Owner and repo are required' },
                { status: 400 }
            )
        }

        // Use authenticated service if token available from cookie
        const tokenCookie = request.cookies.get('gh_token')
        const token = tokenCookie?.value || process.env.GITHUB_TOKEN
        const githubService = new GitHubService(token)

        console.log('[DeepAnalysis API] Fetching repo tree for:', `${owner}/${repo}`)

        // Fetch the repository tree
        let treeData
        try {
            treeData = await githubService.getRepoTree(owner, repo)
        } catch (error: any) {
            console.error('[DeepAnalysis API] Failed to fetch tree:', error.message)
            return NextResponse.json(
                { error: 'Could not access repository. Check if it exists and is public.' },
                { status: 404 }
            )
        }

        // Convert to our format and filter
        const allFiles: RepoTreeItem[] = treeData.tree
            .filter((item: any) => item.type === 'blob')
            .map((item: any) => ({
                path: item.path,
                type: 'blob' as const,
                size: item.size
            }))

        console.log('[DeepAnalysis API] Total files in repo:', allFiles.length)

        // Filter and prioritize files for analysis
        const filesToAnalyze = filterAndPrioritizeFiles(
            allFiles,
            role || 'Fullstack',
            25  // Max 25 files for analysis
        )

        console.log('[DeepAnalysis API] Files selected for analysis:', filesToAnalyze.length)

        // Create a tree overview (simplified directory structure)
        const treeOverview = createTreeOverview(treeData.tree)

        // Fetch content of important files
        const filePaths = filesToAnalyze.map(f => f.path)
        const fileContents = await githubService.batchFetchFileContents(
            owner,
            repo,
            filePaths,
            30000  // 30KB max per file
        )

        console.log('[DeepAnalysis API] Fetched file contents:', fileContents.length)

        // Run AI deep analysis
        const analysis = await aiService.analyzeRepositoryDeep(
            repo,
            description || null,
            role || 'Fullstack',
            seniority || 'Junior',
            treeOverview,
            fileContents,
            geminiApiKey  // Pass user's API key if provided
        )

        console.log('[DeepAnalysis API] Analysis complete for:', repo)

        return NextResponse.json({
            repo_name: repo,
            analysis,
            files_analyzed: fileContents.length,
            total_files: allFiles.length
        })

    } catch (error: any) {
        console.error('[DeepAnalysis API] Error:', error)
        return NextResponse.json(
            { error: error.message || 'Deep analysis failed' },
            { status: 500 }
        )
    }
}

/**
 * Create a simplified tree overview for AI context
 */
function createTreeOverview(tree: any[]): string {
    const directories = new Set<string>()
    const filesByDir: Record<string, string[]> = {}

    for (const item of tree) {
        if (shouldSkipPath(item.path)) continue

        const parts = item.path.split('/')
        const filename = parts.pop()!
        const dir = parts.join('/') || '.'

        if (item.type === 'tree') {
            directories.add(item.path)
        } else {
            if (!filesByDir[dir]) {
                filesByDir[dir] = []
            }
            // Only include first 10 files per directory
            if (filesByDir[dir].length < 10) {
                filesByDir[dir].push(filename)
            }
        }
    }

    // Build overview string
    const lines: string[] = []
    const sortedDirs = Object.keys(filesByDir).sort()

    for (const dir of sortedDirs.slice(0, 15)) {  // Limit directories shown
        const files = filesByDir[dir]
        if (dir === '.') {
            lines.push('Root:')
        } else {
            lines.push(`${dir}/`)
        }
        for (const file of files) {
            lines.push(`  - ${file}`)
        }
        if (files.length >= 10) {
            lines.push(`  ... and more files`)
        }
    }

    if (sortedDirs.length > 15) {
        lines.push(`... and ${sortedDirs.length - 15} more directories`)
    }

    return lines.join('\n')
}
