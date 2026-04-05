require('dotenv').config()
const nodemailer = require('nodemailer')

const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env

if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
  console.error('Missing EMAIL_HOST, EMAIL_USER, or EMAIL_PASS in .env')
  process.exit(1)
}

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: parseInt(EMAIL_PORT || '587'),
  secure: EMAIL_PORT === '465',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
})

async function run() {
  console.log(`Testing SMTP connection to ${EMAIL_HOST}:${EMAIL_PORT || 587}...`)
  try {
    await transporter.verify()
    console.log('✓ SMTP connection successful')

    await transporter.sendMail({
      from: `"TheWire Test" <${EMAIL_USER}>`,
      to: EMAIL_USER,
      subject: 'TheWire email test',
      text: 'If you got this, email is working correctly.'
    })
    console.log(`✓ Test email sent to ${EMAIL_USER}`)
  } catch (err) {
    console.error('✗ Email test failed:', err.message)
    process.exit(1)
  }
}

run()
