const PRIMARY_COLOR = '#FF6B35';
const SECONDARY_COLOR = '#2DD4BF';

const getBaseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DogRental</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #FF8E53 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800;">DogRental</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background-color: #1f2937; padding: 30px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 14px;">© 2025 DogRental. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const getRentalRequestTemplate = (data) => {
  const content = `
    <h2 style="margin: 0 0 20px 0; color: #1f2937;">New Rental Request for ${data.dogName}!</h2>
    <p style="color: #4b5563;">Hi ${data.ownerName},</p>
    <p style="color: #4b5563;"><strong>${data.renterName}</strong> wants to rent <strong>${data.dogName}</strong>.</p>
    <div style="background-color: #f9fafb; padding: 20px; margin: 20px 0;">
      <p><strong>Dates:</strong> ${data.startDate} to ${data.endDate}</p>
      <p><strong>Total:</strong> ${data.totalCost}</p>
      <p><strong>Message:</strong> "${data.message}"</p>
    </div>
    <div style="text-align: center;">
      <a href="${data.dashboardLink}" style="display: inline-block; background: ${PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View Request</a>
    </div>
  `;
  return getBaseTemplate(content);
};

const getRequestApprovedTemplate = (data) => {
  const content = `
    <h2 style="color: #1f2937;">Your rental request was approved!</h2>
    <p style="color: #4b5563;">Hi ${data.renterName},</p>
    <p style="color: #4b5563;"><strong>${data.ownerName}</strong> approved your request for <strong>${data.dogName}</strong>!</p>
    <div style="background-color: #f9fafb; padding: 20px; margin: 20px 0;">
      <p><strong>Dates:</strong> ${data.startDate} to ${data.endDate}</p>
      <p><strong>Total:</strong> ${data.totalCost}</p>
    </div>
    <div style="text-align: center;">
      <a href="${data.dashboardLink}" style="display: inline-block; background: ${SECONDARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View Details</a>
    </div>
  `;
  return getBaseTemplate(content);
};

const getRequestRejectedTemplate = (data) => {
  const content = `
    <h2 style="color: #1f2937;">Update on Your Rental Request</h2>
    <p style="color: #4b5563;">Hi ${data.renterName},</p>
    <p style="color: #4b5563;">Unfortunately, <strong>${data.ownerName}</strong> cannot approve your request for <strong>${data.dogName}</strong>.</p>
    <div style="text-align: center; margin-top: 20px;">
      <a href="${data.dashboardLink}" style="display: inline-block; background: ${PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Find Other Dogs</a>
    </div>
  `;
  return getBaseTemplate(content);
};

const getRentalReminderTemplate = (data) => {
  const content = `
    <h2 style="color: #1f2937;">Your rental starts tomorrow!</h2>
    <p style="color: #4b5563;">Hi ${data.renterName},</p>
    <p style="color: #4b5563;">Reminder: Your rental with <strong>${data.dogName}</strong> begins tomorrow!</p>
    <div style="background-color: #f9fafb; padding: 20px; margin: 20px 0;">
      <p><strong>Starts:</strong> ${data.startDate}</p>
      <p><strong>Owner:</strong> ${data.ownerName}</p>
    </div>
    <div style="text-align: center;">
      <a href="${data.dashboardLink}" style="display: inline-block; background: ${PRIMARY_COLOR}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">View Details</a>
    </div>
  `;
  return getBaseTemplate(content);
};

function getEmailTemplate(type, data) {
  switch (type) {
    case 'rental_request':
      return getRentalRequestTemplate(data);
    case 'request_approved':
      return getRequestApprovedTemplate(data);
    case 'request_rejected':
      return getRequestRejectedTemplate(data);
    case 'rental_reminder':
      return getRentalReminderTemplate(data);
    default:
      throw new Error(`Unknown email template type: ${type}`);
  }
}

module.exports = { getEmailTemplate };
