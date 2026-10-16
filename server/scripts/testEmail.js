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
  console.log('\nUsage: npm run test:email <recipient-email> [--smtp|--console]');
  console.log('   or: node scripts/testEmail.js <recipient-email> [--smtp|--console]\n');
  console.log('Examples:');
  console.log('  npm run test:email candidate@gmail.com');
  console.log('  npm run test:email candidate@gmail.com --smtp\n');
  process.exit(1);
}

const runTest = async () => {
  const forceSmtp = args.some((arg) => arg.toLowerCase() === '--smtp' || arg.toLowerCase() === '--mode=smtp');
  const forceConsole = args.some((arg) => arg.toLowerCase() === '--console' || arg.toLowerCase() === '--mode=console');
  let mode = (process.env.EMAIL_MODE || 'console').toLowerCase();
  if (forceSmtp) mode = 'smtp';
  if (forceConsole) mode = 'console';
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  const from = process.env.EMAIL_FROM || 'AI Mock Interview Coach <no-reply@mockinterview.coach>';

  console.log('================================================================');
  console.log('           AI MOCK INTERVIEW COACH — EMAIL TEST SUITE           ');
  console.log('================================================================');
  console.log(`[Email Diagnostics] Active EMAIL_MODE : ${mode}`);
  console.log(`[Email Diagnostics] SMTP Host         : ${host}`);
  console.log(`[Email Diagnostics] SMTP Port         : ${port}`);
  console.log(`[Email Diagnostics] SMTP User         : ${maskEmail(user)}`);
  console.log(`[Email Diagnostics] Sender (FROM)     : ${from}`);
  console.log(`[Email Diagnostics] Recipient (TO)    : ${maskEmail(targetEmail)} (${targetEmail})`);
  console.log(`[Email Diagnostics] Password Status   : ${pass ? 'Configured (hidden)' : 'MISSING'}`);
  console.log('----------------------------------------------------------------');

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

  // SMTP Mode
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
