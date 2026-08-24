import { getAppUrl } from "@/lib/appUrl";

export function isMailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

async function sendEmail({ to, subject, text, html }) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim() || "AUREX <noreply@aurix.click>";

  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[mail:dev] to=${to} subject=${subject}\n${text}`);
      return { ok: true, dev: true };
    }
    console.error("RESEND_API_KEY is not set; cannot send email.");
    return { ok: false };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text, html: html || text }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("Resend failed:", res.status, body);
    let message = "Could not send email. Try again later.";
    try {
      const parsed = JSON.parse(body);
      const raw = String(parsed?.message || parsed?.error || "");
      if (/own email|testing emails|only send/i.test(raw)) {
        message =
          "Test sender can only email the Resend account address until aurex.click is verified.";
      } else if (raw) {
        message = raw;
      }
    } catch {
      /* keep default */
    }
    return { ok: false, message };
  }
  return { ok: true };
}

export async function sendVerifyEmail(to, rawToken) {
  const link = `${getAppUrl()}/verify-email?token=${rawToken}`;
  return sendEmail({
    to,
    subject: "Verify your AUREX email",
    text: `Confirm your AUREX account:\n${link}\n\nThis link expires in 24 hours.`,
    html: `<p>Confirm your AUREX account:</p><p><a href="${link}">${link}</a></p><p>This link expires in 24 hours.</p>`,
  });
}

export async function sendResetEmail(to, rawToken) {
  const link = `${getAppUrl()}/reset-password?token=${rawToken}`;
  return sendEmail({
    to,
    subject: "Reset your AUREX password",
    text: `Reset your AUREX password:\n${link}\n\nThis link expires in 1 hour. If you did not ask for this, ignore the email.`,
    html: `<p>Reset your AUREX password:</p><p><a href="${link}">${link}</a></p><p>This link expires in 1 hour.</p>`,
  });
}
