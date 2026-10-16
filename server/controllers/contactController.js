import { sendContactFeedbackEmail } from '../services/emailService.js';

/**
 * Handle contact form submission / issue reporting
 * POST /api/contact
 */
export const submitContact = async (req, res, next) => {
  try {
    const { name, email, category, subject, message, metadata } = req.body;

    const result = await sendContactFeedbackEmail({
      name,
      email,
      category,
      subject,
      message,
      metadata: {
        ...metadata,
        clientIp: req.ip,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Thank you for reaching out! Your message has been received and our team will review it shortly.',
      mode: result?.mode || 'console',
    });
  } catch (error) {
    console.error('[Contact][ERROR] Failed to process contact submission:', error.message);
    return res.status(500).json({
      success: false,
      code: 'CONTACT_SUBMISSION_FAILED',
      message: 'An unexpected error occurred while sending your message. Please try again later.',
    });
  }
};

export default {
  submitContact,
};
