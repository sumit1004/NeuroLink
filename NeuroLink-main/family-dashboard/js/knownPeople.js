import { supabaseClient } from "./supabase.js";

const bucket = "known_people";

export function loadKnownPeople() {
  const patientId = window.dashboardContext?.patientId;
  if (!patientId) {
    const container = document.getElementById("known-people");
    if (container) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 2rem;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;"></i>
          <h3>No Patient Configured</h3>
          <p style="color: var(--muted); margin: 1rem 0;">Please configure a patient profile first before adding known people.</p>
          <button onclick="document.querySelector('[data-tab=\\'patient\\']').click();" class="btn-primary" style="margin-top: 1rem;">
            <i class="fa-solid fa-user-injured"></i> Go to Patient Configuration
          </button>
        </div>
      `;
    }
    const form = document.getElementById("known-form");
    if (form) {
      form.style.opacity = "0.5";
      form.style.pointerEvents = "none";
    }
    return;
  }
  const form = document.getElementById("known-form");
  if (form) {
    form.style.opacity = "1";
    form.style.pointerEvents = "auto";
  }
  form?.addEventListener("submit", addKnownPerson);
  fetchKnownPeople();
}

async function addKnownPerson(event) {
  event.preventDefault();
  const patientId = window.dashboardContext?.patientId;
  if (!patientId) {
    alert("No patient configured. Please configure a patient first.");
    document.querySelector('[data-tab="patient"]')?.click();
    return;
  }

  const form = event.target;
  const name = form.name.value.trim();
  const relation = form.relation.value.trim();
  
  if (!name || !relation) {
    alert("Please fill in Name and Relation fields.");
    return;
  }

  const file = form.photo.files[0];
  if (!file) {
    alert("Please select a photo.");
    return;
  }

  // Sanitize filename to avoid path issues
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${patientId}/${Date.now()}-${sanitizedFileName}`;

  try {
    // Upload file to storage
    const { data: storageData, error: uploadError } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      alert(`Upload failed: ${uploadError.message}. Please check that the storage bucket exists and policies are set.`);
      return;
    }

    if (!storageData || !storageData.path) {
      alert("Upload failed: No data returned from storage.");
      return;
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(storageData.path);
    
    const photo_url = urlData?.publicUrl || '';

    const payload = {
      patient_id: patientId,
      name: name,
      relation: relation,
      notes: form.notes?.value?.trim() || null,
      photo_url,
    };

    const { data, error } = await supabaseClient.from("known_people").insert(payload).select();
    
    if (error) {
      console.error("Database insert error:", error);
      // Try to clean up uploaded file if insert fails
      await supabaseClient.storage.from(bucket).remove([storageData.path]);
      alert(`Failed to save: ${error.message}`);
      return;
    }

    form.reset();
    fetchKnownPeople();
  } catch (err) {
    console.error("Unexpected error:", err);
    alert(`An error occurred: ${err.message}`);
  }
}

async function fetchKnownPeople() {
  const container = document.getElementById("known-people");
  if (!container) return;
  container.innerHTML = "<p>Loading...</p>";
  const patientId = window.dashboardContext?.patientId;
  if (!patientId) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 2rem;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;"></i>
        <h3>No Patient Configured</h3>
        <p style="color: var(--muted); margin: 1rem 0;">Please configure a patient profile first.</p>
        <button onclick="document.querySelector('[data-tab=\\'patient\\']').click();" class="btn-primary" style="margin-top: 1rem;">
          <i class="fa-solid fa-user-injured"></i> Go to Patient Configuration
        </button>
      </div>
    `;
    return;
  }

  const { data, error } = await supabaseClient
    .from("known_people")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    container.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  if (!data.length) {
    container.innerHTML = "<p>No known people yet.</p>";
    return;
  }

  container.innerHTML = "";
  data.forEach((person) => {
    const card = document.createElement("div");
    card.className = "card known-card";
    card.innerHTML = `
      <img src="${person.photo_url}" alt="${person.name}" />
      <h3>${person.name}</h3>
      <p>${person.relation}</p>
      <p>${person.notes || ""}</p>
      <div class="actions">
        <button data-action="edit" data-id="${person.id}">Edit</button>
        <button data-action="delete" data-id="${person.id}" style="background:#fee2e2;color:#b91c1c;">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll("button[data-action]").forEach((btn) => {
    if (btn.dataset.action === "delete") {
      btn.addEventListener("click", () => deleteKnownPerson(btn.dataset.id));
    } else {
      btn.addEventListener("click", () => editKnownPerson(btn.dataset.id));
    }
  });
}

async function editKnownPerson(id) {
  const { data } = await supabaseClient
    .from("known_people")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return;
  const name = prompt("Name", data.name);
  const relation = prompt("Relation", data.relation);
  const notes = prompt("Notes", data.notes || "");
  if (!name) return;
  const { error } = await supabaseClient
    .from("known_people")
    .update({ name, relation, notes })
    .eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }
  fetchKnownPeople();
}

export async function deleteKnownPerson(id) {
  if (!confirm("Delete this person?")) return;
  const { error } = await supabaseClient
    .from("known_people")
    .delete()
    .eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }
  fetchKnownPeople();
}

