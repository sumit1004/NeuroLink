// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyDujCfQr_WxcIYHX5XQbP6fORj5TpWF47g",
  authDomain: "neurolink-e97c9.firebaseapp.com",
  databaseURL: "https://neurolink-e97c9-default-rtdb.firebaseio.com",
  projectId: "neurolink-e97c9",
  storageBucket: "neurolink-e97c9.firebasestorage.app",
  messagingSenderId: "564706355288",
  appId: "1:564706355288:web:378e0c3b574e1025de022d",
  measurementId: "G-1BFP34SX01"
};

// Initialize Firebase (lazy load)
let firebaseApp = null;
let database = null;

export async function initFirebase() {
  if (firebaseApp) return firebaseApp;
  
  try {
    // Dynamically import Firebase modules
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
    const { getDatabase } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
    
    firebaseApp = initializeApp(firebaseConfig);
    database = getDatabase(firebaseApp);
    
    console.log("Firebase initialized successfully");
    return firebaseApp;
  } catch (error) {
    console.error("Firebase initialization error:", error);
    throw error;
  }
}

export async function getDatabase() {
  if (!database) {
    await initFirebase();
  }
  return database;
}

export { firebaseApp };
