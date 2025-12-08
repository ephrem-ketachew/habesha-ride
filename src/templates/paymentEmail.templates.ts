import config from '../config/env.config.js';
import { IFinancialBreakdown } from '../types/transaction.types.js';

const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const emailStyles = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
  .header h1 { margin: 0; font-size: 28px; }
  .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  .success-icon { font-size: 48px; color: #10b981; text-align: center; margin: 20px 0; }
  .warning-icon { font-size: 48px; color: #f59e0b; text-align: center; margin: 20px 0; }
  .error-icon { font-size: 48px; color: #ef4444; text-align: center; margin: 20px 0; }
  .info-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 5px; }
  .breakdown-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .breakdown-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
  .breakdown-table tr:last-child td { border-bottom: 2px solid #3b82f6; font-weight: bold; }
  .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
  .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  .highlight { background-color: #fef3c7; padding: 2px 6px; border-radius: 3px; }
`;

export const paymentConfirmationTemplate = (data: {
  userName: string;
  bookingId: string;
  amount: number;
  breakdown?: IFinancialBreakdown;
  transactionRef: string;
  paymentDate: Date;
  bookingStartDate: Date;
  bookingEndDate: Date;
  carName?: string;
}) => {
  const {
    userName,
    bookingId,
    amount,
    breakdown,
    transactionRef,
    paymentDate,
    bookingStartDate,
    bookingEndDate,
    carName,
  } = data;

  return {
    subject: '✅ Payment Confirmed - Your Booking is Confirmed!',
    text: `
Hi ${userName},

Great news! Your payment has been successfully processed.

Booking ID: ${bookingId}
Transaction Reference: ${transactionRef}
Amount Paid: ${formatCurrency(amount)}
Payment Date: ${formatDate(paymentDate)}

${carName ? `Vehicle: ${carName}` : ''}
Rental Period: ${formatDate(bookingStartDate)} - ${formatDate(bookingEndDate)}

Your booking is now confirmed. You can start your rental on the specified date.

View your booking details: ${config.clientUrl}/bookings/${bookingId}

Thank you for choosing Kech.ai!

Best regards,
The Kech.ai Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Payment Confirmed!</h1>
    </div>
    <div class="content">
      <div class="success-icon">✅</div>
      
      <p>Hi <strong>${userName}</strong>,</p>
      
      <p>Great news! Your payment has been successfully processed and your booking is now confirmed.</p>
      
      <div class="info-box">
        <strong>Booking Details</strong><br>
        <strong>Booking ID:</strong> <span class="highlight">#${bookingId}</span><br>
        <strong>Transaction Reference:</strong> ${transactionRef}<br>
        ${carName ? `<strong>Vehicle:</strong> ${carName}<br>` : ''}
        <strong>Rental Period:</strong> ${formatDate(bookingStartDate)} - ${formatDate(bookingEndDate)}
      </div>

      ${
        breakdown
          ? `
      <table class="breakdown-table">
        <tr>
          <td>Rental Fee:</td>
          <td style="text-align: right;">${formatCurrency(breakdown.rentalFee)}</td>
        </tr>
        <tr>
          <td>Security Deposit:</td>
          <td style="text-align: right;">${formatCurrency(breakdown.securityDeposit)}</td>
        </tr>
        <tr>
          <td>Service Fee:</td>
          <td style="text-align: right;">${formatCurrency(breakdown.serviceFee)}</td>
        </tr>
        ${
          breakdown.deliveryFee > 0
            ? `
        <tr>
          <td>Delivery Fee:</td>
          <td style="text-align: right;">${formatCurrency(breakdown.deliveryFee)}</td>
        </tr>
        `
            : ''
        }
        ${
          breakdown.discountAmount > 0
            ? `
        <tr>
          <td>Discount:</td>
          <td style="text-align: right; color: #10b981;">-${formatCurrency(breakdown.discountAmount)}</td>
        </tr>
        `
            : ''
        }
        <tr>
          <td><strong>Total Paid:</strong></td>
          <td style="text-align: right;"><strong>${formatCurrency(amount)}</strong></td>
        </tr>
      </table>
      `
          : `
      <p><strong>Amount Paid:</strong> ${formatCurrency(amount)}<br>
      <strong>Payment Date:</strong> ${formatDate(paymentDate)}</p>
      `
      }

      <p style="margin-top: 30px;">Your booking is confirmed and you can start your rental on <strong>${formatDate(bookingStartDate)}</strong>.</p>

      <center>
        <a href="${config.clientUrl}/bookings/${bookingId}" class="button">View Booking Details</a>
      </center>

      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        If you have any questions or need to make changes to your booking, please contact our support team.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Kech.ai - Car Rental Platform<br>
      This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
};

export const paymentFailedTemplate = (data: {
  userName: string;
  bookingId: string;
  amount: number;
  transactionRef: string;
  failureReason?: string;
}) => {
  const { userName, bookingId, amount, transactionRef, failureReason } = data;

  return {
    subject: '❌ Payment Failed - Action Required',
    text: `
Hi ${userName},

We're sorry, but your payment could not be processed.

Booking ID: ${bookingId}
Transaction Reference: ${transactionRef}
Amount: ${formatCurrency(amount)}
${failureReason ? `Reason: ${failureReason}` : ''}

Your booking is still pending payment. Please try again to confirm your reservation.

Retry payment: ${config.clientUrl}/bookings/${bookingId}

If you continue to experience issues, please contact our support team.

Best regards,
The Kech.ai Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Failed</h1>
    </div>
    <div class="content">
      <div class="error-icon">❌</div>
      
      <p>Hi <strong>${userName}</strong>,</p>
      
      <p>We're sorry, but your payment could not be processed.</p>
      
      <div class="info-box" style="background: #fef2f2; border-left-color: #ef4444;">
        <strong>Payment Details</strong><br>
        <strong>Booking ID:</strong> <span class="highlight">#${bookingId}</span><br>
        <strong>Transaction Reference:</strong> ${transactionRef}<br>
        <strong>Amount:</strong> ${formatCurrency(amount)}<br>
        ${failureReason ? `<strong>Reason:</strong> ${failureReason}` : ''}
      </div>

      <p>Your booking is still pending payment. Please try again to confirm your reservation.</p>

      <center>
        <a href="${config.clientUrl}/bookings/${bookingId}" class="button" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">Retry Payment</a>
      </center>

      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        If you continue to experience issues, please contact our support team. We're here to help!
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Kech.ai - Car Rental Platform<br>
      This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
};

export const refundInitiatedTemplate = (data: {
  userName: string;
  bookingId: string;
  refundAmount: number;
  transactionRef: string;
  reason: string;
  estimatedDays?: number;
}) => {
  const {
    userName,
    bookingId,
    refundAmount,
    transactionRef,
    reason,
    estimatedDays = 5,
  } = data;

  return {
    subject: '💰 Refund Initiated - Processing Your Request',
    text: `
Hi ${userName},

A refund has been initiated for your booking.

Booking ID: ${bookingId}
Transaction Reference: ${transactionRef}
Refund Amount: ${formatCurrency(refundAmount)}
Reason: ${reason}

Your refund is being processed and should be completed within ${estimatedDays} business days.

View your booking: ${config.clientUrl}/bookings/${bookingId}

Thank you for your patience.

Best regards,
The Kech.ai Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Refund Initiated</h1>
    </div>
    <div class="content">
      <div class="warning-icon">💰</div>
      
      <p>Hi <strong>${userName}</strong>,</p>
      
      <p>A refund has been initiated for your booking.</p>
      
      <div class="info-box" style="background: #fef3c7; border-left-color: #f59e0b;">
        <strong>Refund Details</strong><br>
        <strong>Booking ID:</strong> <span class="highlight">#${bookingId}</span><br>
        <strong>Transaction Reference:</strong> ${transactionRef}<br>
        <strong>Refund Amount:</strong> ${formatCurrency(refundAmount)}<br>
        <strong>Reason:</strong> ${reason}
      </div>

      <p>Your refund is being processed manually by our team. The amount of <strong>${formatCurrency(refundAmount)}</strong> will be returned to your original payment method.</p>

      <p><strong>Estimated Processing Time:</strong> ${estimatedDays} business days</p>

      <center>
        <a href="${config.clientUrl}/bookings/${bookingId}" class="button">View Booking Details</a>
      </center>

      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        If you have any questions about your refund, please contact our support team. We'll be happy to assist you.
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Kech.ai - Car Rental Platform<br>
      This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
};

export const refundCompletedTemplate = (data: {
  userName: string;
  bookingId: string;
  refundAmount: number;
  transactionRef: string;
  completedDate: Date;
}) => {
  const { userName, bookingId, refundAmount, transactionRef, completedDate } =
    data;

  return {
    subject: '✅ Refund Completed - Funds Returned',
    text: `
Hi ${userName},

Your refund has been successfully processed.

Booking ID: ${bookingId}
Transaction Reference: ${transactionRef}
Refund Amount: ${formatCurrency(refundAmount)}
Completed Date: ${formatDate(completedDate)}

The funds have been returned to your original payment method.

View your booking: ${config.clientUrl}/bookings/${bookingId}

Thank you for using Kech.ai!

Best regards,
The Kech.ai Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Refund Completed</h1>
    </div>
    <div class="content">
      <div class="success-icon">✅</div>
      
      <p>Hi <strong>${userName}</strong>,</p>
      
      <p>Your refund has been successfully processed!</p>
      
      <div class="info-box">
        <strong>Refund Details</strong><br>
        <strong>Booking ID:</strong> <span class="highlight">#${bookingId}</span><br>
        <strong>Transaction Reference:</strong> ${transactionRef}<br>
        <strong>Refund Amount:</strong> ${formatCurrency(refundAmount)}<br>
        <strong>Completed Date:</strong> ${formatDate(completedDate)}
      </div>

      <p>The amount of <strong>${formatCurrency(refundAmount)}</strong> has been returned to your original payment method.</p>

      <center>
        <a href="${config.clientUrl}/bookings/${bookingId}" class="button">View Booking Details</a>
      </center>

      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        Thank you for using Kech.ai. We hope to serve you again soon!
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Kech.ai - Car Rental Platform<br>
      This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
};

export const paymentReminderTemplate = (data: {
  userName: string;
  bookingId: string;
  amount: number;
  expiresAt?: Date;
  bookingStartDate: Date;
  carName?: string;
}) => {
  const { userName, bookingId, amount, expiresAt, bookingStartDate, carName } =
    data;

  return {
    subject: '⏰ Payment Reminder - Complete Your Booking',
    text: `
Hi ${userName},

This is a friendly reminder that your booking is pending payment.

Booking ID: ${bookingId}
${carName ? `Vehicle: ${carName}` : ''}
Amount Due: ${formatCurrency(amount)}
Rental Start Date: ${formatDate(bookingStartDate)}
${expiresAt ? `Payment Expires: ${formatDate(expiresAt)}` : ''}

Complete your payment to confirm your reservation.

Complete payment: ${config.clientUrl}/bookings/${bookingId}

Best regards,
The Kech.ai Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Reminder</h1>
    </div>
    <div class="content">
      <div class="warning-icon">⏰</div>
      
      <p>Hi <strong>${userName}</strong>,</p>
      
      <p>This is a friendly reminder that your booking is pending payment.</p>
      
      <div class="info-box" style="background: #fef3c7; border-left-color: #f59e0b;">
        <strong>Booking Details</strong><br>
        <strong>Booking ID:</strong> <span class="highlight">#${bookingId}</span><br>
        ${carName ? `<strong>Vehicle:</strong> ${carName}<br>` : ''}
        <strong>Amount Due:</strong> ${formatCurrency(amount)}<br>
        <strong>Rental Start Date:</strong> ${formatDate(bookingStartDate)}<br>
        ${expiresAt ? `<strong>Payment Expires:</strong> <span style="color: #ef4444;">${formatDate(expiresAt)}</span>` : ''}
      </div>

      <p>Complete your payment to confirm your reservation and ensure your vehicle is ready on your rental start date.</p>

      <center>
        <a href="${config.clientUrl}/bookings/${bookingId}" class="button" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">Complete Payment Now</a>
      </center>

      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        ${expiresAt ? 'If payment is not completed by the expiration date, your booking may be automatically cancelled.' : 'Please complete your payment as soon as possible to secure your booking.'}
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Kech.ai - Car Rental Platform<br>
      This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
};
