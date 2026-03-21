// supabase/functions/claude-proxy/index.ts
// 
// Supabase Edge Function that proxies requests to the Anthropic API.
// Keeps the API key server-side so it's never exposed in the browser.
//
// SETUP:
// 1. Install Supabase CLI: npm i -g supabase
// 2. Link your project: supabase link --project-ref YOUR_PROJECT_REF
// 3. Set the secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// 4. Deploy: supabase functions deploy claude-proxy
//
// The function validates the user is authenticated via Supabase Auth
// before forwarding the request to Anthropic.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // 1. Verify the user is authenticated
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 2. Check user is admin (only admins should use the AI content creation)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Only admin users can use AI content generation" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 3. Get the Anthropic API key from secrets
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured. Run: supabase secrets set ANTHROPIC_API_KEY=sk-ant-..." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 4. Parse the incoming request body
    const body = await req.json()

    // Validate required fields
    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: messages array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // 5. Forward to Anthropic API
    const anthropicBody = {
      model: body.model || "claude-sonnet-4-20250514",
      max_tokens: body.max_tokens || 4000,
      system: body.system || "",
      messages: body.messages,
    }

    // Add tools (web search) if requested
    if (body.tools) {
      anthropicBody.tools = body.tools
    }

    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicBody),
    })

    const anthropicData = await anthropicRes.json()

    // 6. Return the response
    return new Response(
      JSON.stringify(anthropicData),
      {
        status: anthropicRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
