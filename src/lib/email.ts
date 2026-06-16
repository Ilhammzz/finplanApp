import {Resend} from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendResetEmail({ to, resetToken }: { to: string; resetToken: string }) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/?token=${resetToken}`

  const { data, error } = await resend.emails.send({
    from: "Finance Tracker <onboarding@resend.dev>", // <-- USE THIS FOR TESTING
    to,
    subject: "Reset Your Password - Finance Tracker",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; background: #059669; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px;">
          This link expires in 1 hour. If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error("[Resend Error]", error)
    throw error
  }

  return data
}