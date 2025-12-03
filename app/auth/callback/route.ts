// [START] referrence: https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=framework&framework=nextjs&queryGroups=environment&environment=client
import { NextRequest, NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '../../utils/supabase/server'

// Helper function to get the proper base URL for redirects
function getRedirectBaseUrl(request: NextRequest): string {
  const url = request.nextUrl
  const isLocalEnv = process.env.NODE_ENV === 'development'
  
  // Log all available information for debugging
  console.log('[Auth Callback] URL Detection:', {
    requestUrl: request.url,
    nextUrlOrigin: url.origin,
    host: request.headers.get('host'),
    forwardedHost: request.headers.get('x-forwarded-host'),
    forwardedProto: request.headers.get('x-forwarded-proto'),
    referer: request.headers.get('referer'),
    vercelUrl: process.env.VERCEL_URL,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    nodeEnv: process.env.NODE_ENV,
    isLocalEnv
  })

  // Priority 1: Explicitly set site URL (best for production)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL
  if (siteUrl) {
    const finalUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
    console.log('[Auth Callback] Using NEXT_PUBLIC_SITE_URL:', finalUrl)
    return finalUrl
  }

  // Priority 2: Hardcoded production URL (known production domain)
  const knownProductionUrl = 'https://nutrition-lm.vercel.app'
  if (!isLocalEnv && url.origin.includes('localhost')) {
    console.log('[Auth Callback] Detected localhost in production, using hardcoded URL:', knownProductionUrl)
    return knownProductionUrl
  }

  // Priority 3: Vercel automatically provided URL
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl && !isLocalEnv) {
    const finalUrl = `https://${vercelUrl}`
    console.log('[Auth Callback] Using VERCEL_URL:', finalUrl)
    return finalUrl
  }

  // Priority 4: Headers from Vercel/proxy
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  if (forwardedHost && !isLocalEnv) {
    const finalUrl = `${forwardedProto}://${forwardedHost}`
    console.log('[Auth Callback] Using x-forwarded-host:', finalUrl)
    return finalUrl
  }

  // Priority 5: Host header
  const host = request.headers.get('host')
  if (host && !host.includes('localhost') && !isLocalEnv) {
    const proto = request.headers.get('x-forwarded-proto') || 
                  (url.protocol === 'https:' ? 'https' : 'http')
    const finalUrl = `${proto}://${host}`
    console.log('[Auth Callback] Using host header:', finalUrl)
    return finalUrl
  }

  // Priority 6: NextRequest URL (should be accurate)
  if (url.origin && !url.origin.includes('localhost')) {
    console.log('[Auth Callback] Using nextUrl.origin:', url.origin)
    return url.origin
  }

  // Priority 7: Fallback to origin from URL (only in local dev)
  if (isLocalEnv) {
    console.log('[Auth Callback] Using localhost (development):', url.origin)
    return url.origin
  }

  // Last resort: Use hardcoded production URL if we're in production
  if (!isLocalEnv) {
    console.warn('[Auth Callback] All detection methods failed, using hardcoded production URL:', knownProductionUrl)
    return knownProductionUrl
  }

  // Should never reach here in production
  console.error('[Auth Callback] ERROR: Could not determine redirect URL')
  return url.origin
}

export async function GET(request: NextRequest) {
  console.log('[Auth Callback] Request received:', {
    url: request.url,
    origin: request.nextUrl.origin,
    pathname: request.nextUrl.pathname,
    searchParams: Object.fromEntries(request.nextUrl.searchParams)
  })

  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // After successful authentication, ensure user exists in database
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Check if user already exists in users table
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle()

        // If user doesn't exist, create them
        if (!existingUser && !checkError) {
          const userData = {
            id: user.id,
            full_name: user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      user.user_metadata?.display_name || 
                      null,
            avatar_url: user.user_metadata?.avatar_url || 
                       user.user_metadata?.picture || 
                       null,
            telegram_chat_id: null,
          }

          const { error: insertError } = await supabase
            .from('users')
            .insert([userData])

          if (insertError) {
            console.error('[Auth Callback] Error creating user record:', insertError)
            // Continue anyway - user is authenticated, just missing profile
          } else {
            console.log('[Auth Callback] Created user record:', user.id)
          }
        }
      }

      // Get the proper redirect URL for Vercel production
      const baseUrl = getRedirectBaseUrl(request)
      const redirectUrl = `${baseUrl}${next}`
      console.log('[Auth Callback] Redirecting to:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
    } else {
      console.error('[Auth Callback] Error exchanging code for session:', error)
    }
  }

  // return the user to an error page with instructions
  const baseUrl = getRedirectBaseUrl(request)
  const errorUrl = `${baseUrl}/auth/auth-code-error`
  console.log('[Auth Callback] Redirecting to error page:', errorUrl)
  return NextResponse.redirect(errorUrl)
}
// [END]