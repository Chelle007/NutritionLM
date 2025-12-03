// [START] referrence: https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=framework&framework=nextjs&queryGroups=environment&environment=client
import { NextRequest, NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '../../utils/supabase/server'

// Helper function to get the proper base URL for redirects
function getRedirectBaseUrl(request: NextRequest): string {
  // Priority 1: Explicitly set site URL (best for production)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL
  if (siteUrl) {
    return siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
  }

  // Priority 2: Vercel automatically provided URL
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl && process.env.NODE_ENV !== 'development') {
    return `https://${vercelUrl}`
  }

  // Priority 3: Headers from Vercel/proxy
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  if (forwardedHost && process.env.NODE_ENV !== 'development') {
    return `${forwardedProto}://${forwardedHost}`
  }

  // Priority 4: Host header
  const host = request.headers.get('host')
  if (host && !host.includes('localhost')) {
    const proto = request.headers.get('x-forwarded-proto') || 
                  (request.nextUrl.protocol === 'https:' ? 'https' : 'http')
    return `${proto}://${host}`
  }

  // Priority 5: NextRequest URL (should be accurate)
  const url = request.nextUrl
  if (url.origin && !url.origin.includes('localhost')) {
    return url.origin
  }

  // Priority 6: Fallback to origin from URL (might be localhost in dev)
  const isLocalEnv = process.env.NODE_ENV === 'development'
  if (isLocalEnv) {
    return url.origin
  }

  // Last resort: log warning and use origin
  console.warn('Warning: Could not determine production URL. Using:', url.origin)
  console.warn('Available headers:', {
    host: request.headers.get('host'),
    forwardedHost: request.headers.get('x-forwarded-host'),
    forwardedProto: request.headers.get('x-forwarded-proto'),
    vercelUrl: process.env.VERCEL_URL,
    origin: url.origin
  })
  
  return url.origin
}

export async function GET(request: NextRequest) {
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
            console.error('Error creating user record:', insertError)
            // Continue anyway - user is authenticated, just missing profile
          } else {
            console.log('Created user record:', user.id)
          }
        }
      }

      // Get the proper redirect URL for Vercel production
      const baseUrl = getRedirectBaseUrl(request)
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  // return the user to an error page with instructions
  const baseUrl = getRedirectBaseUrl(request)
  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`)
}
// [END]