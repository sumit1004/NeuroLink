import { supabaseClient } from "./supabase.js";

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
  ]);
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

