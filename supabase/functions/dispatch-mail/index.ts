// Sends due rows from the private mail queue. The caller must present the dispatch secret.
// Message text, proposals, contacts, and join links are not in the queue and are not sent.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const secret = Deno.env.get("MAIL_DISPATCH_SECRET") || "";
const resendKey = Deno.env.get("RESEND_API_KEY") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character] || character
  ));
}

function letter(row: { subject: string; preview: string; href: string }) {
  const preview = escapeHtml(row.preview);
  const href = escapeHtml(row.href);
  return `<!doctype html><html lang="en"><body style="margin:0;padding:0;background:#eef2f8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f8;padding:32px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden;">
<tr><td style="background:#060D1B;padding:22px 32px;"><span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:4px;">BOND</span></td></tr>
<tr><td style="padding:32px;color:#111D30;"><h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">${escapeHtml(row.subject)}</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:1.55;color:#33415c;">${preview}</p>
<a href="${href}" style="display:inline-block;padding:13px 28px;background:#0057FF;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:999px;">Open BOND</a>
<p style="margin:28px 0 0;font-size:13px;line-height:1.55;color:#5b6b85;">This note does not include the message itself. Open BOND to read it.</p>
</td></tr>
<tr><td style="padding:18px 32px;border-top:1px solid #e3e8f0;font-size:12px;color:#7a879c;">BOND · <a href="https://joinbond.world" style="color:#7a879c;">joinbond.world</a></td></tr>
</table></td></tr></table></body></html>`;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!secret || request.headers.get("Authorization") !== `Bearer ${secret}`) {
    return new Response(JSON.stringify({ sent: 0, failed: 0 }), { status: 401, headers: { "content-type": "application/json" } });
  }
  if (!resendKey || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ sent: 0, failed: 0 }), { status: 503, headers: { "content-type": "application/json" } });
  }
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("claim_due_mail", { dispatch_secret: secret });
  if (error || !Array.isArray(data) || data.length === 0) {
    return Response.json({ sent: 0, failed: 0 });
  }
  const sent: string[] = [];
  const failed: string[] = [];
  for (const row of data) {
    if (!row?.id || !row.recipient_email || !row.href?.startsWith("https://joinbond.world/")) {
      failed.push(row.id);
      continue;
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "BOND <no-reply@joinbond.world>",
        to: [row.recipient_email],
        subject: row.subject,
        html: letter(row),
      }),
    });
    if (response.ok) sent.push(row.id);
    else failed.push(row.id);
  }
  if (sent.length) await supabase.rpc("complete_mail", { dispatch_secret: secret, mail_ids: sent });
  if (failed.length) await supabase.rpc("release_mail", { dispatch_secret: secret, mail_ids: failed });
  return Response.json({ sent: sent.length, failed: failed.length });
});
