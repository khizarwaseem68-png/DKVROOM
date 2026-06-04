import { Resend } from 'resend'

function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY is required to send email')
  return new Resend(apiKey)
}

function getFromAddress() {
  return process.env.EMAIL_FROM || 'DK Vroom <noreply@dkvroom.com>'
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const resend = getResend()
  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject,
    html,
    text,
  })
  if (error) {
    console.error('[Resend] Email send failed:', JSON.stringify(error))
    throw new Error(`Resend error: ${error.message}`)
  }
  return data
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

export async function sendCarListingStatusEmail({
  email,
  name,
  carName,
  status,
  reason,
  bookingFee,
}: {
  email: string
  name: string
  carName: string
  status: 'approved' | 'rejected'
  reason?: string | null
  bookingFee?: number | null
}) {
  const approved = status === 'approved'
  const title = approved
    ? `Your car listing "${carName}" has been approved`
    : `Your car listing "${carName}" was rejected`
  const message = approved
    ? `Hi ${name}, your listing for ${carName} has been approved and is now live on DK Vroom.${
        bookingFee ? ` The booking fee set by admin is RM ${bookingFee}.` : ''
      }`
    : `Hi ${name}, your listing for ${carName} was rejected.${reason ? ` Reason: ${reason}` : ''} Please edit your listing and resubmit.`

  await sendEmail({
    to: email,
    subject: title,
    text: `${message}\n\nSign in to your dealer dashboard to manage your listings.`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#f5f0e8;padding:32px">
        <div style="max-width:560px;margin:0 auto;background:#111;border:1px solid #2a2a2a;border-radius:12px;padding:28px">
          <h1 style="color:#c9a84c;margin:0 0 12px">DK Vroom</h1>
          <h2 style="margin:0 0 16px;color:#f5f0e8">${title}</h2>
          <p style="margin:0 0 20px;color:#d8d2c4;line-height:1.6">${message}</p>
          ${approved && bookingFee ? `
          <div style="margin:18px 0;padding:14px;border-radius:10px;background:#191919;border:1px solid #2a2a2a">
            <p style="margin:0;color:#8a8578;font-size:13px">Admin-set booking fee</p>
            <p style="margin:4px 0 0;color:#c9a84c;font-size:24px;font-weight:700">RM ${bookingFee}</p>
          </div>` : ''}
          <p style="margin:20px 0 0;color:#8a8578;font-size:13px">Sign in to your dealer dashboard to manage your listings.</p>
        </div>
      </div>
    `,
  })
}

export async function sendPaymentVerifiedEmail({
  email,
  name,
  amount,
  vehicleName,
  bookingType,
}: {
  email: string
  name: string
  amount: number
  vehicleName?: string
  bookingType?: string | null
}) {
  const title = 'Your DK Vroom payment has been verified'
  const readableType = bookingType === 'rent' ? 'rental booking fee' : 'payment'
  const vehicleText = vehicleName ? ` for ${vehicleName}` : ''
  const message = `Hi ${name}, your ${readableType}${vehicleText} has been verified. Dealer contact details are now unlocked in your DK Vroom account.`

  await sendEmail({
    to: email,
    subject: title,
    text: `${message}\n\nAmount verified: RM ${amount}. Open your customer dashboard to continue.`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#f5f0e8;padding:32px">
        <div style="max-width:560px;margin:0 auto;background:#111;border:1px solid #2a2a2a;border-radius:12px;padding:28px">
          <h1 style="color:#c9a84c;margin:0 0 12px">DK Vroom</h1>
          <h2 style="margin:0 0 16px;color:#f5f0e8">${title}</h2>
          <p style="margin:0 0 16px;color:#d8d2c4;line-height:1.6">${message}</p>
          <div style="margin:18px 0;padding:14px;border-radius:10px;background:#191919;border:1px solid #2a2a2a">
            <p style="margin:0;color:#8a8578;font-size:13px">Verified amount</p>
            <p style="margin:4px 0 0;color:#c9a84c;font-size:24px;font-weight:700">RM ${amount}</p>
          </div>
          <p style="margin:0;color:#8a8578;font-size:13px">Open your customer dashboard to view the unlocked dealer WhatsApp contact.</p>
        </div>
      </div>
    `,
  })
}
