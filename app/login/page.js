// [START] referrence: https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=framework&framework=nextjs&queryGroups=environment&environment=client
"use client";

import { createClient } from '../utils/supabase/client';

export default function Login() {

    const handleSignInWithGoogle = async () => {
        const supabase = createClient();

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
        
        if (error) {
            console.error('Error logging in with Google:', error.message);
        }
    };

    return (
        <div>
            <button onClick={handleSignInWithGoogle}>
                Login with Google
            </button>
        </div>
    );
}
// [END]