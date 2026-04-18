const form = document.getElementById("login-form");
const statusElement = document.getElementById("login-status");

function setStatus(message, isError = false) {
  statusElement.textContent = message;
  statusElement.style.color = isError ? "hsl(0, 80%, 66%)" : "var(--accent)";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Logging in...");

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: document.getElementById("username").value,
        password: document.getElementById("password").value,
      }),
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.message || "Login failed.");

    setStatus("Logged in. Opening admin...");
    window.location.href = "/admin.html";
  } catch (error) {
    setStatus(error.message, true);
  }
});
