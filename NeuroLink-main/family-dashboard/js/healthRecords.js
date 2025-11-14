import { supabaseClient } from "./supabase.js";

const bucket = "health_records";

export function loadHealthRecords() {
  const patientId = window.dashboardContext?.patientId;
  if (!patientId) {
    showNoPatientMessage("records");
    const form = document.getElementById("health-form");
    if (form) {
      form.style.opacity = "0.5";
      form.style.pointerEvents = "none";
    }
    return;
  }
  const form = document.getElementById("health-form");
  if (form) {
    form.style.opacity = "1";
    form.style.pointerEvents = "auto";
  }
  form?.addEventListener("submit", uploadHealthRecord);
  fetchRecords();
}

function showNoPatientMessage(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 2rem;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;"></i>
        <h3>No Patient Configured</h3>
        <p style="color: var(--muted); margin: 1rem 0;">Please configure a patient profile first before adding health records.</p>
        <button onclick="document.querySelector('[data-tab=\\'patient\\']').click();" class="btn-primary" style="margin-top: 1rem;">
          <i class="fa-solid fa-user-injured"></i> Go to Patient Configuration
        </button>
      </div>
    `;
  }
}

async function uploadHealthRecord(event) {
  event.preventDefault();
  const patientId = window.dashboardContext?.patientId;
  if (!patientId) {
    alert("No patient configured. Please configure a patient first.");
    document.querySelector('[data-tab="patient"]')?.click();
    return;
  }

  const form = event.target;
  const title = form.title.value.trim();
  if (!title) {
    alert("Please enter a title for the health record.");
    return;
  }

  const file = form.file.files[0];
  if (!file) {
    alert("Please select a file to upload.");
    return;
  }

  // Sanitize filename
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${patientId}/${Date.now()}-${sanitizedFileName}`;

  try {
    const { data: storageData, error: uploadError } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      alert(`Upload failed: ${uploadError.message}. Please check that the storage bucket exists and policies are set.`);
      return;
    }

    if (!storageData || !storageData.path) {
      alert("Upload failed: No data returned from storage.");
      return;
    }

    const { data: urlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(storageData.path);
    
    const file_url = urlData?.publicUrl || '';

    const record = {
      patient_id: patientId,
      title: title,
      file_url,
    };
    
    const { error } = await supabaseClient
      .from("health_records")
      .insert(record);
      
    if (error) {
      console.error("Database insert error:", error);
      // Try to clean up uploaded file if insert fails
      await supabaseClient.storage.from(bucket).remove([storageData.path]);
      alert(`Failed to save: ${error.message}`);
      return;
    }
    
    form.reset();
    fetchRecords();
  } catch (err) {
    console.error("Unexpected error:", err);
    alert(`An error occurred: ${err.message}`);
  }
}

async function fetchRecords() {
  const container = document.getElementById("records");
  if (!container) return;
  const patientId = window.dashboardContext?.patientId;
  if (!patientId) {
    showNoPatientMessage("records");
    return;
  }

  const { data, error } = await supabaseClient
    .from("health_records")
    .select("*")
    .eq("patient_id", patientId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    container.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  if (!data.length) {
    container.innerHTML = "<p>No records yet.</p>";
    return;
  }

  container.innerHTML = "";
  data.forEach((record) => {
    const uploadedAt = record.uploaded_at
      ? new Date(record.uploaded_at).toLocaleString()
      : "Just now";
    const card = document.createElement("div");
    card.className = "card record-card";
    card.innerHTML = `
      <h3>${record.title}</h3>
      <small>${uploadedAt}</small>
      <div class="record-actions">
        <a href="${record.file_url}" target="_blank">View</a>
        <button data-id="${record.id}" style="background:#fee2e2;color:#b91c1c;">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => deleteRecord(btn.dataset.id));
  });
}

export async function deleteRecord(id) {
  if (!confirm("Delete this record?")) return;
  const { error } = await supabaseClient
    .from("health_records")
    .delete()
    .eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }
  fetchRecords();
}

