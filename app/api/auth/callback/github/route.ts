import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Alias callback route to match OAuth app registered URL: /api/auth/callback/github
export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const returnedState = url.searchParams.get('state')

  if (!code) {
    return NextResponse.json({ error: 'Missing code in GitHub callback' }, { status: 400 })
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.json({
      error: 'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.'
    }, { status: 500 })
  }

  // Verify state
  const cookieStore = await cookies()
  const expectedState = cookieStore.get('gh_oauth_state')?.value
  if (expectedState && returnedState && expectedState !== returnedState) {
    return NextResponse.json({ error: 'Invalid OAuth state' }, { status: 400 })
  }

  // Exchange code for token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  })

  if (!tokenRes.ok) {
    const txt = await tokenRes.text().catch(() => '')
    return NextResponse.json({ error: `Failed to exchange code: ${tokenRes.statusText} ${txt}` }, { status: 500 })
  }

  const tokenData = await tokenRes.json()
  const accessToken: string | undefined = tokenData?.access_token
  if (!accessToken) {
    return NextResponse.json({ error: 'No access token returned by GitHub' }, { status: 500 })
  }

  const base = process.env.NEXTAUTH_URL || ''
  const defaultRedirect = `${base}/`
  const returnTo = cookieStore.get('gh_return_to')?.value
  let safeRedirect = defaultRedirect
  if (returnTo && base && returnTo.startsWith(base)) {
    safeRedirect = returnTo
  }
  const res = NextResponse.redirect(safeRedirect)

  // Store token cookie
  res.cookies.set('gh_token', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
  // Clear state/returnTo cookies
  res.cookies.set('gh_oauth_state', '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 })
  res.cookies.set('gh_return_to', '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 })
  return res
}

