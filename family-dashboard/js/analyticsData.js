import { initFirebase, getDatabase } from './firebase.js';

export async function fetchAnalyticsData() {
  try {
    await initFirebase();
    
    // Dynamically import Firebase database functions
    const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
    
    const db = await getDatabase();
    
    // Get patient ID for patient-specific data
    const patientId = window.dashboardContext?.patientId || 'default';
    
    // First try to fetch from patient-specific analytics path
    const patientAnalyticsRef = ref(db, `patients/${patientId}/analytics`);
    const patientSnapshot = await get(patientAnalyticsRef);
    
    if (patientSnapshot.exists()) {
      const data = patientSnapshot.val();
      console.log("Firebase data fetched from patient analytics:", data);
      return data;
    }
    
    // Fallback to root level data
    const dbRef = ref(db);
    const snapshot = await get(dbRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log("Firebase data fetched from root:", data);
      return data;
    } else {
      console.log("No data available");
      return null;
    }
  } catch (error) {
    console.error("Error fetching analytics data from Firebase:", error);
    throw error;
  }
}

export function flattenObject(obj, prefix = '') {
  const result = [];
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively flatten nested objects
        result.push(...flattenObject(value, fullKey));
      } else {
        result.push({
          label: fullKey,
          value: value
        });
      }
    }
  }
  
  return result;
}

export function formatValue(value) {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  if (typeof value === 'number') {
    // Check if it looks like a timestamp
    if (value > 1000000000000) {
      return new Date(value).toLocaleString();
    }
    return value.toString();
  }
  
  return String(value);
}
