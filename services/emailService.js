const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

const FROM = `"TheWire" <${process.env.EMAIL_USER}>`

exports.sendWelcomeEmail = async ({ email, displayName }) => {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Welcome to TheWire!',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0d0d0d;color:#e8eaed;border-radius:8px;">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#ffffff;">TheWire</h1>
        <p style="margin:0 0 24px;color:#9ea3a8;font-size:14px;">Your social platform for reviews &amp; discovery</p>
        <hr style="border:none;border-top:1px solid #1e1e1e;margin:0 0 24px;" />
        <p style="margin:0 0 16px;font-size:16px;">Hey <strong>${displayName}</strong>,</p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#c8ccd0;">
          Welcome to TheWire! You're all set to discover movies, music, podcasts, and more — rate, review, and share with your people.
        </p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/discover"
           style="display:inline-block;padding:12px 24px;background:#5865f2;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;">
          Start Exploring
        </a>
        <p style="margin:32px 0 0;font-size:13px;color:#9ea3a8;">
          You're receiving this because you signed up at TheWire. If this wasn't you, you can ignore this email.
        </p>
      </div>
    `
  })
}

exports.sendWatchPartyConfirmation = async ({ email, displayName, partyTitle, contentTitle, scheduledAt, partyUrl }) => {
  const dateStr = new Date(scheduledAt).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Watch party scheduled: ${partyTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0d0d0d;color:#e8eaed;border-radius:8px;">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#ffffff;">TheWire</h1>
        <p style="margin:0 0 24px;color:#9ea3a8;font-size:14px;">Watch Party Confirmed</p>
        <hr style="border:none;border-top:1px solid #1e1e1e;margin:0 0 24px;" />
        <p style="margin:0 0 16px;font-size:16px;">Hey <strong>${displayName}</strong>,</p>
        <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#c8ccd0;">
          Your watch party has been scheduled!
        </p>
        <div style="background:#1a1a1a;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0 0 6px;font-size:17px;font-weight:700;color:#fff;">${partyTitle}</p>
          <p style="margin:0 0 4px;font-size:14px;color:#9ea3a8;">${contentTitle}</p>
          <p style="margin:0;font-size:13px;color:#9ea3a8;">${dateStr}</p>
        </div>
        <a href="${partyUrl}"
           style="display:inline-block;padding:12px 24px;background:#e8793a;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;margin-bottom:12px;">
          View Party
        </a>
        <p style="margin:12px 0 4px;font-size:14px;color:#9ea3a8;">Share this link to invite friends:</p>
        <p style="margin:0 0 24px;font-size:13px;color:#e8793a;word-break:break-all;">${partyUrl}</p>
        <p style="margin:0;font-size:13px;color:#9ea3a8;">
          Anyone with this link can join your watch party directly.
        </p>
      </div>
    `
  })
}

exports.sendWatchPartyInvite = async ({ email, displayName, hostName, partyTitle, contentTitle, scheduledAt, partyUrl }) => {
  const dateStr = new Date(scheduledAt).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `${hostName} invited you to a watch party: ${partyTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0d0d0d;color:#e8eaed;border-radius:8px;">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#ffffff;">TheWire</h1>
        <p style="margin:0 0 24px;color:#9ea3a8;font-size:14px;">Watch Party Invitation</p>
        <hr style="border:none;border-top:1px solid #1e1e1e;margin:0 0 24px;" />
        <p style="margin:0 0 16px;font-size:16px;">Hey <strong>${displayName}</strong>,</p>
        <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#c8ccd0;">
          <strong>${hostName}</strong> has invited you to a watch party!
        </p>
        <div style="background:#1a1a1a;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0 0 6px;font-size:17px;font-weight:700;color:#fff;">${partyTitle}</p>
          <p style="margin:0 0 4px;font-size:14px;color:#9ea3a8;">${contentTitle}</p>
          <p style="margin:0;font-size:13px;color:#9ea3a8;">${dateStr}</p>
        </div>
        <a href="${partyUrl}"
           style="display:inline-block;padding:12px 24px;background:#e8793a;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;">
          RSVP Now
        </a>
        <p style="margin:24px 0 0;font-size:13px;color:#9ea3a8;">
          Click the button above to accept or decline this invitation on TheWire.
        </p>
      </div>
    `
  })
}

exports.sendPasswordResetEmail = async ({ email, displayName, resetUrl }) => {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Reset your TheWire password',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0d0d0d;color:#e8eaed;border-radius:8px;">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#ffffff;">TheWire</h1>
        <p style="margin:0 0 24px;color:#9ea3a8;font-size:14px;">Password Reset</p>
        <hr style="border:none;border-top:1px solid #1e1e1e;margin:0 0 24px;" />
        <p style="margin:0 0 16px;font-size:16px;">Hey <strong>${displayName}</strong>,</p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#c8ccd0;">
          We received a request to reset your password. Click the button below to choose a new one.
          This link expires in <strong>1 hour</strong>.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#5865f2;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;">
          Reset Password
        </a>
        <p style="margin:24px 0 0;font-size:13px;color:#9ea3a8;">
          If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
        <p style="margin:8px 0 0;font-size:12px;color:#666;word-break:break-all;">
          Or copy this link: ${resetUrl}
        </p>
      </div>
    `
  })
}
