// Wait for DOM and Supabase to be ready
async function initAuth() {
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

  // Hide loading screen and show login form
  const loadingScreen = document.getElementById("loading-screen");
  const authCard = document.querySelector(".auth-card");
  if (loadingScreen) loadingScreen.style.display = "none";
  if (authCard) authCard.style.display = "block";

  const form = document.getElementById("login-form");
  const errorBox = document.getElementById("auth-error");

  if (!form) {
    console.error("Login form not found");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.classList.add("hidden");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      errorBox.textContent = "Please enter both email and password.";
      errorBox.classList.remove("hidden");
      return;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Handle email confirmation error specifically
        if (error.message && error.message.includes("Email not confirmed")) {
          errorBox.innerHTML = `
            <strong>Email not confirmed</strong><br>
            Please check your email (${email}) and click the confirmation link before logging in.<br>
            <button id="resend-confirmation" style="margin-top: 10px; padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Resend Confirmation Email
            </button>
          `;
          errorBox.classList.remove("hidden");
          
          // Add resend confirmation handler
          const resendBtn = document.getElementById("resend-confirmation");
          if (resendBtn) {
            resendBtn.onclick = async () => {
              resendBtn.disabled = true;
              resendBtn.textContent = "Sending...";
              try {
                const { error: resendError } = await supabaseClient.auth.resend({
                  type: 'signup',
                  email: email
                });
                if (resendError) throw resendError;
                errorBox.innerHTML = `<strong>Confirmation email sent!</strong> Check your inbox (${email}).`;
              } catch (e) {
                errorBox.innerHTML = `Failed to resend: ${e.message}`;
              } finally {
                resendBtn.disabled = false;
                resendBtn.textContent = "Resend Confirmation Email";
              }
            };
          }
          return;
        }
        throw error;
      }

      // Redirect to dashboard - use replace to avoid back button issues
      window.location.replace("index.html");
    } catch (err) {
      console.error("Login error:", err);
      errorBox.textContent =
        err.message || "Unable to login. Please check your credentials.";
      errorBox.classList.remove("hidden");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuth);
} else {
  initAuth();
}

