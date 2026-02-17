import { Resend } from "resend";

const resend = new Resend(process.env.AUTH_RESEND_KEY || process.env.RESEND_API_KEY);
const fromAddress = process.env.EMAIL_FROM || "visicheck.ai <onboarding@resend.dev>";
const baseUrl = process.env.NEXTAUTH_URL || "https://visicheck.ai";

// ── Team Invitation Email ───────────────────────────────────────────────────

export async function sendTeamInvitationEmail({
  to,
  inviterName,
  teamName,
  token,
  role,
}: {
  to: string;
  inviterName: string;
  teamName: string;
  token: string;
  role: string;
}) {
  const inviteUrl = `${baseUrl}/invite/${token}`;
  const roleLabel = role === "owner" ? "Owner" : "Mitglied";

  const subject = `${inviterName} hat Sie zum Team „${teamName}" eingeladen`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #111;">visicheck.ai</h1>
      </div>
      
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="font-size: 16px; font-weight: 600; color: #0c4a6e; margin: 0 0 8px 0;">
          Team-Einladung
        </p>
        <p style="font-size: 14px; color: #555; margin: 0;">
          <strong>${inviterName}</strong> hat Sie eingeladen, dem Team <strong>„${teamName}"</strong> als <strong>${roleLabel}</strong> beizutreten.
        </p>
      </div>
      
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${inviteUrl}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 500;">
          Einladung annehmen
        </a>
      </div>
      
      <p style="font-size: 13px; color: #777; text-align: center;">
        Dieser Link ist 7 Tage gültig. Falls Sie kein Konto haben, können Sie sich nach dem Klick registrieren.
      </p>
      
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
      
      <p style="font-size: 12px; color: #999; text-align: center;">
        Diese E-Mail wurde automatisch von visicheck.ai gesendet.
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
    });
    console.log(`[Email] Team-Einladung an ${to} gesendet`);
  } catch (err) {
    console.error(`[Email] Fehler beim Senden der Einladung an ${to}:`, err);
  }
}

export async function sendRunCompletedEmail({
  to,
  runId,
  domainName,
  promptCount,
  status,
}: {
  to: string;
  runId: string;
  domainName: string;
  promptCount: number;
  status: "completed" | "failed";
}) {
  const runUrl = `${baseUrl}/dashboard/runs/${runId}`;
  const isSuccess = status === "completed";

  const subject = isSuccess
    ? `✅ Ihr Visibility-Check für „${domainName}" ist fertig`
    : `⚠️ Visibility-Check für „${domainName}" fehlgeschlagen`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #111;">visicheck.ai</h1>
      </div>
      
      <div style="background: ${isSuccess ? "#f0fdf4" : "#fef2f2"}; border: 1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="font-size: 16px; font-weight: 600; color: ${isSuccess ? "#166534" : "#991b1b"}; margin: 0 0 8px 0;">
          ${isSuccess ? "Run erfolgreich abgeschlossen" : "Run fehlgeschlagen"}
        </p>
        <p style="font-size: 14px; color: #555; margin: 0;">
          ${isSuccess
            ? `Ihr Visibility-Check für <strong>${domainName}</strong> mit ${promptCount} Prompts wurde erfolgreich durchgeführt.`
            : `Beim Visibility-Check für <strong>${domainName}</strong> ist ein Fehler aufgetreten.`
          }
        </p>
      </div>
      
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${runUrl}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 500;">
          Ergebnisse ansehen
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
      
      <p style="font-size: 12px; color: #999; text-align: center;">
        Diese E-Mail wurde automatisch von visicheck.ai gesendet.
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
    });
    console.log(`[Email] Run-Benachrichtigung an ${to} gesendet (${status})`);
  } catch (err) {
    console.error(`[Email] Fehler beim Senden an ${to}:`, err);
  }
}
