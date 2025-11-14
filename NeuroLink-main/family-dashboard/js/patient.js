import { supabaseClient } from "./supabase.js";

// Prevent duplicate event listeners
let formHandlerAttached = false;

export async function loadPatientConfig() {
  const form = document.getElementById("patient-form");
  const errorBox = document.getElementById("patient-error");
  const successBox = document.getElementById("patient-success");
  const detailsBox = document.getElementById("patient-details");

  if (!form) {
    console.error("Patient form not found");
    return;
  }

  // Load current patient if exists
  const { data: currentPatient, error: fetchError } = await supabaseClient
    .from("patients")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error("Error fetching patient:", fetchError);
  }

  // Populate form if patient exists
  if (currentPatient) {
    const nameEl = document.getElementById("patient-name");
    const dobEl = document.getElementById("patient-dob");
    const homeLocationEl = document.getElementById("patient-home-location");
    
    if (nameEl) nameEl.value = currentPatient.display_name || "";
    if (dobEl) dobEl.value = currentPatient.dob || "";
    if (homeLocationEl) homeLocationEl.value = currentPatient.home_location || "";

    if (currentPatient.emergency_contact) {
      const ec = currentPatient.emergency_contact;
      const emergencyNameEl = document.getElementById("emergency-name");
      const emergencyPhoneEl = document.getElementById("emergency-phone");
      const emergencyRelationEl = document.getElementById("emergency-relation");
      
      if (emergencyNameEl) emergencyNameEl.value = ec.name || "";
      if (emergencyPhoneEl) emergencyPhoneEl.value = ec.phone || "";
      if (emergencyRelationEl) emergencyRelationEl.value = ec.relation || "";
    }

    // Update patient details display
    displayPatientDetails(currentPatient);
  } else {
    if (detailsBox) {
      detailsBox.innerHTML =
        '<p class="warning">No patient configured yet. Please fill in the form above to create a patient profile.</p>';
    }
  }

  // Handle form submission - only attach once
  if (!formHandlerAttached) {
    form.addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Get fresh references to error/success boxes
    const currentErrorBox = document.getElementById("patient-error");
    const currentSuccessBox = document.getElementById("patient-success");
    
    if (currentErrorBox) currentErrorBox.classList.add("hidden");
    if (currentSuccessBox) currentSuccessBox.classList.add("hidden");

    // Check HTML5 form validation first
    const submitForm = e.target;
    if (!submitForm.checkValidity()) {
      submitForm.reportValidity();
      return;
    }

    // Try FormData first (most reliable), then fallback to direct element access
    const formData = new FormData(submitForm);
    let displayNameRaw = formData.get("patient-name") || "";
    let dobRaw = formData.get("patient-dob") || "";
    let homeLocationRaw = formData.get("patient-home-location") || "";
    let emergencyNameRaw = formData.get("emergency-name") || "";
    let emergencyPhoneRaw = formData.get("emergency-phone") || "";
    let emergencyRelationRaw = formData.get("emergency-relation") || "";

    // If FormData didn't work, try direct element access
    if (!displayNameRaw || !dobRaw) {
      const nameEl = submitForm.querySelector('#patient-name') || document.getElementById("patient-name");
      const dobEl = submitForm.querySelector('#patient-dob') || document.getElementById("patient-dob");
      const homeLocationEl = submitForm.querySelector('#patient-home-location') || document.getElementById("patient-home-location");
      const emergencyNameEl = submitForm.querySelector('#emergency-name') || document.getElementById("emergency-name");
      const emergencyPhoneEl = submitForm.querySelector('#emergency-phone') || document.getElementById("emergency-phone");
      const emergencyRelationEl = submitForm.querySelector('#emergency-relation') || document.getElementById("emergency-relation");

      if (!nameEl || !dobEl) {
        if (currentErrorBox) {
          currentErrorBox.textContent = "Form elements not found. Please refresh the page.";
          currentErrorBox.classList.remove("hidden");
        }
        console.error("Missing form elements:", { nameEl, dobEl });
        return;
      }

      // Fallback to direct value access
      displayNameRaw = nameEl.value ?? "";
      dobRaw = dobEl.value ?? "";
      homeLocationRaw = homeLocationEl?.value ?? "";
      emergencyNameRaw = emergencyNameEl?.value ?? "";
      emergencyPhoneRaw = emergencyPhoneEl?.value ?? "";
      emergencyRelationRaw = emergencyRelationEl?.value ?? "";
    }

    // Convert FormData values to strings if needed
    if (displayNameRaw instanceof File) displayNameRaw = "";
    if (typeof displayNameRaw !== "string") displayNameRaw = String(displayNameRaw || "");
    if (typeof dobRaw !== "string") dobRaw = String(dobRaw || "");
    if (typeof homeLocationRaw !== "string") homeLocationRaw = String(homeLocationRaw || "");
    if (typeof emergencyNameRaw !== "string") emergencyNameRaw = String(emergencyNameRaw || "");
    if (typeof emergencyPhoneRaw !== "string") emergencyPhoneRaw = String(emergencyPhoneRaw || "");
    if (typeof emergencyRelationRaw !== "string") emergencyRelationRaw = String(emergencyRelationRaw || "");

    // Debug: Log raw values immediately after reading
    console.log("Raw values read:", {
      displayNameRaw,
      dobRaw,
      homeLocationRaw,
      formDataEntries: Array.from(formData.entries())
    });

    // Trim text values (not date)
    const displayName = displayNameRaw.trim();
    const dob = dobRaw; // Date inputs don't need trim
    const homeLocation = homeLocationRaw.trim();
    const emergencyName = emergencyNameRaw.trim();
    const emergencyPhone = emergencyPhoneRaw.trim();
    const emergencyRelation = emergencyRelationRaw.trim();

    // Debug: Log the actual values being validated
    console.log("Validation check:", {
      displayNameRaw,
      displayName,
      displayNameLength: displayName.length,
      dobRaw,
      dob,
      dobLength: dob.length
    });

    // Validate required fields - check length, not just truthiness
    if (!displayName || displayName.length === 0) {
      if (currentErrorBox) {
        currentErrorBox.textContent = "Please fill in the Patient Display Name.";
        currentErrorBox.classList.remove("hidden");
      }
      nameEl.focus();
      console.error("Validation failed - displayName is empty:", { displayNameRaw, displayName });
      return;
    }

    if (!dob || dob.length === 0) {
      if (currentErrorBox) {
        currentErrorBox.textContent = "Please select a Date of Birth.";
        currentErrorBox.classList.remove("hidden");
      }
      dobEl.focus();
      console.error("Validation failed - dob is empty:", { dobRaw, dob });
      return;
    }

    const emergencyContact = {};
    if (emergencyName || emergencyPhone || emergencyRelation) {
      emergencyContact.name = emergencyName;
      emergencyContact.phone = emergencyPhone;
      emergencyContact.relation = emergencyRelation;
    }

    const submitBtn = submitForm.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : "Save";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    // Get current patient again to ensure we have the latest
    const { data: latestPatient } = await supabaseClient
      .from("patients")
      .select("*")
      .limit(1)
      .maybeSingle();

    try {
      let result;
      if (latestPatient) {
        // Update existing patient
        result = await supabaseClient
          .from("patients")
          .update({
            display_name: displayName,
            dob,
            home_location: homeLocation || null,
            emergency_contact: Object.keys(emergencyContact).length > 0 ? emergencyContact : null,
          })
          .eq("id", latestPatient.id)
          .select()
          .single();
      } else {
        // Create new patient
        result = await supabaseClient
          .from("patients")
          .insert({
            display_name: displayName,
            dob,
            home_location: homeLocation || null,
            emergency_contact: Object.keys(emergencyContact).length > 0 ? emergencyContact : null,
          })
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      if (currentSuccessBox) {
        currentSuccessBox.textContent = latestPatient
          ? "Patient information updated successfully!"
          : "Patient profile created successfully!";
        currentSuccessBox.classList.remove("hidden");
      }

      // Update dashboard context
      if (window.dashboardContext && window.dashboardContext.updatePatient) {
        window.dashboardContext.updatePatient(result.data);
      }

      // Reload patient details
      displayPatientDetails(result.data);

      // Update patient info in header
      if (document.getElementById("patient-name")) {
        document.getElementById("patient-name").textContent = `Patient: ${result.data.display_name}`;
      }
      if (document.getElementById("patient-dob")) {
        document.getElementById("patient-dob").textContent = `DOB: ${new Date(result.data.dob).toLocaleDateString()}`;
      }
    } catch (err) {
      console.error("Error saving patient:", err);
      if (currentErrorBox) {
        currentErrorBox.textContent =
          err.message || "Failed to save patient configuration. Please try again.";
        currentErrorBox.classList.remove("hidden");
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
    });
    formHandlerAttached = true;
  }
}

function displayPatientDetails(patient) {
  const detailsBox = document.getElementById("patient-details");
  const dob = patient.dob
    ? new Date(patient.dob).toLocaleDateString()
    : "Not set";

  let html = `
    <div class="patient-info-display">
      <p><strong>Name:</strong> ${patient.display_name || "Not set"}</p>
      <p><strong>Date of Birth:</strong> ${dob}</p>
      <p><strong>Home Location:</strong> ${patient.home_location || "Not set"}</p>
    `;

  if (patient.emergency_contact) {
    const ec = patient.emergency_contact;
    html += `
      <div class="emergency-contact-display">
        <strong>Emergency Contact:</strong>
        <ul>
          ${ec.name ? `<li><strong>Name:</strong> ${ec.name}</li>` : ""}
          ${ec.phone ? `<li><strong>Phone:</strong> <a href="tel:${ec.phone}">${ec.phone}</a></li>` : ""}
          ${ec.relation ? `<li><strong>Relation:</strong> ${ec.relation}</li>` : ""}
        </ul>
      </div>
    `;
  }

  html += `</div>`;
  detailsBox.innerHTML = html;
}

