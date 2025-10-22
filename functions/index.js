import * as functions from "firebase-functions";
import admin from "firebase-admin";

admin.initializeApp();

export const createUser = functions.https.onCall(async (data, context) => {
  try {
    // ✅ Verify admin
    const callerEmail = context.auth?.token?.email;
    const allowedAdmins = [
      "Ravi.rv73838@gmail.com",
      "ravi.rv73838@icloud.com",
    ];
    if (!callerEmail || !allowedAdmins.includes(callerEmail)) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Access denied — Admin only"
      );
    }

    // ✅ Extract data
    const { name, email, password, contact, role, drive_folder_id, selection_limit } = data;

    if (!email || !password || !name) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Name, email, and password are required."
      );
    }

    // ✅ Create user in Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // ✅ Create Firestore user document
    const userDoc = {
      id: userRecord.uid,
      name,
      email,
      contact: contact || "",
      role: role || "user",
      drive_folder_id: drive_folder_id || "",
      selection_limit: selection_limit || 150,
      is_finalized: false,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin.firestore().collection("users").doc(userRecord.uid).set(userDoc);

    return { success: true, uid: userRecord.uid };
  } catch (error) {
    console.error("createUser error:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
