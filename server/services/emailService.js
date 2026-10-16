import nodemailer from 'nodemailer';

/**
 * Mask an email address for privacy in logs:
 * e.g. "alex@example.com" -> "al***@example.com"
 *      "220101120038@cutm.ac.in" -> "22***@cutm.ac.in"
 */
export const maskEmail = (email = '') => {
  if (!email || typeof email !== 'string') return '***';
  const clean = email.trim().toLowerCase();
  const parts = clean.split('@');
  if (parts.length !== 2) return '***';
  const [user, domain] = parts;
  if (user.length <= 2) {
    return `${user[0] || '*'}***@${domain}`;
  }
  return `${user.slice(0, 2)}***@${domain}`;
};

export const getEmailConfig = () => {
  const mode = (process.env.EMAIL_MODE || '').toLowerCase();
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || (user ? `AI Mock Interview Coach <${user}>` : 'AI Mock Interview Coach <no-reply@mockinterview.coach>');
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

  const isSmtpConfigured = Boolean(host && user && pass);
  // If SMTP credentials are provided, default to SMTP mode even if EMAIL_MODE wasn't explicitly set
  const activeMode = isSmtpConfigured && (mode === 'smtp' || mode === '') ? 'smtp' : mode === 'smtp' && isSmtpConfigured ? 'smtp' : 'console';

  return {
    mode: activeMode,
    host,
    port,
    user,
    pass,
    from,
    frontendUrl,
    isProduction: process.env.NODE_ENV === 'production',
  };
};

let cachedTransporter = null;

export const getTransporter = (config = getEmailConfig()) => {
  if (cachedTransporter) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465, // true for 465, false for other ports
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: config.isProduction,
    },
  });

  return cachedTransporter;
};

/**
 * Startup diagnostic verification:
 * Prints the active mode and tests SMTP connection if configured.
 * Never logs SMTP_PASS or secret credentials.
 */
export const verifyEmailServiceStartup = async () => {
  const config = getEmailConfig();
  console.log(`[Email] Mode: ${config.mode}`);

  if (config.mode === 'smtp') {
    try {
      const transporter = getTransporter(config);
      await transporter.verify();
      console.log(
        `[Email] SMTP server verified successfully (host: ${config.host}, port: ${config.port}, user: ${maskEmail(config.user)})`
      );
      return { success: true };
    } catch (err) {
      console.error(
        `[Email][ERROR] SMTP connection verification failed: ${err.message} (host: ${config.host}, port: ${config.port}, user: ${maskEmail(config.user)})`
      );
      return { success: false, error: err.message };
    }
  }

  return { success: true };
};

/**
 * Wrap content in the warm paper palette HTML email template
 */
const buildHtmlLayout = ({ title, preheader, contentHtml }) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF6EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1C1B17; -webkit-font-smoothing: antialiased;">
  <span style="display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">
    ${preheader}
  </span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FAF6EE; width: 100%; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 540px; background-color: #FFFDF8; border: 1px solid #E4DCC9; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(28, 27, 23, 0.04);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 20px 36px; border-bottom: 1px solid #E4DCC9; background-color: #FAF6EE;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="display: inline-block; padding: 4px 10px; background-color: #FFFDF8; border: 1px solid #E4DCC9; border-radius: 9999px; font-size: 11px; font-weight: 600; color: #2F5233; letter-spacing: 0.5px; text-transform: uppercase;">
                      AI Mock Interview Coach
                    </span>
                    <h1 style="margin: 14px 0 0 0; font-family: Georgia, 'Times New Roman', serif; font-size: 22px; font-weight: 700; color: #1C1B17; line-height: 1.3;">
                      ${title}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px 36px; color: #1C1B17; font-size: 14px; line-height: 1.6;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #FAF6EE; border-top: 1px solid #E4DCC9; font-size: 12px; color: #787268; line-height: 1.5;">
              <p style="margin: 0 0 8px 0;">
                © ${new Date().getFullYear()} AI Mock Interview Coach • Methodical STAR Practice
              </p>
              <p style="margin: 0;">
                If you didn't request this email, you can safely ignore it. Your account security remains intact.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Generic email dispatcher supporting SMTP or console mode
 */
const sendEmail = async ({ to, subject, html, text, type = 'notice', logMeta = {} }) => {
  const config = getEmailConfig();
  const maskedTo = maskEmail(to);

  if (config.mode === 'console') {
    if (!config.isProduction) {
      console.log('\n┌────────────────────────────────────────────────────────────────────────┐');
      console.log(`│ [Email DEV CONSOLE] Type: ${type.padEnd(44)} │`);
      console.log(`│ Recipient: ${to.padEnd(59)} │`);
      if (logMeta.actionLink) {
        console.log('│ Action Link (copy & paste into browser):                               │');
        console.log(`│ ${logMeta.actionLink.padEnd(70)} │`);
      }
      console.log('└────────────────────────────────────────────────────────────────────────┘\n');
    } else {
      console.log(`[Email] Console mode active in production: skipped sending email to ${maskedTo} (Type: ${type})`);
    }

    console.log(`[Email] Dispatched type: ${type} to: ${maskedTo} | result: console-mode`);
    return { success: true, mode: 'console' };
  }

  try {
    const transporter = getTransporter(config);
    const info = await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text,
      html,
    });

    const accepted = Array.isArray(info.accepted) ? info.accepted.map(maskEmail).join(',') : maskedTo;
    const rejected = Array.isArray(info.rejected) && info.rejected.length > 0
      ? info.rejected.map(maskEmail).join(',')
      : 'none';

    console.log(
      `[Email] Sent type: ${type} to: ${maskedTo} | messageId: ${info.messageId} | accepted: [${accepted}] | rejected: [${rejected}]`
    );
    return { success: true, messageId: info.messageId, mode: 'smtp' };
  } catch (error) {
    console.error(
      `[Email][ERROR] Failed sending type: ${type} to: ${maskedTo} | code: ${error.code || 'UNKNOWN'} | message: ${error.message}`
    );
    return {
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN',
      mode: 'smtp',
    };
  }
};

/**
 * Send email verification link (24h expiration)
 */
export const sendVerificationEmail = async ({ email, name, token, frontendUrl }) => {
  try {
    const config = getEmailConfig();
    const base = (frontendUrl || config.frontendUrl).replace(/\/+$/, '');
    const actionLink = `${base}/verify-email?token=${token}`;
    const displayName = name ? name.split(' ')[0] : 'there';

    const subject = 'Verify your email — AI Mock Interview Coach';
    const preheader = 'Please confirm your email address to start practicing with AI Mock Interview Coach.';

    const contentHtml = `
      <p style="margin: 0 0 16px 0; font-size: 15px;">
        Hi ${displayName},
      </p>
      <p style="margin: 0 0 20px 0;">
        Thank you for joining <strong>AI Mock Interview Coach</strong>. Please verify your email address to activate your account and start practicing behavioral and technical interviews.
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
        <tr>
          <td align="center" style="border-radius: 6px; background-color: #2F5233;">
            <a href="${actionLink}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #FAF6EE; text-decoration: none; border-radius: 6px; background-color: #2F5233; border: 1px solid #244027;">
              Verify Email Address
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 12px 0; font-size: 13px; color: #4A463F;">
        <strong>Note:</strong> This verification link will expire in <strong>24 hours</strong> and can only be used once.
      </p>
      <p style="margin: 0 0 12px 0; font-size: 12px; color: #787268; word-break: break-all;">
        If the button above doesn't work, copy and paste this URL into your browser:<br />
        <a href="${actionLink}" style="color: #2F5233; text-decoration: underline;">${actionLink}</a>
      </p>
    `;

    const text = `Hi ${displayName},

Thank you for joining AI Mock Interview Coach. Please verify your email address to activate your account:

${actionLink}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.`;

    return await sendEmail({
      to: email,
      subject,
      html: buildHtmlLayout({ title: 'Verify Your Email Address', preheader, contentHtml }),
      text,
      type: 'verify',
      logMeta: { actionLink },
    });
  } catch (err) {
    console.error(`[Email][ERROR] sendVerificationEmail caught error for ${maskEmail(email)}:`, err.message);
    return { success: false, error: err.message, mode: 'smtp' };
  }
};

/**
 * Send password reset link (30 minute expiration)
 */
export const sendPasswordResetEmail = async ({ email, name, token, frontendUrl }) => {
  try {
    const config = getEmailConfig();
    const base = (frontendUrl || config.frontendUrl).replace(/\/+$/, '');
    const actionLink = `${base}/reset-password?token=${token}`;
    const displayName = name ? name.split(' ')[0] : 'there';

    const subject = 'Reset your password — AI Mock Interview Coach';
    const preheader = 'Reset your password for AI Mock Interview Coach. This link expires in 30 minutes.';

    const contentHtml = `
      <p style="margin: 0 0 16px 0; font-size: 15px;">
        Hi ${displayName},
      </p>
      <p style="margin: 0 0 20px 0;">
        We received a request to reset the password for your <strong>AI Mock Interview Coach</strong> account. Click the button below to choose a new password:
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0;">
        <tr>
          <td align="center" style="border-radius: 6px; background-color: #2F5233;">
            <a href="${actionLink}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 600; color: #FAF6EE; text-decoration: none; border-radius: 6px; background-color: #2F5233; border: 1px solid #244027;">
              Reset Password
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 0 0 12px 0; font-size: 13px; color: #4A463F;">
        <strong>Note:</strong> This password reset link will expire in <strong>30 minutes</strong> and is valid for a single use.
      </p>
      <p style="margin: 0 0 12px 0; font-size: 12px; color: #787268; word-break: break-all;">
        If the button above doesn't work, copy and paste this link into your browser:<br />
        <a href="${actionLink}" style="color: #2F5233; text-decoration: underline;">${actionLink}</a>
      </p>
    `;

    const text = `Hi ${displayName},

We received a request to reset your password for AI Mock Interview Coach:

${actionLink}

This link will expire in 30 minutes.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.`;

    return await sendEmail({
      to: email,
      subject,
      html: buildHtmlLayout({ title: 'Reset Your Password', preheader, contentHtml }),
      text,
      type: 'reset',
      logMeta: { actionLink },
    });
  } catch (err) {
    console.error(`[Email][ERROR] sendPasswordResetEmail caught error for ${maskEmail(email)}:`, err.message);
    return { success: false, error: err.message, mode: 'smtp' };
  }
};

/**
 * Send notification confirming password was successfully changed
 */
export const sendPasswordChangedNotification = async ({ email, name }) => {
  try {
    const displayName = name ? name.split(' ')[0] : 'there';
    const subject = 'Your password has been changed — AI Mock Interview Coach';
    const preheader = 'Your password was successfully changed.';

    const contentHtml = `
      <p style="margin: 0 0 16px 0; font-size: 15px;">
        Hi ${displayName},
      </p>
      <p style="margin: 0 0 20px 0;">
        This email confirms that the password for your <strong>AI Mock Interview Coach</strong> account was recently changed.
      </p>
      <div style="background-color: #FAF6EE; border: 1px solid #E4DCC9; border-radius: 6px; padding: 14px 18px; margin: 20px 0; font-size: 13px; color: #4A463F;">
        If you made this change, no further action is needed. Any previous active sessions have been automatically logged out for your security.
      </div>
      <p style="margin: 16px 0 0 0; font-size: 13px; color: #C2572B;">
        <strong>If you did not make this change:</strong> Please contact support immediately or use the Forgot Password feature to recover your account.
      </p>
    `;

    const text = `Hi ${displayName},

This email confirms that the password for your AI Mock Interview Coach account was recently changed.

If you made this change, no further action is needed.

If you did not make this change, please recover your account immediately.`;

    return await sendEmail({
      to: email,
      subject,
      html: buildHtmlLayout({ title: 'Password Changed Successfully', preheader, contentHtml }),
      text,
      type: 'notice',
    });
  } catch (err) {
    console.error(`[Email][ERROR] sendPasswordChangedNotification caught error for ${maskEmail(email)}:`, err.message);
    return { success: false, error: err.message, mode: 'smtp' };
  }
};

/**
 * Send contact inquiry or audio bug report to support and send confirmation to user
 */
export const sendContactFeedbackEmail = async ({
  name,
  email,
  category = 'general',
  subject = '',
  message,
  metadata = {},
}) => {
  try {
    const config = getEmailConfig();
    const categoryLabels = {
      audio_mic: '🎙️ Audio / Microphone Issue',
      feature_request: '💡 Feature Request / Suggestion',
      bug_report: '🐛 Bug Report',
      general: '✉️ General Inquiry',
    };
    const categoryLabel = categoryLabels[category] || '✉️ General Inquiry';
    const emailSubject = subject?.trim() ? `[Contact] ${categoryLabel} - ${subject}` : `[Contact] ${categoryLabel}`;

    // Format metadata HTML if available
    let metadataHtml = '';
    if (metadata && (metadata.userAgent || metadata.speechRecognitionSupported !== undefined)) {
      metadataHtml = `
        <div style="margin-top: 20px; padding: 14px 16px; background-color: #FAF6EE; border: 1px solid #E4DCC9; border-radius: 6px; font-size: 12px; color: #787268;">
          <strong style="color: #1C1B17; display: block; margin-bottom: 6px;">Browser Telemetry & Diagnostics:</strong>
          <div><strong>User Agent:</strong> ${metadata.userAgent || 'Not provided'}</div>
          <div><strong>Web Speech API:</strong> ${metadata.speechRecognitionSupported ? '✅ Supported' : '❌ Not Available'}</div>
          ${metadata.screenResolution ? `<div><strong>Screen:</strong> ${metadata.screenResolution}</div>` : ''}
        </div>
      `;
    }

    const adminHtml = `
      <p style="margin: 0 0 16px 0; font-size: 14px;">
        You received a new inquiry from the <strong>AI Mock Interview Coach</strong> website contact form.
      </p>
      <div style="background-color: #FAF6EE; border-left: 4px solid #2F5233; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0 0 8px 0;"><strong>From:</strong> ${name} &lt;${email}&gt;</p>
        <p style="margin: 0 0 8px 0;"><strong>Category:</strong> ${categoryLabel}</p>
        ${subject ? `<p style="margin: 0 0 8px 0;"><strong>Subject:</strong> ${subject}</p>` : ''}
        <p style="margin: 0 0 4px 0;"><strong>Message:</strong></p>
        <div style="background-color: #FFFDF8; border: 1px solid #E4DCC9; padding: 12px; border-radius: 4px; white-space: pre-wrap; font-family: inherit; font-size: 13px; color: #1C1B17; line-height: 1.6;">
${message}
        </div>
      </div>
      ${metadataHtml}
    `;

    const adminText = `[New Contact Form Submission]
From: ${name} (${email})
Category: ${categoryLabel}
Subject: ${subject || 'N/A'}
Message:
${message}

Telemetry:
User Agent: ${metadata?.userAgent || 'N/A'}
Speech API: ${metadata?.speechRecognitionSupported ? 'Supported' : 'Not Supported'}`;

    const adminRecipient = process.env.SUPPORT_EMAIL || config.user || 'support@mockinterview.coach';

    // Dispatch notification to admin / support
    const adminResult = await sendEmail({
      to: adminRecipient,
      subject: emailSubject,
      html: buildHtmlLayout({
        title: `New Message: ${categoryLabel}`,
        preheader: `Contact form submission from ${name}`,
        contentHtml: adminHtml,
      }),
      text: adminText,
      type: 'notice',
      logMeta: { submitter: maskEmail(email), category },
    });

    // Send confirmation receipt to the user
    const userReceiptHtml = `
      <p style="margin: 0 0 16px 0; font-size: 15px;">
        Hi ${name.split(' ')[0]},
      </p>
      <p style="margin: 0 0 16px 0; line-height: 1.6;">
        Thank you for reaching out to the <strong>AI Mock Interview Coach</strong> team. We have received your message regarding <strong>${categoryLabel}</strong>.
      </p>
      <div style="background-color: #FAF6EE; border: 1px solid #E4DCC9; border-radius: 6px; padding: 14px 18px; margin: 20px 0; font-size: 13px; color: #4A463F;">
        <strong>Your message summary:</strong>
        <p style="margin: 8px 0 0 0; font-style: italic; color: #1C1B17;">"${message.slice(0, 180)}${message.length > 180 ? '...' : ''}"</p>
      </div>
      <p style="margin: 16px 0 0 0; font-size: 13px; color: #787268; line-height: 1.5;">
        Our team reviews inquiries regularly and will get back to you if follow-up is needed. You can continue practicing in the studio in the meantime!
      </p>
    `;

    // Only attempt receipt if email mode is configured and valid
    sendEmail({
      to: email,
      subject: 'We received your message • AI Mock Interview Coach',
      html: buildHtmlLayout({
        title: 'Thank You For Contacting Us',
        preheader: 'Your message has been received by our support team',
        contentHtml: userReceiptHtml,
      }),
      text: `Hi ${name},\n\nThank you for reaching out! We received your message regarding "${categoryLabel}". Our team will review it shortly.`,
      type: 'notice',
    }).catch((err) => {
      console.warn('[Email] User contact receipt dispatch skipped or non-fatal error:', err.message);
    });

    return adminResult;
  } catch (err) {
    console.error(`[Email][ERROR] sendContactFeedbackEmail caught error:`, err.message);
    return { success: false, error: err.message };
  }
};

export default {
  maskEmail,
  getEmailConfig,
  verifyEmailServiceStartup,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedNotification,
  sendContactFeedbackEmail,
};

