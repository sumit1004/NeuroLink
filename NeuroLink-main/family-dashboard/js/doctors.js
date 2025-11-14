import { supabaseClient } from "./supabase.js";

export function loadDoctors() {
  const patientId = window.dashboardContext?.patientId;
  if (!patientId) {
    showNoPatientMessage("doctor-grid");
    const form = document.getElementById("doctor-form");
    if (form) {
      form.style.opacity = "0.5";
      form.style.pointerEvents = "none";
    }
    return;
  }
  const form = document.getElementById("doctor-form");
  if (form) {
    form.style.opacity = "1";
    form.style.pointerEvents = "auto";
  }
  form?.addEventListener("submit", addDoctor);
  fetchDoctors();
}

function showNoPatientMessage(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 2rem;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;"></i>
        <h3>No Patient Configured</h3>
        <p style="color: var(--muted); margin: 1rem 0;">Please configure a patient profile first before adding doctors.</p>
        <button onclick="document.querySelector('[data-tab=\\'patient\\']').click();" class="btn-primary" style="margin-top: 1rem;">
          <i class="fa-solid fa-user-injured"></i> Go to Patient Configuration
        </button>
      </div>
    `;
  }
}

async function addDoctor(event) {
  event.preventDefault();
  const form = event.target;
  const patientId = window.dashboardContext?.patientId;
  if (!patientId) {
    alert("No patient configured. Please configure a patient first.");
    document.querySelector('[data-tab="patient"]')?.click();
    return;
  }

  const payload = {
    patient_id: patientId,
    name: form.name.value,
    phone: form.phone.value,
    speciality: form.speciality.value,
  };

  const { error } = await supabaseClient
    .from("doctor_contacts")
    .insert(payload);
  if (error) {
    alert(error.message);
    return;
  }
  form.reset();
  fetchDoctors();
}

async function fetchDoctors() {
  const container = document.getElementById("doctor-grid");
  if (!container) return;
  const patientId = window.dashboardContext?.patientId;
  if (!patientId) {
    showNoPatientMessage("doctor-grid");
    return;
  }
  const { data, error } = await supabaseClient
    .from("doctor_contacts")
    .select("*")
    .eq("patient_id", patientId)
    .order("name");

  if (error) {
    container.innerHTML = `<p>${error.message}</p>`;
    return;
  }

  if (!data.length) {
    container.innerHTML = "<p>No contacts yet.</p>";
    return;
  }

  container.innerHTML = "";
  data.forEach((doc) => {
    const card = document.createElement("div");
    card.className = "card doctor-card";
    card.innerHTML = `
      <h3>${doc.name}</h3>
      <p>${doc.speciality}</p>
      <a href="tel:${doc.phone}">${doc.phone}</a>
      <button data-id="${doc.id}" style="background:#fee2e2;color:#b91c1c;">Delete</button>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll("button[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => deleteDoctor(btn.dataset.id));
  });
}

export async function deleteDoctor(id) {
  if (!confirm("Delete doctor contact?")) return;
  const { error } = await supabaseClient
    .from("doctor_contacts")
    .delete()
    .eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }
  fetchDoctors();
}

