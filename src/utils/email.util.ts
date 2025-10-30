import nodemailer from 'nodemailer';
import config from '../config/env.config.js';
import logger from '../config/logger.config.js';
import { MailOptions } from '../types/email.types.js';

const createTransporter = () => {
  let transportConfig: any;

  if (config.brevo.smtpKey) {
    transportConfig = {
      host: config.brevo.host,
      port: config.brevo.port,
      auth: {
        user: config.brevo.user,
        pass: config.brevo.smtpKey,
      },
    };
    logger.info('[Email]: Using Brevo transporter.');
  } else if (config.mailtrap.host) {
    transportConfig = {
      host: config.mailtrap.host,
      port: config.mailtrap.port,
      auth: {
        user: config.mailtrap.username,
        pass: config.mailtrap.password,
      },
    };
    logger.info('[Email]: Using Mailtrap transporter.');
  } else {
    logger.warn(
      '[Email]: No email provider (Brevo/Mailtrap) configured. Email sending will be disabled.',
    );
    return null;
  }

  return nodemailer.createTransport(transportConfig);
};

const transporter = createTransporter();

if (transporter) {
  logger.info('[Email]: Transporter configured successfully.');
}

export const sendEmail = async (options: MailOptions) => {
  if (!transporter) {
    logger.error('[Email]: Cannot send email. Transporter is not configured.');
    return;
  }

  try {
    const mailOptionsWithFrom = {
      from: `Kech.ai <${config.emailFrom}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptionsWithFrom);
    logger.info(`[Email]: Message sent: ${info.messageId}`);
  } catch (err: any) {
    logger.error(err, '[Email]: Error sending email');
  }
};
