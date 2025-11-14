import { supabaseClient } from "./supabase.js";
import { initNavigation } from "./navigation.js";
import { loadAnalytics } from "./analytics.js";
import { loadKnownPeople } from "./knownPeople.js";
import { loadHealthRecords } from "./healthRecords.js";
import { loadRoutines } from "./routines.js";
import { loadLocationMap } from "./location.js";
import { loadConversations } from "./conversations.js";
import { loadDoctors } from "./doctors.js";
import { loadPatientConfig } from "./patient.js";

const state = {
  user: null,
  patient: null,
};

window.dashboardContext = {
  get user() {
    return state.user;
  },
  get patient() {
    return state.patient;
  },
  get patientId() {
    return state.patient?.id || null;
  },
  updatePatient(patientData) {
    state.patient = patientData;
    // Update UI
    if (patientData) {
      const nameEl = document.getElementById("patient-name");
      const dobEl = document.getElementById("patient-dob");
      if (nameEl) {
        nameEl.textContent = `Patient: ${patientData.display_name || "Unnamed"}`;
      }
      if (dobEl && patientData.dob) {
        dobEl.textContent = `DOB: ${new Date(patientData.dob).toLocaleDateString()}`;
      }
    }
  },
};

let alertsChannel = null;

async function bootstrap() {
  // Check session first (more reliable than getUser for initial check)
  const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
  
  // If no session, check user as fallback
  if (!sessionData?.session?.user) {
    const { data: userData } = await supabaseClient.auth.getUser();
    if (!userData?.user) {
      // Only redirect if we're not already on login page
      if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('signup.html')) {
        // Hide loading screen before redirect
        const loadingScreen = document.getElementById("loading-screen");
        if (loadingScreen) loadingScreen.style.display = "none";
        window.location.replace("login.html");
      }
      return;
    }
    state.user = userData.user;
  } else {
    state.user = sessionData.session.user;
  }
  
  document.getElementById("user-email").textContent = state.user.email;

  // Hide loading screen and show dashboard
  const loadingScreen = document.getElementById("loading-screen");
  const dashboard = document.querySelector(".dashboard");
  if (loadingScreen) loadingScreen.style.display = "none";
  if (dashboard) dashboard.style.display = "flex";

  await hydratePatient();

  initNavigation({
    patient: () => loadPatientConfig(),
    analytics: () => loadAnalytics(),
    knownPeople: () => loadKnownPeople(),
    healthRecords: () => loadHealthRecords(),
    routines: () => loadRoutines(),
    location: () => loadLocationMap(),
    conversations: () => loadConversations(),
    doctors: () => loadDoctors(),
  });

  document.getElementById("logout-btn").addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
  });

  setupAlertSubscription();
}

async function hydratePatient() {
  const { data, error } = await supabaseClient
    .from("patients")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error loading patient:", error);
    return;
  }
  state.patient = data;
  if (!data) {
    const nameEl = document.getElementById("patient-name");
    const dobEl = document.getElementById("patient-dob");
    if (nameEl) {
      nameEl.innerHTML = '<span style="color: #dc2626;">⚠️ No patient configured</span>';
    }
    if (dobEl) {
      dobEl.innerHTML = '<a href="#" onclick="document.querySelector(\'[data-tab=\\\'patient\\\']\').click(); return false;" style="color: var(--brand); text-decoration: underline;">Click to configure</a>';
    }
    return;
  }
  const nameEl = document.getElementById("patient-name");
  const dobEl = document.getElementById("patient-dob");
  if (nameEl) {
    nameEl.textContent = `Patient: ${data.display_name || "Unnamed"}`;
  }
  if (dobEl && data.dob) {
    dobEl.textContent = `DOB: ${new Date(data.dob).toLocaleDateString()}`;
  }
}

function setupAlertSubscription() {
  alertsChannel = supabaseClient
    .channel("alerts-dashboard")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "alerts" },
      (payload) => handleAlert(payload.new)
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.info("Listening for alerts");
      }
    });
}

function handleAlert(alert) {
  const popup = document.getElementById("alert-popup");
  const title = document.getElementById("alert-title");
  const body = document.getElementById("alert-body");
  const timestamp = document.getElementById("alert-timestamp");
  const audio = document.getElementById("alert-audio");

  title.textContent = `${alert.type?.toUpperCase() || "Alert"}`;
  body.textContent = alert.payload?.message || "New patient alert";
  timestamp.textContent = new Date(alert.created_at).toLocaleString();
  popup.classList.remove("hidden");
  audio.currentTime = 0;
  audio.play().catch(() => {});

  document.getElementById("dismiss-alert").onclick = () => {
    popup.classList.add("hidden");
  };

  if (document.getElementById("alerts-timeline")) {
    loadAnalytics();
  }
}

window.addEventListener("beforeunload", () => {
  alertsChannel?.unsubscribe();
});

bootstrap();

export function requirePatientId() {
  if (!state.patient?.id) {
    throw new Error("No patient configured");
  }
  return state.patient.id;
}

