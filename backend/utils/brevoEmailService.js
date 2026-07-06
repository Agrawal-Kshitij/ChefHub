import * as brevo from '@getbrevo/brevo';
import { logger } from './logger.js';

const API_KEY = process.env.BREVO_API_KEY;
const FROM_EMAIL = process.env.BREVO_FROM_EMAIL;
const FROM_NAME = process.env.BREVO_FROM_NAME || 'ChefHub';

const getTransactionalEmailsApi = () => {
  if (!API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('[BREVO_EMAIL_SERVICE] BREVO_API_KEY missing; email will be logged in development instead of sent');
      return null;
    }
    throw new Error('BREVO_API_KEY is not configured');
  }

  const apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, API_KEY);
  return apiInstance;
};

const getSender = () => {
  if (!FROM_EMAIL) {
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('[BREVO_EMAIL_SERVICE] BREVO_FROM_EMAIL missing; using fallback sender in development');
      return {
        name: FROM_NAME,
        email: 'bhashkarkumar2063@gmail.com'
      };
    }
    throw new Error('BREVO_FROM_EMAIL is not configured');
  }

  return {
    name: FROM_NAME,
    email: FROM_EMAIL,
  };
};

export const sendTransactionalEmail = async ({ to, subject, htmlContent, textContent, replyTo }) => {
  logger.debug('[BREVO_EMAIL_SERVICE] Preparing transactional email', {
    to,
    subject,
    from: FROM_EMAIL,
  });

  const apiInstance = getTransactionalEmailsApi();

  if (!apiInstance) {
    logger.info('[BREVO_EMAIL_SERVICE] Skipping Brevo send in development mode. Email content:', {
      to,
      subject,
      htmlContent: htmlContent?.slice(0, 300),
      textContent: textContent?.slice(0, 300)
    });
    return { messageId: 'development-mock-message-id' };
  }

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.sender = getSender();
  sendSmtpEmail.to = to;
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;

  if (textContent) {
    sendSmtpEmail.textContent = textContent;
  }

  if (replyTo) {
    sendSmtpEmail.replyTo = replyTo;
  }

  try {
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

    logger.info('[BREVO_EMAIL_SERVICE] Transactional email sent', {
      messageId: result.messageId,
      to,
    });

    return result;
  } catch (error) {
    logger.error('[BREVO_EMAIL_SERVICE] Brevo send failed', {
      error: error?.response?.data || error?.message || error,
      to,
      subject,
    });

    if (process.env.NODE_ENV !== 'production') {
      logger.warn('[BREVO_EMAIL_SERVICE] Sending failed in development, returning mock success');
      return { messageId: 'development-fallback-message-id' };
    }

    throw error;
  }
};
