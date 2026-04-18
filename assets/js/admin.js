const fields = [
  "siteName",
  "resumeUrl",
  "hero.greeting",
  "hero.name",
  "hero.split",
  "hero.profession",
  "hero.resumeLabel",
  "hero.image",
  "about.title",
  "about.description",
  "about.buttonLabel",
  "about.image",
  "projectsTitle",
  "workTitle",
  "servicesTitle",
  "testimonialsTitle",
  "contact.title",
  "contact.description",
  "contact.copyButtonLabel",
  "contact.email",
  "contact.location",
  "footer.year",
  "footer.copy",
];

const repeaters = {
  projects: ["category", "title", "subtitle", "description", "image", "url"],
  experience: ["title", "place", "year", "description"],
  education: ["title", "place", "year", "description"],
  services: ["title", "description", "subtitle", "skills"],
  testimonials: ["name", "rating", "quote", "image"],
  socials: ["label", "url"],
  messaging: ["label", "url"],
};

const templates = {
  projects: {
    category: "Web",
    title: "New Project",
    subtitle: "Technologies used",
    description: "",
    image: "assets/img/projects-1.png",
    url: "",
  },
  experience: {
    title: "Role",
    place: "Company",
    year: "2026",
    description: "",
  },
  education: {
    title: "Course",
    place: "School",
    year: "2026",
    description: "",
  },
  services: {
    title: "Service",
    description: "",
    subtitle: "Skills & Tools",
    skills: "",
  },
  testimonials: {
    name: "Client Name",
    rating: "5.0",
    quote: "",
    image: "assets/img/testimonial-1.png",
  },
  socials: {
    label: "Link",
    url: "https://example.com",
  },
  messaging: {
    label: "Message",
    url: "https://example.com",
  },
};

let data = null;
let currentUser = null;

const $ = (selector) => document.querySelector(selector);

function getPath(source, path) {
  return path.split(".").reduce((value, key) => value?.[key], source);
}

function setPath(target, path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const parent = keys.reduce((object, key) => {
    object[key] = object[key] || {};
    return object[key];
  }, target);
  parent[last] = value;
}

function setStatus(message, isError = false) {
  const status = $("#status");
  status.textContent = message;
  status.style.color = isError ? "hsl(0, 80%, 66%)" : "var(--accent)";
}

function titleCase(value) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

function escapeHTML(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderSimpleFields() {
  fields.forEach((field) => {
    const input = document.getElementById(field);
    if (input) input.value = getPath(data, field) || "";
  });
}

function collectSimpleFields() {
  fields.forEach((field) => {
    const input = document.getElementById(field);
    if (input) setPath(data, field, input.value);
  });
}

function renderRepeater(name) {
  const list = document.getElementById(`${name}-list`);
  const items = data[name] || [];

  list.innerHTML = items
    .map(
      (item, index) => `
        <article class="repeat-card" data-repeater="${name}" data-index="${index}">
          <div class="repeat-card__head wide">
            <strong>${titleCase(name)} ${index + 1}</strong>
            <button class="button button--danger" data-remove="${name}" data-index="${index}" type="button">Remove</button>
          </div>
          ${repeaters[name]
            .map((field) => {
              const value = item[field] || "";
              const isLong = ["description", "quote", "skills"].includes(field);
              const input = isLong
                ? `<textarea data-field="${field}">${escapeHTML(value)}</textarea>`
                : `<input data-field="${field}" type="text" value="${escapeHTML(value)}">`;
              return `<label>${titleCase(field)}${input}</label>`;
            })
            .join("")}
        </article>`
    )
    .join("");
}

function renderRepeaters() {
  Object.keys(repeaters).forEach(renderRepeater);
}

function collectRepeaters() {
  Object.keys(repeaters).forEach((name) => {
    const cards = [...document.querySelectorAll(`[data-repeater="${name}"]`)];
    data[name] = cards.map((card) => {
      const item = {};
      repeaters[name].forEach((field) => {
        item[field] = card.querySelector(`[data-field="${field}"]`).value;
      });
      return item;
    });
  });
}

function bindRepeaterActions() {
  document.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add]");
    if (addButton) {
      collectSimpleFields();
      collectRepeaters();
      const name = addButton.dataset.add;
      data[name] = data[name] || [];
      data[name].push({ ...templates[name] });
      renderRepeater(name);
      return;
    }

    const removeButton = event.target.closest("[data-remove]");
    if (removeButton) {
      collectSimpleFields();
      collectRepeaters();
      const name = removeButton.dataset.remove;
      const index = Number(removeButton.dataset.index);
      data[name].splice(index, 1);
      renderRepeater(name);
    }
  });
}

async function savePortfolio() {
  collectSimpleFields();
  collectRepeaters();

  setStatus("Saving...");
  try {
    const response = await fetch("/api/portfolio", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.message || "Save failed.");
    data = result.data;
    setStatus("Saved. Refresh the public site to see the latest content.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function loadSession() {
  const response = await fetch("/api/auth/me");
  if (response.status === 401) {
    window.location.href = "/login.html";
    return false;
  }

  const result = await response.json();
  if (!response.ok) throw new Error(result.message || "Could not verify login.");

  currentUser = result.user;
  $("#current-user").textContent = `Logged in as ${currentUser.displayName || currentUser.username}`;
  $("#profile-username").value = currentUser.username;
  $("#profile-display-name").value = currentUser.displayName || "";
  return true;
}

async function updateProfile() {
  const displayName = $("#profile-display-name").value.trim();
  setProfileStatus("Updating profile...");

  try {
    const response = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ displayName }),
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.message || "Profile update failed.");

    currentUser = result.user;
    $("#current-user").textContent = `Logged in as ${currentUser.displayName || currentUser.username}`;
    setProfileStatus("Profile updated.");
  } catch (error) {
    setProfileStatus(error.message, true);
  }
}

async function changePassword() {
  const currentPassword = $("#current-password").value;
  const newPassword = $("#new-password").value;
  setProfileStatus("Changing password...");

  try {
    const response = await fetch("/api/auth/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.message || "Password change failed.");

    $("#current-password").value = "";
    $("#new-password").value = "";
    setProfileStatus("Password changed.");
  } catch (error) {
    setProfileStatus(error.message, true);
  }
}

function setProfileStatus(message, isError = false) {
  const status = $("#profile-status");
  status.textContent = message;
  status.style.color = isError ? "hsl(0, 80%, 66%)" : "var(--accent)";
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login.html";
}

async function init() {
  try {
    const loggedIn = await loadSession();
    if (!loggedIn) return;

    const response = await fetch("/api/portfolio");
    if (!response.ok) throw new Error("Could not load portfolio data.");
    data = await response.json();
    renderSimpleFields();
    renderRepeaters();
    bindRepeaterActions();
    $("#save-button").addEventListener("click", savePortfolio);
    $("#profile-save-button").addEventListener("click", updateProfile);
    $("#password-save-button").addEventListener("click", changePassword);
    $("#logout-button").addEventListener("click", logout);
  } catch (error) {
    setStatus(error.message, true);
  }
}

init();
