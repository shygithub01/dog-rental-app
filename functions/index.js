// functions/index.js
const { setGlobalOptions } = require("firebase-functions/v2");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const { getEmailTemplate } = require("./emailTemplates");

// ✅ Align gen-2 functions with your Eventarc location
setGlobalOptions({ region: "us-east4" });

// Initialize Admin once
admin.initializeApp();

// Lazy, safe SendGrid init (avoids build-time warnings)
let SENDGRID_READY = false;
function ensureSendGrid() {
  if (!SENDGRID_READY) {
    const key = process.env.SENDGRID_API_KEY;
    if (!key || !key.startsWith("SG.")) {
      console.error(
        "SENDGRID_API_KEY is missing/invalid. It must start with 'SG.'. " +
        "Check functions/.env and ensure no quotes or extra spaces."
      );
      return false;
    }
    sgMail.setApiKey(key);
    SENDGRID_READY = true;
  }
  return true;
}

// Use a verified sender in SendGrid
const FROM_EMAIL = "mohapatra.shyam@gmail.com"; // <-- make sure this identity is verified in SendGrid
const FROM_NAME = "DogRental";

// -------- sendRentalRequestEmail --------
exports.sendRentalRequestEmail = onDocumentCreated(
  { document: "rentalRequests/{requestId}" },
  async (event) => {
    if (!ensureSendGrid()) return;

    const snap = event.data;
    const request = snap.data();

    try {
      const ownerDoc = await admin.firestore().collection("users").doc(request.dogOwnerId).get();
      if (!ownerDoc.exists) {
        console.error("Owner not found:", request.dogOwnerId);
        return;
      }
      const owner = ownerDoc.data();

      if (!owner.preferences?.emailNotifications || !owner.preferences?.rentalRequests) {
        console.log("Owner has email notifications disabled");
        return;
      }

      const emailData = {
        ownerName: owner.displayName || "Dog Owner",
        renterName: request.renterName,
        dogName: request.dogName,
        dogBreed: request.dogBreed || "Dog",
        startDate: new Date(request.startDate).toLocaleDateString("en-US", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        }),
        endDate: new Date(request.endDate).toLocaleDateString("en-US", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        }),
        totalCost: `$${request.totalCost}`,
        dashboardLink: "https://dog-rental-app.web.app/",
        message: request.message || "No additional message provided.",
      };

      const htmlContent = getEmailTemplate("rental_request", emailData);

      await sgMail.send({
        to: owner.email,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: `New Rental Request for ${request.dogName}`,
        html: htmlContent,
      });

      console.log("Rental request email sent to:", owner.email);
    } catch (error) {
      console.error("Error sending rental request email:", error);
    }
  }
);

// -------- sendRequestApprovedEmail --------
exports.sendRequestApprovedEmail = onDocumentUpdated(
  { document: "rentalRequests/{requestId}" },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (!(before.status !== "approved" && after.status === "approved")) return;
    if (!ensureSendGrid()) return;

    try {
      const renterDoc = await admin.firestore().collection("users").doc(after.renterId).get();
      if (!renterDoc.exists) {
        console.error("Renter not found:", after.renterId);
        return;
      }
      const renter = renterDoc.data();

      if (!renter.preferences?.emailNotifications || !renter.preferences?.rentalUpdates) {
        console.log("Renter has email notifications disabled");
        return;
      }

      const emailData = {
        renterName: renter.displayName || "Renter",
        ownerName: after.dogOwnerName,
        dogName: after.dogName,
        dogBreed: after.dogBreed || "Dog",
        startDate: new Date(after.startDate).toLocaleDateString("en-US", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        }),
        endDate: new Date(after.endDate).toLocaleDateString("en-US", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        }),
        totalCost: `$${after.totalCost}`,
        dashboardLink: "https://dog-rental-app.web.app/",
      };

      const htmlContent = getEmailTemplate("request_approved", emailData);

      await sgMail.send({
        to: renter.email,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: `Your Rental Request for ${after.dogName} was Approved!`,
        html: htmlContent,
      });

      console.log("Request approved email sent to:", renter.email);
    } catch (error) {
      console.error("Error sending request approved email:", error);
    }
  }
);

// -------- sendRequestRejectedEmail --------
exports.sendRequestRejectedEmail = onDocumentUpdated(
  { document: "rentalRequests/{requestId}" },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (!(before.status !== "rejected" && after.status === "rejected")) return;
    if (!ensureSendGrid()) return;

    try {
      const renterDoc = await admin.firestore().collection("users").doc(after.renterId).get();
      if (!renterDoc.exists) {
        console.error("Renter not found:", after.renterId);
        return;
      }
      const renter = renterDoc.data();

      if (!renter.preferences?.emailNotifications || !renter.preferences?.rentalUpdates) {
        console.log("Renter has email notifications disabled");
        return;
      }

      const emailData = {
        renterName: renter.displayName || "Renter",
        ownerName: after.dogOwnerName,
        dogName: after.dogName,
        dogBreed: after.dogBreed || "Dog",
        startDate: new Date(after.startDate).toLocaleDateString("en-US", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        }),
        dashboardLink: "https://dog-rental-app.web.app/",
      };

      const htmlContent = getEmailTemplate("request_rejected", emailData);

      await sgMail.send({
        to: renter.email,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: `Update on Your Rental Request for ${after.dogName}`,
        html: htmlContent,
      });

      console.log("Request rejected email sent to:", renter.email);
    } catch (error) {
      console.error("Error sending request rejected email:", error);
    }
  }
);

// (Optional) If you later re-enable scheduler, add {region:"us-east4"} to its options too.

