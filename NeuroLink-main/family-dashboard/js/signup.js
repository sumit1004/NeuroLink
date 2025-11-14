// Wait for DOM and Supabase to be ready
async function initSignup() {
  // Wait for Supabase UMD to load
  while (typeof window.supabase === "undefined") {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const SUPABASE_URL =
    window.SUPABASE_URL || "https://tspfjhwcatqdvbkejica.supabase.co";
  const SUPABASE_ANON_KEY =
    window.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzcGZqaHdjYXRxZHZia2VqaWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMTU1OTgsImV4cCI6MjA3ODY5MTU5OH0.zMWUklUmtIMvmDAC1Ec2si_TosZplxcbef134kz9ihk";

  const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
      },
    }
  );

  // Check if already logged in - use getSession for more reliable check
  const { data: sessionData } = await supabaseClient.auth.getSession();
  if (sessionData?.session?.user) {
    // Only redirect if we're not already on index page
    if (!window.location.pathname.includes('index.html')) {
      window.location.replace("index.html");
    }
    return;
  }
  
  // Fallback check with getUser
  const { data: userData } = await supabaseClient.auth.getUser();
  if (userData?.user) {
    if (!window.location.pathname.includes('index.html')) {
      window.location.replace("index.html");
    }
    return;
  }

  // Hide loading screen and show signup form
  const loadingScreen = document.getElementById("loading-screen");
  const authCard = document.querySelector(".auth-card");
  if (loadingScreen) loadingScreen.style.display = "none";
  if (authCard) authCard.style.display = "block";

  const form = document.getElementById("signup-form");
  const errorBox = document.getElementById("signup-error");
  const successBox = document.getElementById("signup-success");

  if (!form) {
    console.error("Signup form not found");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.classList.add("hidden");
    successBox.classList.add("hidden");

    const fullName = document.getElementById("full_name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;

    if (!fullName || !email || !password) {
      errorBox.textContent = "Please fill in all fields.";
      errorBox.classList.remove("hidden");
      return;
    }

    if (password.length < 6) {
      errorBox.textContent = "Password must be at least 6 characters.";
      errorBox.classList.remove("hidden");
      return;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating Account...";

    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: "family" },
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Create profile record
        const { error: profileError } = await supabaseClient
          .from("profiles")
          .upsert(
            {
              id: data.user.id,
              full_name: fullName,
              email,
              role: "family",
            },
            { onConflict: "id" }
          );

        if (profileError) {
          console.error("Profile creation error:", profileError);
          // Don't throw - account is created, profile can be fixed later
        }
      }

      // Check if email confirmation is required
      const needsConfirmation = data.user && !data.session;
      
      if (needsConfirmation) {
        successBox.innerHTML = `
          <strong>Account created! Check your email.</strong><br><br>
          A confirmation email has been sent to <code>${email}</code>.<br>
          Please click the confirmation link in the email before logging in.<br><br>
          <strong>Note:</strong> If you don't receive the email, check your spam folder or contact your administrator to disable email confirmation in Supabase settings.<br><br>
          <a href="login.html" style="color: #4CAF50; text-decoration: underline;">Go to Login →</a>
        `;
      } else {
        successBox.innerHTML = `
          <strong>Account created successfully!</strong><br>
          Email: <code>${email}</code><br>
          Password: <code>${password}</code><br><br>
          <strong>Share these credentials with your family members.</strong><br>
          <a href="login.html" style="color: #4CAF50; text-decoration: underline;">Go to Login →</a>
        `;
      }
      successBox.classList.remove("hidden");
      form.reset();
    } catch (err) {
      console.error("Signup error:", err);
      errorBox.textContent =
        err.message || "Unable to create account. Please try again.";
      errorBox.classList.remove("hidden");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSignup);
} else {
  initSignup();
}

