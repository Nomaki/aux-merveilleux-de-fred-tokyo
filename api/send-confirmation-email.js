import { Resend } from 'resend';
import { generateConfirmationEmail } from './templates/confirmation-email.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { confirmationData, language = 'ja' } = req.body;

    // Validate required data
    if (!confirmationData || !confirmationData.order || !confirmationData.reservationCode) {
      return res.status(400).json({
        error: 'Missing required data',
        message: 'confirmationData with order and reservationCode is required',
      });
    }

    const { order, reservationCode } = confirmationData;

    if (!order.email) {
      return res.status(400).json({
        error: 'Missing email',
        message: 'Customer email is required',
      });
    }

    // Generate email HTML
    const emailHtml = generateConfirmationEmail({
      reservationCode,
      order,
      language,
    });

    // Email subject
    const subject = language === 'ja' ? `【ご予約確認】予約番号: ${reservationCode}` : `Reservation Confirmation - Code: ${reservationCode}`;

    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'romain.delhoute@gmail.com',
      to: [order.email],
      subject: subject,
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({
        error: 'Failed to send email',
        message: error.message,
      });
    }

    console.log('✅ Email sent successfully:', data.id);

    res.status(200).json({
      success: true,
      emailId: data.id,
      message: `Confirmation email sent to ${order.email}`,
    });
  } catch (error) {
    console.error('Error sending confirmation email:', error);

    res.status(500).json({
      error: 'Email sending failed',
      message: error.message,
    });
  }
}
