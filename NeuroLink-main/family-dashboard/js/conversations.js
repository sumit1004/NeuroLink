import { supabaseClient } from "./supabase.js";

export async function loadConversations() {
  const container = document.getElementById("conversation-list");
  container.innerHTML = "<p>Loading conversations...</p>";
  const patientId = window.dashboardContext?.patientId;
  if (!patientId) return;

  const { data, error } = await supabaseClient
    .from("conversations")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    container.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  if (!data.length) {
    container.innerHTML = "<p>No conversations yet.</p>";
    return;
  }

  container.innerHTML = "";
  data.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card conversation-card";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h3>${item.person_name || "Unknown"}</h3>
          <small>${new Date(item.created_at).toLocaleString()}</small>
        </div>
        <span>${item.summary || "No summary"}</span>
      </div>
      <p>${item.transcript || "No transcript"}</p>
      ${
        item.audio_url
          ? `<audio controls src="${item.audio_url}"></audio>`
          : "<p>No audio file.</p>"
      }
    `;
    container.appendChild(card);
  });
}

