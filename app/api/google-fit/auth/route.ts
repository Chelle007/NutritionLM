// [START] documentation reference: https://console.cloud.google.com/apis/library/fitness.googleapis.com
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user from Supabase
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_FIT_REDIRECT_URI || `${req.nextUrl.origin}/api/google-fit/callback`;

    if (!clientId) {
      return NextResponse.json({ 
        error: "Google Fit client ID not configured",
        hint: "Set GOOGLE_FIT_CLIENT_ID or GOOGLE_CLIENT_ID in your environment variables"
      }, { status: 500 });
    }

    // Google Fit OAuth scopes
    const scopes = [
      "https://www.googleapis.com/auth/fitness.activity.read",
      "https://www.googleapis.com/auth/fitness.body.read",
      "https://www.googleapis.com/auth/fitness.nutrition.read",
    ].join(" ");

    // Generate state parameter to prevent CSRF attacks
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString("base64");

    // Build Google OAuth URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("state", state);

    // If user logged in with Google, use their email as login_hint for smoother flow
    const isGoogleProvider = user.app_metadata?.provider === "google" || 
                             user.identities?.some((identity: any) => identity.provider === "google");
    
    if (isGoogleProvider && user.email) {
      authUrl.searchParams.set("login_hint", user.email);
      authUrl.searchParams.set("prompt", "select_account");
    } else {
      authUrl.searchParams.set("prompt", "consent");
    }

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error("Google Fit auth error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// [END]