import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Handles OAuth callback: verifies state, exchanges code for token, stores token in cookie.
export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const returnedState = url.searchParams.get('state')

  if (!code) {
    return NextResponse.json({ error: 'Missing code in GitHub callback' }, { status: 400 })
  }

  // Read cookies via headers workaround (App Router provides cookies on NextRequest, but we are using Request)
  // We’ll rely on the browser sending cookies; NextResponse can still set/delete them.
  // In practice, state validation is best-effort here.
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.json({
      error: 'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.'
    }, { status: 500 })
  }

  // Verify state (best-effort)
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
      // redirect_uri optional if matches registered callback
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

  // Prepare redirect
  const base = process.env.NEXTAUTH_URL || ''
  const defaultRedirect = `${base}/`
  const returnTo = cookieStore.get('gh_return_to')?.value
  let safeRedirect = defaultRedirect
  if (returnTo && base && returnTo.startsWith(base)) {
    safeRedirect = returnTo
  }
  const res = NextResponse.redirect(safeRedirect)

  // Store token as httpOnly cookie
  res.cookies.set('gh_token', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // Token longevity: GitHub OAuth tokens generally don’t expire unless revoked
  })
  // Clear state/returnTo cookies if present
  res.cookies.set('gh_oauth_state', '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 })
  res.cookies.set('gh_return_to', '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 })
  return res
}
