// [START] referrence: https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=framework&framework=nextjs&queryGroups=environment&environment=client
import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '../../utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? null

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

        // Check if user has completed onboarding by checking for user preferences
        // If "next" param is explicitly provided, use it; otherwise determine based on onboarding status
        if (!next) {
          const { data: userPreferences } = await supabase
            .from('user_preferences')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)

          // New user (no preferences) -> redirect to onboarding
          // Existing user (has preferences) -> redirect to home
          next = userPreferences && userPreferences.length > 0 ? '/' : '/onboarding'
        }
      } else {
        // If no user, default to home
        next = next || '/'
      }
    }

    // Validate next path for security
    if (!next.startsWith('/')) {
      next = '/'
    }

    const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
    const isLocalEnv = process.env.NODE_ENV === 'development'
    if (isLocalEnv) {
      // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
      return NextResponse.redirect(`${origin}${next}`)
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`)
    } else {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
// [END]