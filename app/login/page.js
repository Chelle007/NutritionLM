// [START] documentation reference: https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=framework&framework=nextjs&queryGroups=environment&environment=client
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../utils/supabase/client";
import Image from "next/image";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // 🚀 Auto-redirect when OAuth returns to login with "code" param
  useEffect(() => {
    const supabase = createClient();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          router.replace("/onboarding"); // auto-continue onboarding
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleSignInWithGoogle = async () => {
    const supabase = createClient();
    setIsSigningIn(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login`, // ⬅ return to login first
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("Error logging in with Google:", error.message);
      setIsSigningIn(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen text-white bg-black">
      {isSigningIn ? (
        <p className="text-lg animate-pulse">Signing in...</p>
      ) : (
        <button
          className="group h-12 px-6 border-2 border-gray-300 rounded-full transition"
          onClick={handleSignInWithGoogle}
        >
          <div className="flex items-center space-x-4 justify-center">
            <Image
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="google logo"
              width={20}
              height={20}
            />
            <span className="font-semibold tracking-wide text-sm">
              Continue with Google
            </span>
          </div>
        </button>
      )}
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="flex flex-col justify-center items-center h-screen text-white bg-black">
        <p className="text-lg animate-pulse">Loading...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
// [END]
