// [START] referrence: https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=framework&framework=nextjs&queryGroups=environment&environment=client
"use client";

import { createClient } from '../utils/supabase/client';
import Image from 'next/image';

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
        <div className="flex flex-col justify-center items-center h-screen">
            <button 
                className="group h-12 px-6 border-2 border-gray-300 rounded-full" 
                onClick={handleSignInWithGoogle}>
                <div className="flex items-center space-x-4 justify-center">
                    <Image src="https://www.svgrepo.com/show/475656/google-color.svg" alt="google logo" width={20} height={20} />
                    <span className="font-semibold tracking-wide text-gray-700 dark:text-white text-sm">
                        Continue with Google
                    </span>
                </div>
            </button>
        </div>
    );
}
// [END]