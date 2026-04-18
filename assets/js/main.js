const iconMap = {
  linkedin: "ri-linkedin-fill",
  github: "ri-github-fill",
  dribbble: "ri-dribbble-line",
  gitlab: "ri-gitlab-fill",
  whatsapp: "ri-whatsapp-line",
  messenger: "ri-messenger-line",
  telegram: "ri-telegram-line",
  instagram: "ri-instagram-line",
  default: "ri-links-line",
};

let portfolioData = null;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function setHTML(selector, value) {
  const element = $(selector);
  if (element) element.innerHTML = value || "";
}

function setText(selector, value) {
  const element = $(selector);
  if (element) element.textContent = value || "";
}

function setImage(selector, src, alt) {
  const element = $(selector);
  if (!element || !src) return;
  element.src = src;
  element.alt = alt || "";
}

function socialIcon(label = "") {
  const key = label.toLowerCase().replace(/\s+/g, "");
  return iconMap[key] || iconMap.default;
}

function renderSocialLinks(container, links = [], iconOnly = false) {
  if (!container) return;

  container.innerHTML = links
    .map((link) => {
      const icon = `<i class="${socialIcon(link.label)}"></i>`;
      const text = iconOnly ? `<span class="sr-only">${link.label}</span>` : `<span>${link.label}</span>`;
      return `<a href="${link.url}" target="_blank" rel="noreferrer">${icon}${text}</a>`;
    })
    .join("");
}

function renderPortfolio(data) {
  portfolioData = data;
  document.title = `${data.siteName} | Portfolio`;

  setText("[data-site-name]", data.siteName);
  setText("[data-hero-greeting]", data.hero.greeting);
  setHTML("[data-hero-name]", data.hero.name);
  setText("[data-hero-split]", data.hero.split);
  setHTML("[data-hero-profession]", data.hero.profession);
  setImage("[data-hero-image]", data.hero.image, `${data.siteName} portrait`);

  const resumeLinks = $$("[data-resume-link], [data-about-resume]");
  resumeLinks.forEach((link) => {
    link.href = data.resumeUrl;
    link.textContent = link.dataset.resumeLink !== undefined ? data.hero.resumeLabel : data.about.buttonLabel;
  });

  renderSocialLinks($("[data-social-links]"), data.socials, true);

  setHTML("[data-about-title]", data.about.title);
  setHTML("[data-about-description]", data.about.description);
  setImage("[data-about-image]", data.about.image, `${data.siteName} about portrait`);

  setHTML("[data-projects-title]", data.projectsTitle);
  const projectsList = $("[data-projects-list]");
  projectsList.innerHTML = data.projects
    .map(
      (project, index) => `
        <article class="project-card">
          <img src="${project.image}" alt="${project.title.replace(/<br>/g, " ")}" class="project-card__image">
          <div class="project-card__body">
            <div class="project-card__meta">
              <span>${String(index + 1).padStart(2, "0")}</span>
              <span>${project.category}</span>
            </div>
            <h3>${project.title}</h3>
            <p class="project-card__subtitle">${project.subtitle}</p>
            <p>${project.description}</p>
            ${project.url ? `<a href="${project.url}" target="_blank" rel="noreferrer">Open project <i class="ri-arrow-right-up-line"></i></a>` : ""}
          </div>
        </article>`
    )
    .join("");

  setHTML("[data-work-title]", data.workTitle);
  renderWork("experience", data.experience);
  renderWork("education", data.education);

  setHTML("[data-skills-title]", data.skillsTitle);
  const skillsList = $("[data-skills-list]");
  skillsList.innerHTML = data.skills
    .map(
      (skill) => `
        <article class="skill-card">
          <h3>${skill.category}</h3>
          <p>${skill.items}</p>
        </article>`
    )
    .join("");

  setHTML("[data-certifications-title]", data.certificationsTitle);
  const certificationsList = $("[data-certifications-list]");
  certificationsList.innerHTML = data.certifications
    .map(
      (cert) => `
        <article class="certification-card">
          <h3>${cert.title}</h3>
          <p class="cert-issuer">${cert.issuer}</p>
          <p class="cert-year">${cert.year}</p>
          <p class="cert-description">${cert.description}</p>
        </article>`
    )
    .join("");

  setHTML("[data-services-title]", data.servicesTitle);
  const servicesList = $("[data-services-list]");
  servicesList.innerHTML = data.services
    .map(
      (service) => `
        <article class="service-card">
          <button class="service-card__head" type="button" aria-expanded="false">
            <span>${service.title}</span>
            <i class="ri-add-line"></i>
          </button>
          <div class="service-card__body">
            <p>${service.description}</p>
            <h4>${service.subtitle}</h4>
            <p>${service.skills}</p>
          </div>
        </article>`
    )
    .join("");

  setHTML("[data-testimonials-title]", data.testimonialsTitle);
  const testimonialsList = $("[data-testimonials-list]");
  testimonialsList.innerHTML = data.testimonials
    .map(
      (testimonial) => `
        <article class="testimonial-card">
          <img src="${testimonial.image}" alt="${testimonial.name}">
          <div>
            <h3>${testimonial.name}</h3>
            <span>${testimonial.rating}</span>
          </div>
          <p>${testimonial.quote}</p>
        </article>`
    )
    .join("");

  setHTML("[data-contact-title]", data.contact.title);
  setText("[data-contact-description]", data.contact.description);
  const emailLink = $("[data-contact-email]");
  emailLink.textContent = data.contact.email;
  emailLink.href = `mailto:${data.contact.email}`;
  setText("[data-contact-location]", data.contact.location);
  $("#copy-email").textContent = data.contact.copyButtonLabel;
  renderSocialLinks($("[data-contact-social]"), data.socials);
  renderSocialLinks($("[data-contact-messaging]"), data.messaging);

  setText("[data-footer-year]", data.footer.year);
  setHTML("[data-footer-copy]", data.footer.copy);

  bindDynamicInteractions();
}

function renderWork(type, items = []) {
  const list = $(`[data-work-list="${type}"]`);
  list.innerHTML = items
    .map(
      (item) => `
        <article class="work-card">
          <span>${item.year}</span>
          <h3>${item.title}</h3>
          <p class="work-card__place">${item.place}</p>
          <p>${item.description}</p>
        </article>`
    )
    .join("");
}

function bindDynamicInteractions() {
  $$(".service-card__head").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".service-card");
      const isOpen = card.classList.toggle("open");
      button.setAttribute("aria-expanded", String(isOpen));
    });
  });
}

function bindStaticInteractions() {
  const navToggle = $("#nav-toggle");
  const navMenu = $("#nav-menu");
  const closeMenu = () => {
    navMenu.classList.remove("show-menu");
    navToggle.setAttribute("aria-expanded", "false");
  };

  navToggle.addEventListener("click", () => {
    const open = navMenu.classList.toggle("show-menu");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  $$(".nav__link").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  document.addEventListener("click", (event) => {
    if (!navMenu.classList.contains("show-menu")) return;
    if (navMenu.contains(event.target) || navToggle.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  $$(".work__button").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".work__button").forEach((item) => item.classList.remove("active"));
      $$(".work__list").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      $(`[data-work-list="${button.dataset.tab}"]`).classList.add("active");
    });
  });

  $("#copy-email").addEventListener("click", async () => {
    if (!portfolioData?.contact?.email) return;

    await navigator.clipboard.writeText(portfolioData.contact.email);
    $("#copy-message").textContent = "Email copied.";
    window.setTimeout(() => {
      $("#copy-message").textContent = "";
    }, 2200);
  });

  window.addEventListener("scroll", () => {
    $("#header").classList.toggle("scroll-header", window.scrollY > 40);
  });
}

async function init() {
  bindStaticInteractions();

  try {
    const data = await loadPortfolioData();
    renderPortfolio(data);
  } catch (error) {
    console.error(error);
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<p class="load-error">Could not load portfolio data. Please refresh the page.</p>'
    );
  }
}

async function loadPortfolioData() {
  const sources = ["/api/portfolio", "/assets/data/portfolio.json"];

  for (const source of sources) {
    try {
      const response = await fetch(source, { cache: "no-store" });
      if (!response.ok) continue;

      const data = await response.json();
      if (data?.hero && data?.projects && data?.contact) return data;
    } catch (error) {
      console.warn(`Portfolio data source failed: ${source}`, error);
    }
  }

  throw new Error("Portfolio data failed to load.");
}

init();
