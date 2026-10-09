(() => {
  "use strict";

  const STORAGE_KEY = "bond.demo.profiles";
  const MESSAGES_KEY = "bond.demo.messages";
  const SAVED_KEY = "bond.demo.saved";
  const MEETINGS_KEY = "bond.demo.meetings";
  const MAX_UPLOAD_BYTES = 1024 * 1024;
  const MAX_IMAGE_DATA_URL_LENGTH = 1.5 * 1024 * 1024;
  const MAX_PROFILE_STORAGE_LENGTH = 6 * 1024 * 1024;
  const categories = ["Aerospace & Defense", "Construction", "Engineering", "Manufacturing", "Technology", "Logistics", "Energy", "Professional services", "Other industry"];
  const ownershipOptions = ["Veteran-owned", "Woman-owned", "Small business"];
  const sampleProfiles = [
    {
      id: "nova",
      name: "Nova Logistics",
      category: "Logistics",
      location: "Riverside, California",
      description: "A sample company focused on coordinating fleets, distribution, and the movement of goods.",
      services: ["Fleet coordination", "Distribution planning", "Supply chain support"],
      founded: 2018,
      story: "In this fictional company history, Nova began by helping local teams organize deliveries and grew into a regional operations partner.",
      representative: "Maya Torres",
      representativeRole: "Operations lead",
      ownership: "Veteran-owned",
    },
    {
      id: "helix",
      name: "Helix Energy",
      category: "Energy",
      location: "San Diego, California",
      description: "A sample company showing how energy specialists could introduce their capabilities on BOND.",
      services: ["Energy planning", "Renewable systems", "Efficiency consulting"],
      founded: 2020,
      story: "This fictional company story starts with a small energy advisory team and expands into helping businesses plan practical renewable projects.",
      representative: "Jordan Chen",
      representativeRole: "Partnerships lead",
      ownership: "Woman-owned",
    },
    {
      id: "creston",
      name: "Creston Advisory",
      category: "Professional services",
      location: "Irvine, California",
      description: "A sample advisory company supporting business strategy, programs, and everyday operations.",
      services: ["Business strategy", "Program management", "Process improvement"],
      founded: 2016,
      story: "For this preview, Creston’s story follows a small advisory firm helping organizations turn business plans into coordinated programs.",
      representative: "Alex Morgan",
      representativeRole: "Company director",
      ownership: "Small business",
    },
    {
      id: "lumen",
      name: "Lumen Digital",
      category: "Technology",
      location: "San Francisco, California",
      description: "A sample technology company bringing software, dashboards, and workflow ideas to the network.",
      services: ["Business software", "Digital dashboards", "Workflow automation"],
      founded: 2021,
      story: "In this fictional company history, Lumen began with custom reporting tools and developed a focus on software that simplifies everyday work.",
      representative: "Sam Rivera",
      representativeRole: "Solutions lead",
      ownership: "Small business",
    },
    {
      id: "aero",
      name: "AeroWorks Studio",
      category: "Aerospace & Defense",
      location: "Riverside, California",
      description: "A sample aerospace company connecting systems integration and engineering support capabilities.",
      services: ["Systems integration", "Engineering support", "Technical documentation"],
      founded: 2019,
      story: "This fictional company story follows a small technical team developing an aerospace focus around integration planning and engineering coordination.",
      representative: "Taylor Brooks",
      representativeRole: "Technical partnerships lead",
      ownership: "Small business",
    },
    {
      id: "fieldstone",
      name: "Fieldstone Build",
      category: "Construction",
      location: "San Diego, California",
      description: "A sample construction company presenting general construction and project coordination capabilities.",
      services: ["General construction", "Project coordination", "Site planning"],
      founded: 2020,
      story: "For this fictional history, Fieldstone began with local project coordination and developed a broader focus on construction delivery.",
      representative: "Casey Lopez",
      representativeRole: "Project lead",
      ownership: "Veteran-owned",
    },
    {
      id: "vector",
      name: "Vector Engineering",
      category: "Engineering",
      location: "Irvine, California",
      description: "A sample engineering company offering design support and technical consulting across project teams.",
      services: ["Design support", "Technical consulting", "Engineering coordination"],
      founded: 2017,
      story: "In this fictional story, Vector grew from a design support team into a company working across technical planning and project coordination.",
      representative: "Dana Patel",
      representativeRole: "Engineering lead",
      ownership: "Woman-owned",
    },
    {
      id: "forge",
      name: "ForgeWorks Manufacturing",
      category: "Manufacturing",
      location: "Riverside, California",
      description: "A sample manufacturing company introducing fabrication, prototyping, and production planning capabilities.",
      services: ["Fabrication", "Prototyping", "Production planning"],
      founded: 2015,
      story: "This fictional company history begins with a small fabrication workshop and grows into a team helping businesses explore prototype and production needs.",
      representative: "Chris Bennett",
      representativeRole: "Manufacturing lead",
      ownership: "Small business",
    },
  ];

  const sampleOpportunities = [
    {
      id: "nova-dashboard", type: "Service", companyId: "nova",
      title: "Fleet dashboard support",
      summary: "Explore a sample need for software that brings vehicles, assignments, and reporting into one view.",
      detail: "This fictional opportunity illustrates how a logistics company could describe a software need and discover businesses with relevant capabilities.",
      scope: ["Fleet and assignment overview", "Simple operational reporting", "Workflow planning"],
    },
    {
      id: "helix-implementation", type: "Partner", companyId: "helix",
      title: "Renewable implementation partner",
      summary: "Discover a sample partnership around planning and implementing renewable energy projects.",
      detail: "This fictional opportunity shows how an energy company could introduce its interests and invite a conversation with potential implementation partners.",
      scope: ["Implementation planning", "Complementary energy capabilities", "An introductory company conversation"],
    },
    {
      id: "creston-program", type: "Collaboration", companyId: "creston",
      title: "Program delivery collaboration",
      summary: "Explore a sample collaboration between teams with complementary program and operations expertise.",
      detail: "This fictional opportunity demonstrates a company seeking to discuss shared delivery methods and complementary professional services.",
      scope: ["Program coordination", "Operational process design", "Shared capabilities discussion"],
    },
  ];

  const sampleIntroductions = {
    nova: [["lumen", "Digital dashboard capabilities"], ["creston", "Operational process planning"]],
    helix: [["vector", "Engineering coordination"], ["fieldstone", "Construction project coordination"]],
    creston: [["fieldstone", "Project delivery capabilities"], ["lumen", "Digital reporting tools"]],
    lumen: [["nova", "Fleet workflow capabilities"], ["creston", "Program management capabilities"]],
    aero: [["vector", "Engineering design support"], ["forge", "Prototyping and fabrication"]],
    fieldstone: [["vector", "Design support"], ["nova", "Fleet and distribution coordination"]],
    vector: [["aero", "Systems integration capabilities"], ["helix", "Energy planning capabilities"]],
    forge: [["aero", "Systems integration capabilities"], ["vector", "Engineering design support"]],
  };

  const iconPaths = {
    Logistics: ["M4 21V5h11v16", "M15 10h5v11", "M8 9h3M8 13h3M8 17h3M18 14v1M18 18v1M2 21h20"],
    Energy: ["M20 4c-8-1-15 3-15 9a6 6 0 0 0 6 6c6 0 10-7 9-15Z", "M4 21 15 10", "M9 16v-5M9 16h5"],
    "Professional services": ["M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", "M3 7h18v13H3Z", "M3 12a24 24 0 0 0 18 0", "M10 12h4v4h-4Z"],
    Technology: ["M7 7h10v10H7Z", "M10 10h4v4h-4Z", "M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"],
    "Aerospace & Defense": ["M12 3v18", "M12 6 3 14v3l9-4 9 4v-3L12 6Z", "M8 21l4-3 4 3"],
    Construction: ["M3 21h18", "M5 21V9l7-5 7 5v12", "M9 21v-7h6v7", "M8 10h1M15 10h1"],
    Engineering: ["m4 17 13-13 3 3L7 20H4Z", "m12 9 3 3M9 12l2 2M6 15l2 2"],
    Manufacturing: ["M3 21V9l6 4V9l6 4V7h6v14Z", "M6 17h1M11 17h1M17 17h1M17 11h1"],
  };

  const profiles = [...sampleProfiles, ...readSavedProfiles()];
  const savedCompanies = new Set(readStoredIds(SAVED_KEY));
  const messagesByCompany = readSavedMessages();
  const meetingRequests = readSavedMeetings();
  let currentFilter = "All";
  let currentOpportunityFilter = "All";
  let currentExpoProfile = sampleProfiles[0];
  let chatSequence = 0;
  let toastTimer;
  const dialogOpeners = new WeakMap();

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function companyIcon(category) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "24");
    svg.setAttribute("height", "24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.6");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    for (const pathData of iconPaths[category] || iconPaths.Technology) {
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", pathData);
      svg.append(path);
    }
    return svg;
  }

  function cleanText(value, maxLength) {
    return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
  }

  function normalizeWebsite(value) {
    if (typeof value !== "string" || !value.trim() || value.trim().length > 2048) return "";
    try {
      const url = new URL(value.trim());
      if (!["https:", "http:"].includes(url.protocol) || !url.hostname || url.username || url.password) return "";
      return url.href;
    } catch {
      return "";
    }
  }

  function normalizeEmail(value) {
    const email = cleanText(value, 160);
    return /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,63}$/.test(email) ? email : "";
  }

  function normalizePhone(value) {
    const phone = cleanText(value, 40);
    if (!/^[+()\d.\-\s]+$/.test(phone) || phone.indexOf("+", 1) !== -1) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) return "";
    return `${phone.startsWith("+") ? "+" : ""}${digits}`;
  }

  function parseServices(value) {
    const entries = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
    const services = [];
    const seen = new Set();
    for (const entry of entries) {
      const service = cleanText(entry, 60);
      if (!service || seen.has(service.toLocaleLowerCase())) continue;
      seen.add(service.toLocaleLowerCase());
      services.push(service);
      if (services.length === 6) break;
    }
    return services;
  }

  function normalizeImageDataUrl(value) {
    if (typeof value !== "string" || value.length > MAX_IMAGE_DATA_URL_LENGTH) return "";
    const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    if (!match || match[2].length % 4 !== 0) return "";
    try {
      const header = atob(match[2].slice(0, 32));
      const valid = match[1] === "png" ? header.startsWith("\x89PNG\r\n\x1a\n")
        : match[1] === "jpeg" ? header.startsWith("\xff\xd8\xff")
          : header.startsWith("RIFF") && header.slice(8, 12) === "WEBP";
      return valid ? value : "";
    } catch {
      return "";
    }
  }

  function readImageFile(file) {
    if (!file) return Promise.resolve("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return Promise.reject(new Error("Choose a PNG, JPEG, or WebP image."));
    if (!file.size || file.size > MAX_UPLOAD_BYTES) return Promise.reject(new Error("Choose an image no larger than 1 MB."));
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("The image could not be read. Choose another file."));
      reader.onabort = () => reject(new Error("Image loading was interrupted. Choose the image again."));
      reader.onload = () => {
        const dataUrl = normalizeImageDataUrl(reader.result);
        if (!dataUrl) {
          reject(new Error("This file is not a readable PNG, JPEG, or WebP image."));
          return;
        }
        const image = new Image();
        image.onload = () => image.naturalWidth && image.naturalHeight ? resolve(dataUrl) : reject(new Error("This image could not be decoded. Choose another file."));
        image.onerror = () => reject(new Error("This image could not be decoded. Choose another file."));
        image.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  function companyLogo(profile, className = "company-logo-image") {
    if (!profile.logo) return companyIcon(profile.category);
    const image = element("img", `${className} uploaded-company-logo`);
    image.src = profile.logo;
    image.alt = `${profile.name} logo`;
    image.addEventListener("error", () => {
      image.parentElement?.classList.remove("has-uploaded-logo");
      image.replaceWith(companyIcon(profile.category));
    }, { once: true });
    return image;
  }

  function fullProfileLink(profile) {
    const link = element("a", "company-link full-profile-link", "Open full profile");
    link.href = `company.html?id=${encodeURIComponent(profile.id)}`;
    return link;
  }

  function newProfileId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `local-${crypto.randomUUID()}`;
    }
    return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function readSavedProfiles() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored || stored.length > MAX_PROFILE_STORAGE_LENGTH) return [];
      const saved = JSON.parse(stored);
      if (!Array.isArray(saved)) return [];
      return saved.flatMap((profile) => {
        if (!profile || typeof profile !== "object") return [];
        const name = cleanText(profile.company, 80);
        const category = cleanText(profile.industry, 40);
        const location = cleanText(profile.location, 100) || "Location not added";
        const description = cleanText(profile.description, 500);
        if (!name || !description || !categories.includes(category)) return [];
        const id = typeof profile.id === "string" && /^local-[a-zA-Z0-9-]{1,80}$/.test(profile.id)
          ? profile.id : newProfileId();
        const representative = cleanText(profile.representative, 80);
        const ownership = ownershipOptions.includes(profile.ownership) ? profile.ownership : "Not specified";
        return [{
          id, name, category, location, description, representative,
          representativeRole: "Company representative", ownership, local: true,
          tagline: cleanText(profile.tagline, 100), services: parseServices(profile.services),
          story: cleanText(profile.story, 1200),
          serviceArea: cleanText(profile.serviceArea, 150), website: normalizeWebsite(profile.website),
          logo: normalizeImageDataUrl(profile.logo), cover: normalizeImageDataUrl(profile.cover),
          publicEmail: normalizeEmail(profile.publicEmail), publicPhone: normalizePhone(profile.publicPhone),
          publishContact: profile.publishContact === true,
        }];
      });
    } catch {
      return [];
    }
  }

  function saveLocalProfiles() {
    const saved = profiles.filter((profile) => profile.local).map((profile) => ({
      id: profile.id,
      company: profile.name,
      industry: profile.category,
      location: profile.location,
      description: profile.description,
      representative: profile.representative || "",
      ownership: profile.ownership || "Not specified",
      tagline: profile.tagline || "",
      story: profile.story || "",
      services: profile.services,
      serviceArea: profile.serviceArea || "",
      website: profile.website || "",
      logo: profile.logo || "",
      cover: profile.cover || "",
      publicEmail: profile.publicEmail || "",
      publicPhone: profile.publicPhone || "",
      publishContact: profile.publishContact === true,
    }));
    try {
      const serialized = JSON.stringify(saved);
      if (serialized.length > MAX_PROFILE_STORAGE_LENGTH) return false;
      localStorage.setItem(STORAGE_KEY, serialized);
      return true;
    } catch {
      return false;
    }
  }

  function readStoredValue(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw || raw.length > 500000) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function writeStoredValue(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function knownProfileId(id) {
    return typeof id === "string" && profiles.some((profile) => profile.id === id);
  }

  function readStoredIds(key) {
    const value = readStoredValue(key);
    return Array.isArray(value) ? value.filter(knownProfileId) : [];
  }

  function cleanMessage(value) {
    return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim().slice(0, 1500) : "";
  }

  function readSavedMessages() {
    const result = Object.create(null);
    const stored = readStoredValue(MESSAGES_KEY);
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return result;
    for (const [id, entries] of Object.entries(stored)) {
      if (!knownProfileId(id) || !Array.isArray(entries)) continue;
      result[id] = entries.flatMap((message) => {
        if (!message || typeof message !== "object") return [];
        const text = cleanMessage(message.text);
        const timestamp = typeof message.at === "string" ? Date.parse(message.at) : NaN;
        if (!text || !Number.isFinite(timestamp)) return [];
        return [{ text, at: new Date(timestamp).toISOString() }];
      });
    }
    return result;
  }

  function readSavedMeetings() {
    const result = Object.create(null);
    const stored = readStoredValue(MEETINGS_KEY);
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return result;
    for (const [id, at] of Object.entries(stored)) {
      if (knownProfileId(id) && typeof at === "string" && Number.isFinite(Date.parse(at))) result[id] = at;
    }
    return result;
  }

  function ownershipLabel(profile) {
    if (!ownershipOptions.includes(profile.ownership)) return null;
    return element("span", "ownership-label", `${profile.ownership} · Self-reported`);
  }

  function serviceTags(profile) {
    const services = element("div", "company-services");
    for (const service of profile.services) services.append(element("span", "service-tag", service));
    return services;
  }

  function createCompanyCard(profile) {
    const card = element("article", "company-card");
    const headingId = `${profile.id}-card-title`;
    card.setAttribute("aria-labelledby", headingId);
    const head = element("div", "company-card-head");
    const avatar = element("div", "company-avatar");
    avatar.classList.toggle("has-uploaded-logo", Boolean(profile.logo));
    avatar.append(companyLogo(profile));
    const meta = element("div", "company-meta");
    const heading = element("h3", "", profile.name);
    heading.id = headingId;
    meta.append(heading, element("p", "company-category", profile.category));
    head.append(avatar, meta);
    const label = profile.local ? "Local preview" : "Sample company";
    const previewLabel = element("span", "sample-label", label);
    const location = element("p", "company-location", profile.location);
    const description = element("p", "company-description", profile.description);
    const button = element("button", "company-link", "View company profile");
    button.type = "button";
    button.setAttribute("aria-label", `View ${profile.name} sample profile`);
    button.addEventListener("click", () => openCompany(profile, button));
    card.append(head, previewLabel, location, description);
    const ownership = ownershipLabel(profile);
    if (ownership) card.append(ownership);
    if (profile.services.length) card.append(serviceTags(profile));
    card.append(button, fullProfileLink(profile));
    return card;
  }

  function renderDirectory() {
    const grid = document.getElementById("company-grid");
    if (!grid) return;
    const search = document.getElementById("directory-search");
    const query = (search ? search.value : "").trim().toLocaleLowerCase();
    const locationFilter = document.getElementById("directory-location")?.value || "All";
    const ownershipFilter = document.getElementById("directory-ownership")?.value || "All";
    const visible = profiles.filter((profile) => {
      const matchesCategory = currentFilter === "All" || profile.category === currentFilter;
      const matchesLocation = locationFilter === "All" || profile.location.toLocaleLowerCase().includes(locationFilter.toLocaleLowerCase());
      const matchesOwnership = ownershipFilter === "All" || profile.ownership === ownershipFilter;
      const searchText = [profile.name, profile.category, profile.location, profile.description, profile.tagline || "", profile.serviceArea || "", profile.story || "", profile.representative || "", profile.ownership || "", ...profile.services].join(" ").toLocaleLowerCase();
      return matchesCategory && matchesLocation && matchesOwnership && (!query || searchText.includes(query));
    });
    const content = document.createDocumentFragment();
    for (const profile of visible) content.append(createCompanyCard(profile));
    if (!visible.length) {
      content.append(element("p", "directory-empty", "No sample companies match your filters. Try another service, location, ownership label, or industry."));
    }
    grid.replaceChildren(content);
    const status = document.getElementById("directory-status");
    if (status) status.textContent = `Showing ${visible.length} of ${profiles.length} sample company profiles.`;
    document.querySelectorAll(".filter-btn[data-filter]").forEach((button) => {
      const active = button.dataset.filter === currentFilter;
      button.classList.toggle("is-active", active);
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  const featuredIds = ["aero", "fieldstone", "lumen", "nova"];
  const industryImages = {
    "Aerospace & Defense": "assets/industry-aerospace.jpg",
    Engineering: "assets/industry-engineering.jpg",
    Construction: "assets/industry-construction.jpg",
    Technology: "assets/industry-software.jpg",
    Logistics: "assets/industry-logistics.jpg",
    Manufacturing: "assets/industry-manufacturing.jpg",
    Energy: "assets/industry-energy.jpg",
    "Professional services": "assets/collaboration.png",
  };

  function renderFeatured() {
    const grid = document.getElementById("featured-grid");
    if (!grid) return;
    const content = document.createDocumentFragment();
    for (const id of featuredIds) {
      const profile = resolveProfile(id);
      if (!profile) continue;
      const card = element("article", "featured-card");
      const cover = element("div", "featured-cover");
      const image = element("img");
      image.src = industryImages[profile.category] || "assets/expo-hero.png";
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      cover.append(image);
      const logo = element("div", "company-avatar featured-logo");
      logo.append(companyLogo(profile));
      const body = element("div", "featured-body");
      body.append(element("p", "company-category", profile.category), element("h4", "", profile.name), element("p", "featured-location", profile.location));
      const open = element("button", "company-link", "View company profile");
      open.type = "button";
      open.setAttribute("aria-label", `View ${profile.name} sample profile`);
      open.addEventListener("click", () => openCompany(profile, open));
      body.append(open);
      card.append(cover, logo, body);
      content.append(card);
    }
    grid.replaceChildren(content);
  }

  function showDirectory() {
    renderDirectory();
    document.getElementById("businesses")?.scrollIntoView({ block: "start" });
  }

  function showDialog(dialog, opener) {
    if (!dialog) return;
    if (!dialog.open) {
      dialogOpeners.set(dialog, opener || document.activeElement);
      dialog.showModal();
    }
  }

  function refreshSaveButtons() {
    document.querySelectorAll("[data-save-company]").forEach((button) => {
      const saved = savedCompanies.has(button.dataset.saveCompany);
      button.textContent = saved ? "Company saved" : "Save company";
      button.setAttribute("aria-pressed", String(saved));
      button.classList.toggle("is-saved", saved);
    });
  }

  function profileActions(profile, container, onConnect) {
    const actions = element("div", "profile-actions");
    const connect = element("button", "button button-primary company-connect", "Message company");
    connect.type = "button";
    const save = element("button", "button button-secondary company-save", savedCompanies.has(profile.id) ? "Company saved" : "Save company");
    save.type = "button";
    save.dataset.saveCompany = profile.id;
    save.setAttribute("aria-pressed", String(savedCompanies.has(profile.id)));
    save.classList.toggle("is-saved", savedCompanies.has(profile.id));
    const meeting = element("button", "button button-secondary company-meeting", "Request a meeting");
    meeting.type = "button";
    const status = element("p", "profile-action-status");
    status.setAttribute("role", "status");
    const conversation = element("div", "profile-demo-chat");
    conversation.hidden = true;
    connect.addEventListener("click", () => {
      if (onConnect) onConnect();
      else {
        if (conversation.hidden) renderChat(profile, conversation);
        conversation.hidden = false;
        conversation.querySelector("textarea")?.focus();
      }
    });
    save.addEventListener("click", () => {
      const wasSaved = savedCompanies.has(profile.id);
      if (wasSaved) savedCompanies.delete(profile.id);
      else savedCompanies.add(profile.id);
      const persisted = writeStoredValue(SAVED_KEY, [...savedCompanies]);
      refreshSaveButtons();
      status.textContent = wasSaved
        ? `${profile.name} removed from your saved demo companies.`
        : `${profile.name} saved ${persisted ? "in this browser" : "for this visit; browser storage is unavailable"}.`;
    });
    meeting.addEventListener("click", () => {
      meetingRequests[profile.id] = new Date().toISOString();
      const persisted = writeStoredValue(MEETINGS_KEY, meetingRequests);
      status.textContent = persisted
        ? "Demo meeting request saved in this browser. Meeting scheduling will be available when BOND launches."
        : "Demo meeting request saved for this visit. Browser storage is unavailable.";
    });
    actions.append(connect, save, meeting);
    container.append(actions, status, conversation);
  }

  function renderChatThread(profile, thread) {
    thread.replaceChildren();
    const messages = messagesByCompany[profile.id] || [];
    if (!messages.length) {
      thread.append(element("p", "chat-empty", "Your sample conversation begins here. Only the demo messages you write will appear."));
      return;
    }
    for (const message of messages) {
      const entry = element("article", "chat-message");
      entry.append(element("p", "chat-message-author", "Your company · Demo message"));
      entry.append(element("p", "chat-message-text", message.text));
      const time = element("time", "chat-message-time", new Date(message.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
      time.dateTime = message.at;
      entry.append(time);
      thread.append(entry);
    }
    thread.scrollTop = thread.scrollHeight;
  }

  function renderChat(profile, container) {
    container.replaceChildren();
    container.classList.add("expo-chat");
    container.append(element("h4", "detail-label", "1:1 conversation preview"));
    container.append(element("p", "chat-recipient", `${profile.representative || "Company representative"} · ${profile.name} · Demo`));
    container.append(element("p", "chat-disclaimer", "Messages are saved only in this browser. They are not sent to a company."));
    const thread = element("div", "chat-thread");
    thread.dataset.chatCompany = profile.id;
    thread.setAttribute("role", "log");
    thread.setAttribute("aria-live", "polite");
    thread.setAttribute("aria-relevant", "additions");
    thread.setAttribute("aria-label", `Local demo conversation with ${profile.name}`);
    renderChatThread(profile, thread);
    const form = element("form", "chat-form");
    const messageId = `demo-message-${profile.id}-${++chatSequence}`;
    const label = element("label", "chat-label", "Your demo message");
    label.htmlFor = messageId;
    const textarea = element("textarea", "chat-input");
    textarea.id = messageId;
    textarea.name = "message";
    textarea.rows = 3;
    textarea.maxLength = 1500;
    textarea.required = true;
    textarea.placeholder = "Introduce your company or ask a sample question…";
    const send = element("button", "button button-primary", "Send demo message");
    send.type = "submit";
    const status = element("p", "chat-status");
    status.setAttribute("role", "status");
    textarea.addEventListener("input", () => textarea.setCustomValidity(""));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = cleanMessage(textarea.value);
      if (!text) {
        textarea.setCustomValidity("Write a demo message before sending.");
        textarea.reportValidity();
        return;
      }
      if (!messagesByCompany[profile.id]) messagesByCompany[profile.id] = [];
      messagesByCompany[profile.id].push({ text, at: new Date().toISOString() });
      const persisted = writeStoredValue(MESSAGES_KEY, messagesByCompany);
      document.querySelectorAll("[data-chat-company]").forEach((otherThread) => {
        if (otherThread.dataset.chatCompany === profile.id) renderChatThread(profile, otherThread);
      });
      textarea.value = "";
      textarea.focus();
      status.textContent = persisted ? "Demo message saved in this browser." : "Demo message saved for this visit; browser storage is unavailable.";
    });
    form.append(label, textarea, send, status);
    container.append(thread, form);
  }

  function renderCompanyDetails(profile, container, options = {}) {
    if (!container) return;
    const { inDialog = false, showHeading = true, onConnect = null } = options;
    container.replaceChildren();
    if (showHeading) {
      container.append(element("p", "dialog-kicker", profile.local ? "Your local sample profile" : "Sample company profile"));
      const title = element(inDialog ? "h2" : "h3", "dialog-heading", profile.name);
      if (inDialog) {
        title.id = "company-dialog-title";
        document.getElementById("company-dialog")?.setAttribute("aria-labelledby", title.id);
      }
      if (inDialog) {
        const identity = element("div", "company-card-head profile-dialog-identity");
        const avatar = element("div", "company-avatar");
        avatar.classList.toggle("has-uploaded-logo", Boolean(profile.logo));
        avatar.append(companyLogo(profile));
        identity.append(avatar, title);
        container.append(identity);
      } else container.append(title);
    }
    if (profile.tagline) container.append(element("p", "profile-tagline", profile.tagline));
    container.append(element("p", "company-category", profile.category));
    container.append(element("p", "company-location", profile.location === "Location not added" ? profile.location : `${profile.location} · ${profile.local ? "Local preview" : "Sample location"}`));
    container.append(element("p", "dialog-copy", profile.description));
    const ownership = ownershipLabel(profile);
    if (ownership) {
      container.append(ownership);
      container.append(element("p", "ownership-note", "Self-reported demo label. Certification status is not provided; this sample does not assert VOSB or SDVOSB certification."));
    }
    if (profile.services.length) {
      container.append(element("h4", "detail-label", "Capabilities"), serviceTags(profile));
    }
    if (profile.story) {
      const story = element("section", "company-story");
      story.append(element("h4", "detail-label", profile.local ? "Company story · Local preview" : "Company story · Sample"));
      if (profile.founded) story.append(element("p", "company-founded", `Founded ${profile.founded} · Demo company history`));
      story.append(element("p", "dialog-copy", profile.story));
      container.append(story);
    }
    const representative = element("section", "representative-card");
    representative.append(element("h4", "detail-label", "Authorized representative · Demo"));
    representative.append(element("p", "representative-name", profile.representative || "Representative not specified"));
    representative.append(element("p", "representative-role", `${profile.representativeRole || "Company representative"} · Sample role`));
    container.append(representative);
    const contact = element("div", "profile-contact");
    renderProfileContact(profile, contact);
    container.append(contact, fullProfileLink(profile));
    profileActions(profile, container, onConnect);
    if (inDialog && sampleIntroductions[profile.id]) {
      const introductions = element("section", "sample-introductions");
      introductions.append(element("h4", "detail-label", "Suggested sample introductions"));
      introductions.append(element("p", "ownership-note", "Illustrative connections based on the sample capabilities shown."));
      for (const [companyId, reason] of sampleIntroductions[profile.id]) {
        const suggested = resolveProfile(companyId);
        if (!suggested) continue;
        const item = element("div", "introduction-item");
        const button = element("button", "company-link", suggested.name);
        button.type = "button";
        button.addEventListener("click", () => openCompany(suggested));
        item.append(button, element("p", "ownership-note", reason));
        introductions.append(item);
      }
      container.append(introductions);
    }
  }

  function renderProfileContact(profile, container) {
    const website = normalizeWebsite(profile.website);
    if (website) {
      const link = element("a", "profile-contact-link profile-website-link", "Visit website");
      link.href = website;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      container.append(link);
    } else container.append(element("p", "profile-website-note", "Website not added"));
    if (profile.serviceArea) container.append(element("p", "profile-service-area", `Service area: ${profile.serviceArea}`));
    if (profile.publishContact === true) {
      const email = normalizeEmail(profile.publicEmail);
      const phone = normalizePhone(profile.publicPhone);
      if (email) {
        const link = element("a", "profile-contact-link", email);
        link.href = `mailto:${encodeURIComponent(email)}`;
        container.append(link);
      }
      if (phone) {
        const link = element("a", "profile-contact-link", phone);
        link.href = `tel:${phone}`;
        container.append(link);
      }
      if (!email && !phone) container.append(element("p", "profile-website-note", "Public contact details not added"));
    } else container.append(element("p", "profile-website-note", "Public email and phone are not displayed in this preview."));
  }

  function renderFullCompanyProfile() {
    const container = document.getElementById("full-company-profile");
    if (!container) return;
    container.classList.add("full-profile");
    container.replaceChildren();
    const requestedId = new URLSearchParams(window.location.search).get("id");
    const profile = requestedId ? resolveProfile(requestedId) : null;
    if (!profile) {
      const notice = element("section", "profile-not-found");
      notice.append(element("p", "dialog-kicker", "Company preview"), element("h1", "", requestedId ? "This profile is unavailable here." : "Choose a company profile."));
      notice.append(element("p", "dialog-copy", requestedId?.startsWith("local-")
        ? "Local preview profiles are available only in the browser where they were created. This profile is not available in this browser."
        : requestedId ? "This sample company profile could not be found. Explore the directory to choose a company." : "Explore the company directory and open a full profile to see the business, its capabilities, and ways to connect."));
      const directory = element("a", "button button-primary", "Explore company directory");
      directory.href = "index.html#businesses";
      notice.append(directory);
      container.append(notice);
      return;
    }
    document.title = `${profile.name} — BOND company preview`;
    const cover = element("div", "company-cover");
    const coverImage = element("img", "");
    const coverNote = element("p", "company-cover-note", profile.cover ? "Uploaded cover · Local preview" : "Concept cover · Design preview");
    coverImage.src = profile.cover || "assets/expo-hero.png";
    coverImage.alt = profile.cover ? `${profile.name} uploaded cover` : "Concept image for a BOND company profile";
    coverImage.addEventListener("error", () => {
      coverImage.src = "assets/expo-hero.png";
      coverImage.alt = "Concept image for a BOND company profile";
      coverNote.textContent = "Concept cover · Design preview";
    }, { once: true });
    cover.append(coverImage, coverNote);
    const identity = element("div", "profile-identity");
    const brandLogo = element("div", "profile-brand-logo");
    brandLogo.classList.toggle("has-uploaded-logo", Boolean(profile.logo));
    brandLogo.append(companyLogo(profile));
    const identityCopy = element("div", "profile-identity-copy");
    identityCopy.append(element("h1", "", profile.name));
    if (profile.tagline) identityCopy.append(element("p", "profile-tagline", profile.tagline));
    const meta = element("div", "profile-meta");
    meta.append(element("span", "", profile.category), element("span", "", profile.location));
    const ownership = ownershipLabel(profile);
    if (ownership) meta.append(ownership);
    identityCopy.append(meta, element("span", "profile-preview-status", profile.local ? "Local preview · Stored in this browser" : "Sample company · Design preview"));
    identity.append(brandLogo, identityCopy);
    const layout = element("div", "profile-main-layout");
    const content = element("div", "profile-content");
    const section = (title, copy) => {
      const block = element("section", "profile-section");
      block.append(element("h2", "", title));
      if (copy) block.append(element("p", "dialog-copy", copy));
      content.append(block);
      return block;
    };
    section("Company overview", profile.description);
    const services = section("Services & capabilities", profile.services.length ? "" : "Services have not been added to this preview yet.");
    if (profile.services.length) services.append(serviceTags(profile));
    const story = section("Company story", profile.story || "Company history has not been added to this local preview.");
    if (profile.founded) story.append(element("p", "company-founded", `Founded ${profile.founded} · Demo company history`));
    const representative = section("Company representative", "Representative identity and authorization are illustrated as a demo role here.");
    representative.append(element("p", "representative-name", profile.representative || "Representative not added"));
    representative.append(element("p", "representative-role", `${profile.representativeRole || "Company representative"} · Demo`));
    const opportunities = sampleOpportunities.filter((opportunity) => opportunity.companyId === profile.id);
    const opportunitySection = section("Opportunities", opportunities.length ? "Illustrative opportunities connected to this sample company." : "This preview has no opportunity posts for this company.");
    for (const opportunity of opportunities) {
      const card = element("article", "opportunity-card");
      card.append(element("p", "opportunity-type", `${opportunity.type} · Sample opportunity`), element("h3", "", opportunity.title), element("p", "opportunity-copy", opportunity.summary));
      const button = element("button", "company-link", "Explore sample opportunity");
      button.type = "button";
      button.addEventListener("click", () => openOpportunity(opportunity, button));
      card.append(button);
      opportunitySection.append(card);
    }
    const spotlight = section("Business Spotlight", "A planned five-minute camera presentation introduces the company. Audience Q&A, profile-linked replays, and follow-up conversations continue the introduction. This preview shows the replay format as text.");
    const replay = element("button", "button button-secondary", "Explore replay format");
    replay.type = "button";
    replay.addEventListener("click", () => showReplay(profile, replay));
    spotlight.append(replay);
    const side = element("aside", "profile-side");
    const contact = element("section", "profile-contact");
    contact.append(element("h2", "", "Connect with this company"));
    renderProfileContact(profile, contact);
    if (ownership) contact.append(element("p", "ownership-note", "Ownership is self-reported in this preview. Certification status is not provided."));
    const actions = element("div", "profile-page-actions");
    profileActions(profile, actions);
    side.append(contact, actions);
    layout.append(content, side);
    container.append(cover, identity, layout);
  }

  function openCompany(profile, opener) {
    const dialog = document.getElementById("company-dialog");
    renderCompanyDetails(profile, document.getElementById("company-dialog-body"), { inDialog: true });
    showDialog(dialog, opener);
  }

  function renderExpoPanel(profile, initialTab = "profile") {
    const container = document.getElementById("expo-company-info");
    if (!container) return;
    currentExpoProfile = profile;
    container.replaceChildren();
    const header = element("div", "expo-panel-header");
    header.append(element("p", "dialog-kicker", "Sample company · Beside the stage"));
    header.append(element("h3", "dialog-heading", profile.name));
    const tabs = element("div", "expo-panel-tabs");
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", `${profile.name} preview panels`);
    const profileTab = element("button", "expo-panel-tab", "Company profile");
    const messageTab = element("button", "expo-panel-tab", "1:1 demo chat");
    const companyPanel = element("div", "panel-company");
    const messagePanel = element("div", "panel-message");
    const entries = [{ key: "profile", button: profileTab, panel: companyPanel }, { key: "message", button: messageTab, panel: messagePanel }];
    for (const entry of entries) {
      entry.button.type = "button";
      entry.button.dataset.expoPanel = entry.key;
      entry.button.id = `expo-tab-${profile.id}-${entry.key}`;
      entry.button.setAttribute("role", "tab");
      entry.panel.id = `expo-panel-${profile.id}-${entry.key}`;
      entry.panel.setAttribute("role", "tabpanel");
      entry.panel.setAttribute("aria-labelledby", entry.button.id);
      entry.button.setAttribute("aria-controls", entry.panel.id);
    }
    const activateTab = (key, focus = false) => {
      for (const entry of entries) {
        const active = entry.key === key;
        entry.button.setAttribute("aria-selected", String(active));
        entry.button.tabIndex = active ? 0 : -1;
        entry.button.classList.toggle("is-active", active);
        entry.panel.hidden = !active;
        if (active && focus) entry.button.focus();
      }
    };
    for (const [index, entry] of entries.entries()) {
      entry.button.addEventListener("click", () => activateTab(entry.key));
      entry.button.addEventListener("keydown", (event) => {
        let next;
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") next = entries[(index + 1) % entries.length];
        else if (event.key === "Home") next = entries[0];
        else if (event.key === "End") next = entries[entries.length - 1];
        if (next) {
          event.preventDefault();
          activateTab(next.key, true);
        }
      });
    }
    renderCompanyDetails(profile, companyPanel, {
      showHeading: false,
      onConnect: () => {
        activateTab("message");
        messagePanel.querySelector("textarea")?.focus();
      },
    });
    renderChat(profile, messagePanel);
    tabs.append(profileTab, messageTab);
    container.append(header, tabs, companyPanel, messagePanel);
    activateTab(initialTab);
  }

  function renderOpportunities() {
    const grid = document.getElementById("opportunity-grid");
    if (!grid) return;
    const cards = document.createDocumentFragment();
    const visible = sampleOpportunities.filter((opportunity) => currentOpportunityFilter === "All" || opportunity.type === currentOpportunityFilter);
    for (const opportunity of visible) {
      const profile = resolveProfile(opportunity.companyId);
      if (!profile) continue;
      const card = element("article", "opportunity-card");
      const title = element("h3", "", opportunity.title);
      title.id = `opportunity-${opportunity.id}`;
      card.setAttribute("aria-labelledby", title.id);
      const thumbnail = element("img", `opportunity-thumbnail opportunity-thumbnail-${opportunity.type.toLowerCase()}`);
      thumbnail.src = opportunity.type === "Partner" ? "assets/networking.png" : "assets/collaboration.png";
      thumbnail.alt = "";
      thumbnail.width = 720;
      thumbnail.height = 480;
      thumbnail.loading = "lazy";
      thumbnail.decoding = "async";
      card.append(thumbnail);
      card.append(element("p", "opportunity-type", `${opportunity.type} · Sample opportunity`));
      card.append(title, element("p", "opportunity-company", profile.name));
      card.append(element("p", "opportunity-copy", opportunity.summary));
      const view = element("button", "company-link", "View sample opportunity");
      view.type = "button";
      view.addEventListener("click", () => openOpportunity(opportunity, view));
      card.append(view);
      cards.append(card);
    }
    grid.replaceChildren(cards);
    document.querySelectorAll("[data-opportunity-filter]").forEach((button) => {
      const active = button.dataset.opportunityFilter === currentOpportunityFilter;
      button.classList.toggle("is-active", active);
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const status = document.getElementById("opportunity-status");
    if (status) status.textContent = `Showing ${visible.length} of ${sampleOpportunities.length} sample opportunities.`;
  }

  function openOpportunity(opportunity, opener) {
    const dialog = document.getElementById("company-dialog");
    const body = document.getElementById("company-dialog-body");
    const profile = resolveProfile(opportunity.companyId);
    if (!dialog || !body || !profile) return;
    body.replaceChildren();
    body.append(element("p", "dialog-kicker", `${opportunity.type} · Sample opportunity`));
    const title = element("h2", "dialog-heading", opportunity.title);
    title.id = "company-dialog-title";
    dialog.setAttribute("aria-labelledby", title.id);
    body.append(title, element("p", "opportunity-company", profile.name));
    body.append(element("p", "dialog-copy", opportunity.detail));
    const scope = element("ul", "opportunity-scope");
    for (const item of opportunity.scope) scope.append(element("li", "", item));
    body.append(element("h3", "detail-label", "Sample discussion areas"), scope);
    body.append(element("p", "ownership-note", "Design preview only. This fictional opportunity is not an active solicitation."));
    const contact = element("button", "button button-primary", "Explore this company");
    contact.type = "button";
    contact.addEventListener("click", () => openCompany(profile, opener));
    body.append(contact);
    showDialog(dialog, opener);
  }

  function showReplay(profile, opener) {
    const dialog = document.getElementById("company-dialog");
    const body = document.getElementById("company-dialog-body");
    if (!dialog || !body || !profile) return;
    body.replaceChildren();
    body.append(element("p", "dialog-kicker", "Sample replay overview"));
    const title = element("h2", "dialog-heading", `${profile.name}: Business Spotlight`);
    title.id = "company-dialog-title";
    dialog.setAttribute("aria-labelledby", title.id);
    body.append(title);
    body.append(element("p", "dialog-copy", "Explore the outline of a sample five-minute camera presentation and follow-up Q&A. This design preview contains a text overview; recorded video is planned for launch."));
    const outline = element("ol", "spotlight-outline");
    outline.append(
      element("li", "", "00:00 — Company introduction and story."),
      element("li", "", "01:00 — Services, capabilities, and collaboration interests."),
      element("li", "", "04:00 — Invitation to open the company profile and connect."),
      element("li", "", "After the spotlight — Audience Q&A and follow-up conversations."),
    );
    body.append(outline);
    body.append(element("p", "dialog-copy", "The planned replay stays connected to the company profile so visitors can discover the business and continue a conversation after the expo."));
    const company = element("button", "button button-primary", "Open sample company profile");
    company.type = "button";
    company.addEventListener("click", () => openCompany(profile, opener));
    body.append(company);
    showDialog(dialog, opener);
  }

  function showSpotlight(opener) {
    const dialog = document.getElementById("company-dialog");
    const body = document.getElementById("company-dialog-body");
    if (!dialog || !body) return;
    body.replaceChildren();
    body.append(element("p", "dialog-kicker", "Business Spotlight · Design preview"));
    const title = element("h2", "dialog-heading", "Five minutes. Your business in focus.");
    title.id = "company-dialog-title";
    dialog.setAttribute("aria-labelledby", title.id);
    body.append(title);
    body.append(element("p", "dialog-copy", "BOND’s planned Business Spotlight gives an authorized company representative five minutes on camera to introduce the business, its story, and its capabilities. Visitors can explore company profiles and a 1:1 conversation beside the presentation."));
    body.append(element("p", "dialog-copy", "This is a sample presentation format. Camera streaming, follow-up audience Q&A, and recorded replays are planned for launch. The company profiles and local demo conversations can be explored in this preview."));
    body.append(element("h3", "detail-label", "A sample five-minute outline"));
    const outline = element("ol", "spotlight-outline");
    outline.append(
      element("li", "", "Minute 1: Introduce your company and the problem you solve."),
      element("li", "", "Minutes 2–4: Present your services, capabilities, or work."),
      element("li", "", "Minute 5: Invite visitors to connect and continue the conversation."),
      element("li", "", "After the five-minute spotlight: Open audience Q&A and keep the company profile available for follow-up."),
    );
    body.append(outline);
    const button = element("button", "button button-primary", "Try a company profile");
    button.type = "button";
    button.addEventListener("click", () => {
      dialog.close();
      openJoin(opener);
    });
    body.append(button);
    showDialog(dialog, opener);
  }

  function openJoin(opener) {
    showDialog(document.getElementById("join-dialog"), opener);
  }

  function resolveProfile(value) {
    const key = String(value || "").trim().toLocaleLowerCase();
    return profiles.find((profile) => profile.id === key || profile.name.toLocaleLowerCase() === key || profile.name.toLocaleLowerCase().replace(/\s+/g, "-") === key);
  }

  function announce(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add("is-visible");
    toastTimer = setTimeout(() => {
      toast.classList.remove("is-visible");
      toast.hidden = true;
    }, 5500);
  }

  function setFormMessage(message, error = false) {
    const status = document.getElementById("join-success");
    if (!status) return;
    status.hidden = false;
    status.textContent = message;
    status.classList.toggle("is-error", error);
    status.classList.toggle("is-success", !error);
    status.setAttribute("role", error ? "alert" : "status");
  }

  function configureProfileUploads(form) {
    let version = 0;
    let submitting = false;
    const states = Object.create(null);
    const submitButtons = [...form.querySelectorAll("button[type=submit], input[type=submit]")];
    const initiallyDisabled = new Map(submitButtons.map((button) => [button, button.disabled]));
    const status = document.getElementById("profile-upload-status");
    function updateStatus() {
      const pending = Object.values(states).some((state) => state.pending);
      const errors = Object.values(states).map((state) => state.error).filter(Boolean);
      const loaded = Object.values(states).filter((state) => state.dataUrl).length;
      const message = errors[0] || (pending ? "Loading company images…" : loaded ? "Image previews ready. Uploads stay in this browser." : "");
      if (status) {
        status.textContent = message;
        status.hidden = !message;
      }
      for (const button of submitButtons) button.disabled = initiallyDisabled.get(button) || submitting || pending;
      form.setAttribute("aria-busy", String(submitting || pending));
    }
    function queue(kind) {
      const state = states[kind];
      if (!state) return Promise.resolve("");
      const file = state.input.files?.[0] || null;
      const token = ++state.token;
      state.file = file;
      state.dataUrl = "";
      state.error = "";
      state.pending = Boolean(file);
      state.input.setCustomValidity("");
      state.preview?.replaceChildren();
      updateStatus();
      state.promise = readImageFile(file).then((dataUrl) => {
        if (state.token === token) {
          state.dataUrl = dataUrl;
          if (dataUrl && state.preview) {
            const image = element("img", "upload-preview-image");
            image.src = dataUrl;
            image.alt = `${kind === "logo" ? "Company logo" : "Company cover"} upload preview`;
            state.preview.replaceChildren(image);
          }
        }
        return dataUrl;
      }, (error) => {
        if (state.token === token) {
          state.error = `${kind === "logo" ? "Logo" : "Cover"}: ${error.message}`;
          state.input.setCustomValidity(error.message);
          const details = state.input.closest(".profile-form-details");
          if (details) details.open = true;
        }
        throw error;
      }).finally(() => {
        if (state.token === token) {
          state.pending = false;
          updateStatus();
        }
      });
      state.promise.catch(() => {});
      return state.promise;
    }
    for (const kind of ["logo", "cover"]) {
      const input = form.elements.namedItem(kind);
      if (!input || input.type !== "file") continue;
      states[kind] = { input, preview: document.getElementById(`${kind}-upload-preview`), token: 0, file: null, dataUrl: "", error: "", pending: false, promise: null };
      input.addEventListener("change", () => queue(kind));
    }
    form.addEventListener("input", (event) => {
      version++;
      if (["website", "publicEmail", "publicPhone"].includes(event.target.name)) event.target.setCustomValidity("");
    });
    form.addEventListener("change", () => version++);
    form.addEventListener("invalid", (event) => {
      const details = event.target.closest(".profile-form-details");
      if (details) details.open = true;
    }, true);
    form.addEventListener("reset", () => {
      version++;
      for (const state of Object.values(states)) {
        state.token++;
        state.file = null;
        state.dataUrl = "";
        state.promise = null;
        state.error = "";
        state.pending = false;
        state.input.setCustomValidity("");
        state.preview?.replaceChildren();
      }
      for (const fieldName of ["website", "publicEmail", "publicPhone"]) form.elements.namedItem(fieldName)?.setCustomValidity("");
      updateStatus();
    });
    return {
      version: () => version,
      busy: () => submitting,
      setSubmitting: (value) => { submitting = value; updateStatus(); },
      prepare: async () => {
        const images = await Promise.all(["logo", "cover"].map((kind) => {
          const state = states[kind];
          if (!state) return "";
          const file = state.input.files?.[0] || null;
          return state.file === file && state.promise ? state.promise : queue(kind);
        }));
        return { logo: images[0], cover: images[1] };
      },
    };
  }

  function invalidProfileField(form, name, message) {
    const field = form.elements.namedItem(name);
    field?.setCustomValidity(message);
    const details = field?.closest(".profile-form-details");
    if (details) details.open = true;
    field?.reportValidity();
    setFormMessage(message, true);
  }

  function setup() {
    const requestedIndustry = new URLSearchParams(window.location.search).get("industry");
    if (categories.includes(requestedIndustry)) currentFilter = requestedIndustry;
    const menuToggle = document.getElementById("menu-toggle");
    const nav = document.getElementById("nav-links");
    const closeMenu = () => {
      if (!menuToggle || !nav) return;
      menuToggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    };
    if (menuToggle && nav) {
      menuToggle.setAttribute("aria-controls", "nav-links");
      menuToggle.addEventListener("click", () => {
        const expanded = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", String(!expanded));
        nav.classList.toggle("is-open", !expanded);
      });
      nav.querySelectorAll("a, [data-open-join]").forEach((link) => link.addEventListener("click", closeMenu));
      document.addEventListener("click", (event) => {
        if (!menuToggle.contains(event.target) && !nav.contains(event.target)) closeMenu();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true" && !document.querySelector("dialog[open]")) {
          closeMenu();
          menuToggle.focus();
        }
      });
    }

    document.getElementById("home-search")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const search = document.getElementById("directory-search");
      if (search) search.value = cleanText(document.getElementById("home-search-input")?.value, 80);
      currentFilter = "All";
      showDirectory();
    });
    document.querySelectorAll("[data-industry-jump]").forEach((link) => {
      link.addEventListener("click", (event) => {
        const next = link.dataset.industryJump;
        if (!categories.includes(next)) return;
        event.preventDefault();
        currentFilter = next;
        showDirectory();
      });
    });
    document.getElementById("directory-search")?.addEventListener("input", renderDirectory);
    document.getElementById("directory-location")?.addEventListener("change", renderDirectory);
    document.getElementById("directory-ownership")?.addEventListener("change", renderDirectory);
    document.querySelectorAll(".filter-btn[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = button.dataset.filter;
        if (next === "All" || categories.includes(next)) {
          currentFilter = next;
          renderDirectory();
        }
      });
    });

    document.querySelectorAll("[data-open-join]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        closeMenu();
        openJoin(button);
      });
    });

    document.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => button.closest("dialog")?.close());
    });
    document.querySelectorAll("dialog").forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
      });
      dialog.addEventListener("close", () => {
        const opener = dialogOpeners.get(dialog);
        if (!document.querySelector("dialog[open]") && opener?.isConnected && typeof opener.focus === "function") opener.focus();
      });
    });

    const expoButtons = [...document.querySelectorAll("[data-expo-company], #expo-tabs [data-company]")];
    expoButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const profile = resolveProfile(button.dataset.expoCompany || button.dataset.company);
        if (!profile) return;
        for (const tab of expoButtons) {
          const active = tab === button;
          tab.classList.toggle("is-active", active);
          tab.classList.toggle("active", active);
          tab.setAttribute(tab.getAttribute("role") === "tab" ? "aria-selected" : "aria-pressed", String(active));
        }
        renderExpoPanel(profile);
      });
    });
    const firstExpoProfile = expoButtons.length ? resolveProfile(expoButtons[0].dataset.expoCompany || expoButtons[0].dataset.company) : sampleProfiles[0];
    if (firstExpoProfile) renderExpoPanel(firstExpoProfile);
    document.getElementById("expo-preview")?.addEventListener("click", (event) => showSpotlight(event.currentTarget));
    document.querySelectorAll("[data-replay], button#expo-replay").forEach((button) => {
      button.addEventListener("click", () => showReplay(resolveProfile(button.dataset.replay) || currentExpoProfile, button));
    });
    document.querySelectorAll("[data-opportunity-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = button.dataset.opportunityFilter;
        if (["All", "Partner", "Service", "Collaboration"].includes(next)) {
          currentOpportunityFilter = next;
          renderOpportunities();
        }
      });
    });

    const form = document.getElementById("join-form");
    const uploads = form ? configureProfileUploads(form) : null;
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (uploads.busy()) return;
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const name = cleanText(data.get("company"), 80);
      const category = cleanText(data.get("industry"), 40);
      const location = cleanText(data.get("location"), 100) || "Location not added";
      const description = cleanText(data.get("description"), 500);
      const representative = cleanText(data.get("representative"), 80);
      const selectedOwnership = cleanText(data.get("ownership"), 40);
      const ownership = ownershipOptions.includes(selectedOwnership) ? selectedOwnership : "Not specified";
      if (!name || !description || !categories.includes(category)) {
        setFormMessage("Enter a company name, industry, and short description to try a sample profile.", true);
        return;
      }
      const websiteInput = cleanText(data.get("website"), 2048);
      const website = normalizeWebsite(websiteInput);
      const emailInput = cleanText(data.get("publicEmail"), 160);
      const publicEmail = normalizeEmail(emailInput);
      const phoneInput = cleanText(data.get("publicPhone"), 40);
      const publicPhone = normalizePhone(phoneInput);
      if (websiteInput && !website) { invalidProfileField(form, "website", "Use an http:// or https:// website address without embedded login details."); return; }
      if (emailInput && !publicEmail) { invalidProfileField(form, "publicEmail", "Enter a valid public business email address."); return; }
      if (phoneInput && !publicPhone) { invalidProfileField(form, "publicPhone", "Enter a phone number with 7–15 digits and an optional leading +."); return; }
      const submittedVersion = uploads.version();
      uploads.setSubmitting(true);
      try {
      const images = await uploads.prepare();
      if (submittedVersion !== uploads.version()) return;
      const createdProfile = {
        id: newProfileId(), name, category, location, description, representative,
        representativeRole: "Company representative", ownership, local: true,
        tagline: cleanText(data.get("tagline"), 100), services: parseServices(data.get("services")),
        story: cleanText(data.get("story"), 1200),
        serviceArea: cleanText(data.get("serviceArea"), 150), website,
        publicEmail, publicPhone, publishContact: data.has("publishContact"), ...images,
      };
      profiles.push(createdProfile);
      const saved = saveLocalProfiles();
      currentFilter = "All";
      const search = document.getElementById("directory-search");
      if (search) search.value = "";
      const locationFilter = document.getElementById("directory-location");
      const ownershipFilter = document.getElementById("directory-ownership");
      if (locationFilter) locationFilter.value = "All";
      if (ownershipFilter) ownershipFilter.value = "All";
      renderDirectory();
      form.reset();
      const hasDirectory = Boolean(document.getElementById("company-grid"));
      setFormMessage(saved
        ? `${name} is now a sample profile in this browser. ${hasDirectory ? "Close this preview to find it in the directory." : "Open the company directory below to find it."} This does not register a BOND account.`
        : `${name} is now a sample profile for this visit. Browser storage is unavailable, so it will not persist after this visit. This does not register a BOND account.`);
      if (!hasDirectory) {
        const status = document.getElementById("join-success");
        if (status && saved) {
          const directoryLink = element("a", "company-link profile-directory-link", "Open the company directory");
          directoryLink.href = "index.html#businesses";
          status.append(directoryLink);
        } else if (status) {
          const viewProfile = element("button", "company-link", "View your sample profile");
          viewProfile.type = "button";
          viewProfile.addEventListener("click", () => {
            const joinDialog = document.getElementById("join-dialog");
            const originalOpener = joinDialog ? dialogOpeners.get(joinDialog) : null;
            joinDialog?.close();
            openCompany(createdProfile, originalOpener);
          });
          status.append(viewProfile);
        }
      }
      const success = document.getElementById("join-success");
      if (success && saved) success.append(fullProfileLink(createdProfile));
      announce("Your local sample company profile is ready.");
      } catch (error) {
        if (submittedVersion === uploads.version()) {
          setFormMessage(error.message || "The profile images could not be prepared. Choose another file.", true);
          form.reportValidity();
        }
      } finally {
        uploads.setSubmitting(false);
      }
    });

    renderDirectory();
    renderFeatured();
    renderOpportunities();
    renderFullCompanyProfile();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();
