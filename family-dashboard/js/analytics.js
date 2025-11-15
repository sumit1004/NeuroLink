import { supabaseClient } from "./supabase.js";
import { fetchAnalyticsData, flattenObject, formatValue } from "./analyticsData.js";
import { initFirebase, getDatabase } from "./firebase.js";

export async function loadAnalytics() {
  const patientId = window.dashboardContext?.patientId;
  if (!patientId) {
    document.getElementById("content").innerHTML =
      '<div class="card">No patient configured.</div>';
    return;
  }

  await Promise.all([
    loadAlertStats(patientId),
    loadRoutineStats(patientId),
    loadConversationsToday(patientId),
    loadAlertsTimeline(patientId),
    loadDataCounts(),
  ]);

  setupImportButton();
}

async function loadAlertStats(patientId) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count } = await supabaseClient
    .from("alerts")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", patientId)
    .gte("created_at", weekAgo.toISOString())
    .eq("type", "unknown_person");

  document.getElementById("stat-unknown-alerts").textContent = count ?? 0;
}

async function loadRoutineStats(patientId) {
  const { data: routines } = await supabaseClient
    .from("routines")
    .select("id")
    .eq("patient_id", patientId);

  if (!routines?.length) {
    document.getElementById("stat-routines").textContent = "0%";
    document.getElementById("stat-active-tasks").textContent = "0";
    return;
  }

  const routineIds = routines.map((r) => r.id);
  const { data: tasks } = await supabaseClient
    .from("tasks")
    .select("completed")
    .in("routine_id", routineIds);

  const total = tasks?.length || 0;
  const completed = tasks?.filter((t) => t.completed).length || 0;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  document.getElementById("stat-routines").textContent = `${pct}%`;
  document.getElementById("stat-active-tasks").textContent = String(
    total - completed
  );
}

async function loadConversationsToday(patientId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { data } = await supabaseClient
    .from("conversations")
    .select("id")
    .eq("patient_id", patientId)
    .gte("created_at", start.toISOString());

  document.getElementById("stat-interactions").textContent = data?.length || 0;
}

async function loadAlertsTimeline(patientId) {
  const container = document.getElementById("alerts-timeline");
  container.innerHTML = "";
  const { data } = await supabaseClient
    .from("alerts")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!data?.length) {
    container.innerHTML = "<p>No alerts recorded.</p>";
    return;
  }

  data.forEach((alert) => {
    const div = document.createElement("div");
    div.className = "timeline-item";
    div.innerHTML = `
      <div>
        <strong>${alert.type}</strong>
        <p>${alert.payload?.message || "No message"}</p>
        <small>${new Date(alert.created_at).toLocaleString()}</small>
      </div>
    `;
    container.appendChild(div);
  });
}

function countDataItems(data, path) {
  if (!data) return 0;
  
  const keys = path.split('.');
  let current = data;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return 0;
    }
  }
  
  if (Array.isArray(current)) {
    return current.length;
  } else if (typeof current === 'object' && current !== null) {
    return Object.keys(current).length;
  }
  
  return current ? 1 : 0;
}

async function loadDataCounts() {
  const container = document.getElementById("data-count-container");
  const errorDiv = document.getElementById("data-count-error");
  
  if (!container) return;
  
  try {
    container.innerHTML = `
      <div class="data-count-item loading">
        <div class="data-count-icon">
          <i class="fa-solid fa-spinner fa-spin"></i>
        </div>
        <p>Loading data counts...</p>
      </div>
    `;
    if (errorDiv) errorDiv.style.display = "none";
    
    const data = await fetchAnalyticsData();
    
    if (!data) {
      container.innerHTML = '<div class="data-count-item"><p style="color: var(--muted);">No data available. Click "Import Data" to load.</p></div>';
      return;
    }
    
    // Define data types with their paths and icons
    const dataTypes = [
      { key: 'notes', label: 'Notes', icon: 'fa-sticky-note', paths: ['notes', 'note'] },
      { key: 'patientLocation', label: 'Patient Location', icon: 'fa-location-dot', paths: ['patientLocation', 'patient_location', 'locations'] },
      { key: 'patientsSettings', label: 'Patients Settings', icon: 'fa-gear', paths: ['patientsSettings', 'patient_settings', 'settings'] },
      { key: 'patients', label: 'Patients', icon: 'fa-user-injured', paths: ['patients', 'patient'] },
      { key: 'unknownPeople', label: 'Unknown People', icon: 'fa-user-question', paths: ['unknownPeople', 'unknown_people', 'unknown'] },
      { key: 'chatMessage', label: 'Chat Messages', icon: 'fa-comments', paths: ['chatMessage', 'chat_message', 'messages', 'chat'] },
      { key: 'gameResult', label: 'Game Results', icon: 'fa-gamepad', paths: ['gameResult', 'game_result', 'games', 'game'] },
      { key: 'locationHistory', label: 'Location History', icon: 'fa-clock-rotate-left', paths: ['locationHistory', 'location_history', 'history'] }
    ];
    
    container.innerHTML = "";
    
    dataTypes.forEach((type) => {
      let count = 0;
      
      // Try multiple possible paths for each data type
      for (const path of type.paths) {
        const pathCount = countDataItems(data, path);
        if (pathCount > 0) {
          count = pathCount;
          break;
        }
      }
      
      // If no direct path found, search in flattened data
      if (count === 0) {
        const flatData = flattenObject(data);
        const matchingItems = flatData.filter(item => 
          type.paths.some(path => 
            item.label.toLowerCase().includes(path.toLowerCase())
          )
        );
        count = matchingItems.length;
      }
      
      const item = document.createElement("div");
      item.className = "data-count-item";
      item.innerHTML = `
        <div class="data-count-icon">
          <i class="fa-solid ${type.icon}"></i>
        </div>
        <div class="data-count-content">
          <div class="data-count-label">${type.label}</div>
          <div class="data-count-value">${count.toLocaleString()}</div>
        </div>
      `;
      container.appendChild(item);
    });
    
  } catch (error) {
    console.error("Data count error:", error);
    container.innerHTML = "";
    if (errorDiv) {
      errorDiv.style.display = "flex";
      document.getElementById("data-count-error-message").textContent = 
        `Failed to load data counts: ${error.message}`;
    }
  }
}

async function uploadDataToFirebase(data) {
  try {
    await initFirebase();
    const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js');
    const db = await getDatabase();
    
    // Get patient ID for organizing data
    const patientId = window.dashboardContext?.patientId || 'default';
    
    // Upload data to Firebase under patient-specific path
    const dbRef = ref(db, `patients/${patientId}/analytics`);
    await set(dbRef, data);
    
    console.log("Data uploaded to Firebase successfully");
    return true;
  } catch (error) {
    console.error("Error uploading to Firebase:", error);
    throw error;
  }
}

function readFileAsJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        resolve(jsonData);
      } catch (error) {
        reject(new Error("Invalid JSON file. Please check the file format."));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error reading file."));
    };
    
    reader.readAsText(file);
  });
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function setupImportButton() {
  const fileInput = document.getElementById("import-data-input");
  const refreshBtn = document.getElementById("refresh-data-btn");
  const importStatus = document.getElementById("import-status");
  const importBtnLabel = fileInput?.parentElement;
  
  if (!fileInput || !importStatus) return;
  
  // Handle file selection
  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
      importStatus.innerHTML = '<p class="import-status-message error"><i class="fa-solid fa-circle-exclamation"></i> Please select a valid JSON file.</p>';
      fileInput.value = '';
      return;
    }
    
    if (importBtnLabel) {
      importBtnLabel.style.pointerEvents = 'none';
      importBtnLabel.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Importing...';
    }
    importStatus.innerHTML = '<p class="import-status-message"><i class="fa-solid fa-circle-info"></i> Reading file...</p>';
    
    try {
      // Read and parse JSON file
      const jsonData = await readFileAsJSON(file);
      
      importStatus.innerHTML = '<p class="import-status-message"><i class="fa-solid fa-circle-info"></i> Uploading data to database...</p>';
      
      // Upload to Firebase
      await uploadDataToFirebase(jsonData);
      
      importStatus.innerHTML = '<p class="import-status-message success"><i class="fa-solid fa-circle-check"></i> Data imported and stored successfully!</p>';
      
      // Refresh data overview
      setTimeout(async () => {
        await loadDataCounts();
        importStatus.innerHTML = '<p class="import-status-message success"><i class="fa-solid fa-circle-check"></i> Data imported and stored successfully! View updated in Data Overview.</p>';
        setTimeout(() => {
          importStatus.innerHTML = '';
        }, 5000);
      }, 500);
      
    } catch (error) {
      console.error("Import error:", error);
      importStatus.innerHTML = `<p class="import-status-message error"><i class="fa-solid fa-circle-exclamation"></i> Import failed: ${error.message}</p>`;
    } finally {
      if (importBtnLabel) {
        importBtnLabel.style.pointerEvents = '';
        importBtnLabel.innerHTML = '<i class="fa-solid fa-upload"></i> Import Local Data';
      }
      // Reset file input
      fileInput.value = '';
    }
  });
  
  // Refresh button to reload data from Firebase
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...';
      importStatus.innerHTML = '<p class="import-status-message"><i class="fa-solid fa-circle-info"></i> Refreshing data from database...</p>';
      
      try {
        await loadDataCounts();
        importStatus.innerHTML = '<p class="import-status-message success"><i class="fa-solid fa-circle-check"></i> Data refreshed successfully!</p>';
        setTimeout(() => {
          importStatus.innerHTML = '';
        }, 3000);
      } catch (error) {
        importStatus.innerHTML = `<p class="import-status-message error"><i class="fa-solid fa-circle-exclamation"></i> Refresh failed: ${error.message}</p>`;
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<i class="fa-solid fa-refresh"></i> Refresh';
      }
    });
  }
}

