// supabase/functions/generate-report/index.ts
//
// Generates a branded PDF report from weekly + per-post data.
// Called from the frontend with the report payload.
//
// Deploy: supabase functions deploy generate-report

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"
import { jsPDF } from "https://esm.sh/jspdf@2.5.1"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// Brand colors
const NAVY = [15, 26, 46]
const BLUE = [45, 127, 249]
const ORANGE = [255, 107, 53]
const GREEN = [34, 197, 94]
const GRAY = [107, 114, 128]
const LIGHT_GRAY = [243, 244, 246]
const WHITE = [255, 255, 255]
const DARK = [31, 41, 55]

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })

    const body = await req.json()
    const { client, weeklyData, postsData, periodStart, periodEnd } = body

    if (!client || !periodStart || !periodEnd) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const W = 210, H = 297
    const M = 18 // margin
    const CW = W - M * 2 // content width
    let y = 0

    // Helper functions
    const setFont = (size: number, style = "normal", color = DARK) => {
      doc.setFontSize(size)
      doc.setFont("helvetica", style)
      doc.setTextColor(color[0], color[1], color[2])
    }

    const drawRect = (x: number, yy: number, w: number, h: number, color: number[]) => {
      doc.setFillColor(color[0], color[1], color[2])
      doc.rect(x, yy, w, h, "F")
    }

    const drawLine = (x1: number, y1: number, x2: number, y2: number, color = LIGHT_GRAY, width = 0.3) => {
      doc.setDrawColor(color[0], color[1], color[2])
      doc.setLineWidth(width)
      doc.line(x1, y1, x2, y2)
    }

    const checkPage = (needed: number) => {
      if (y + needed > H - 20) { doc.addPage(); y = M; return true }
      return false
    }

    // ═══════════════════════════════════════
    // PAGE 1: COVER
    // ═══════════════════════════════════════
    drawRect(0, 0, W, H, NAVY)

    // DPT branding
    setFont(10, "normal", [156, 163, 175])
    doc.text("DPT AGENCY", M, 40)
    drawLine(M, 44, M + 30, 44, ORANGE, 1)

    setFont(36, "bold", WHITE)
    doc.text("LinkedIn", M, 70)
    doc.text("Performance", M, 84)
    doc.text("Report", M, 98)

    setFont(14, "normal", [209, 213, 219])
    doc.text(client.full_name || "Client", M, 120)
    doc.text(client.company || "", M, 128)

    setFont(11, "normal", [156, 163, 175])
    doc.text(`Niche: ${client.niche || "General"}`, M, 145)
    doc.text(`Period: ${periodStart} — ${periodEnd}`, M, 153)
    doc.text(`Generated: ${new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`, M, 161)

    // Confidential footer
    setFont(9, "normal", [100, 116, 139])
    doc.text("CONFIDENTIAL — Prepared by DPT Agency", M, H - 20)

    // ═══════════════════════════════════════
    // PAGE 2: EXECUTIVE SUMMARY
    // ═══════════════════════════════════════
    doc.addPage()
    y = M

    // Section header
    setFont(20, "bold", NAVY)
    doc.text("Executive Summary", M, y + 8)
    y += 12
    drawLine(M, y, M + 40, y, ORANGE, 1.5)
    y += 10

    // KPI calculations
    const weekly = weeklyData || []
    const posts = postsData || []
    const totalImps = weekly.reduce((s: number, d: any) => s + (d.impressions || 0), 0)
    const totalEng = weekly.reduce((s: number, d: any) => s + (d.likes || 0) + (d.comments || 0) + (d.shares || 0), 0)
    const engRate = totalImps ? ((totalEng / totalImps) * 100).toFixed(1) : "0"
    const latestFollowers = weekly.length ? weekly[weekly.length - 1].followers || 0 : 0
    const firstFollowers = weekly.length ? weekly[0].followers || 0 : 0
    const followerGrowth = firstFollowers ? (((latestFollowers - firstFollowers) / firstFollowers) * 100).toFixed(1) : "0"
    const followerNet = latestFollowers - firstFollowers
    const totalProfileViews = weekly.reduce((s: number, d: any) => s + (d.profile_views || 0), 0)

    // KPI cards (2 rows of 3)
    const kpis = [
      { label: "Current Followers", value: latestFollowers.toLocaleString(), sub: `+${followerNet.toLocaleString()} (+${followerGrowth}%)`, color: BLUE },
      { label: "Total Impressions", value: totalImps.toLocaleString(), sub: `${weekly.length} weeks`, color: ORANGE },
      { label: "Total Engagements", value: totalEng.toLocaleString(), sub: "Likes + Comments + Shares", color: GREEN },
      { label: "Engagement Rate", value: `${engRate}%`, sub: "Engagements / Impressions", color: NAVY },
      { label: "Profile Views", value: totalProfileViews.toLocaleString(), sub: "Total in period", color: [139, 92, 246] },
      { label: "Posts Published", value: posts.length.toString(), sub: "In reporting period", color: DARK },
    ]

    const cardW = (CW - 8) / 3
    const cardH = 28
    kpis.forEach((k, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const cx = M + col * (cardW + 4)
      const cy = y + row * (cardH + 4)

      drawRect(cx, cy, cardW, cardH, [249, 250, 251])
      doc.setFillColor(k.color[0], k.color[1], k.color[2])
      doc.rect(cx, cy, 2, cardH, "F") // left accent

      setFont(18, "bold", k.color)
      doc.text(k.value, cx + 8, cy + 12)
      setFont(8, "bold", GRAY)
      doc.text(k.label, cx + 8, cy + 19)
      setFont(7, "normal", [156, 163, 175])
      doc.text(k.sub, cx + 8, cy + 24)
    })

    y += cardH * 2 + 16

    // Key findings
    if (weekly.length > 0) {
      setFont(12, "bold", NAVY)
      doc.text("Key Findings", M, y)
      y += 6

      const findings = []
      if (followerNet > 0) findings.push(`Follower base grew by ${followerNet.toLocaleString()} (+${followerGrowth}%) during the reporting period.`)
      if (totalImps > 0) findings.push(`Total of ${totalImps.toLocaleString()} impressions generated across ${weekly.length} weeks.`)
      if (parseFloat(engRate) > 3) findings.push(`Engagement rate of ${engRate}% exceeds the LinkedIn average of 2-3%.`)
      else if (parseFloat(engRate) > 0) findings.push(`Engagement rate of ${engRate}%. Industry benchmark is 2-3% — ${parseFloat(engRate) >= 2 ? 'on track' : 'room for improvement'}.`)
      if (posts.length > 0) findings.push(`${posts.length} posts published in this period.`)

      setFont(9, "normal", DARK)
      findings.forEach(f => {
        const lines = doc.splitTextToSize(`• ${f}`, CW - 8)
        lines.forEach((line: string) => { doc.text(line, M + 4, y); y += 4.5 })
        y += 1
      })
    }

    // ═══════════════════════════════════════
    // PAGE 3: WEEKLY PERFORMANCE
    // ═══════════════════════════════════════
    if (weekly.length > 0) {
      doc.addPage()
      y = M

      setFont(20, "bold", NAVY)
      doc.text("Weekly Performance", M, y + 8)
      y += 12
      drawLine(M, y, M + 40, y, BLUE, 1.5)
      y += 10

      // Impressions bar chart
      setFont(11, "bold", NAVY)
      doc.text("Weekly Impressions", M, y)
      y += 6

      const maxImp = Math.max(...weekly.map((w: any) => w.impressions || 0))
      const barMaxW = CW - 45
      const barH = 6

      weekly.forEach((w: any) => {
        checkPage(12)
        const pct = maxImp ? ((w.impressions || 0) / maxImp) : 0

        setFont(8, "normal", GRAY)
        doc.text(w.week_label || "", M, y + 4.5)

        // Bar background
        drawRect(M + 42, y, barMaxW, barH, LIGHT_GRAY)
        // Bar fill (gradient effect with two rects)
        if (pct > 0) {
          const fillW = barMaxW * pct
          drawRect(M + 42, y, fillW * 0.6, barH, BLUE)
          drawRect(M + 42 + fillW * 0.6, y, fillW * 0.4, barH, ORANGE)
        }

        // Value
        setFont(8, "bold", NAVY)
        doc.text((w.impressions || 0).toLocaleString(), M + 42 + barMaxW + 2, y + 4.5)

        y += barH + 3
      })

      y += 8

      // Data table
      checkPage(30)
      setFont(11, "bold", NAVY)
      doc.text("Detailed Breakdown", M, y)
      y += 6

      const headers = ["Week", "Impressions", "Likes", "Comments", "Shares", "Profile Views", "Followers"]
      const colW = CW / headers.length

      // Header row
      drawRect(M, y, CW, 7, NAVY)
      setFont(7, "bold", WHITE)
      headers.forEach((h, i) => doc.text(h, M + i * colW + 2, y + 5))
      y += 7

      // Data rows
      weekly.forEach((w: any, idx: number) => {
        checkPage(8)
        if (idx % 2 === 1) drawRect(M, y, CW, 6.5, LIGHT_GRAY)
        setFont(7, "normal", DARK)
        const vals = [w.week_label || "", (w.impressions || 0).toLocaleString(), (w.likes || 0).toLocaleString(), (w.comments || 0).toLocaleString(), (w.shares || 0).toLocaleString(), (w.profile_views || 0).toLocaleString(), (w.followers || 0).toLocaleString()]
        vals.forEach((v, i) => doc.text(v, M + i * colW + 2, y + 4.5))
        y += 6.5
      })
    }

    // ═══════════════════════════════════════
    // PAGE 4: POST PERFORMANCE
    // ═══════════════════════════════════════
    const postsWithMetrics = posts.filter((p: any) => p.post_metrics?.length > 0)
      .map((p: any) => ({ ...p, m: p.post_metrics[0] }))
      .sort((a: any, b: any) => (b.m.impressions || 0) - (a.m.impressions || 0))

    if (postsWithMetrics.length > 0) {
      doc.addPage()
      y = M

      setFont(20, "bold", NAVY)
      doc.text("Post Performance", M, y + 8)
      y += 12
      drawLine(M, y, M + 40, y, GREEN, 1.5)
      y += 10

      // Content type breakdown
      const typeCount: Record<string, number> = {}
      posts.forEach((p: any) => { typeCount[p.content_type || "Text"] = (typeCount[p.content_type || "Text"] || 0) + 1 })

      if (Object.keys(typeCount).length > 0) {
        setFont(11, "bold", NAVY)
        doc.text("Content Mix", M, y)
        y += 6

        const types = Object.entries(typeCount).sort((a, b) => b[1] - a[1])
        const typeColors = [BLUE, ORANGE, GREEN, [139, 92, 246], [245, 158, 11]]
        const typeCardW = (CW - (types.length - 1) * 4) / Math.min(types.length, 5)

        types.slice(0, 5).forEach(([type, count], i) => {
          const cx = M + i * (typeCardW + 4)
          const tc = typeColors[i % typeColors.length]
          drawRect(cx, y, typeCardW, 18, LIGHT_GRAY)
          setFont(16, "bold", tc)
          doc.text(count.toString(), cx + typeCardW / 2, y + 10, { align: "center" })
          setFont(7, "bold", GRAY)
          doc.text(type, cx + typeCardW / 2, y + 15, { align: "center" })
        })
        y += 24
      }

      // Ranked posts
      setFont(11, "bold", NAVY)
      doc.text("Ranked by Impressions", M, y)
      y += 6

      postsWithMetrics.forEach((p: any, i: number) => {
        checkPage(28)
        const m = p.m
        const totalEng = (m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.reposts || 0)
        const postEngRate = m.impressions ? ((totalEng / m.impressions) * 100).toFixed(1) : "0"
        const isTop = i === 0

        // Card background
        if (isTop) drawRect(M, y, CW, 24, [236, 253, 245])
        else drawRect(M, y, CW, 24, i % 2 === 0 ? WHITE : LIGHT_GRAY)

        // Rank circle
        const circleColor = isTop ? GREEN : GRAY
        doc.setFillColor(circleColor[0], circleColor[1], circleColor[2])
        doc.circle(M + 6, y + 8, 4, "F")
        setFont(9, "bold", WHITE)
        doc.text((i + 1).toString(), M + 6, y + 9.5, { align: "center" })

        // Date and type
        setFont(7, "normal", GRAY)
        const dateStr = p.posted_date ? new Date(p.posted_date + "T00:00:00").toLocaleDateString("en-AU", { month: "short", day: "numeric" }) : ""
        doc.text(`${dateStr} · ${p.content_type || "Text"}${isTop ? " · BEST PERFORMER" : ""}`, M + 14, y + 6)

        // Post preview
        setFont(8, "normal", DARK)
        const preview = (p.content || "").slice(0, 120) + ((p.content || "").length > 120 ? "..." : "")
        const previewLines = doc.splitTextToSize(preview, CW - 18)
        previewLines.slice(0, 2).forEach((line: string, li: number) => { doc.text(line, M + 14, y + 11 + li * 3.5) })

        // Metrics row
        setFont(7, "bold", NAVY)
        const metricsStr = `${(m.impressions || 0).toLocaleString()} impr  ·  ${m.likes || 0} likes  ·  ${m.comments || 0} comments  ·  ${m.shares || 0} shares  ·  ${postEngRate}% eng rate`
        doc.text(metricsStr, M + 14, y + 21)

        y += 26
      })
    }

    // ═══════════════════════════════════════
    // FINAL PAGE: FOOTER
    // ═══════════════════════════════════════
    checkPage(20)
    y += 10
    drawLine(M, y, W - M, y, LIGHT_GRAY, 0.5)
    y += 8
    setFont(9, "normal", GRAY)
    doc.text("Confidential — Prepared by DPT Agency", W / 2, y, { align: "center" })
    doc.text(new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }), W / 2, y + 5, { align: "center" })

    // Generate PDF as base64
    const pdfBase64 = doc.output("datauristring")

    return new Response(
      JSON.stringify({ pdf: pdfBase64 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
