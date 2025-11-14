import { supabaseClient } from "./supabase.js";

export function loadRoutines() {
  const patientId = window.dashboardContext?.patientId;
  if (!patientId) {
    showNoPatientMessage("routine-list");
    const form = document.getElementById("routine-form");
    if (form) {
      form.style.opacity = "0.5";
      form.style.pointerEvents = "none";
    }
    return;
  }
  const form = document.getElementById("routine-form");
  if (form) {
    form.style.opacity = "1";
    form.style.pointerEvents = "auto";
  }
  form?.addEventListener("submit", addRoutine);
  fetchRoutines();
}

function showNoPatientMessage(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 2rem;">
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; color: #dc2626; margin-bottom: 1rem;"></i>
        <h3>No Patient Configured</h3>
        <p style="color: var(--muted); margin: 1rem 0;">Please configure a patient profile first before adding routines.</p>
        <button onclick="document.querySelector('[data-tab=\\'patient\\']').click();" class="btn-primary" style="margin-top: 1rem;">
          <i class="fa-solid fa-user-injured"></i> Go to Patient Configuration
        </button>
      </div>
    `;
  }
}

async function addRoutine(event) {
  event.preventDefault();
  const patientId = window.dashboardContext?.patientId;
  if (!patientId) {
    alert("No patient configured. Please configure a patient first.");
    document.querySelector('[data-tab="patient"]')?.click();
    return;
  }
  const form = event.target;
  
  // Get time value
  const timeValue = form.time.value;
  if (!timeValue) {
    alert("Please select a time for this routine.");
    return;
  }
  
  // Get selected days
  const selectedDays = Array.from(form.querySelectorAll('input[name="days"]:checked'))
    .map(checkbox => checkbox.value);
  
  if (selectedDays.length === 0) {
    alert("Please select at least one day for this routine.");
    return;
  }
  
  // Build schedule object
  const schedule = {
    time: timeValue,
    days: selectedDays
  };
  
  const payload = {
    patient_id: patientId,
    title: form.title.value.trim(),
    schedule,
    active: form.active.checked,
  };
  
  console.log("Inserting routine:", payload);
  const { data, error } = await supabaseClient.from("routines").insert(payload).select();
  
  if (error) {
    console.error("Error inserting routine:", error);
    alert(`Error: ${error.message}`);
    return;
  }
  
  console.log("Routine inserted successfully:", data);
  form.reset();
  // Refresh the list
  await fetchRoutines();
}

async function fetchRoutines() {
  const container = document.getElementById("routine-list");
  if (!container) return;
  container.innerHTML = "<p>Loading routines...</p>";
  const patientId = window.dashboardContext?.patientId;
  if (!patientId) {
    showNoPatientMessage("routine-list");
    return;
  }

  // First fetch routines
  const { data: routinesData, error: routinesError } = await supabaseClient
    .from("routines")
    .select("*")
    .eq("patient_id", patientId)
    .order("id", { ascending: true });

  if (routinesError) {
    container.innerHTML = `<p>Error loading routines: ${routinesError.message}</p>`;
    console.error("Routines fetch error:", routinesError);
    return;
  }

  console.log("Fetched routines:", routinesData);

  if (!routinesData || routinesData.length === 0) {
    container.innerHTML = "<p>No routines yet. Create your first routine above.</p>";
    return;
  }

  // Then fetch tasks for each routine
  const routineIds = routinesData.map(r => r.id);
  let tasksData = [];
  if (routineIds.length > 0) {
    const { data: fetchedTasks, error: tasksError } = await supabaseClient
      .from("tasks")
      .select("*")
      .in("routine_id", routineIds);
    
    if (tasksError) {
      console.warn("Error loading tasks:", tasksError);
      // Continue without tasks - routines will still display
    } else {
      tasksData = fetchedTasks || [];
    }
  }

  // Combine routines with their tasks
  const data = routinesData.map(routine => ({
    ...routine,
    tasks: tasksData.filter(task => task.routine_id === routine.id)
  }));

  // Create table view
  container.innerHTML = `
    <div class="card" style="overflow-x: auto;">
      <h3 style="margin-bottom: 1rem;">Routines List</h3>
      <table class="routines-table" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f0f4f8; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 0.75rem; text-align: left;">Title</th>
            <th style="padding: 0.75rem; text-align: left;">Time</th>
            <th style="padding: 0.75rem; text-align: left;">Days</th>
            <th style="padding: 0.75rem; text-align: center;">Status</th>
            <th style="padding: 0.75rem; text-align: center;">Tasks</th>
            <th style="padding: 0.75rem; text-align: center;">Actions</th>
          </tr>
        </thead>
        <tbody id="routines-table-body">
        </tbody>
      </table>
    </div>
    <div id="routines-detail-view" style="margin-top: 2rem;">
    </div>
  `;

  const tableBody = document.getElementById("routines-table-body");
  const detailView = document.getElementById("routines-detail-view");

  // Populate table
  data.forEach((routine) => {
    // Format time display (convert 24h to 12h format)
    let timeDisplay = "N/A";
    if (routine.schedule?.time) {
      const [hours, minutes] = routine.schedule.time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      timeDisplay = `${displayHour}:${minutes} ${ampm}`;
    }
    
    // Format days display
    let daysDisplay = "No days selected";
    if (routine.schedule?.days && routine.schedule.days.length > 0) {
      // Shorten day names for display
      const dayMap = {
        'Monday': 'Mon',
        'Tuesday': 'Tue',
        'Wednesday': 'Wed',
        'Thursday': 'Thu',
        'Friday': 'Fri',
        'Saturday': 'Sat',
        'Sunday': 'Sun'
      };
      daysDisplay = routine.schedule.days.map(day => dayMap[day] || day).join(", ");
    }
    
    // Add row to table
    const row = document.createElement("tr");
    row.style.borderBottom = "1px solid #e2e8f0";
    row.innerHTML = `
      <td style="padding: 0.75rem;">
        <strong>${routine.title || "Untitled"}</strong>
      </td>
      <td style="padding: 0.75rem;">
        <i class="fa-solid fa-clock"></i> ${timeDisplay}
      </td>
      <td style="padding: 0.75rem;">
        <i class="fa-solid fa-calendar-days"></i> ${daysDisplay}
      </td>
      <td style="padding: 0.75rem; text-align: center;">
        ${routine.active 
          ? '<span style="background: #d1fae5; color: #065f46; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem;">Active</span>' 
          : '<span style="background: #fee2e2; color: #991b1b; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem;">Inactive</span>'}
      </td>
      <td style="padding: 0.75rem; text-align: center;">
        <span style="background: #dbeafe; color: #1e40af; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem;">
          ${(routine.tasks || []).length} task${(routine.tasks || []).length !== 1 ? 's' : ''}
        </span>
      </td>
      <td style="padding: 0.75rem; text-align: center;">
        <button data-action="view" data-id="${routine.id}" style="background: #dbeafe; color: #1e40af; padding: 0.375rem 0.75rem; border: none; border-radius: 4px; cursor: pointer; margin-right: 0.5rem;">
          <i class="fa-solid fa-eye"></i> View
        </button>
        <button data-action="delete" data-id="${routine.id}" style="background: #fee2e2; color: #b91c1c; padding: 0.375rem 0.75rem; border: none; border-radius: 4px; cursor: pointer;">
          <i class="fa-solid fa-trash"></i> Delete
        </button>
      </td>
    `;
    tableBody.appendChild(row);
    
    // Create detail card for each routine (initially hidden)
    const detailCard = document.createElement("div");
    detailCard.className = "card routine-card";
    detailCard.id = `routine-detail-${routine.id}`;
    detailCard.style.display = "none";
    detailCard.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center; margin-bottom: 1rem;">
        <div>
          <h3>${routine.title} ${!routine.active ? '<span style="color: var(--muted); font-size: 0.9rem; font-weight: normal;">(Inactive)</span>' : ''}</h3>
          <p style="color: var(--muted); margin-top: 0.25rem;">
            <i class="fa-solid fa-clock"></i> ${timeDisplay} · 
            <i class="fa-solid fa-calendar-days"></i> ${daysDisplay}
          </p>
        </div>
        <button data-action="close-detail" data-id="${routine.id}" style="background:#f3f4f6;color:#374151; padding: 0.5rem; border: none; border-radius: 4px; cursor: pointer;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div>
        <h4 style="margin-bottom: 0.5rem;">Tasks</h4>
        <ul class="tasks">
          ${
            (routine.tasks || []).length > 0
              ? (routine.tasks || [])
                  .map(
                    (task) => `
            <li>
              <span>${task.title}</span>
              <div>
                <button data-action="done" data-id="${task.id}" ${
                  task.completed ? 'disabled style="opacity:0.5;"' : ""
                }>
                  ${task.completed ? "Completed" : "Mark Done"}
                </button>
              </div>
            </li>
          `
                  )
                  .join("")
              : "<li style='color: var(--muted);'>No tasks yet.</li>"
          }
        </ul>
        <form data-routine="${routine.id}" class="task-form" style="margin-top: 1rem; display: flex; gap: 0.5rem; align-items: end;">
          <div style="flex: 1;">
            <input type="text" name="title" placeholder="Task description" required style="width: 100%; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px;" />
          </div>
          <div>
            <input type="datetime-local" name="due_at" style="padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px;" />
          </div>
          <button type="submit" style="background: var(--brand); color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
            Add Task
          </button>
        </form>
      </div>
    `;
    detailView.appendChild(detailCard);
  });

  // Add event listeners for table actions (in container)
  container.querySelectorAll("button[data-action='delete']").forEach((btn) => {
    btn.addEventListener("click", () => deleteRoutine(btn.dataset.id));
  });
  
  container.querySelectorAll("button[data-action='view']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const routineId = btn.dataset.id;
      // Hide all detail views
      document.querySelectorAll('[id^="routine-detail-"]').forEach(card => {
        card.style.display = "none";
      });
      // Show selected detail view
      const detailCard = document.getElementById(`routine-detail-${routineId}`);
      if (detailCard) {
        detailCard.style.display = "block";
        // Scroll to detail view
        detailCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  });
  
  // Add event listeners for detail view actions (in detailView)
  detailView.querySelectorAll("button[data-action='close-detail']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const routineId = btn.dataset.id;
      const detailCard = document.getElementById(`routine-detail-${routineId}`);
      if (detailCard) {
        detailCard.style.display = "none";
      }
    });
  });
  
  // Add event listeners for task actions in detail views
  detailView.querySelectorAll("button[data-action='done']").forEach((btn) => {
    btn.addEventListener("click", () => markTaskComplete(btn.dataset.id));
  });
  
  detailView.querySelectorAll(".task-form").forEach((form) => {
    form.addEventListener("submit", (e) => addTask(e, form.dataset.routine));
  });
}

export async function addTask(event, routineId) {
  event.preventDefault();
  const form = event.target;
  const payload = {
    routine_id: routineId,
    title: form.title.value,
    due_at: form.due_at.value || null,
  };
  const { error } = await supabaseClient.from("tasks").insert(payload);
  if (error) {
    alert(error.message);
    return;
  }
  form.reset();
  fetchRoutines();
}

export async function markTaskComplete(taskId) {
  const { error } = await supabaseClient
    .from("tasks")
    .update({ completed: true })
    .eq("id", taskId);
  if (error) {
    alert(error.message);
    return;
  }
  fetchRoutines();
}

export async function deleteRoutine(id) {
  if (!confirm("Delete this routine and its tasks?")) return;
  const { error } = await supabaseClient.from("routines").delete().eq("id", id);
  if (error) {
    alert(error.message);
    return;
  }
  fetchRoutines();
}

