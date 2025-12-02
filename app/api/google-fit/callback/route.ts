// [START] documentation reference: https://console.cloud.google.com/apis/library/fitness.googleapis.com
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth error
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(`${req.nextUrl.origin}/?error=google_fit_auth_failed`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${req.nextUrl.origin}/?error=missing_oauth_params`);
    }

    // Decode state to get userId
    let userId: string;
    try {
      const decodedState = JSON.parse(Buffer.from(state, "base64").toString());
      userId = decodedState.userId;
    } catch (e) {
      return NextResponse.redirect(`${req.nextUrl.origin}/?error=invalid_state`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_FIT_REDIRECT_URI || `${req.nextUrl.origin}/api/google-fit/callback`;

    if (!clientId || !clientSecret) {
      console.error("Missing credentials:", { 
        hasClientId: !!clientId, 
        hasClientSecret: !!clientSecret,
        redirectUri 
      });
      return NextResponse.redirect(`${req.nextUrl.origin}/?error=google_fit_not_configured`);
    }

    // Log the redirect URI being used for debugging
    console.log("Using redirect URI:", redirectUri);

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange error:", errorData);
      return NextResponse.redirect(`${req.nextUrl.origin}/?error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    if (!access_token) {
      return NextResponse.redirect(`${req.nextUrl.origin}/?error=no_access_token`);
    }

    // Store tokens in Supabase
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase credentials");
      return NextResponse.redirect(`${req.nextUrl.origin}/?error=supabase_not_configured`);
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Calculate expiration timestamp
    const expiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000).toISOString()
      : null;

    console.log("Storing tokens for user:", userId);
    const { data, error: dbError } = await supabase
      .from("users")
      .update({
        google_fit_access_token: access_token,
        google_fit_refresh_token: refresh_token,
        google_fit_token_expires_at: expiresAt,
        google_fit_verified: true,
      })
      .eq("id", userId)
      .select();

    if (dbError) {
      console.error("Database error details:", {
        error: dbError,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        code: dbError.code,
        userId
      });
      
      // Check if it's a column missing error
      if (dbError.message?.includes("column") || dbError.code === "42703") {
        return NextResponse.redirect(`${req.nextUrl.origin}/?error=missing_database_columns&details=${encodeURIComponent(dbError.message)}`);
      }
      
      return NextResponse.redirect(`${req.nextUrl.origin}/?error=database_error&details=${encodeURIComponent(dbError.message)}`);
    }

    console.log("Successfully stored Google Fit tokens");
    // Redirect back to main page with success
    return NextResponse.redirect(`${req.nextUrl.origin}/?google_fit_connected=true`);
  } catch (error: any) {
    console.error("Google Fit callback error:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.redirect(`${req.nextUrl.origin}/?error=callback_error&details=${encodeURIComponent(error.message || 'Unknown error')}`);
  }
}

// [END]