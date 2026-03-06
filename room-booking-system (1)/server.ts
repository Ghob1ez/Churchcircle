import express from "express";
import { createServer as createViteServer } from "vite";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import dotenv from "dotenv";
import { Resend } from "resend";
import { 
  parseISO, 
  differenceInCalendarDays, 
  differenceInCalendarWeeks, 
  differenceInCalendarMonths 
} from "date-fns";

dotenv.config();

const app = express();
const PORT = 3000;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "georgeghobrial97@gmail.com";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

// Initialize Firebase Admin
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log("Firebase Admin initialized");
    }
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
  }
}

app.use(express.json());

// Real Email Function
const sendEmail = async (to: string, subject: string, body: string, html?: string) => {
  if (resend) {
    try {
      await resend.emails.send({
        from: "RoomBook <onboarding@resend.dev>",
        to: [to],
        subject,
        text: body,
        html: html || body.replace(/\n/g, "<br>")
      });
      console.log(`[RESEND] Email sent to ${to}`);
    } catch (error) {
      console.error("[RESEND ERROR]", error);
    }
  } else {
    console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
    console.log(`[MOCK EMAIL] Body: ${body}`);
  }
};

// API Routes
app.post("/api/requests/submit", async (req, res) => {
  const { userId, userEmail, roomId, date, startTime, endTime, eventType } = req.body;

  try {
    const db = getFirestore();
    const requestRef = db.collection("bookingRequests").doc();
    const requestId = requestRef.id;

    await requestRef.set({
      userId,
      userEmail,
      roomId,
      date,
      startTime,
      endTime,
      eventType: eventType || "Other",
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    });

    const detailUrl = `${APP_URL}/admin/requests/${requestId}`;

    await sendEmail(
      ADMIN_EMAIL,
      `New Booking Request: ${roomId}`,
      `A new booking request has been submitted by ${userEmail}.\n\nRoom: ${roomId}\nDate: ${date}\nTime: ${startTime} - ${endTime}\n\nReview here: ${detailUrl}`,
      `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #4f46e5;">New Booking Request</h2>
        <p>A new booking request has been submitted by <strong>${userEmail}</strong>.</p>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Room:</strong> ${roomId}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
        </div>
        <a href="${detailUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Review & Respond</a>
        <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">You can accept or reject this request directly from the dashboard.</p>
      </div>
      `
    );

    res.json({ success: true, requestId });
  } catch (error: any) {
    console.error("Submission error:", error);
    
    // Provide a more helpful message for the "API not enabled" error
    if (error.message?.includes("firestore.googleapis.com")) {
      return res.status(500).json({ 
        error: "Firestore API is not enabled. Please enable it in the Google Cloud Console: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=church-events-4b777" 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/requests/my", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const db = getFirestore();
    const snapshot = await db.collection("bookingRequests")
      .where("userId", "==", userId)
      .get();

    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    // Sort in memory to avoid needing a composite index
    requests.sort((a: any, b: any) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return dateB - dateA;
    });

    res.json(requests);
  } catch (error: any) {
    console.error("Fetch requests error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/requests/all", async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection("bookingRequests")
      .orderBy("createdAt", "desc")
      .get();

    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    res.json(requests);
  } catch (error: any) {
    console.error("Fetch all requests error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/requests/detail/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const db = getFirestore();
    const doc = await db.collection("bookingRequests").doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Request not found" });
    }
    const data = {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate?.() || doc.data()?.createdAt
    };
    res.json(data);
  } catch (error: any) {
    console.error("Fetch request detail error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/requests/approve", async (req, res) => {
  const { requestId, adminId } = req.body;

  try {
    const db = getFirestore();
    const requestRef = db.collection("bookingRequests").doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return res.status(404).json({ error: "Request not found" });
    }

    const requestData = requestDoc.data()!;
    const { roomId, date, startTime, endTime, userId, userEmail } = requestData;

    // Conflict Check
    const bookingsConflicts = await db.collection("bookings")
      .where("roomId", "==", roomId)
      .where("date", "==", date)
      .get();

    const hasBookingConflict = bookingsConflicts.docs.some(doc => {
      const b = doc.data();
      return (startTime < b.endTime) && (endTime > b.startTime);
    });

    if (hasBookingConflict) {
      return res.status(400).json({ error: "Time slot already booked by another event" });
    }

    // Check against availability blocks
    const blocksSnapshot = await db.collection("availabilityBlocks").get();

    const hasBlockConflict = blocksSnapshot.docs.some(doc => {
      const block = doc.data();
      // Check if the block applies to this room or all rooms
      if (block.roomId !== "All Rooms" && block.roomId !== roomId) return false;

      const start = parseISO(block.startDate);
      const end = parseISO(block.endDate);
      const targetDate = parseISO(date);

      // Check if the request date falls within the block range
      if (targetDate < start || targetDate > end) return false;

      // Check if times overlap
      const isTimeOverlap = (startTime < block.endTime) && (endTime > block.startTime);
      if (!isTimeOverlap) return false;

      if (!block.recurrence || block.recurrence === "none") {
        return true;
      }

      const interval = block.interval || 1;

      if (block.recurrence === "daily") {
        const diff = differenceInCalendarDays(targetDate, start);
        return diff % interval === 0;
      }

      if (block.recurrence === "weekly") {
        const diff = differenceInCalendarWeeks(targetDate, start);
        if (diff % interval !== 0) return false;
        if (block.days && block.days.length > 0) {
          return block.days.includes(targetDate.getDay());
        }
        return targetDate.getDay() === start.getDay();
      }

      if (block.recurrence === "monthly") {
        const diff = differenceInCalendarMonths(targetDate, start);
        if (diff % interval !== 0) return false;
        return targetDate.getDate() === start.getDate();
      }

      return false;
    });

    if (hasBlockConflict) {
      return res.status(400).json({ error: "Time slot is blocked by administration" });
    }

    // Atomic update
    const batch = db.batch();
    
    // Update request
    batch.update(requestRef, {
      status: "approved",
      updatedAt: FieldValue.serverTimestamp(),
      approvedBy: adminId
    });

    // Create booking
    const bookingRef = db.collection("bookings").doc();
    batch.set(bookingRef, {
      requestId,
      roomId,
      date,
      startTime,
      endTime,
      userId,
      userEmail,
      createdAt: FieldValue.serverTimestamp()
    });

    await batch.commit();

    // Send Email
    await sendEmail(
      userEmail,
      "Booking Approved",
      `Your booking for ${roomId} on ${date} from ${startTime} to ${endTime} has been approved.`
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error("Approval error:", error);
    
    // Provide a more helpful message for the "API not enabled" error
    if (error.message?.includes("firestore.googleapis.com")) {
      return res.status(500).json({ 
        error: "Firestore API is not enabled. Please enable it in the Google Cloud Console: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=church-events-4b777" 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/requests/deny", async (req, res) => {
  const { requestId, adminNote, adminId } = req.body;

  try {
    const db = getFirestore();
    const requestRef = db.collection("bookingRequests").doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return res.status(404).json({ error: "Request not found" });
    }

    const requestData = requestDoc.data()!;

    await requestRef.update({
      status: "denied",
      adminNote,
      updatedAt: FieldValue.serverTimestamp(),
      deniedBy: adminId
    });

    // Send Email
    await sendEmail(
      requestData.userEmail,
      "Booking Denied",
      `Your booking request for ${requestData.roomId} on ${requestData.date} has been denied.\nReason: ${adminNote}`
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error("Denial error:", error);
    
    // Provide a more helpful message for the "API not enabled" error
    if (error.message?.includes("firestore.googleapis.com")) {
      return res.status(500).json({ 
        error: "Firestore API is not enabled. Please enable it in the Google Cloud Console: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=church-events-4b777" 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/requests/cancel", async (req, res) => {
  const { requestId, userId } = req.body;

  try {
    const db = getFirestore();
    const requestRef = db.collection("bookingRequests").doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return res.status(404).json({ error: "Request not found" });
    }

    const requestData = requestDoc.data()!;
    if (requestData.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized to cancel this request" });
    }

    if (requestData.status === "approved") {
      // If it was approved, we also need to remove the booking
      const bookingsSnapshot = await db.collection("bookings")
        .where("requestId", "==", requestId)
        .get();
      
      const batch = db.batch();
      bookingsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      batch.delete(requestRef);
      await batch.commit();
    } else {
      await requestRef.delete();
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Cancellation error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/bookings/calendar", async (req, res) => {
  try {
    const db = getFirestore();
    
    // Fetch approved bookings
    const bookingsSnapshot = await db.collection("bookings").get();
    const bookings = bookingsSnapshot.docs.map(doc => ({
      id: doc.id,
      type: "booking",
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    // Fetch availability blocks
    const blocksSnapshot = await db.collection("availabilityBlocks").get();
    const blocks = blocksSnapshot.docs.map(doc => ({
      id: doc.id,
      type: "block",
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    res.json([...bookings, ...blocks]);
  } catch (error: any) {
    console.error("Fetch calendar bookings error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/availability/block", async (req, res) => {
  const { 
    roomId, 
    startDate, 
    endDate, 
    startTime, 
    endTime, 
    reason, 
    adminId, 
    recurrence,
    interval,
    days,
    recurrenceEndDate
  } = req.body;

  try {
    const db = getFirestore();
    const batch = db.batch();

    const blockRef = db.collection("availabilityBlocks").doc();
    batch.set(blockRef, {
      roomId,
      startDate,
      endDate: recurrence === "none" ? endDate : (recurrenceEndDate || endDate),
      startTime: startTime || "00:00",
      endTime: endTime || "23:59",
      reason: reason || "Admin Block",
      adminId,
      recurrence: recurrence || "none", // none, daily, weekly, monthly
      interval: interval || 1,
      days: days || [],
      recurrenceEndDate: recurrenceEndDate || null,
      createdAt: FieldValue.serverTimestamp()
    });

    await batch.commit();
    res.json({ success: true, id: blockRef.id });
  } catch (error: any) {
    console.error("Block availability error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/availability/blocks", async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection("availabilityBlocks").orderBy("createdAt", "desc").get();
    const blocks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));
    res.json(blocks);
  } catch (error: any) {
    console.error("Fetch availability blocks error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/availability/block/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const db = getFirestore();
    await db.collection("availabilityBlocks").doc(id).delete();
    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete availability block error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/admin/availability/block/:id", async (req, res) => {
  const { id } = req.params;
  const { 
    roomId, 
    startDate, 
    endDate, 
    startTime, 
    endTime, 
    reason, 
    recurrence,
    interval,
    days,
    recurrenceEndDate
  } = req.body;

  try {
    const db = getFirestore();
    await db.collection("availabilityBlocks").doc(id).update({
      roomId,
      startDate,
      endDate: recurrence === "none" ? endDate : (recurrenceEndDate || endDate),
      startTime: startTime || "00:00",
      endTime: endTime || "23:59",
      reason: reason || "Admin Block",
      recurrence: recurrence || "none",
      interval: interval || 1,
      days: days || [],
      recurrenceEndDate: recurrenceEndDate || null,
      updatedAt: FieldValue.serverTimestamp()
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error("Update availability block error:", error);
    res.status(500).json({ error: error.message });
  }
});

// User Management Endpoints
app.get("/api/admin/users", async (req, res) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection("users").orderBy("email").get();
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(users);
  } catch (error: any) {
    console.error("Fetch users error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const db = getFirestore();
    const userDoc = await db.collection("users").doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = { id: userDoc.id, ...userDoc.data() };

    // Fetch user's booking requests
    const requestsSnapshot = await db.collection("bookingRequests")
      .where("userId", "==", id)
      .get();
    
    const requests = requestsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    // Sort in memory
    requests.sort((a: any, b: any) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return dateB - dateA;
    });

    res.json({ user: userData, requests });
  } catch (error: any) {
    console.error("Fetch user detail error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/users/:id/role", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (role !== "admin" && role !== "member") {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const db = getFirestore();
    await db.collection("users").doc(id).update({
      role,
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error("Update user role error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static("dist"));
  app.get("*", (req, res) => {
    res.sendFile("dist/index.html", { root: "." });
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
