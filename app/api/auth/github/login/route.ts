import { NextResponse } from 'next/server'

// Redirects the user to GitHub OAuth authorize with a CSRF state cookie.
export async function GET(req: Request) {
  const url = new URL(req.url)
  const scope = url.searchParams.get('scope') || 'public_repo,user:email,workflow'
  const returnTo = url.searchParams.get('returnTo') || '/'

  const clientId = process.env.GITHUB_CLIENT_ID
  const callback = process.env.GITHUB_CALLBACK_URL
  if (!clientId || !callback) {
    return NextResponse.json({
      error: 'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and NEXTAUTH_URL.'
    }, { status: 500 })
  }

  // Create a random state for CSRF protection
  const state = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)

  const authorizeURL = new URL('https://github.com/login/oauth/authorize')
  authorizeURL.searchParams.set('client_id', clientId)
  authorizeURL.searchParams.set('redirect_uri', callback)
  authorizeURL.searchParams.set('scope', scope)
  authorizeURL.searchParams.set('state', state)

  const res = NextResponse.redirect(authorizeURL.toString())
  // Store state and returnTo in cookies for callback verification and redirect
  res.cookies.set('gh_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
  res.cookies.set('gh_return_to', returnTo, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })
  return res
}

