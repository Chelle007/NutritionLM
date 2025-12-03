// [START] referrence: https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=framework&framework=nextjs&queryGroups=environment&environment=client
import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '../../utils/supabase/server'

// Helper function to get the proper base URL for redirects
function getRedirectBaseUrl(request: Request, origin: string): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const vercelUrl = process.env.VERCEL_URL
  
  const isLocalEnv = process.env.NODE_ENV === 'development'
  
  if (isLocalEnv) {
    // Local development - use the origin from the request
    return origin
  } else if (forwardedHost) {
    // Vercel provides x-forwarded-host header in production
    return `${forwardedProto}://${forwardedHost}`
  } else if (vercelUrl) {
    // Fallback to VERCEL_URL environment variable
    return `https://${vercelUrl}`
  } else {
    // Last resort - use origin (might be localhost if incorrectly configured)
    // Log a warning if origin looks like localhost
    if (origin.includes('localhost')) {
      console.warn('Warning: Redirecting to localhost origin. Check VERCEL_URL and x-forwarded-host headers.')
    }
    return origin
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
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
      const baseUrl = getRedirectBaseUrl(request, origin)
      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  // return the user to an error page with instructions
  const baseUrl = getRedirectBaseUrl(request, origin)
  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`)
}
// [END]