import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { maskEmail } from '../services/emailService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const args = process.argv.slice(2);
const targetEmail = args.find((arg) => arg.includes('@') && !arg.startsWith('--'));

if (!targetEmail) {
  console.log('\nUsage: npm run test:email <recipient-email> [--brevo|--smtp|--console]');
  console.log('   or: node scripts/testEmail.js <recipient-email> [--brevo|--smtp|--console]\n');
  console.log('Examples:');
  console.log('  npm run test:email candidate@gmail.com --brevo');
  console.log('  npm run test:email candidate@gmail.com --smtp');
  console.log('  npm run test:email candidate@gmail.com --console\n');
  process.exit(1);
}

const runTest = async () => {
  const forceBrevo = args.some((arg) => arg.toLowerCase() === '--brevo' || arg.toLowerCase() === '--mode=brevo');
  const forceSmtp = args.some((arg) => arg.toLowerCase() === '--smtp' || arg.toLowerCase() === '--mode=smtp');
  const forceConsole = args.some((arg) => arg.toLowerCase() === '--console' || arg.toLowerCase() === '--mode=console');

  let mode = (process.env.EMAIL_MODE || '').trim().toLowerCase();
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim();
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const from = process.env.EMAIL_FROM || 'AI Mock Interview Coach <no-reply@mockinterview.coach>';

  if (forceBrevo) mode = 'brevo';
  else if (forceSmtp) mode = 'smtp';
  else if (forceConsole) mode = 'console';
  else if (!mode) {
    if (brevoApiKey) mode = 'brevo';
    else if (host && user && pass) mode = 'smtp';
    else mode = 'console';
  }

  console.log('================================================================');
  console.log('           AI MOCK INTERVIEW COACH — EMAIL TEST SUITE           ');
  console.log('================================================================');
  console.log(`[Email Diagnostics] Active Mode       : ${mode.toUpperCase()}`);
  console.log(`[Email Diagnostics] Sender (FROM)     : ${from}`);
  console.log(`[Email Diagnostics] Recipient (TO)    : ${maskEmail(targetEmail)} (${targetEmail})`);

  if (mode === 'brevo') {
    const maskedKey = brevoApiKey.length > 8 ? `${brevoApiKey.slice(0, 8)}...` : 'MISSING';
    console.log(`[Email Diagnostics] Brevo API Key     : ${maskedKey}`);
    console.log(`[Email Diagnostics] Protocol          : HTTPS REST API (Port 443)`);
  } else if (mode === 'smtp') {
    console.log(`[Email Diagnostics] SMTP Host         : ${host}`);
    console.log(`[Email Diagnostics] SMTP Port         : ${port}`);
    console.log(`[Email Diagnostics] SMTP User         : ${maskEmail(user)}`);
    console.log(`[Email Diagnostics] Password Status   : ${pass ? 'Configured (hidden)' : 'MISSING'}`);
  }
  console.log('----------------------------------------------------------------');

  // 1. Console Mode
  if (mode === 'console') {
    console.log('[Email] Mode is CONSOLE. Testing console output representation:');
    console.log('\n┌────────────────────────────────────────────────────────────────────────┐');
    console.log(`│ [Email DEV CONSOLE] Type: test                                         │`);
    console.log(`│ Recipient: ${targetEmail.padEnd(59)} │`);
    console.log(`│ Action Link: http://localhost:5173/verify-email?token=test_token_123   │`);
    console.log('└────────────────────────────────────────────────────────────────────────┘\n');
    console.log('✓ [Email] Console mode test completed successfully.');
    console.log('================================================================');
    process.exit(0);
  }

  // 2. Brevo HTTPS API Mode
  if (mode === 'brevo') {
    if (!brevoApiKey) {
      console.error('✗ [Email][ERROR] BREVO_API_KEY is not defined in environment variables.');
      console.error('  Please add BREVO_API_KEY to your .env file or Render environment variables.');
      console.log('================================================================');
      process.exit(1);
    }

    console.log('[Email] Sending transactional email via Brevo HTTPS REST API...');
    let senderName = 'AI Mock Interview Coach';
    let senderEmail = from;
    const match = from.match(/^(.*?)\s*<(.+)>$/);
    if (match) {
      senderName = match[1].replace(/^["']|["']$/g, '').trim() || senderName;
      senderEmail = match[2].trim();
    }

    const payload = {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: targetEmail.trim().toLowerCase(),
          name: 'Candidate',
        },
      ],
      subject: 'AI Mock Interview Coach — Diagnostic Test (Brevo API)',
      textContent: `Hello!\n\nThis is a diagnostic email from AI Mock Interview Coach confirming your Brevo HTTPS API integration is operational.\n\nTimestamp: ${new Date().toISOString()}`,
      htmlContent: `
        <div style="font-family: Georgia, serif; background-color: #FAF6EE; padding: 30px 20px; color: #1C1B17;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #FFFDF8; border: 1px solid #E4DCC9; border-radius: 8px; padding: 28px;">
            <span style="font-size: 11px; font-weight: 600; color: #2F5233; text-transform: uppercase; letter-spacing: 0.5px;">AI Mock Interview Coach</span>
            <h2 style="margin: 12px 0; font-size: 20px; color: #1C1B17;">Brevo HTTPS API Verification</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #4A463F;">
              Your Brevo HTTPS REST API configuration is successfully verified. Emails sent by the application will reach candidate inboxes seamlessly.
            </p>
            <div style="margin-top: 20px; padding: 12px; background-color: #FAF6EE; border: 1px solid #E4DCC9; border-radius: 6px; font-size: 12px; color: #787268;">
              Dispatched: ${new Date().toISOString()} via Brevo HTTPS (Port 443)
            </div>
          </div>
        </div>
      `,
    };

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || `HTTP ${response.status} ${response.statusText}`);
      }

      console.log('✓ [Email] Test email successfully transmitted via Brevo HTTPS API!');
      console.log(`  Message ID : ${data.messageId || 'OK'}`);
      console.log(`  Recipient  : ${maskEmail(targetEmail)} (${targetEmail})`);
      console.log('================================================================');
      process.exit(0);
    } catch (err) {
      console.error(`✗ [Email][ERROR] Brevo API dispatch failed: ${err.message}`);
      console.log('================================================================');
      process.exit(1);
    }
  }

  // 3. SMTP Mode
  console.log('[Email] Connecting to SMTP server and verifying credentials...');
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });

  try {
    await transporter.verify();
    console.log('✓ [Email] SMTP server handshake and authentication successful.');
  } catch (verifyErr) {
    console.error(`✗ [Email][ERROR] SMTP connection verification failed: ${verifyErr.message}`);
    console.error(`  Code: ${verifyErr.code || 'N/A'} | Response: ${verifyErr.response || 'N/A'}`);
    console.log('================================================================');
    process.exit(1);
  }

  console.log('[Email] Dispatching test email...');
  try {
    const info = await transporter.sendMail({
      from,
      to: targetEmail,
      subject: 'AI Mock Interview Coach — SMTP Diagnostic Test',
      text: `Hello!\n\nThis is a diagnostic email from AI Mock Interview Coach confirming your SMTP relay configuration is operating properly.\n\nTimestamp: ${new Date().toISOString()}`,
      html: `
        <div style="font-family: Georgia, serif; background-color: #FAF6EE; padding: 30px 20px; color: #1C1B17;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #FFFDF8; border: 1px solid #E4DCC9; border-radius: 8px; padding: 28px;">
            <span style="font-size: 11px; font-weight: 600; color: #2F5233; text-transform: uppercase; letter-spacing: 0.5px;">AI Mock Interview Coach</span>
            <h2 style="margin: 12px 0; font-size: 20px; color: #1C1B17;">SMTP Diagnostic Verification</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #4A463F;">
              Your SMTP relay configuration has been successfully verified. Emails sent by the application will reach candidate inboxes.
            </p>
            <div style="margin-top: 20px; padding: 12px; background-color: #FAF6EE; border: 1px solid #E4DCC9; border-radius: 6px; font-size: 12px; color: #787268;">
              Dispatched: ${new Date().toISOString()}
            </div>
          </div>
        </div>
      `,
    });

    const accepted = Array.isArray(info.accepted) ? info.accepted.map(maskEmail).join(', ') : maskEmail(targetEmail);
    const rejected = Array.isArray(info.rejected) && info.rejected.length > 0
      ? info.rejected.map(maskEmail).join(', ')
      : 'none';

    console.log('✓ [Email] Test email successfully transmitted!');
    console.log(`  Message ID : ${info.messageId}`);
    console.log(`  Accepted   : [${accepted}]`);
    console.log(`  Rejected   : [${rejected}]`);
    console.log(`  Response   : ${info.response}`);
    console.log('================================================================');
    process.exit(0);
  } catch (sendErr) {
    console.error(`✗ [Email][ERROR] Failed to send test email: ${sendErr.message}`);
    console.error(`  Code: ${sendErr.code || 'N/A'} | Response: ${sendErr.response || 'N/A'}`);
    console.log('================================================================');
    process.exit(1);
  }
};

runTest();
