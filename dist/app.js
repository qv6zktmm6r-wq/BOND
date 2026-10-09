(() => {
  "use strict";

  const STORAGE_KEY = "bond.demo.profiles";
  const MESSAGES_KEY = "bond.demo.messages";
  const SAVED_KEY = "bond.demo.saved";
  const MEETINGS_KEY = "bond.demo.meetings";
  const QUESTIONS_KEY = "bond.demo.questions";
  const INTROS_KEY = "bond.demo.intros";
  const MAX_UPLOAD_BYTES = 1024 * 1024;
  const MAX_IMAGE_DATA_URL_LENGTH = 1.5 * 1024 * 1024;
  const MAX_PROFILE_STORAGE_LENGTH = 6 * 1024 * 1024;
  const MEDIA_DB_NAME = "bond-demo-media";
  const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
  const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
  const MAX_VIDEO_SECONDS = 30;
  const MAX_PROJECT_PHOTOS = 3;
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

  const sampleShowcase = {
    nova: {
      certifications: ["DOT-registered motor carrier", "Hazardous materials handling training"],
      projects: [["Regional distribution launch", "Dock scheduling and same-day routes for a growing retailer.", "assets/project-nova.jpg"], ["Job-site delivery program", "Material deliveries coordinated across multi-site builds.", "assets/industry-logistics.jpg"]],
    },
    helix: {
      certifications: ["NABCEP PV installation professional", "LEED Green Associate"],
      projects: [["Warehouse rooftop solar", "Planning and installation oversight for a commercial rooftop array.", "assets/project-helix.jpg"], ["Facility efficiency review", "Energy use assessment with a phased upgrade plan.", "assets/industry-energy.jpg"]],
    },
    creston: {
      certifications: ["PMP-certified program managers", "Lean Six Sigma Green Belt"],
      projects: [["Program kickoff workshop", "Turned a multi-team plan into a shared delivery timeline.", "assets/project-creston.jpg"], ["Operations process redesign", "Mapped and simplified a client's order-to-delivery process.", "assets/collaboration.png"]],
    },
    lumen: {
      certifications: ["SOC 2 Type II (in progress)", "AWS Partner"],
      projects: [["Fleet operations dashboard", "Live map and reporting wall for a dispatch team.", "assets/project-lumen.jpg"], ["Workflow automation rollout", "Replaced spreadsheet handoffs with an approval workflow.", "assets/industry-software.jpg"]],
    },
    aero: {
      certifications: ["AS9100 quality management", "ITAR registration"],
      projects: [["Satellite subassembly integration", "Harness routing and connector integration on a test stand.", "assets/project-aero.jpg"], ["Hangar test support", "Engineering support during ground testing.", "assets/industry-aerospace.jpg"]],
    },
    fieldstone: {
      certifications: ["California general contractor license (Class B)", "OSHA 30 construction safety"],
      projects: [["Two-story office building", "Ground-up commercial build with a glass storefront.", "assets/project-fieldstone.jpg"], ["Site planning and coordination", "Phased site work coordinated with engineering partners.", "assets/industry-construction.jpg"]],
    },
    vector: {
      certifications: ["Licensed Professional Engineers (PE) on staff", "ISO 9001 quality management"],
      projects: [["Pedestrian truss bridge", "Structural design support for a park crossing.", "assets/project-vector.jpg"], ["Design review program", "Technical consulting across a multi-phase build.", "assets/industry-engineering.jpg"]],
    },
    forge: {
      certifications: ["ISO 9001 quality management", "AS9100 (in progress)"],
      projects: [["Precision bracket run", "CNC-machined aluminum brackets from prototype to production.", "assets/project-forge.jpg"], ["Prototype fabrication", "Short-run prototypes for design validation.", "assets/industry-manufacturing.jpg"]],
    },
  };
  for (const profile of sampleProfiles) {
    const showcase = sampleShowcase[profile.id];
    profile.certifications = showcase ? showcase.certifications : [];
    profile.projects = showcase ? showcase.projects.map(([title, summary, image]) => ({ title, summary, image })) : [];
  }

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

  const matchRelations = {
    "Aerospace & Defense": [["Engineering", "Partner", "Design and analysis support for programs"], ["Manufacturing", "Supplier", "Precision parts and prototypes"], ["Technology", "Supplier", "Software and data systems for programs"], ["Logistics", "Supplier", "Parts shipping and distribution"], ["Professional services", "Teaming", "Program management on larger bids"], ["Construction", "Supplier", "Facilities, hangars, and test sites"], ["Energy", "Partner", "Power and efficiency systems"]],
    Construction: [["Engineering", "Partner", "Design support for bids and builds"], ["Manufacturing", "Supplier", "Fabricated components and materials"], ["Logistics", "Supplier", "Material delivery and site logistics"], ["Energy", "Customer", "Energy projects need construction delivery"], ["Aerospace & Defense", "Customer", "Facilities and hangar construction"], ["Professional services", "Teaming", "Program management on larger bids"], ["Technology", "Supplier", "Project tracking and field software"]],
    Engineering: [["Construction", "Customer", "Builders need design and engineering support"], ["Aerospace & Defense", "Customer", "Programs need engineering support"], ["Manufacturing", "Partner", "Design for manufacturing and prototyping"], ["Energy", "Customer", "Energy projects need engineering"], ["Technology", "Supplier", "Modeling and analysis software"], ["Professional services", "Teaming", "Joint proposals on larger programs"]],
    Manufacturing: [["Engineering", "Partner", "Designs ready for production"], ["Aerospace & Defense", "Customer", "Precision parts for aerospace programs"], ["Construction", "Customer", "Fabricated components for builds"], ["Logistics", "Supplier", "Shipping and distribution of finished goods"], ["Energy", "Customer", "Components for energy systems"], ["Technology", "Supplier", "Production planning and automation software"]],
    Technology: [["Logistics", "Customer", "Fleet and operations software needs"], ["Manufacturing", "Customer", "Production planning and automation"], ["Construction", "Customer", "Field and project software"], ["Professional services", "Partner", "Process design for software rollouts"], ["Energy", "Customer", "Monitoring and reporting dashboards"], ["Aerospace & Defense", "Customer", "Data systems for programs"], ["Engineering", "Partner", "Technical integrations"]],
    Logistics: [["Technology", "Supplier", "Dispatch, tracking, and reporting software"], ["Manufacturing", "Customer", "Moving finished goods"], ["Construction", "Customer", "Material delivery to job sites"], ["Professional services", "Supplier", "Operations and process improvement"], ["Energy", "Customer", "Equipment transport for energy projects"], ["Aerospace & Defense", "Customer", "Parts distribution"]],
    Energy: [["Engineering", "Partner", "Engineering for energy systems"], ["Construction", "Partner", "Installation and site work"], ["Manufacturing", "Supplier", "Components and equipment"], ["Logistics", "Supplier", "Equipment transport"], ["Technology", "Supplier", "Monitoring and reporting dashboards"], ["Professional services", "Teaming", "Program delivery on larger projects"]],
    "Professional services": [["Construction", "Customer", "Program management for construction delivery"], ["Logistics", "Customer", "Operations and process improvement"], ["Technology", "Partner", "Digital tools for client programs"], ["Engineering", "Teaming", "Joint proposals on larger programs"], ["Energy", "Customer", "Program delivery for energy projects"], ["Aerospace & Defense", "Customer", "Program and compliance support"], ["Manufacturing", "Customer", "Process improvement on the shop floor"]],
  };
  const matchTypes = { Customer: "Potential customer", Partner: "Partner", Supplier: "Supplier", Teaming: "Teaming partner" };
  const matchWeights = { Customer: 3, Partner: 3, Supplier: 2, Teaming: 2 };
  const matchStopwords = new Set(["sample", "company", "companies", "business", "businesses", "service", "services", "support", "focused", "introducing", "capabilities", "capability", "across", "their", "with", "that", "this", "from", "into", "offering", "connecting", "presenting", "showing", "bringing", "everyday", "ideas", "network", "teams", "team", "work", "help", "helping", "movement", "goods", "general"]);

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
  const introRequests = new Set(readStoredIds(INTROS_KEY));
  const messagesByCompany = readSavedMessages();
  const questionsByCompany = readSavedMessages(QUESTIONS_KEY);
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

  function parseList(value, limit, maxLength, separator = ",") {
    const entries = Array.isArray(value) ? value : typeof value === "string" ? value.split(separator) : [];
    const items = [];
    const seen = new Set();
    for (const entry of entries) {
      const item = cleanText(entry, maxLength);
      if (!item || seen.has(item.toLocaleLowerCase())) continue;
      seen.add(item.toLocaleLowerCase());
      items.push(item);
      if (items.length === limit) break;
    }
    return items;
  }

  function parseServices(value) {
    return parseList(value, 6, 60);
  }

  function parseCertifications(value) {
    return parseList(value, 6, 80);
  }

  function parseProjects(value) {
    const titles = Array.isArray(value) ? value.map((project) => typeof project === "string" ? project : project?.title) : value;
    return parseList(titles, 3, 100, "\n").map((title) => ({ title, summary: "", image: "" }));
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

  function readVideoFile(file) {
    if (!file) return Promise.resolve(null);
    if (!VIDEO_TYPES.includes(file.type)) return Promise.reject(new Error("Choose an MP4, WebM, or MOV video."));
    if (!file.size || file.size > MAX_VIDEO_BYTES) return Promise.reject(new Error("Choose a video no larger than 30 MB."));
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      const finish = (callback) => {
        video.onloadedmetadata = null;
        video.onerror = null;
        URL.revokeObjectURL(url);
        callback();
      };
      video.preload = "metadata";
      video.muted = true;
      video.onloadedmetadata = () => {
        const { duration, videoWidth } = video;
        if (!videoWidth) finish(() => reject(new Error("This file has no picture. Choose a video file.")));
        else if (!Number.isFinite(duration) || duration > MAX_VIDEO_SECONDS + 0.5) finish(() => reject(new Error("Keep your introduction video to 30 seconds or less.")));
        else finish(() => resolve({ blob: file, seconds: duration }));
      };
      video.onerror = () => finish(() => reject(new Error("This video could not be played in this browser. Try an MP4 file.")));
      video.src = url;
    });
  }

  function mediaRequest(mode, action) {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("Browser media storage is unavailable."));
        return;
      }
      const open = indexedDB.open(MEDIA_DB_NAME, 1);
      open.onupgradeneeded = () => open.result.createObjectStore("media");
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const transaction = db.transaction("media", mode);
        const request = action(transaction.objectStore("media"));
        transaction.oncomplete = () => { db.close(); resolve(request.result); };
        transaction.onerror = transaction.onabort = () => { db.close(); reject(transaction.error); };
      };
    });
  }

  function saveProfileMedia(id, media) {
    return mediaRequest("readwrite", (store) => store.put(media, id));
  }

  async function readProfileMedia(profile) {
    if (!profile.local) return { video: null, photos: [] };
    const stored = await mediaRequest("readonly", (store) => store.get(profile.id)).catch(() => null);
    const video = stored?.video instanceof Blob && VIDEO_TYPES.includes(stored.video.type) && stored.video.size <= MAX_VIDEO_BYTES ? stored.video : null;
    const photos = Array.isArray(stored?.photos) ? stored.photos.map(normalizeImageDataUrl).filter(Boolean).slice(0, MAX_PROJECT_PHOTOS) : [];
    return { video, photos };
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
          certifications: parseCertifications(profile.certifications), projects: parseProjects(profile.projects),
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
      certifications: profile.certifications || [],
      projects: (profile.projects || []).map((project) => project.title),
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

  function readSavedMessages(key = MESSAGES_KEY) {
    const result = Object.create(null);
    const stored = readStoredValue(key);
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
      const searchText = [profile.name, profile.category, profile.location, profile.description, profile.tagline || "", profile.serviceArea || "", profile.story || "", profile.representative || "", profile.ownership || "", ...profile.services, ...(profile.certifications || [])].join(" ").toLocaleLowerCase();
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

  const boothPresence = { nova: "presenting", aero: "available", vector: "available", lumen: "available", fieldstone: "available", forge: "available", helix: "away", creston: "away" };
  const presenceLabels = { presenting: "Premiering on the main stage", available: "Representative available", away: "Representative away" };
  let currentFloorFilter = "All";

  function boothNumber(profile) {
    return `B-${String(profiles.indexOf(profile) + 1).padStart(2, "0")}`;
  }

  function presenceOf(profile) {
    return boothPresence[profile.id] || "away";
  }

  function presenceBadge(profile) {
    const presence = presenceOf(profile);
    const badge = element("span", "booth-presence", presenceLabels[presence]);
    badge.dataset.presence = presence;
    return badge;
  }

  function renderExpoFloor() {
    const grid = document.getElementById("floor-booths");
    if (!grid) return;
    const filters = document.getElementById("floor-filters");
    if (filters && !filters.childElementCount) {
      const halls = ["All", ...categories.filter((category) => profiles.some((profile) => profile.category === category))];
      for (const hall of halls) {
        const button = element("button", "filter-btn", hall === "All" ? "All halls" : hall);
        button.type = "button";
        button.dataset.floorFilter = hall;
        button.addEventListener("click", () => {
          currentFloorFilter = hall;
          renderExpoFloor();
        });
        filters.append(button);
      }
    }
    filters?.querySelectorAll("[data-floor-filter]").forEach((button) => {
      const active = button.dataset.floorFilter === currentFloorFilter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const visible = profiles.filter((profile) => currentFloorFilter === "All" || profile.category === currentFloorFilter);
    const content = document.createDocumentFragment();
    for (const profile of visible) {
      const booth = element("button", "booth");
      booth.type = "button";
      booth.dataset.presence = presenceOf(profile);
      booth.setAttribute("aria-label", `Enter ${profile.name} booth ${boothNumber(profile)}, ${profile.category}, ${presenceLabels[presenceOf(profile)]}`);
      const logo = element("span", "company-avatar booth-logo");
      logo.classList.toggle("has-uploaded-logo", Boolean(profile.logo));
      logo.append(companyLogo(profile));
      booth.append(element("span", "booth-number", profile.local ? `${boothNumber(profile)} · Your booth` : boothNumber(profile)), logo, element("strong", "booth-name", profile.name), element("span", "booth-category", profile.category), presenceBadge(profile));
      booth.addEventListener("click", () => openBooth(profile, booth));
      content.append(booth);
    }
    grid.replaceChildren(content);
    const available = visible.filter((profile) => presenceOf(profile) !== "away").length;
    const status = document.getElementById("floor-status");
    if (status) status.textContent = `${visible.length} ${visible.length === 1 ? "booth" : "booths"} · ${available} with a representative on the floor.`;
  }

  function openBooth(profile, opener) {
    const dialog = document.getElementById("company-dialog");
    const body = document.getElementById("company-dialog-body");
    if (!dialog || !body) return;
    body.replaceChildren();
    body.append(element("p", "dialog-kicker", `Booth ${boothNumber(profile)} · ${profile.local ? "Your local preview" : "Sample company"}`));
    const title = element("h2", "dialog-heading", profile.name);
    title.id = "company-dialog-title";
    dialog.setAttribute("aria-labelledby", title.id);
    body.append(title, element("p", "company-category", profile.category));
    if (profile.tagline) body.append(element("p", "profile-tagline", profile.tagline));
    const video = element("figure", "booth-video");
    const poster = element("img");
    poster.src = profile.cover || industryImages[profile.category] || "assets/expo-hero.png";
    poster.alt = "";
    const play = element("button", "play-button booth-play");
    play.type = "button";
    play.setAttribute("aria-label", `Play ${profile.name} 30-second introduction`);
    const playIcon = element("span", "", "▶");
    playIcon.setAttribute("aria-hidden", "true");
    play.append(playIcon);
    const caption = element("figcaption", "", "30-second introduction");
    play.addEventListener("click", () => {
      caption.textContent = "This booth has no introduction video yet. Companies will upload a 30-second video when BOND launches.";
      caption.classList.add("is-note");
      play.remove();
      caption.setAttribute("tabindex", "-1");
      caption.focus();
    });
    video.append(poster, play, caption);
    body.append(video, element("p", "dialog-copy", profile.description));
    const rep = element("section", "booth-rep");
    rep.append(element("h3", "detail-label", "In the booth"), element("p", "representative-name", profile.representative || "Company representative"), element("p", "representative-role", `${profile.representativeRole || "Company representative"} · Sample role`), presenceBadge(profile));
    body.append(rep);
    if (presenceOf(profile) === "presenting" && document.getElementById("experience")) {
      const watch = element("button", "button button-secondary booth-watch", "Watch on the main stage");
      watch.type = "button";
      watch.addEventListener("click", () => {
        dialog.close();
        renderExpoPanel(profile);
        document.getElementById("experience").scrollIntoView({ block: "start" });
      });
      body.append(watch);
    }
    profileActions(profile, body);
    body.append(fullProfileLink(profile));
    showDialog(dialog, opener);
  }

  function matchTerms(profile) {
    const text = [profile.description, profile.tagline || "", ...profile.services].join(" ").toLocaleLowerCase();
    const terms = new Set();
    for (const word of text.split(/[^a-z]+/)) {
      if (word.length < 4 || matchStopwords.has(word)) continue;
      terms.add(word.endsWith("s") && word.length > 4 ? word.slice(0, -1) : word);
    }
    return terms;
  }

  function cityOf(profile) {
    return (profile.location || "").split(",")[0].trim().toLocaleLowerCase();
  }

  function findMatches(profile) {
    const ownTerms = matchTerms(profile);
    const relations = matchRelations[profile.category] || [];
    const results = [];
    for (const candidate of profiles) {
      if (candidate.id === profile.id) continue;
      const sameIndustry = candidate.category === profile.category && profile.category !== "Other industry";
      const relation = sameIndustry
        ? [candidate.category, "Teaming", "Same industry: subcontracting or teaming on larger bids"]
        : relations.find(([category]) => category === candidate.category);
      const candidateTerms = matchTerms(candidate);
      const shared = sameIndustry ? [] : [...ownTerms].filter((term) => candidateTerms.has(term)).slice(0, 3);
      if (!relation && !shared.length) continue;
      const type = relation ? relation[1] : "Partner";
      const reasons = [relation ? relation[2] : "Overlapping capabilities"];
      if (shared.length) reasons.push(`Shared focus: ${shared.join(", ")}`);
      const sameCity = cityOf(profile) && cityOf(profile) === cityOf(candidate);
      if (sameCity) reasons.push(`Both based in ${candidate.location.split(",")[0]}`);
      const score = (relation ? matchWeights[type] : 1) + shared.length * 1.5 + (sameCity ? 1 : 0);
      results.push({ profile: candidate, type, reasons, score });
    }
    return results.sort((a, b) => b.score - a.score || a.profile.name.localeCompare(b.profile.name));
  }

  function matchStrength(score) {
    return score >= 5 ? "Strong match" : score >= 3 ? "Good match" : "Possible match";
  }

  function renderMatchList(profile, container, { limit = 6, compact = false } = {}) {
    const matches = findMatches(profile).slice(0, limit);
    if (!matches.length) {
      container.append(element("p", "ownership-note", "No matches yet. Add services and an industry to get suggestions."));
      return;
    }
    const list = element(compact ? "ul" : "div", compact ? "match-list match-list-compact" : "match-grid");
    for (const match of matches) {
      const item = element(compact ? "li" : "article", "match-card");
      const head = element("div", "match-head");
      const logo = element("span", "company-avatar match-logo");
      logo.append(companyLogo(match.profile));
      const name = element("div", "match-name");
      name.append(element("strong", "", match.profile.name), element("span", "", match.profile.category));
      head.append(logo, name);
      const tags = element("p", "match-tags");
      tags.append(element("span", "match-type", matchTypes[match.type]), element("span", "match-strength", matchStrength(match.score)));
      const reasons = element("ul", "match-reasons");
      for (const reason of compact ? match.reasons.slice(0, 1) : match.reasons) reasons.append(element("li", "", reason));
      const view = element("button", "company-link", "View company profile");
      view.type = "button";
      view.setAttribute("aria-label", `View ${match.profile.name} profile`);
      view.addEventListener("click", () => openCompany(match.profile, view));
      item.append(head, tags, reasons);
      if (!compact) {
        const intro = element("button", "button button-secondary match-intro", introRequests.has(match.profile.id) ? "Introduction requested" : "Request introduction");
        intro.type = "button";
        intro.setAttribute("aria-label", `${intro.textContent} to ${match.profile.name}`);
        const status = element("p", "match-status");
        status.setAttribute("role", "status");
        intro.addEventListener("click", () => {
          introRequests.add(match.profile.id);
          const persisted = writeStoredValue(INTROS_KEY, [...introRequests]);
          intro.textContent = "Introduction requested";
          intro.setAttribute("aria-label", `Introduction requested to ${match.profile.name}`);
          status.textContent = persisted ? "Saved in this browser. BOND will send introductions when it launches." : "Saved for this visit; browser storage is unavailable.";
        });
        item.append(intro, status);
      }
      item.append(view);
      list.append(item);
    }
    container.append(list, element("p", "match-disclosure", "Matching preview: suggestions come from industry relationships, shared capabilities, and location. AI matching that reads full profiles is planned."));
  }

  function renderMatchmaker() {
    const form = document.getElementById("matchmaker-form");
    const results = document.getElementById("matchmaker-results");
    if (!form || !results) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const category = cleanText(data.get("industry"), 40);
      if (!categories.includes(category)) {
        form.elements.namedItem("industry")?.focus();
        return;
      }
      const draft = { id: "matchmaker-draft", name: "Your company", category, location: cleanText(data.get("city"), 80), description: "", services: parseServices(data.get("services")) };
      results.replaceChildren(element("h3", "matchmaker-heading", `Suggested matches for a ${category.toLocaleLowerCase()} company`));
      renderMatchList(draft, results, { limit: 6 });
      results.hidden = false;
      results.querySelector(".matchmaker-heading")?.setAttribute("tabindex", "-1");
      results.querySelector(".matchmaker-heading")?.focus();
    });
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
    if (profile.certifications?.length) {
      const certifications = element("div", "company-services");
      for (const name of profile.certifications) certifications.append(element("span", "service-tag", name));
      container.append(element("h4", "detail-label", profile.local ? "Certifications · Self-reported" : "Certifications · Sample, not verified"), certifications);
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
    if (inDialog) {
      const introductions = element("section", "sample-introductions");
      introductions.append(element("h4", "detail-label", "Suggested matches"));
      renderMatchList(profile, introductions, { limit: 3, compact: true });
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
    const sectionNav = element("nav", "profile-section-nav");
    sectionNav.setAttribute("aria-label", "Profile sections");
    const section = (title, copy, id, navLabel) => {
      const block = element("section", "profile-section");
      const heading = element("h2", "", title);
      if (id) {
        block.id = id;
        heading.id = `${id}-heading`;
        block.setAttribute("aria-labelledby", heading.id);
        const link = element("a", "", navLabel || title);
        link.href = `#${id}`;
        sectionNav.append(link);
      }
      block.append(heading);
      if (copy) block.append(element("p", "dialog-copy", copy));
      content.append(block);
      return block;
    };
    const side = element("aside", "profile-side");
    section("Company overview", profile.description, "overview", "Overview");
    const intro = section("30-second introduction", "", "intro-video", "Video");
    renderIntroVideo(profile, intro);
    const services = section("Services & capabilities", profile.services.length ? "" : "Services have not been added to this preview yet.", "services", "Services");
    if (profile.services.length) {
      const grid = element("ul", "service-grid");
      profile.services.forEach((service, index) => {
        const item = element("li", "service-card");
        item.append(element("span", "service-number", String(index + 1).padStart(2, "0")), element("span", "", service));
        grid.append(item);
      });
      services.append(grid);
    }
    renderCertifications(profile, section("Certifications & licenses", "", "certifications", "Certifications"));
    renderPortfolio(profile, section("Projects", "", "portfolio", "Projects"));
    const story = section("Company story", profile.story || "Company history has not been added to this local preview.", "story", "Story");
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
    const matches = section("Suggested matches", "Customers, partners, suppliers, and teaming partners this company could work with.", "matches", "Matches");
    renderMatchList(profile, matches, { limit: 6 });
    const spotlight = section("Business Spotlight", "A five-minute Spotlight, recorded by the company in its own space or presented live, premieres on the main stage and is followed by live Q&A. The recording stays on this profile as a replay. This preview shows the replay format as text.");
    const replay = element("button", "button button-secondary", "Explore replay format");
    replay.type = "button";
    replay.addEventListener("click", () => showReplay(profile, replay));
    spotlight.append(replay);
    const contact = element("section", "profile-contact");
    contact.id = "contact";
    contact.append(element("h2", "", "Connect with this company"));
    renderProfileContact(profile, contact);
    if (ownership) contact.append(element("p", "ownership-note", "Ownership is self-reported in this preview. VOSB and SDVOSB certification are not asserted."));
    const actions = element("div", "profile-page-actions");
    profileActions(profile, actions);
    side.append(contact, actions);
    layout.append(content, side);
    const contactLink = element("a", "", "Contact");
    contactLink.href = "#contact";
    sectionNav.append(contactLink);
    container.append(cover, identity, profileHeroActions(profile, side), sectionNav, layout);
  }

  function profileHeroActions(profile, side) {
    const bar = element("div", "profile-hero-actions");
    const contact = element("button", "button button-primary", "Contact company");
    contact.type = "button";
    contact.addEventListener("click", () => {
      const connect = side.querySelector(".company-connect");
      connect?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      connect?.click();
    });
    bar.append(contact);
    const website = normalizeWebsite(profile.website);
    if (website) {
      const link = element("a", "button button-secondary", "Visit website");
      link.href = website;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      bar.append(link);
    }
    const watch = element("a", "button button-secondary", "Watch introduction");
    watch.href = "#intro-video";
    const share = element("button", "button button-secondary", "Share profile");
    share.type = "button";
    const status = element("p", "profile-share-status");
    status.setAttribute("role", "status");
    share.addEventListener("click", async () => {
      const url = new URL(`company.html?id=${encodeURIComponent(profile.id)}`, window.location.href).href;
      const localNote = profile.local ? " This local preview opens only in this browser." : "";
      try {
        await navigator.clipboard.writeText(url);
        status.textContent = `Profile link copied.${localNote}`;
      } catch {
        status.textContent = `Copy this profile link: ${url}${localNote}`;
      }
    });
    bar.append(watch, share, status);
    return bar;
  }

  function renderIntroVideo(profile, container) {
    const frame = element("div", "intro-video");
    const poster = element("div", "intro-poster");
    const copy = element("div", "intro-copy");
    copy.append(element("strong", "", profile.name), element("span", "", profile.tagline || profile.category));
    const play = element("button", "intro-play", "Play introduction");
    play.type = "button";
    play.setAttribute("aria-label", `Play the ${profile.name} introduction`);
    poster.append(copy, play, element("span", "intro-length", "0:30"));
    const still = profile.cover || profile.projects?.find((project) => project.image)?.image || industryImages[profile.category];
    if (still) {
      const backdrop = element("img", "intro-backdrop");
      backdrop.src = still;
      backdrop.alt = "";
      backdrop.addEventListener("error", () => backdrop.remove(), { once: true });
      frame.append(backdrop);
    }
    frame.append(poster);
    const note = element("p", "intro-note");
    note.setAttribute("role", "status");
    container.append(frame, note);
    const sampleNote = profile.local
      ? "No introduction video yet. Add one when you create a profile draft; it stays in this browser."
      : "Sample profile: no video is uploaded. Companies add a 30-second introduction here. Video hosting is planned for launch.";
    play.addEventListener("click", () => { note.textContent = sampleNote; });
    readProfileMedia(profile).then(({ video }) => {
      if (!video) return;
      const url = URL.createObjectURL(video);
      const player = element("video", "intro-player");
      player.controls = true;
      player.playsInline = true;
      player.preload = "metadata";
      player.src = url;
      player.setAttribute("aria-label", `${profile.name} introduction video`);
      frame.replaceChildren(player);
      note.textContent = "Your introduction video · Stored in this browser only.";
      window.addEventListener("pagehide", () => URL.revokeObjectURL(url), { once: true });
    });
  }

  function renderCertifications(profile, container) {
    const certifications = profile.certifications || [];
    if (!certifications.length) {
      container.append(element("p", "dialog-copy", "No certifications or licenses added yet."));
      return;
    }
    const list = element("ul", "cert-list");
    for (const name of certifications) {
      const item = element("li", "cert-item");
      item.append(element("span", "cert-name", name), element("span", "cert-badge", profile.local ? "Self-reported" : "Sample · Not verified"));
      list.append(item);
    }
    container.append(list, element("p", "ownership-note", "BOND will check licenses and certifications before showing a Verified badge. Verification is planned for launch."));
  }

  function renderPortfolio(profile, container) {
    const grid = element("div", "portfolio-grid");
    const empty = element("p", "dialog-copy", "No projects added yet.");
    const fill = (projects) => {
      grid.replaceChildren();
      for (const project of projects) {
        const card = element("figure", "portfolio-card");
        if (project.image) {
          const open = element("button", "portfolio-photo");
          open.type = "button";
          open.setAttribute("aria-label", `Enlarge photo: ${project.title}`);
          const image = element("img");
          image.src = project.image;
          image.alt = "";
          image.loading = "lazy";
          image.decoding = "async";
          open.append(image);
          open.addEventListener("click", () => openPhoto(project, profile, open));
          card.append(open);
        } else card.classList.add("no-photo");
        const caption = element("figcaption");
        caption.append(element("h3", "", project.title));
        if (project.summary) caption.append(element("p", "", project.summary));
        caption.append(element("span", "portfolio-label", profile.local ? "Your project · Local preview" : "Sample project · Illustrative photo"));
        card.append(caption);
        grid.append(card);
      }
      empty.hidden = projects.length > 0;
    };
    container.append(grid, empty);
    fill(profile.projects || []);
    if (!profile.local) return;
    readProfileMedia(profile).then(({ photos }) => {
      if (!photos.length) return;
      const titles = (profile.projects || []).map((project) => project.title);
      const count = Math.max(photos.length, titles.length);
      fill(Array.from({ length: count }, (_, index) => ({ title: titles[index] || `Project photo ${index + 1}`, summary: "", image: photos[index] || "" })));
    });
  }

  function openPhoto(project, profile, opener) {
    const dialog = document.getElementById("company-dialog");
    const body = document.getElementById("company-dialog-body");
    if (!dialog || !body) return;
    body.replaceChildren();
    body.append(element("p", "dialog-kicker", `${profile.name} · Projects`));
    const title = element("h2", "dialog-heading", project.title);
    title.id = "company-dialog-title";
    dialog.setAttribute("aria-labelledby", title.id);
    const image = element("img", "portfolio-full");
    image.src = project.image;
    image.alt = project.summary || project.title;
    body.append(title, image);
    if (project.summary) body.append(element("p", "dialog-copy", project.summary));
    body.append(element("p", "ownership-note", profile.local ? "Uploaded to this browser only." : "Illustrative photo for a sample company."));
    showDialog(dialog, opener);
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
    const qaTab = element("button", "expo-panel-tab", "Live Q&A");
    const companyPanel = element("div", "panel-company");
    const messagePanel = element("div", "panel-message");
    const qaPanel = element("div", "panel-qa");
    const entries = [{ key: "profile", button: profileTab, panel: companyPanel }, { key: "message", button: messageTab, panel: messagePanel }, { key: "qa", button: qaTab, panel: qaPanel }];
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
        if (event.key === "ArrowRight") next = entries[(index + 1) % entries.length];
        else if (event.key === "ArrowLeft") next = entries[(index - 1 + entries.length) % entries.length];
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
    renderQA(profile, qaPanel);
    tabs.append(profileTab, messageTab, qaTab);
    container.append(header, tabs, companyPanel, messagePanel, qaPanel);
    activateTab(initialTab);
  }

  const STAGE_COMPANY_ID = "nova";
  const PREMIERE_SECONDS = 300;
  const PREMIERE_DEMO_MS = 20000;
  const premiereChapters = [[0, "Who we are"], [60, "The problem we solve"], [120, "How we help"], [210, "Proof: projects and clients"], [270, "How to connect"]];
  const premiereTags = { ready: "Premiere · Recorded Spotlight", premiere: "Premiering now · Recorded", qa: "Live Q&A · Open" };
  const sampleQuestions = {
    nova: [
      { text: "Do you handle same-day deliveries across Southern California?", answer: "For scheduled regional routes, yes. We plan same-day windows with each client." },
      { text: "Can your dispatch reporting connect to our existing inventory system?" },
    ],
    helix: [{ text: "Do you help with incentive and rebate paperwork for solar projects?" }],
    lumen: [{ text: "How long does a typical dashboard project take?", answer: "Most first versions take four to six weeks, depending on the data sources." }],
  };
  let premierePhase = "ready";
  let premiereTimer;

  function formatClock(seconds) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function qaStatusText(profile) {
    const rep = profile.representative || "The company representative";
    if (presenceOf(profile) === "away") return `${rep} is away. Questions are saved and answered on the replay.`;
    if (profile.id !== STAGE_COMPANY_ID) return `${rep} is at the booth and answers questions here.`;
    if (premierePhase === "premiere") return `Premiere playing. Ask now; ${rep} answers live when the video ends.`;
    if (premierePhase === "qa") return `Live Q&A is open. ${rep} is answering questions now.`;
    return `Ask before or during the premiere. ${rep} answers live after the video.`;
  }

  function renderQA(profile, container) {
    container.replaceChildren();
    container.classList.add("expo-qa");
    container.append(element("h4", "detail-label", "Live Q&A"));
    const status = element("p", "qa-status", qaStatusText(profile));
    status.dataset.qaStatus = profile.id;
    status.setAttribute("aria-live", "polite");
    container.append(status);
    const questions = [...(sampleQuestions[profile.id] || []), ...(questionsByCompany[profile.id] || []).map((entry) => ({ text: entry.text, local: true }))];
    if (questions.length) {
      const list = element("ol", "qa-list");
      for (const question of questions) {
        const item = element("li", "qa-item");
        item.append(element("p", "qa-meta", question.local ? "Your question · Saved in this browser" : "Sample question"), element("p", "qa-question", question.text));
        if (question.answer) item.append(element("p", "qa-answer", `${profile.representative || "Representative"} · Sample answer: ${question.answer}`));
        list.append(item);
      }
      container.append(list);
    } else container.append(element("p", "chat-empty", "No questions yet. Ask the first one."));
    const form = element("form", "chat-form qa-form");
    const inputId = `qa-question-${profile.id}-${++chatSequence}`;
    const label = element("label", "chat-label", "Your question");
    label.htmlFor = inputId;
    const textarea = element("textarea", "chat-input");
    textarea.id = inputId;
    textarea.rows = 2;
    textarea.maxLength = 500;
    textarea.required = true;
    textarea.placeholder = `Ask ${profile.name} about its services, experience, or availability…`;
    const submit = element("button", "button button-primary", "Ask question");
    submit.type = "submit";
    const formStatus = element("p", "chat-status");
    formStatus.setAttribute("role", "status");
    textarea.addEventListener("input", () => textarea.setCustomValidity(""));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = cleanMessage(textarea.value).slice(0, 500);
      if (!text) {
        textarea.setCustomValidity("Write a question before submitting.");
        textarea.reportValidity();
        return;
      }
      if (!questionsByCompany[profile.id]) questionsByCompany[profile.id] = [];
      questionsByCompany[profile.id].push({ text, at: new Date().toISOString() });
      const persisted = writeStoredValue(QUESTIONS_KEY, questionsByCompany);
      renderQA(profile, container);
      container.querySelector("textarea")?.focus();
      const nextStatus = container.querySelector(".chat-status");
      if (nextStatus) nextStatus.textContent = persisted ? "Question added. In this preview it is saved only in this browser." : "Question added for this visit; browser storage is unavailable.";
    });
    form.append(label, textarea, submit, formStatus);
    container.append(form);
  }

  function setPremierePhase(phase) {
    premierePhase = phase;
    const tag = document.getElementById("stage-tag");
    if (tag) tag.textContent = premiereTags[phase];
    document.querySelector(".expo-stage")?.setAttribute("data-phase", phase);
    document.querySelectorAll("[data-qa-status]").forEach((node) => {
      const profile = resolveProfile(node.dataset.qaStatus);
      if (profile) node.textContent = qaStatusText(profile);
    });
  }

  function showStageCompany(tab) {
    const profile = resolveProfile(STAGE_COMPANY_ID);
    if (!profile) return;
    renderExpoPanel(profile, tab);
    document.querySelectorAll("[data-expo-company]").forEach((button) => {
      const active = button.dataset.expoCompany === STAGE_COMPANY_ID;
      button.classList.toggle("is-active", active);
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function runPremiere() {
    const stage = document.querySelector(".expo-stage");
    const center = stage?.querySelector(".stage-center");
    if (!stage || !center || premierePhase === "premiere") return;
    clearInterval(premiereTimer);
    let bar = stage.querySelector(".premiere-bar");
    if (!bar) {
      bar = element("div", "premiere-bar");
      bar.tabIndex = -1;
      const meta = element("div", "premiere-meta");
      const chapter = element("span", "premiere-chapter");
      chapter.setAttribute("aria-live", "polite");
      meta.append(chapter, element("span", "premiere-time"));
      const track = element("div", "premiere-track");
      track.setAttribute("role", "progressbar");
      track.setAttribute("aria-label", "Premiere progress");
      track.setAttribute("aria-valuemin", "0");
      track.setAttribute("aria-valuemax", String(PREMIERE_SECONDS));
      track.append(element("span", "premiere-fill"));
      bar.append(meta, track, element("p", "premiere-note", "Sample still with a compressed 20-second timeline. Uploaded Spotlight videos will play here."));
      stage.querySelector(".stage-bottom")?.before(bar);
    }
    const chapter = bar.querySelector(".premiere-chapter");
    const time = bar.querySelector(".premiere-time");
    const track = bar.querySelector(".premiere-track");
    const fill = bar.querySelector(".premiere-fill");
    center.hidden = true;
    bar.hidden = false;
    bar.focus();
    setPremierePhase("premiere");
    showStageCompany("qa");
    const started = performance.now();
    const tick = () => {
      const progress = Math.min(1, (performance.now() - started) / PREMIERE_DEMO_MS);
      const seconds = Math.round(progress * PREMIERE_SECONDS);
      const current = premiereChapters.filter(([start]) => start <= seconds).pop()[1];
      if (chapter.textContent !== current) chapter.textContent = current;
      time.textContent = `${formatClock(seconds)} / ${formatClock(PREMIERE_SECONDS)}`;
      fill.style.width = `${progress * 100}%`;
      track.setAttribute("aria-valuenow", String(seconds));
      track.setAttribute("aria-valuetext", `${formatClock(seconds)} of ${formatClock(PREMIERE_SECONDS)}, ${current}`);
      if (progress >= 1) {
        clearInterval(premiereTimer);
        endPremiere(stage, center, bar);
      }
    };
    tick();
    premiereTimer = setInterval(tick, 250);
  }

  function endPremiere(stage, center, bar) {
    const profile = resolveProfile(STAGE_COMPANY_ID);
    bar.hidden = true;
    center.hidden = false;
    const heading = center.querySelector("h3");
    if (heading) heading.textContent = "Live Q&A is open.";
    const copy = center.querySelector("p");
    if (copy) copy.textContent = `Ask ${profile?.representative || "the representative"} a question beside the stage · Replay the premiere preview`;
    center.querySelector("#expo-preview")?.setAttribute("aria-label", "Replay the premiere preview");
    setPremierePhase("qa");
    center.querySelector("#expo-preview")?.focus();
    announce("The premiere ended. Live Q&A is open.");
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
    body.append(element("p", "dialog-copy", "Explore the outline of a sample five-minute Spotlight and its follow-up Q&A. This design preview contains a text overview; uploaded Spotlight videos are planned for launch."));
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
    body.append(element("p", "dialog-kicker", "Business Spotlight · How it works"));
    const title = element("h2", "dialog-heading", "Five minutes. Your business. Your way.");
    title.id = "company-dialog-title";
    dialog.setAttribute("aria-labelledby", title.id);
    body.append(title);
    body.append(element("p", "dialog-copy", "Record your five-minute Spotlight in your own space, on your own schedule, with as many takes as you need, then upload it. BOND premieres it on the main stage at a scheduled time so everyone watches together, then opens live Q&A with your representative. Prefer to present live? You can stream instead."));
    body.append(element("p", "dialog-copy", "In this preview the video is a sample still and the premiere timeline is compressed. Video upload, live streaming, captions, and replays are planned for launch."));
    body.append(element("h3", "detail-label", "A suggested five-minute outline"));
    const outline = element("ol", "spotlight-outline");
    outline.append(
      element("li", "", "Minute 1: Who you are and why your company exists."),
      element("li", "", "Minute 2: The problem you solve and who you solve it for."),
      element("li", "", "Minutes 3–4: How you help, with proof such as projects, products, or clients."),
      element("li", "", "Minute 5: How another company can work with you."),
      element("li", "", "After the premiere: Live Q&A. The recording stays on your profile as a replay."),
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

  function configureShowcaseUploads(form) {
    const videoInput = form.elements.namedItem("video");
    const photosInput = form.elements.namedItem("photos");
    const videoStatus = document.getElementById("video-upload-status");
    const photosPreview = document.getElementById("photos-upload-preview");
    const videoHelp = videoStatus?.textContent || "";
    let videoCheck = Promise.resolve(null);
    let photosCheck = Promise.resolve([]);
    let videoToken = 0;
    let photosToken = 0;
    const fail = (input, message) => {
      input.setCustomValidity(message);
      const details = input.closest(".profile-form-details");
      if (details) details.open = true;
    };
    const setVideoStatus = (message, error = false) => {
      if (!videoStatus) return;
      videoStatus.textContent = message;
      videoStatus.classList.toggle("is-error", error);
    };
    const checkVideo = () => {
      if (!videoInput) return;
      const token = ++videoToken;
      const file = videoInput.files?.[0] || null;
      videoInput.setCustomValidity("");
      setVideoStatus(file ? "Checking video…" : videoHelp);
      videoCheck = readVideoFile(file).then((result) => {
        if (token === videoToken && result) setVideoStatus(`Video ready · ${formatClock(Math.round(result.seconds))}. It stays in this browser.`);
        return result;
      }, (error) => {
        if (token === videoToken) {
          fail(videoInput, error.message);
          setVideoStatus(error.message, true);
        }
        throw error;
      });
      videoCheck.catch(() => {});
    };
    const checkPhotos = () => {
      if (!photosInput) return;
      const token = ++photosToken;
      const files = [...(photosInput.files || [])];
      photosInput.setCustomValidity("");
      photosPreview?.replaceChildren(element("span", "", files.length ? "Loading photos…" : "Up to three photos"));
      const showError = (message) => {
        if (token !== photosToken) return;
        fail(photosInput, message);
        photosPreview?.replaceChildren(element("span", "", message));
      };
      if (files.length > MAX_PROJECT_PHOTOS) {
        const error = new Error("Choose up to three project photos.");
        showError(error.message);
        photosCheck = Promise.reject(error);
      } else {
        photosCheck = Promise.all(files.map(readImageFile)).then((photos) => {
          if (token === photosToken && photos.length) {
            photosPreview?.replaceChildren(...photos.map((src, index) => {
              const image = element("img", "upload-preview-image");
              image.src = src;
              image.alt = `Project photo ${index + 1} preview`;
              return image;
            }));
          }
          return photos;
        }, (error) => {
          const message = `Project photos: ${error.message}`;
          showError(message);
          throw new Error(message);
        });
      }
      photosCheck.catch(() => {});
    };
    videoInput?.addEventListener("change", checkVideo);
    photosInput?.addEventListener("change", checkPhotos);
    form.addEventListener("reset", () => setTimeout(() => { checkVideo(); checkPhotos(); }));
    return {
      prepare: async () => {
        const [video, photos] = await Promise.all([videoCheck, photosCheck]);
        return { video: video ? video.blob : null, photos };
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
    document.getElementById("expo-preview")?.addEventListener("click", runPremiere);
    document.getElementById("spotlight-info")?.addEventListener("click", (event) => showSpotlight(event.currentTarget));
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
    const showcase = form ? configureShowcaseUploads(form) : null;
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
      const media = await showcase.prepare();
      if (submittedVersion !== uploads.version()) return;
      const createdProfile = {
        id: newProfileId(), name, category, location, description, representative,
        representativeRole: "Company representative", ownership, local: true,
        tagline: cleanText(data.get("tagline"), 100), services: parseServices(data.get("services")),
        certifications: parseCertifications(data.get("certifications")), projects: parseProjects(data.get("projects")),
        story: cleanText(data.get("story"), 1200),
        serviceArea: cleanText(data.get("serviceArea"), 150), website,
        publicEmail, publicPhone, publishContact: data.has("publishContact"), ...images,
      };
      profiles.push(createdProfile);
      const saved = saveLocalProfiles();
      const hasMedia = Boolean(media.video || media.photos.length);
      const mediaSaved = saved && hasMedia ? await saveProfileMedia(createdProfile.id, media).then(() => true, () => false) : !hasMedia;
      currentFilter = "All";
      const search = document.getElementById("directory-search");
      if (search) search.value = "";
      const locationFilter = document.getElementById("directory-location");
      const ownershipFilter = document.getElementById("directory-ownership");
      if (locationFilter) locationFilter.value = "All";
      if (ownershipFilter) ownershipFilter.value = "All";
      renderDirectory();
      renderExpoFloor();
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
      if (success && !mediaSaved) success.append(element("p", "ownership-note", "Your video and project photos could not be stored in this browser, so they will not appear on the profile."));
      if (success && saved) success.append(fullProfileLink(createdProfile));
      if (success) {
        success.append(element("h3", "detail-label", "Your first matches"));
        renderMatchList(createdProfile, success, { limit: 3, compact: true });
      }
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
    renderMatchmaker();
    renderExpoFloor();
    renderOpportunities();
    renderFullCompanyProfile();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();
