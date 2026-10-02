import { Resend } from "resend";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

export async function sendVerificationEmail({
  email,
  name,
  token,
}: {
  email: string;
  name: string;
  token: string;
}) {
  const verificationUrl = buildTokenUrl("/verify-email", token);

  const { data, error } =
    await resend.emails.send({
      from: getEmailFrom(),
      to: email,
      subject:
        "Verify your Assistora account",

      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #111827;
          "
        >
          <div
            style="
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 30px;
            "
          >
            Assistora
          </div>

          <h1
            style="
              font-size: 28px;
              margin-bottom: 12px;
            "
          >
            Verify your email 👋
          </h1>

          <p
            style="
              font-size: 16px;
              color: #4b5563;
              line-height: 1.6;
            "
          >
            Hi ${escapeHtml(name)},
          </p>

          <p
            style="
              font-size: 16px;
              color: #4b5563;
              line-height: 1.6;
            "
          >
            Thanks for creating your Assistora
            account. Please verify your email
            address to continue.
          </p>

          <div style="margin: 30px 0;">
            <a
              href="${escapeHtml(verificationUrl)}"
              style="
                display: inline-block;
                background: #4f46e5;
                color: #ffffff;
                text-decoration: none;
                padding: 14px 24px;
                border-radius: 8px;
                font-weight: 600;
              "
            >
              Verify Email
            </a>
          </div>

          <p
            style="
              font-size: 14px;
              color: #6b7280;
              line-height: 1.6;
            "
          >
            This verification link expires
            in 24 hours.
          </p>

          <p
            style="
              font-size: 13px;
              color: #9ca3af;
              margin-top: 30px;
              line-height: 1.6;
            "
          >
            If you didn't create an Assistora
            account, you can safely ignore this
            email.
          </p>

          <hr
            style="
              margin: 30px 0;
              border: none;
              border-top: 1px solid #e5e7eb;
            "
          />

          <p
            style="
              font-size: 12px;
              color: #9ca3af;
              word-break: break-all;
            "
          >
            If the button doesn't work, copy and
            paste this link into your browser:
          </p>

          <p style="font-size: 12px; color: #6b7280; word-break: break-all;">
            ${escapeHtml(verificationUrl)}
          </p>
        </div>
      `,
    });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }

  return data;
}

export async function sendPasswordResetEmail({
  email,
  name,
  token,
}: {
  email: string;
  name: string;
  token: string;
}) {
  const resetUrl = buildTokenUrl("/reset-password", token);
  const { error } = await resend.emails.send({
    from: getEmailFrom(),
    to: email,
    subject: "Reset your Assistora password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #111827;">
        <h1 style="font-size: 24px;">Reset your password</h1>
        <p style="color: #4b5563; line-height: 1.6;">Hi ${escapeHtml(name)},</p>
        <p style="color: #4b5563; line-height: 1.6;">Use the link below to choose a new password. It expires in one hour.</p>
        <p><a href="${escapeHtml(resetUrl)}" style="display: inline-block; background: #111827; color: #fff; text-decoration: none; padding: 14px 24px; border-radius: 8px;">Reset password</a></p>
        <p style="font-size: 12px; color: #6b7280; word-break: break-all;">${escapeHtml(resetUrl)}</p>
        <p style="font-size: 13px; color: #6b7280;">If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });

  if (error) throw new Error(`Failed to send password reset email: ${error.message}`);
}

function buildTokenUrl(path: string, token: string) {
  const configuredUrl = process.env.APP_URL || "http://localhost:3000";
  const appUrl = new URL(configuredUrl);
  if (appUrl.protocol !== "https:" && appUrl.protocol !== "http:") {
    throw new Error("APP_URL must use HTTP or HTTPS.");
  }
  if (process.env.NODE_ENV === "production" && appUrl.protocol !== "https:") {
    throw new Error("APP_URL must use HTTPS in production.");
  }
  const link = new URL(path, appUrl);
  link.searchParams.set("token", token);
  return link.toString();
}

function getEmailFrom() {
  return process.env.EMAIL_FROM || "Assistora <onboarding@resend.dev>";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}