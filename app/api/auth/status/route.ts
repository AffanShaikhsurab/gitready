import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Returns whether a GitHub OAuth token cookie is present
export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('gh_token')?.value
  return NextResponse.json({ authenticated: !!token })
}

