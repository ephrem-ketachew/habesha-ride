import config from '../config/env.config.js';

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

const formatDateShort = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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
  .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
  .breakdown-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .breakdown-table td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
  .breakdown-table tr:last-child td { border-bottom: 2px solid #3b82f6; font-weight: bold; }
  .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
  .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  .highlight { background-color: #fef3c7; padding: 2px 6px; border-radius: 3px; }
  .car-info { background: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0; }
`;

export const reservationConfirmationBuyerTemplate = (data: {
  buyerName: string;
  reservationId: string;
  carInfo: string;
  salePrice: number;
  reservationFee: number;
  finalSettlementAmount: number;
  expiresAt: Date;
  sellerName: string;
  purchaseAgreementUrl?: string;
}) => {
  const {
    buyerName,
    reservationId,
    carInfo,
    salePrice,
    reservationFee,
    finalSettlementAmount,
    expiresAt,
    sellerName,
    purchaseAgreementUrl,
  } = data;

  return {
    subject: `Car Reservation Confirmed - ${carInfo}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reservation Confirmed</title>
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✅</div>
              <h1>Reservation Confirmed!</h1>
              <p>Your car reservation is now active</p>
            </div>

            <div class="content">
              <p>Hi ${buyerName},</p>

              <p><strong>Great news!</strong> Your reservation for the <strong>${carInfo}</strong> has been confirmed and is now active.</p>

              <div class="car-info">
                <h3>Reservation Details</h3>
                <p><strong>Reservation ID:</strong> ${reservationId}</p>
                <p><strong>Seller:</strong> ${sellerName}</p>
                <p><strong>Vehicle:</strong> ${carInfo}</p>
                <p><strong>Expires:</strong> ${formatDate(expiresAt)}</p>
              </div>

              <table class="breakdown-table">
                <tr>
                  <td>Vehicle Price:</td>
                  <td style="text-align: right;">${formatCurrency(salePrice)}</td>
                </tr>
                <tr>
                  <td>Reservation Fee (Paid):</td>
                  <td style="text-align: right;">${formatCurrency(reservationFee)}</td>
                </tr>
                <tr>
                  <td><strong>Remaining Balance Due:</strong></td>
                  <td style="text-align: right; color: #3b82f6;"><strong>${formatCurrency(finalSettlementAmount)}</strong></td>
                </tr>
              </table>

              <div class="info-box">
                <h4>📋 Next Steps:</h4>
                <ol>
                  <li>The seller will contact you to schedule an inspection</li>
                  <li>Meet the seller to inspect the vehicle</li>
                  <li>If satisfied, proceed with final payment at Transport Authority</li>
                  <li>Complete ownership transfer</li>
                </ol>
              </div>

              ${
                purchaseAgreementUrl
                  ? `
                <div class="info-box">
                  <h4>📄 Purchase Agreement</h4>
                  <p>Your digital purchase agreement is ready. <a href="${purchaseAgreementUrl}" target="_blank">Download PDF</a></p>
                </div>
              `
                  : ''
              }

              <div class="warning-box">
                <p><strong>⚠️ Important:</strong> This reservation expires on <strong>${formatDate(expiresAt)}</strong>. If you don't complete the inspection by then, the reservation will be cancelled and your payment refunded (minus 20% platform fee).</p>
              </div>

              <p>Questions? Contact our support team at <a href="mailto:support@kech.ai">support@kech.ai</a></p>

              <p>Best regards,<br>The Kech.ai Team</p>
            </div>

            <div class="footer">
              <p>This is an automated message from Kech.ai. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Kech.ai. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Reservation Confirmed!

      Hi ${buyerName},

      Your reservation for the ${carInfo} has been confirmed and is now active.

      Reservation Details:
      - Reservation ID: ${reservationId}
      - Seller: ${sellerName}
      - Vehicle: ${carInfo}
      - Expires: ${formatDate(expiresAt)}

      Payment Breakdown:
      - Vehicle Price: ${formatCurrency(salePrice)}
      - Reservation Fee (Paid): ${formatCurrency(reservationFee)}
      - Remaining Balance Due: ${formatCurrency(finalSettlementAmount)}

      Next Steps:
      1. The seller will contact you to schedule an inspection
      2. Meet the seller to inspect the vehicle
      3. If satisfied, proceed with final payment at Transport Authority
      4. Complete ownership transfer

      Important: This reservation expires on ${formatDate(expiresAt)}. If you don't complete the inspection by then, the reservation will be cancelled and your payment refunded (minus 20% platform fee).

      Questions? Contact support@kech.ai

      Best regards,
      The Kech.ai Team
    `,
  };
};

export const reservationExpiryReminderBuyerTemplate = (data: {
  buyerName: string;
  reservationId: string;
  carInfo: string;
  hoursRemaining: number;
  expiresAt: Date;
  sellerName: string;
}) => {
  const {
    buyerName,
    reservationId,
    carInfo,
    hoursRemaining,
    expiresAt,
    sellerName,
  } = data;

  const urgencyText = hoursRemaining <= 6 ? 'URGENT' : 'Reminder';
  const urgencyIcon = hoursRemaining <= 6 ? '🚨' : '⏰';

  return {
    subject: `${urgencyIcon} Reservation Expires in ${hoursRemaining} Hours - ${carInfo}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reservation Expiring</title>
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="${hoursRemaining <= 6 ? 'error-icon' : 'warning-icon'}">${urgencyIcon}</div>
              <h1>${urgencyText}: Reservation Expires Soon</h1>
            </div>

            <div class="content">
              <p>Hi ${buyerName},</p>

              <div class="${hoursRemaining <= 6 ? 'error-icon' : 'warning-icon'}">
                <p><strong>This is ${hoursRemaining <= 6 ? 'an URGENT reminder' : 'a reminder'}</strong> that your car reservation will expire in <strong>${hoursRemaining} hours</strong>.</p>
              </div>

              <div class="car-info">
                <h3>Reservation Details</h3>
                <p><strong>Reservation ID:</strong> ${reservationId}</p>
                <p><strong>Vehicle:</strong> ${carInfo}</p>
                <p><strong>Seller:</strong> ${sellerName}</p>
                <p><strong>Expires:</strong> ${formatDate(expiresAt)}</p>
              </div>

              <div class="warning-box">
                <h4>⚠️ Action Required</h4>
                <p>You need to contact the seller and schedule an inspection before the reservation expires. If the reservation expires:</p>
                <ul>
                  <li>You will receive an 80% refund (20% platform fee)</li>
                  <li>The car will become available to other buyers</li>
                  <li>You'll need to start the reservation process again</li>
                </ul>
              </div>

              <div class="info-box">
                <h4>📞 Contact the Seller</h4>
                <p>Please reach out to ${sellerName} immediately to schedule your vehicle inspection. You can find their contact information in your reservation details.</p>
              </div>

              <p>Questions? Contact our support team at <a href="mailto:support@kech.ai">support@kech.ai</a></p>

              <p>Best regards,<br>The Kech.ai Team</p>
            </div>

            <div class="footer">
              <p>This is an automated message from Kech.ai. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Kech.ai. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      ${urgencyText}: Reservation Expires Soon

      Hi ${buyerName},

      This is ${hoursRemaining <= 6 ? 'an URGENT reminder' : 'a reminder'} that your car reservation will expire in ${hoursRemaining} hours.

      Reservation Details:
      - Reservation ID: ${reservationId}
      - Vehicle: ${carInfo}
      - Seller: ${sellerName}
      - Expires: ${formatDate(expiresAt)}

      Action Required:
      You need to contact the seller and schedule an inspection before the reservation expires. If the reservation expires:
      - You will receive an 80% refund (20% platform fee)
      - The car will become available to other buyers
      - You'll need to start the reservation process again

      Contact the Seller:
      Please reach out to ${sellerName} immediately to schedule your vehicle inspection.

      Questions? Contact support@kech.ai

      Best regards,
      The Kech.ai Team
    `,
  };
};

export const reservationCancelledBuyerTemplate = (data: {
  buyerName: string;
  reservationId: string;
  carInfo: string;
  cancellationReason: string;
  refundAmount?: number;
  refundStatus?: string;
  cancelledBy: string;
}) => {
  const {
    buyerName,
    reservationId,
    carInfo,
    cancellationReason,
    refundAmount,
    refundStatus,
    cancelledBy,
  } = data;

  return {
    subject: `Reservation Cancelled - ${carInfo}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reservation Cancelled</title>
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="warning-icon">⚠️</div>
              <h1>Reservation Cancelled</h1>
            </div>

            <div class="content">
              <p>Hi ${buyerName},</p>

              <p>We're sorry to inform you that your reservation for the <strong>${carInfo}</strong> has been cancelled.</p>

              <div class="car-info">
                <h3>Cancellation Details</h3>
                <p><strong>Reservation ID:</strong> ${reservationId}</p>
                <p><strong>Vehicle:</strong> ${carInfo}</p>
                <p><strong>Cancelled By:</strong> ${cancelledBy}</p>
                <p><strong>Reason:</strong> ${cancellationReason}</p>
              </div>

              ${
                refundAmount
                  ? `
                <div class="info-box">
                  <h4>💰 Refund Information</h4>
                  <p><strong>Refund Amount:</strong> ${formatCurrency(refundAmount)}</p>
                  <p><strong>Status:</strong> ${refundStatus || 'Processing'}</p>
                  <p>Refunds are typically processed within 3-5 business days.</p>
                </div>
              `
                  : ''
              }

              <div class="info-box">
                <h4>🔄 Next Steps</h4>
                <p>If you'd like to reserve this or another vehicle, you can browse our listings and start a new reservation anytime.</p>
              </div>

              <p>If you have any questions about this cancellation or need assistance, please contact our support team at <a href="mailto:support@kech.ai">support@kech.ai</a></p>

              <p>Best regards,<br>The Kech.ai Team</p>
            </div>

            <div class="footer">
              <p>This is an automated message from Kech.ai. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Kech.ai. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Reservation Cancelled

      Hi ${buyerName},

      Your reservation for the ${carInfo} has been cancelled.

      Cancellation Details:
      - Reservation ID: ${reservationId}
      - Vehicle: ${carInfo}
      - Cancelled By: ${cancelledBy}
      - Reason: ${cancellationReason}

      ${
        refundAmount
          ? `
      Refund Information:
      - Refund Amount: ${formatCurrency(refundAmount)}
      - Status: ${refundStatus || 'Processing'}
      - Refunds are typically processed within 3-5 business days.
      `
          : ''
      }

      Next Steps:
      If you'd like to reserve this or another vehicle, you can browse our listings and start a new reservation anytime.

      Questions? Contact support@kech.ai

      Best regards,
      The Kech.ai Team
    `,
  };
};

export const newReservationAlertSellerTemplate = (data: {
  sellerName: string;
  buyerName: string;
  reservationId: string;
  carInfo: string;
  salePrice: number;
  reservationFee: number;
  expiresAt: Date;
  buyerEmail: string;
  buyerPhone?: string;
}) => {
  const {
    sellerName,
    buyerName,
    reservationId,
    carInfo,
    salePrice,
    reservationFee,
    expiresAt,
    buyerEmail,
    buyerPhone,
  } = data;

  return {
    subject: `New Car Reservation - ${carInfo}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Reservation Alert</title>
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">🔔</div>
              <h1>New Reservation Alert</h1>
              <p>Someone has reserved your car!</p>
            </div>

            <div class="content">
              <p>Hi ${sellerName},</p>

              <p><strong>Great news!</strong> Your <strong>${carInfo}</strong> has been reserved by a potential buyer.</p>

              <div class="car-info">
                <h3>Reservation Details</h3>
                <p><strong>Reservation ID:</strong> ${reservationId}</p>
                <p><strong>Buyer:</strong> ${buyerName}</p>
                <p><strong>Buyer Email:</strong> ${buyerEmail}</p>
                ${buyerPhone ? `<p><strong>Buyer Phone:</strong> ${buyerPhone}</p>` : ''}
                <p><strong>Vehicle:</strong> ${carInfo}</p>
                <p><strong>Asking Price:</strong> ${formatCurrency(salePrice)}</p>
                <p><strong>Reservation Fee Paid:</strong> ${formatCurrency(reservationFee)}</p>
                <p><strong>Reservation Expires:</strong> ${formatDate(expiresAt)}</p>
              </div>

              <div class="info-box">
                <h4>📋 Action Required</h4>
                <p>You need to contact the buyer within the next few hours to schedule an inspection. Here's what to do:</p>
                <ol>
                  <li><strong>Contact the buyer immediately</strong> using the details above</li>
                  <li><strong>Agree on a meeting time and place</strong> for vehicle inspection</li>
                  <li><strong>Prepare the vehicle</strong> and all necessary documentation</li>
                  <li><strong>Schedule the inspection</strong> through the Kech.ai platform</li>
                </ol>
              </div>

              <div class="warning-box">
                <p><strong>⚠️ Important Deadlines:</strong></p>
                <ul>
                  <li>The reservation expires in 48 hours if no inspection is scheduled</li>
                  <li>You earn your commission only after a successful sale</li>
                  <li>Platform fees apply to completed transactions</li>
                </ul>
              </div>

              <div class="info-box">
                <h4>💰 Potential Earnings</h4>
                <p>Upon successful sale completion:</p>
                <ul>
                  <li><strong>You receive:</strong> ${formatCurrency(salePrice - salePrice * 0.02)} (minus 2% platform fee)</li>
                  <li><strong>Platform fee:</strong> ${formatCurrency(salePrice * 0.02)}</li>
                </ul>
              </div>

              <p>Questions? Contact our seller support team at <a href="mailto:sellers@kech.ai">sellers@kech.ai</a></p>

              <p>Best regards,<br>The Kech.ai Seller Team</p>
            </div>

            <div class="footer">
              <p>This is an automated message from Kech.ai. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Kech.ai. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      New Reservation Alert

      Hi ${sellerName},

      Great news! Your ${carInfo} has been reserved by a potential buyer.

      Reservation Details:
      - Reservation ID: ${reservationId}
      - Buyer: ${buyerName}
      - Buyer Email: ${buyerEmail}
      ${buyerPhone ? `- Buyer Phone: ${buyerPhone}` : ''}
      - Vehicle: ${carInfo}
      - Asking Price: ${formatCurrency(salePrice)}
      - Reservation Fee Paid: ${formatCurrency(reservationFee)}
      - Reservation Expires: ${formatDate(expiresAt)}

      Action Required:
      1. Contact the buyer immediately using the details above
      2. Agree on a meeting time and place for vehicle inspection
      3. Prepare the vehicle and all necessary documentation
      4. Schedule the inspection through the Kech.ai platform

      Important Deadlines:
      - The reservation expires in 48 hours if no inspection is scheduled
      - You earn your commission only after a successful sale
      - Platform fees apply to completed transactions

      Potential Earnings:
      - You receive: ${formatCurrency(salePrice - salePrice * 0.02)} (minus 2% platform fee)
      - Platform fee: ${formatCurrency(salePrice * 0.02)}

      Questions? Contact sellers@kech.ai

      Best regards,
      The Kech.ai Seller Team
    `,
  };
};

export const reservationExpiredSellerTemplate = (data: {
  sellerName: string;
  reservationId: string;
  carInfo: string;
  buyerName: string;
  expiresAt: Date;
}) => {
  const { sellerName, reservationId, carInfo, buyerName, expiresAt } = data;

  return {
    subject: `Reservation Expired - ${carInfo}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reservation Expired</title>
          <style>${emailStyles}</style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="warning-icon">⏰</div>
              <h1>Reservation Expired</h1>
            </div>

            <div class="content">
              <p>Hi ${sellerName},</p>

              <p>The reservation for your <strong>${carInfo}</strong> has expired without a scheduled inspection.</p>

              <div class="car-info">
                <h3>Expired Reservation Details</h3>
                <p><strong>Reservation ID:</strong> ${reservationId}</p>
                <p><strong>Vehicle:</strong> ${carInfo}</p>
                <p><strong>Buyer:</strong> ${buyerName}</p>
                <p><strong>Expired:</strong> ${formatDate(expiresAt)}</p>
              </div>

              <div class="info-box">
                <h4>🔄 What's Next</h4>
                <p>Your vehicle is now available for new reservations. You can:</p>
                <ul>
                  <li>Update your listing to attract new buyers</li>
                  <li>Receive notifications when new reservations come in</li>
                  <li>Adjust your pricing if needed</li>
                </ul>
              </div>

              <div class="warning-box">
                <p><strong>💡 Tips for Better Results:</strong></p>
                <ul>
                  <li>Respond quickly to new reservation notifications</li>
                  <li>Be flexible with inspection scheduling</li>
                  <li>Ensure your vehicle photos are clear and comprehensive</li>
                  <li>Provide detailed vehicle information and history</li>
                </ul>
              </div>

              <p>If you have any questions or need assistance with your listing, please contact our seller support team at <a href="mailto:sellers@kech.ai">sellers@kech.ai</a></p>

              <p>Best regards,<br>The Kech.ai Seller Team</p>
            </div>

            <div class="footer">
              <p>This is an automated message from Kech.ai. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Kech.ai. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Reservation Expired

      Hi ${sellerName},

      The reservation for your ${carInfo} has expired without a scheduled inspection.

      Expired Reservation Details:
      - Reservation ID: ${reservationId}
      - Vehicle: ${carInfo}
      - Buyer: ${buyerName}
      - Expired: ${formatDate(expiresAt)}

      What's Next:
      Your vehicle is now available for new reservations. You can:
      - Update your listing to attract new buyers
      - Receive notifications when new reservations come in
      - Adjust your pricing if needed

      Tips for Better Results:
      - Respond quickly to new reservation notifications
      - Be flexible with inspection scheduling
      - Ensure your vehicle photos are clear and comprehensive
      - Provide detailed vehicle information and history

      Questions? Contact sellers@kech.ai

      Best regards,
      The Kech.ai Seller Team
    `,
  };
};
