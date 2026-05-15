import PDFDocument from 'pdfkit';
import { cloudinary } from '../utils/cloudinary.util.js';
import logger from '../config/logger.config.js';
import SaleReservation from '../models/saleReservation.model.js';
import { ISaleReservationDocument } from '../types/saleReservation.types.js';

/**
 * Generate a purchase agreement PDF for a sale reservation
 */
export const generatePurchaseAgreement = async (
  reservationId: string,
): Promise<string> => {
  const reservation = await SaleReservation.findById(reservationId)
    .populate('buyer', 'firstName lastName email phoneNumber')
    .populate('seller', 'firstName lastName email phoneNumber')
    .populate('listing')
    .populate({
      path: 'car',
      populate: [{ path: 'make' }, { path: 'vehicleModel' }],
    });

  if (!reservation) {
    throw new Error('Reservation not found');
  }

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const buffers: Buffer[] = [];

  doc.on('data', buffers.push.bind(buffers));

  // Header
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('VEHICLE PURCHASE AGREEMENT', { align: 'center' })
    .moveDown();

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Agreement Date: ${new Date().toLocaleDateString()}`)
    .text(`Reservation ID: ${reservation._id}`)
    .moveDown();

  // Parties
  doc.fontSize(14).font('Helvetica-Bold').text('PARTIES', { underline: true });
  doc.moveDown(0.5);

  const buyer = reservation.buyer as any;
  const seller = reservation.seller as any;

  doc.fontSize(12).font('Helvetica-Bold').text('SELLER:');
  doc.fontSize(10).font('Helvetica')
    .text(`Name: ${seller.firstName} ${seller.lastName}`)
    .text(`Email: ${seller.email}`)
    .text(`Phone: ${seller.phoneNumber}`)
    .moveDown();

  doc.fontSize(12).font('Helvetica-Bold').text('BUYER:');
  doc.fontSize(10).font('Helvetica')
    .text(`Name: ${buyer.firstName} ${buyer.lastName}`)
    .text(`Email: ${buyer.email}`)
    .text(`Phone: ${buyer.phoneNumber}`)
    .moveDown();

  // Vehicle Details
  doc.fontSize(14).font('Helvetica-Bold').text('VEHICLE DETAILS', { underline: true });
  doc.moveDown(0.5);

  const car = reservation.car as any;
  doc.fontSize(10).font('Helvetica')
    .text(`Make: ${car.make?.name || 'N/A'}`)
    .text(`Model: ${car.vehicleModel?.name || 'N/A'}`)
    .text(`Year: ${car.year || 'N/A'}`)
    .text(`VIN: ${car.vin || 'N/A'}`)
    .text(`License Plate: ${car.licensePlate || 'N/A'}`)
    .text(`Color: ${car.color || 'N/A'}`)
    .text(`Mileage: ${car.mileage ? car.mileage + ' km' : 'N/A'}`)
    .text(`Condition: ${car.condition || 'N/A'}`)
    .moveDown();

  // Financial Terms
  doc.fontSize(14).font('Helvetica-Bold').text('FINANCIAL TERMS', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica')
    .text(`Sale Price: ${reservation.salePrice.toLocaleString()} ETB`)
    .text(`Reservation Fee (Paid): ${reservation.reservationFee.toLocaleString()} ETB`)
    .text(`Final Settlement Amount: ${reservation.finalSettlementAmount.toLocaleString()} ETB`)
    .moveDown();

  // Terms & Conditions
  doc.fontSize(14).font('Helvetica-Bold').text('TERMS & CONDITIONS', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica')
    .text('1. This agreement is a reservation document, not a final sale contract.')
    .text('2. The buyer has paid a reservation fee to hold the vehicle for inspection.')
    .text('3. The reservation is valid for 48 hours from payment confirmation.')
    .text('4. Physical inspection must be completed before final settlement.')
    .text('5. Final settlement and ownership transfer must occur at a Transport Authority office.')
    .text('6. The seller guarantees the vehicle is free of liens and encumbrances.')
    .text('7. The buyer accepts the vehicle in its current condition as described.')
    .text('8. Cancellation terms are governed by the Kech.ai platform policies.')
    .moveDown();

  // Platform Information
  doc.fontSize(14).font('Helvetica-Bold').text('PLATFORM INFORMATION', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica')
    .text('This transaction is facilitated by Kech.ai')
    .text('Website: kech.ai')
    .text('Email: support@kech.ai')
    .text('Phone: +251 XXX XXX XXX')
    .moveDown();

  // Signatures (Placeholder)
  doc.fontSize(14).font('Helvetica-Bold').text('SIGNATURES', { underline: true });
  doc.moveDown(2);

  doc.fontSize(10).font('Helvetica')
    .text('_______________________', 100, doc.y)
    .text('Seller Signature', 100, doc.y + 5)
    .text('_______________________', 350, doc.y - 15)
    .text('Buyer Signature', 350, doc.y + 5);

  doc.end();

  // Convert to buffer and upload
  return new Promise((resolve, reject) => {
    doc.on('end', async () => {
      try {
        const pdfBuffer = Buffer.concat(buffers);

        // Upload to Cloudinary
        const uploadResult = await new Promise<any>((resolveUpload, rejectUpload) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'raw',
              public_id: `sale_agreements/${reservation._id}`,
              format: 'pdf',
              folder: 'kech/sale_agreements',
            },
            (error, result) => {
              if (error) {
                rejectUpload(error);
              } else {
                resolveUpload(result);
              }
            },
          );

          uploadStream.end(pdfBuffer);
        });

        logger.info(
          {
            reservationId: reservation._id,
            pdfUrl: uploadResult.secure_url,
          },
          'Purchase agreement PDF generated and uploaded',
        );

        // Update reservation with PDF URL
        reservation.purchaseAgreementUrl = uploadResult.secure_url;
        reservation.purchaseAgreementGeneratedAt = new Date();
        await reservation.save();

        resolve(uploadResult.secure_url);
      } catch (error: any) {
        logger.error(
          { reservationId, error: error.message },
          'Failed to generate or upload purchase agreement PDF',
        );
        reject(error);
      }
    });

    doc.on('error', (error: any) => {
      logger.error(
        { reservationId, error: error.message },
        'PDF generation error',
      );
      reject(error);
    });
  });
};

/**
 * Generate and update purchase agreement for a reservation
 */
export const generateAndUpdatePurchaseAgreement = async (
  reservationId: string,
): Promise<ISaleReservationDocument> => {
  try {
    const pdfUrl = await generatePurchaseAgreement(reservationId);

    // Fetch updated reservation
    const reservation = await SaleReservation.findById(reservationId);

    if (!reservation) {
      throw new Error('Reservation not found after PDF generation');
    }

    return reservation;
  } catch (error: any) {
    logger.error(
      { reservationId, error: error.message },
      'Failed to generate purchase agreement',
    );
    throw error;
  }
};
