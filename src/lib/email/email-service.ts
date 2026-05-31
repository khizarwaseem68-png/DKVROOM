import nodemailer from 'nodemailer'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text: string
}

function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error('SMTP_HOST, SMTP_USER, and SMTP_PASS are required to send email')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  })
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER
  if (!from) throw new Error('EMAIL_FROM or SMTP_USER is required to send email')

  await getTransporter().sendMail({
    from,
    to,
    subject,
    html,
    text,
  })
}

export async function sendOtpEmail({
  email,
  otp,
  purpose,
}: {
  email: string
  otp: string
  purpose: 'registration' | 'forgot_password'
}) {
  const isPasswordReset = purpose === 'forgot_password'
  const title = isPasswordReset ? 'Reset your DK Vroom password' : 'Verify your DK Vroom email'
  const message = isPasswordReset
    ? 'Use this code to reset your password.'
    : 'Use this code to finish creating your account.'

  await sendEmail({
    to: email,
    subject: title,
    text: `${message}\n\nYour OTP is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#f5f0e8;padding:32px">
        <div style="max-width:520px;margin:0 auto;background:#111;border:1px solid #2a2a2a;border-radius:12px;padding:28px">
          <h1 style="color:#c9a84c;margin:0 0 12px">DK Vroom</h1>
          <p style="margin:0 0 20px;color:#d8d2c4">${message}</p>
          <div style="font-size:32px;letter-spacing:8px;font-weight:700;color:#0a0a0a;background:#c9a84c;border-radius:10px;padding:16px;text-align:center">
            ${otp}
          </div>
          <p style="margin:20px 0 0;color:#8a8578;font-size:13px">This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>
        </div>
      </div>
    `,
  })
}

export async function sendDealerVerificationEmail({
  email,
  name,
  companyName,
  status,
  reason,
}: {
  email: string
  name: string
  companyName: string
  status: 'verified' | 'rejected'
  reason?: string | null
}) {
  const accepted = status === 'verified'
  const title = accepted ? 'Your DK Vroom dealer account is approved' : 'Your DK Vroom dealer account was rejected'
  const message = accepted
    ? `Good news, ${name}. Your dealer account "${companyName}" has been approved. You can now access your dealer dashboard and start listing vehicles.`
    : `Hi ${name}, your dealer account "${companyName}" was rejected.${reason ? ` Reason: ${reason}` : ''}`
  const ctaText = accepted ? 'Open Dealer Dashboard' : 'View Account Status'
  const ctaUrl = accepted ? '/dealer-dashboard' : '/dealer-status'

  await sendEmail({
    to: email,
    subject: title,
    text: `${message}\n\n${accepted ? 'You can now sign in and access your dealer dashboard.' : 'Please contact DK Vroom support if you need help with your application.'}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#f5f0e8;padding:32px">
        <div style="max-width:560px;margin:0 auto;background:#111;border:1px solid #2a2a2a;border-radius:12px;padding:28px">
          <h1 style="color:#c9a84c;margin:0 0 12px">DK Vroom</h1>
          <h2 style="margin:0 0 16px;color:#f5f0e8">${title}</h2>
          <p style="margin:0 0 20px;color:#d8d2c4;line-height:1.6">${message}</p>
          <p style="margin:0 0 20px;color:#8a8578;font-size:13px">
            ${accepted ? 'You can now sign in and manage your listings.' : 'If you believe this was a mistake, please contact DK Vroom support.'}
          </p>
          <div style="display:inline-block;background:#c9a84c;color:#0a0a0a;border-radius:8px;padding:12px 18px;font-weight:700">
            ${ctaText}: ${ctaUrl}
          </div>
        </div>
      </div>
    `,
  })
}
