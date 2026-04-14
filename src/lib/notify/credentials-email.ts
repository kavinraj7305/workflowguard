import { Resend } from "resend";

type SendCredentialsEmailInput = {
  to: string;
  userName: string;
  role: "hr" | "manager" | "developer" | "tester";
  temporaryPassword: string;
  orgName: string;
  loginUrl: string;
  createdByName: string;
};

type SendCredentialsEmailResult = {
  sent: boolean;
  message: string;
};

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey || !from) {
    return null;
  }

  return { apiKey, from };
}

export async function sendCredentialsEmail(
  input: SendCredentialsEmailInput
): Promise<SendCredentialsEmailResult> {
  const cfg = getResendConfig();
  if (!cfg) {
    return {
      sent: false,
      message:
        "Resend is not configured. Set RESEND_API_KEY and MAIL_FROM.",
    };
  }

  const resend = new Resend(cfg.apiKey);

  const roleLabel = input.role === "developer" ? "Developer" : "Tester";

  const subject = `${input.orgName}: ${roleLabel} account details`;
  const text = [
    `Hello ${input.userName},`,
    "",
    `${input.createdByName} created your ${roleLabel} account in WorkFlowGuard.`,
    "",
    `Username: ${input.to}`,
    `Temporary password: ${input.temporaryPassword}`,
    `Login: ${input.loginUrl}`,
    "",
    "Please sign in and change your password as soon as possible.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin-bottom: 12px;">Welcome to WorkFlowGuard</h2>
      <p>Hello ${input.userName},</p>
      <p>${input.createdByName} created your <strong>${roleLabel}</strong> account in <strong>${input.orgName}</strong>.</p>
      <p><strong>Username:</strong> ${input.to}<br />
      <strong>Temporary password:</strong> ${input.temporaryPassword}<br />
      <strong>Login:</strong> <a href="${input.loginUrl}">${input.loginUrl}</a></p>
      <p>Please sign in and change your password as soon as possible.</p>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: cfg.from,
      to: input.to,
      subject,
      text,
      html,
    });

    if (result.error) {
      return {
        sent: false,
        message: `Could not send credentials email to ${input.to}. ${result.error.message}`,
      };
    }

    return {
      sent: true,
      message: `Credentials email sent to ${input.to}.`,
    };
  } catch {
    return {
      sent: false,
      message: `Could not send credentials email to ${input.to}. Check SMTP settings.`,
    };
  }
}
