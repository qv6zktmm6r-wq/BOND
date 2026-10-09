(() => {
  "use strict";

  const STORAGE_KEY = "bond.demo.profiles";
  const MESSAGES_KEY = "bond.demo.messages";
  const SAVED_KEY = "bond.demo.saved";
  const MEETINGS_KEY = "bond.demo.meetings";
  const QUESTIONS_KEY = "bond.demo.questions";
  const INTROS_KEY = "bond.demo.intros";
  const OPPORTUNITIES_KEY = "bond.demo.opportunities";
  const RESPONSES_KEY = "bond.demo.responses";
  const FOLLOWS_KEY = "bond.demo.follows";
  const POSTS_KEY = "bond.demo.posts";
  const DAY_MS = 24 * 60 * 60 * 1000;
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
      id: "fieldstone-electrical", type: "Service", companyId: "fieldstone", seeking: ["Construction", "Engineering"],
      title: "Certified electrical subcontractor",
      summary: "A sample request for a licensed electrical subcontractor on a two-story office build in San Diego.",
      detail: "This fictional request shows how a general contractor could find certified subcontractors for a commercial build and compare their qualifications.",
      scope: ["Commercial electrical license", "Tenant improvement experience", "Availability next quarter"],
    },
    {
      id: "forge-shipping", type: "Partner", companyId: "forge", seeking: ["Logistics"],
      title: "Logistics partner for finished goods",
      summary: "A sample search for a regional logistics partner to ship finished parts to customers across Southern California.",
      detail: "This fictional request shows how a manufacturer could look for an ongoing logistics partner instead of booking shipments one at a time.",
      scope: ["Regional distribution", "Scheduled pickups from the shop floor", "Shipment tracking"],
    },
    {
      id: "creston-website", type: "Service", companyId: "creston", seeking: ["Technology"],
      title: "Website developer for a client portal",
      summary: "A sample need for a website developer to build a simple, secure client portal for program updates.",
      detail: "This fictional request shows how a professional services firm could describe a software project and find technology companies that fit.",
      scope: ["Client sign-in and document sharing", "Program status pages", "Ongoing maintenance"],
    },
    {
      id: "nova-dashboard", type: "Service", companyId: "nova", seeking: ["Technology"],
      title: "Fleet dashboard support",
      summary: "Explore a sample need for software that brings vehicles, assignments, and reporting into one view.",
      detail: "This fictional opportunity illustrates how a logistics company could describe a software need and discover businesses with relevant capabilities.",
      scope: ["Fleet and assignment overview", "Simple operational reporting", "Workflow planning"],
    },
    {
      id: "helix-implementation", type: "Partner", companyId: "helix", seeking: ["Construction", "Engineering"],
      title: "Renewable implementation partner",
      summary: "Discover a sample partnership around planning and implementing renewable energy projects.",
      detail: "This fictional opportunity shows how an energy company could introduce its interests and invite a conversation with potential implementation partners.",
      scope: ["Implementation planning", "Complementary energy capabilities", "An introductory company conversation"],
    },
    {
      id: "creston-program", type: "Collaboration", companyId: "creston", seeking: ["Professional services", "Technology"],
      title: "Program delivery collaboration",
      summary: "Explore a sample collaboration between teams with complementary program and operations expertise.",
      detail: "This fictional opportunity demonstrates a company seeking to discuss shared delivery methods and complementary professional services.",
      scope: ["Program coordination", "Operational process design", "Shared capabilities discussion"],
    },
  ];
  const opportunityTypes = { Partner: "Partnership", Service: "Service need", Collaboration: "Collaboration" };
  const postTypes = { project: "Project", capability: "New capability", partnership: "Partnership", hiring: "Hiring", event: "Upcoming event" };
  const samplePosts = [
    { id: "post-forge-run", companyId: "forge", type: "project", daysAgo: 1, text: "Wrapped a 2,000-piece run of CNC-machined aluminum brackets, from first prototype to production in six weeks." },
    { id: "post-lumen-hiring", companyId: "lumen", type: "hiring", daysAgo: 2, text: "We're hiring a full-stack engineer to help build dispatch dashboards for logistics teams. California based, remote-friendly." },
    { id: "post-helix-partner", companyId: "helix", type: "partnership", daysAgo: 3, text: "Now teaming with a regional installer on commercial rooftop solar, so clients get planning and installation under one plan." },
    { id: "post-vector-capability", companyId: "vector", type: "capability", daysAgo: 4, text: "New: structural design reviews for steel pedestrian bridges, with stamped calculations from our licensed engineers." },
    { id: "post-nova-event", companyId: "nova", type: "event", daysAgo: 5, text: "Our five-minute Spotlight premieres on the BOND main stage, with live Q&A right after. Bring your routing questions." },
    { id: "post-fieldstone-project", companyId: "fieldstone", type: "project", daysAgo: 6, text: "Topped out a two-story office building in San Diego. The glass storefront goes in next month." },
    { id: "post-aero-capability", companyId: "aero", type: "capability", daysAgo: 8, text: "Added harness routing and connector integration support for satellite subassemblies." },
    { id: "post-creston-event", companyId: "creston", type: "event", daysAgo: 9, text: "Hosting a free workshop on turning a multi-team plan into one delivery timeline. Seats are limited." },
  ].map((post) => ({ ...post, at: new Date(Date.now() - post.daysAgo * DAY_MS).toISOString() }));

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
  const matchStopwords = new Set(["sample", "company", "companies", "business", "businesses", "service", "services", "support", "focused", "introducing", "capabilities", "capability", "across", "their", "with", "that", "this", "from", "into", "offering", "connecting", "presenting", "showing", "bringing", "everyday", "ideas", "network", "teams", "team", "work", "help", "helping", "movement", "goods", "general", "project"]);

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
  const postedOpportunities = readPostedOpportunities();
  const responsesByOpportunity = readResponses();
  const followedCompanies = new Set(readStoredIds(FOLLOWS_KEY));
  const postedUpdates = readPostedUpdates();
  let currentFilter = "All";
  let currentOpportunityFilter = "All";
  let currentFeedFilter = "All";
  let feedLimit = 8;
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
        const entry = { text, at: new Date(timestamp).toISOString() };
        if (typeof message.recording === "string" && /^rec-[a-z0-9-]{1,60}$/.test(message.recording)) {
          entry.recording = message.recording;
          entry.seconds = Number.isFinite(message.seconds) ? Math.min(Math.max(Math.round(message.seconds), 0), 600) : 0;
        }
        return [entry];
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

  function newId(prefix) {
    const random = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}-${random}`;
  }

  function storedTime(value) {
    const time = typeof value === "string" ? Date.parse(value) : NaN;
    return Number.isFinite(time) ? new Date(time).toISOString() : "";
  }

  function readPostedOpportunities() {
    const stored = readStoredValue(OPPORTUNITIES_KEY);
    if (!Array.isArray(stored)) return [];
    return stored.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const title = cleanText(item.title, 100);
      const summary = cleanText(item.summary, 600);
      const at = storedTime(item.at);
      if (typeof item.id !== "string" || !/^opp-[a-z0-9-]{1,60}$/.test(item.id) || !opportunityTypes[item.type]
        || !knownProfileId(item.companyId) || !title || !summary || !at) return [];
      return [{
        id: item.id, type: item.type, companyId: item.companyId, title, summary, detail: summary,
        scope: parseList(item.scope, 5, 80), seeking: categories.includes(item.seeking) ? [item.seeking] : [],
        location: cleanText(item.location, 80), at, local: true,
      }];
    });
  }

  function savePostedOpportunities() {
    return writeStoredValue(OPPORTUNITIES_KEY, postedOpportunities.map((item) => ({
      id: item.id, type: item.type, companyId: item.companyId, title: item.title, summary: item.summary,
      scope: item.scope, seeking: item.seeking[0] || "", location: item.location, at: item.at,
    })));
  }

  function allOpportunities() {
    return [...postedOpportunities, ...sampleOpportunities];
  }

  function readResponses() {
    const result = Object.create(null);
    const stored = readStoredValue(RESPONSES_KEY);
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return result;
    const ids = new Set(allOpportunities().map((opportunity) => opportunity.id));
    for (const [id, entries] of Object.entries(stored)) {
      if (!ids.has(id) || !Array.isArray(entries)) continue;
      result[id] = entries.flatMap((entry) => {
        const at = storedTime(entry?.at);
        if (!at) return [];
        return [{ text: cleanMessage(entry.text).slice(0, 800), from: knownProfileId(entry.from) ? entry.from : "", at }];
      });
    }
    return result;
  }

  function readPostedUpdates() {
    const stored = readStoredValue(POSTS_KEY);
    if (!Array.isArray(stored)) return [];
    return stored.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const text = cleanMessage(item.text).slice(0, 500);
      const at = storedTime(item.at);
      if (typeof item.id !== "string" || !/^post-[a-z0-9-]{1,60}$/.test(item.id) || !postTypes[item.type]
        || !knownProfileId(item.companyId) || !text || !at) return [];
      return [{ id: item.id, type: item.type, companyId: item.companyId, text, at, local: true }];
    });
  }

  function savePostedUpdates() {
    return writeStoredValue(POSTS_KEY, postedUpdates.map(({ id, type, companyId, text, at }) => ({ id, type, companyId, text, at })));
  }

  function allPosts() {
    return [...postedUpdates, ...samplePosts].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  }

  function shortDate(at) {
    return new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function timeAgo(at) {
    const days = Math.floor((Date.now() - Date.parse(at)) / DAY_MS);
    if (days <= 0) return "Today";
    if (days === 1) return "1 day ago";
    return days < 30 ? `${days} days ago` : shortDate(at);
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
    actions.append(connect, save);
    if (!profile.local) actions.append(followButton(profile, "button button-secondary"));
    actions.append(meeting);
    container.append(actions, status, conversation);
  }

  function followButton(profile, className) {
    const button = element("button", `${className} company-follow`);
    button.type = "button";
    button.dataset.followCompany = profile.id;
    button.addEventListener("click", () => toggleFollow(profile));
    paintFollowButton(button);
    return button;
  }

  function paintFollowButton(button) {
    const following = followedCompanies.has(button.dataset.followCompany);
    const profile = resolveProfile(button.dataset.followCompany);
    button.textContent = following ? "Following" : "Follow";
    button.setAttribute("aria-pressed", String(following));
    button.setAttribute("aria-label", `${following ? "Following" : "Follow"} ${profile ? profile.name : "company"}`);
    button.classList.toggle("is-following", following);
  }

  function toggleFollow(profile) {
    const following = !followedCompanies.has(profile.id);
    if (following) followedCompanies.add(profile.id);
    else followedCompanies.delete(profile.id);
    const persisted = writeStoredValue(FOLLOWS_KEY, [...followedCompanies]);
    document.querySelectorAll("[data-follow-company]").forEach(paintFollowButton);
    if (currentFeedFilter === "Following") renderFeed();
    else paintFeedFilters();
    announce(following
      ? `Following ${profile.name}. Its updates appear under Following${persisted ? "" : " for this visit"}.`
      : `You unfollowed ${profile.name}.`);
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
    const actions = element("div", "chat-actions");
    actions.append(send, dictationButton(textarea, status));
    form.append(label, textarea, actions, status);
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
      container.append(element("p", "ownership-note", "Self-reported ownership label. This sample does not assert VOSB or SDVOSB certification."));
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
    renderProfileOpportunities(profile, section("Opportunities", "", "opportunities", "Opportunities"));
    renderCompanyPosts(profile, section("Activity", "", "activity", "Activity"));
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
    activeVoice?.finish();
    Object.keys(liveSessions).forEach((id) => { if (id !== profile.id) leaveLive(id); });
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
      { text: "Do you handle same-day deliveries across Southern California?", audio: "assets/qa/nova-q1.m4a", answer: "For scheduled regional routes, yes. We plan same-day windows with each client.", answerAudio: "assets/qa/nova-a1.m4a" },
      { text: "Can your dispatch reporting connect to our existing inventory system?", audio: "assets/qa/nova-q2.m4a" },
    ],
    helix: [{ text: "Do you help with incentive and rebate paperwork for solar projects?", audio: "assets/qa/helix-q1.m4a" }],
    lumen: [{ text: "How long does a typical dashboard project take?", audio: "assets/qa/lumen-q1.m4a", answer: "Most first versions take four to six weeks, depending on the data sources.", answerAudio: "assets/qa/lumen-a1.m4a" }],
  };
  const MAX_VOICE_SECONDS = 60;
  const MAX_VOICE_BYTES = 10 * 1024 * 1024;
  const handState = Object.create(null);
  const handTimers = Object.create(null);
  const liveSessions = Object.create(null);
  const hostMode = new URLSearchParams(window.location.search).has("host");
  let liveUnavailable = !window.BondLive;
  let activeVoice = null;
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

  function qaAudio(src, label) {
    const player = element("audio", "qa-audio");
    player.controls = true;
    player.preload = "none";
    player.src = src;
    player.setAttribute("aria-label", label);
    return player;
  }

  function readRecording(id) {
    return mediaRequest("readonly", (store) => store.get(`qa-recording:${id}`)).then((blob) => (
      blob instanceof Blob && blob.type.startsWith("audio/") && blob.size <= MAX_VOICE_BYTES ? blob : null
    ), () => null);
  }

  function voiceMimeType() {
    if (typeof MediaRecorder === "undefined") return null;
    return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"].find((type) => MediaRecorder.isTypeSupported(type)) || "";
  }

  function startCaptions(onText, onStop) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return null;
    const recognition = new Recognition();
    let finalText = "";
    let latest = "";
    let active = true;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index];
        if (result.isFinal) finalText += `${result[0].transcript} `;
        else interim += result[0].transcript;
      }
      latest = cleanMessage(`${finalText}${interim}`);
      onText(latest);
    };
    recognition.onerror = (event) => {
      if (["not-allowed", "service-not-allowed", "audio-capture", "network"].includes(event.error)) active = false;
    };
    recognition.onend = () => {
      if (active) {
        try { recognition.start(); return; } catch { active = false; }
      }
      if (onStop) onStop();
    };
    try { recognition.start(); } catch { return null; }
    return { stop: () => { active = false; try { recognition.stop(); } catch { /* already stopped */ } }, text: () => latest };
  }

  function dictationButton(textarea, status) {
    const button = element("button", "button button-secondary qa-mic chat-dictate", "Speak");
    button.type = "button";
    button.setAttribute("aria-label", "Speak your message");
    button.setAttribute("aria-pressed", "false");
    let session = null;
    const reset = () => {
      session = null;
      button.textContent = "Speak";
      button.setAttribute("aria-pressed", "false");
      button.classList.remove("is-listening");
    };
    button.addEventListener("click", () => {
      if (session) {
        session.stop();
        reset();
        status.textContent = textarea.value.trim() ? "Done listening. Check the text, then send." : "Didn't catch anything. Tap Speak to try again.";
        return;
      }
      const base = textarea.value.trim();
      textarea.form?.addEventListener("submit", () => {
        if (session) session.stop();
        reset();
      }, { once: true });
      session = startCaptions((text) => {
        if (!session) return;
        textarea.value = `${base ? `${base} ` : ""}${text}`.slice(0, textarea.maxLength);
        textarea.setCustomValidity("");
      }, () => {
        if (!session) return;
        reset();
        status.textContent = textarea.value.trim() ? "Done listening. Check the text, then send." : "The microphone stopped. Check browser permission, then tap Speak again.";
      });
      if (!session) {
        status.textContent = "Voice typing isn't available in this browser. Try Chrome, Edge, or Safari, or type your message.";
        return;
      }
      button.textContent = "Stop";
      button.setAttribute("aria-pressed", "true");
      button.classList.add("is-listening");
      status.textContent = "Listening… speak now. Your words appear in the box. Your browser's speech service may process the audio.";
    });
    return button;
  }

  function grantMicLater(profile) {
    clearTimeout(handTimers[profile.id]);
    handTimers[profile.id] = setTimeout(() => {
      if (handState[profile.id] !== "raised") return;
      if (profile.id === STAGE_COMPANY_ID && premierePhase === "premiere") {
        grantMicLater(profile);
        return;
      }
      handState[profile.id] = "mic";
      refreshVoice(profile);
      announce(`${profile.representative || "The representative"} passed you the mic. Tap Start talking.`);
    }, 2500);
  }

  function refreshVoice(profile) {
    document.querySelectorAll(`[data-qa-voice="${profile.id}"]`).forEach((block) => renderVoice(profile, block, block.closest(".expo-qa")));
  }

  function visitorName() {
    const own = profiles.filter((profile) => profile.local).at(-1);
    if (!own) return "Guest";
    return own.representative ? `${own.representative} · ${own.name}` : own.name;
  }

  function liveSession(profile) {
    return liveSessions[profile.id]?.session || null;
  }

  function joinLive(profile, options = {}) {
    if (liveUnavailable) return Promise.resolve(null);
    const existing = liveSessions[profile.id];
    if (existing?.session) return Promise.resolve(existing.session);
    if (existing?.joining) return existing.joining;
    const entry = { session: null, state: null, joining: null, hostCode: "", releasing: false, hostKey: "" };
    liveSessions[profile.id] = entry;
    entry.joining = window.BondLive.join({
      profileId: profile.id,
      name: options.name || visitorName(),
      role: options.role || "guest",
      hostCode: options.hostCode,
      onChange: (state) => onLiveChange(profile, entry, state),
    }).then((session) => {
      entry.session = session;
      entry.joining = null;
      if (options.role === "host") entry.hostCode = options.hostCode;
      if (liveSessions[profile.id] !== entry) {
        session.leave();
        return null;
      }
      return session;
    }, (error) => {
      if (liveSessions[profile.id] === entry) delete liveSessions[profile.id];
      if (error.unavailable) liveUnavailable = true;
      throw error;
    });
    return entry.joining;
  }

  function leaveLive(profileId) {
    const entry = liveSessions[profileId];
    if (!entry) return;
    delete liveSessions[profileId];
    entry.hostMic?.stop();
    entry.session?.leave();
    delete handState[profileId];
    document.querySelectorAll(`.stage-onair.is-remote[data-live="${profileId}"]`).forEach((node) => node.remove());
  }

  function onLiveChange(profile, entry, state) {
    const previous = entry.state;
    entry.state = state;
    if (liveSessions[profile.id] !== entry) return;
    const rep = profile.representative || "The representative";
    if (!state.connected && previous?.connected) {
      if (activeVoice?.profileId === profile.id && activeVoice.live) activeVoice.finish();
      leaveLive(profile.id);
      refreshVoice(profile);
      refreshHostControls(profile);
      announce("Live audio disconnected.");
      return;
    }
    if (state.role === "guest") {
      if (state.canPublish && !previous?.canPublish) {
        handState[profile.id] = "mic";
        refreshVoice(profile);
        announce(`${rep} passed you the mic. Tap Start talking.`);
      } else if (!state.canPublish && previous?.canPublish) {
        const self = entry.releasing;
        entry.releasing = false;
        if (activeVoice?.profileId === profile.id && activeVoice.live) activeVoice.finish();
        else if (!self) {
          delete handState[profile.id];
          refreshVoice(profile);
        }
        if (!self) announce(`${rep} took back the mic.`);
      } else if (!previous || previous.hostPresent !== state.hostPresent) refreshVoice(profile);
    }
    updateLiveRoom(profile, state);
    const hostKey = JSON.stringify([state.connected, state.listeners, state.people.map((person) => [person.identity, person.hand, person.live])]);
    if (hostKey !== entry.hostKey) {
      entry.hostKey = hostKey;
      refreshHostControls(profile);
    }
  }

  function updateLiveRoom(profile, state) {
    const rep = profile.representative || "the representative";
    const room = state.connected
      ? `Live audio · ${state.listeners} in the room${state.hostPresent ? ` · ${rep} is here` : ` · Waiting for ${rep}`}`
      : "";
    const speaker = state.speakers[0];
    const speakerLabel = speaker ? `${speaker.name} (${speaker.role === "host" ? "representative" : "guest"})` : "";
    document.querySelectorAll(`[data-qa-room="${profile.id}"]`).forEach((node) => { node.textContent = room; });
    document.querySelectorAll(`[data-qa-speaker="${profile.id}"]`).forEach((node) => {
      node.hidden = !speaker;
      node.textContent = speaker ? `Now speaking: ${speakerLabel}${speaker.caption ? ` — “${speaker.caption}”` : ""}` : "";
    });
    if (profile.id !== STAGE_COMPANY_ID) return;
    const stage = document.querySelector(".expo-stage");
    let banner = stage?.querySelector(".stage-onair.is-remote");
    if (!speaker || !stage) {
      banner?.remove();
      return;
    }
    if (!banner) {
      banner = element("div", "stage-onair is-remote");
      banner.dataset.live = profile.id;
      banner.setAttribute("aria-hidden", "true");
      banner.append(element("span", "stage-onair-tag"), element("p", "stage-onair-caption"));
      stage.append(banner);
    }
    banner.querySelector(".stage-onair-tag").textContent = `On air · ${speakerLabel}`;
    banner.querySelector(".stage-onair-caption").textContent = speaker.caption || "Speaking…";
  }

  function refreshHostControls(profile) {
    document.querySelectorAll(`[data-qa-host="${profile.id}"]`).forEach((block) => renderHostControls(profile, block));
  }

  function startHostMic(profile, entry, status) {
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(async (stream) => {
      if (!(await entry.session.publishMic(stream))) {
        stream.getTracks().forEach((track) => track.stop());
        status.textContent = "Your mic couldn't be broadcast. Try again.";
        return;
      }
      const captions = startCaptions((text) => entry.session.sendCaption(text));
      entry.hostMic = {
        stop() {
          captions?.stop();
          entry.session?.unpublishMic();
          stream.getTracks().forEach((track) => track.stop());
          entry.hostMic = null;
        },
      };
      renderHostControls(profile, status.closest("[data-qa-host]"));
    }, () => {
      status.textContent = "Microphone access was blocked. Allow the microphone for this site.";
    });
  }

  function renderHostControls(profile, block) {
    if (!block) return;
    const focusedKey = block.contains(document.activeElement) ? document.activeElement.dataset.hostKey : null;
    block.replaceChildren(element("h5", "qa-voice-title", "Representative controls"));
    const status = element("p", "qa-voice-status");
    status.setAttribute("role", "status");
    const entry = liveSessions[profile.id];
    if (liveUnavailable) {
      status.textContent = "Live audio isn't configured on this deployment.";
      block.append(status);
      return;
    }
    if (!entry?.session || entry.session.role !== "host") {
      if (entry?.session) {
        status.textContent = "You joined as a guest. Leave live audio, then open the room as the representative.";
        block.append(status);
        return;
      }
      const form = element("form", "qa-host-form");
      const nameId = `host-name-${profile.id}-${++chatSequence}`;
      const codeId = `host-code-${profile.id}-${chatSequence}`;
      const nameLabel = element("label", "chat-label", "Your name, shown to the room");
      nameLabel.htmlFor = nameId;
      const nameInput = element("input", "chat-input");
      nameInput.id = nameId;
      nameInput.maxLength = 40;
      nameInput.value = profile.representative || "";
      const codeLabel = element("label", "chat-label", "Host code");
      codeLabel.htmlFor = codeId;
      const codeInput = element("input", "chat-input");
      codeInput.id = codeId;
      codeInput.type = "password";
      codeInput.required = true;
      codeInput.autocomplete = "off";
      const open = element("button", "button button-primary", "Open the room");
      open.type = "submit";
      status.textContent = "Open the room to see raised hands and pass the mic.";
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        open.disabled = true;
        status.textContent = "Connecting…";
        joinLive(profile, { role: "host", name: nameInput.value, hostCode: codeInput.value }).then(() => {
          refreshVoice(profile);
          refreshHostControls(profile);
          block.querySelector("button")?.focus();
        }, (error) => {
          open.disabled = false;
          status.textContent = error.message;
          codeInput.select();
        });
      });
      form.append(nameLabel, nameInput, codeLabel, codeInput, open);
      block.append(status, form);
      return;
    }
    const state = entry.state || entry.session.snapshot();
    const guests = state.people.filter((person) => person.role === "guest")
      .sort((a, b) => (b.hand === "mic") - (a.hand === "mic") || (b.hand === "raised") - (a.hand === "raised"));
    const raised = guests.filter((person) => person.hand === "raised").length;
    status.textContent = `You're in the room. ${guests.length} ${guests.length === 1 ? "guest" : "guests"} listening${raised ? ` · ${raised} ${raised === 1 ? "hand" : "hands"} raised` : ""}.`;
    const actions = element("div", "qa-voice-actions");
    const mic = element("button", `button ${entry.hostMic ? "button-secondary" : "button-primary qa-mic"}`, entry.hostMic ? "Mute my mic" : "Answer live");
    mic.type = "button";
    mic.dataset.hostKey = "mic";
    mic.addEventListener("click", () => {
      if (entry.hostMic) {
        entry.hostMic.stop();
        renderHostControls(profile, block);
        block.querySelector('[data-host-key="mic"]')?.focus();
      } else startHostMic(profile, entry, status);
    });
    const leave = element("button", "button button-secondary", "Close the room");
    leave.type = "button";
    leave.dataset.hostKey = "leave";
    leave.addEventListener("click", () => {
      leaveLive(profile.id);
      refreshVoice(profile);
      renderHostControls(profile, block);
    });
    actions.append(mic, leave);
    block.append(status, actions);
    if (guests.length) {
      const list = element("ul", "qa-host-list");
      for (const guest of guests) {
        const item = element("li", "qa-host-guest");
        const label = guest.hand === "mic" ? (guest.live ? "Talking now" : "Has the mic") : guest.hand === "raised" ? "Hand raised" : "Listening";
        item.append(element("span", "qa-host-name", guest.name), element("span", `qa-host-state is-${guest.hand || "listening"}`, label));
        if (guest.hand === "raised" || guest.hand === "mic") {
          const passing = guest.hand === "raised";
          const button = element("button", `button ${passing ? "button-primary" : "button-secondary"}`, passing ? "Pass the mic" : "Take back the mic");
          button.type = "button";
          button.dataset.hostKey = `guest-${guest.identity}`;
          button.setAttribute("aria-label", `${passing ? "Pass the mic to" : "Take back the mic from"} ${guest.name}`);
          button.addEventListener("click", () => {
            button.disabled = true;
            (passing ? entry.session.grant(guest.identity, entry.hostCode) : entry.session.revoke(guest.identity, entry.hostCode))
              .catch((error) => {
                button.disabled = false;
                status.textContent = error.message;
              });
          });
          item.append(button);
        }
        list.append(item);
      }
      block.append(list);
    }
    if (focusedKey) block.querySelector(`[data-host-key="${CSS.escape(focusedKey)}"]`)?.focus();
  }

  function renderVoice(profile, block, qaContainer) {
    block.replaceChildren();
    const inLiveRoom = Boolean(liveSession(profile));
    qaContainer?.classList.toggle("is-live-room", inLiveRoom);
    if (inLiveRoom) qaContainer?.querySelectorAll(".qa-item .qa-audio").forEach((player) => { if (!player.closest(".qa-recording-slot")) player.pause(); });
    const rep = profile.representative || "the representative";
    const away = presenceOf(profile) === "away";
    const state = handState[profile.id] || "idle";
    block.append(element("h5", "qa-voice-title", "Ask with your microphone"));
    const status = element("p", "qa-voice-status");
    status.setAttribute("role", "status");
    const actions = element("div", "qa-voice-actions");
    if (activeVoice?.profileId === profile.id) {
      status.textContent = "You're live. Tap Done talking when you finish.";
      block.append(status);
      return;
    }
    if (away) {
      status.textContent = `${rep} is away. Record a voice question and it will be answered on the replay.`;
      const record = element("button", "button button-primary qa-mic", "Record a voice question");
      record.type = "button";
      record.addEventListener("click", () => startTalking(profile, block, qaContainer, false));
      actions.append(record);
    } else if (state === "raised") {
      const waiting = profile.id === STAGE_COMPANY_ID && premierePhase === "premiere";
      const liveState = liveSessions[profile.id]?.state;
      status.textContent = liveState
        ? (liveState.hostPresent ? `Hand raised. ${rep} can see it and will pass you the mic.` : `Hand raised. ${rep} isn't in the room yet and will see your hand on arrival.`)
        : waiting ? `Hand raised. ${rep} will pass you the mic when the premiere ends.` : `Hand raised. You're next in line for ${rep}.`;
      const lower = element("button", "button button-secondary", "Lower hand");
      lower.type = "button";
      lower.addEventListener("click", () => {
        clearTimeout(handTimers[profile.id]);
        delete handState[profile.id];
        liveSession(profile)?.setHand("");
        renderVoice(profile, block, qaContainer);
        block.querySelector("button")?.focus();
      });
      actions.append(lower);
    } else if (state === "mic") {
      status.textContent = liveSession(profile)
        ? `${rep} passed you the mic. Everyone in the room will hear you as you talk.`
        : `${rep} passed you the mic. In this preview your question is recorded, not broadcast.`;
      const talk = element("button", "button button-primary qa-mic", "Start talking");
      talk.type = "button";
      talk.addEventListener("click", () => startTalking(profile, block, qaContainer, true));
      const pass = element("button", "button button-secondary", "Hand back the mic");
      pass.type = "button";
      pass.addEventListener("click", () => {
        delete handState[profile.id];
        const entry = liveSessions[profile.id];
        if (entry?.session) {
          entry.releasing = true;
          entry.session.release();
        }
        renderVoice(profile, block, qaContainer);
        block.querySelector("button")?.focus();
      });
      actions.append(talk, pass);
    } else {
      status.textContent = `Tap the mic to raise your hand. When ${rep} passes you the mic, everyone hears you and your words appear as text.`;
      const raise = element("button", "button button-primary qa-mic qa-raise", "Tap the mic to ask");
      raise.type = "button";
      raise.addEventListener("click", async () => {
        handState[profile.id] = "raised";
        renderVoice(profile, block, qaContainer);
        block.querySelector("button")?.focus();
        const result = await joinLive(profile).catch((error) => error);
        if (handState[profile.id] !== "raised") return;
        if (result && !(result instanceof Error)) {
          result.setHand("raised");
        } else if (!result || result.unavailable) {
          grantMicLater(profile);
        } else {
          delete handState[profile.id];
          renderVoice(profile, block, qaContainer);
          const nextStatus = block.querySelector(".qa-voice-status");
          if (nextStatus) nextStatus.textContent = result.message;
        }
        refreshVoice(profile);
      });
      actions.append(raise);
      if (!liveUnavailable) {
        const connected = Boolean(liveSession(profile));
        const listen = element("button", "button button-secondary", connected ? "Leave live audio" : "Listen live");
        listen.type = "button";
        listen.addEventListener("click", () => {
          if (connected) {
            leaveLive(profile.id);
            refreshVoice(profile);
            refreshHostControls(profile);
            block.querySelector("button")?.focus();
            return;
          }
          listen.disabled = true;
          status.textContent = "Connecting to live audio…";
          joinLive(profile).then((session) => {
            if (!session) status.textContent = "Live audio isn't available in this preview.";
            refreshVoice(profile);
            refreshHostControls(profile);
          }, (error) => {
            listen.disabled = false;
            status.textContent = error.message;
            if (error.unavailable) refreshVoice(profile);
          });
        });
        actions.append(listen);
      }
    }
    block.append(status, actions);
    const entry = liveSessions[profile.id];
    if (entry?.session) {
      const room = element("p", "qa-live-room");
      room.dataset.qaRoom = profile.id;
      const speaker = element("p", "qa-live-speaker");
      speaker.dataset.qaSpeaker = profile.id;
      speaker.setAttribute("aria-live", "polite");
      speaker.hidden = true;
      block.append(room, speaker);
      if (entry.state) queueMicrotask(() => updateLiveRoom(profile, entry.state));
    }
    const captionNote = "Live captions use your browser's speech recognition, which may send audio to the browser maker (for example, Google in Chrome).";
    block.append(element("p", "qa-voice-note", liveUnavailable
      ? `Preview: your voice is recorded in this browser only. Live broadcast to the room isn't connected on this deployment. ${captionNote}`
      : `Live: while you have the mic, everyone listening in this room hears you. A copy of your question and its text is also saved in this browser. ${captionNote}`));
  }

  async function startTalking(profile, block, qaContainer, live) {
    const status = block.querySelector(".qa-voice-status");
    const mimeType = voiceMimeType();
    if (mimeType === null || !navigator.mediaDevices?.getUserMedia) {
      if (status) status.textContent = "This browser can't record audio. Type your question below instead.";
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (error) {
      if (status) status.textContent = error?.name === "NotAllowedError"
        ? "Microphone access was blocked. Allow the microphone for this site, or type your question below."
        : "No microphone was found. Connect one, or type your question below.";
      return;
    }
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 64000 } : undefined);
    const liveEntry = live ? liveSessions[profile.id] : null;
    const broadcasting = Boolean(liveEntry?.session && liveEntry.state?.canPublish && await liveEntry.session.publishMic(stream));
    const chunks = [];
    const started = performance.now();
    let transcript = "";
    block.replaceChildren();
    block.classList.add("is-live");
    const onAir = element("p", "qa-onair", broadcasting ? "On air · Everyone hears you" : live ? "On air" : "Recording");
    const meter = element("div", "qa-meter");
    const meterFill = element("span", "qa-meter-fill");
    meter.append(meterFill);
    meter.setAttribute("aria-hidden", "true");
    const clock = element("span", "qa-clock", "0:00");
    const caption = element("p", "qa-live-caption", "Listening…");
    caption.setAttribute("aria-live", "polite");
    const done = element("button", "button button-primary qa-done", "Done talking");
    done.type = "button";
    const head = element("div", "qa-live-head");
    head.append(onAir, clock);
    block.append(head, meter, caption, done);
    done.focus();
    const stage = profile.id === STAGE_COMPANY_ID ? document.querySelector(".expo-stage") : null;
    let banner = null;
    let bannerCaption = null;
    if (stage) {
      banner = element("div", "stage-onair");
      banner.setAttribute("aria-hidden", "true");
      bannerCaption = element("p", "stage-onair-caption", "Listening…");
      banner.append(element("span", "stage-onair-tag", live ? "On air · Audience question" : "Recording · Question for the replay"), bannerCaption);
      stage.append(banner);
    }
    const captions = startCaptions((text) => {
      transcript = text;
      if (broadcasting) liveEntry.session.sendCaption(text);
      caption.textContent = text || "Listening…";
      if (bannerCaption) bannerCaption.textContent = text || "Listening…";
    });
    if (!captions) caption.textContent = "Live captions aren't available in this browser. You can type a summary after you finish.";
    let audioContext;
    let frame;
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      const draw = () => {
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) sum += ((sample - 128) / 128) ** 2;
        meterFill.style.width = `${Math.min(100, Math.sqrt(sum / samples.length) * 320)}%`;
        frame = requestAnimationFrame(draw);
      };
      draw();
    } catch { meter.hidden = true; }
    const tick = setInterval(() => {
      const seconds = Math.floor((performance.now() - started) / 1000);
      clock.textContent = `${formatClock(seconds)} / ${formatClock(MAX_VOICE_SECONDS)}`;
      if (seconds >= MAX_VOICE_SECONDS) finish();
    }, 250);
    recorder.addEventListener("dataavailable", (event) => { if (event.data.size) chunks.push(event.data); });
    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      activeVoice = null;
      clearInterval(tick);
      cancelAnimationFrame(frame);
      captions?.stop();
      transcript = captions?.text() || transcript;
      done.disabled = true;
      done.textContent = "Saving…";
      if (liveEntry?.session && liveSessions[profile.id] === liveEntry) {
        liveEntry.session.unpublishMic();
        if (liveEntry.state?.canPublish) {
          liveEntry.releasing = true;
          liveEntry.session.release();
        }
      }
      recorder.addEventListener("stop", async () => {
        stream.getTracks().forEach((track) => track.stop());
        audioContext?.close().catch(() => {});
        banner?.remove();
        block.classList.remove("is-live");
        const seconds = Math.round((performance.now() - started) / 1000);
        const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || "audio/webm" });
        const id = `rec-${newProfileId().slice(6).toLowerCase()}`.slice(0, 64);
        const stored = blob.size && blob.size <= MAX_VOICE_BYTES
          ? await mediaRequest("readwrite", (store) => store.put(blob, `qa-recording:${id}`)).then(() => true, () => false)
          : false;
        const text = cleanMessage(transcript).slice(0, 500) || "Voice question (no captions captured)";
        if (!questionsByCompany[profile.id]) questionsByCompany[profile.id] = [];
        questionsByCompany[profile.id].push(stored ? { text, at: new Date().toISOString(), recording: id, seconds } : { text, at: new Date().toISOString() });
        const persisted = writeStoredValue(QUESTIONS_KEY, questionsByCompany);
        delete handState[profile.id];
        renderQA(profile, qaContainer);
        const nextStatus = qaContainer.querySelector(".qa-voice-status");
        if (nextStatus) nextStatus.textContent = !stored
          ? "Your question text was saved, but the recording couldn't be stored in this browser."
          : persisted ? `Your ${live ? "live" : "recorded"} question is in the list with its recording and text. Saved in this browser only.` : "Saved for this visit; browser storage is unavailable.";
        qaContainer.querySelector(".qa-item:last-child .qa-question")?.setAttribute("tabindex", "-1");
        qaContainer.querySelector(".qa-item:last-child .qa-question")?.focus();
      }, { once: true });
      if (recorder.state !== "inactive") recorder.stop();
      else recorder.dispatchEvent(new Event("stop"));
    }
    done.addEventListener("click", finish);
    activeVoice = { profileId: profile.id, finish, live: broadcasting };
    recorder.start(1000);
  }

  function renderQA(profile, container) {
    container.replaceChildren();
    container.classList.add("expo-qa");
    container.append(element("h4", "detail-label", "Live Q&A"));
    const status = element("p", "qa-status", qaStatusText(profile));
    status.dataset.qaStatus = profile.id;
    status.setAttribute("aria-live", "polite");
    container.append(status);
    const rep = profile.representative || "Representative";
    const questions = [...(sampleQuestions[profile.id] || []), ...(questionsByCompany[profile.id] || []).map((entry) => ({ ...entry, local: true }))];
    const asked = element("div", "qa-asked");
    asked.append(element("h5", "qa-asked-title", "Questions so far"));
    if (questions.length) {
      const list = element("ol", "qa-list");
      for (const question of questions) {
        const item = element("li", "qa-item");
        const meta = element("p", "qa-meta", question.local
          ? (question.recording ? `Your voice question · ${formatClock(question.seconds || 0)} · Saved in this browser` : "Your question · Saved in this browser")
          : "Sample question");
        if (question.audio) meta.append(element("span", "qa-synthetic", " · Synthetic voice"));
        item.append(meta);
        if (question.audio) item.append(qaAudio(question.audio, `Play sample question: ${question.text}`));
        if (question.recording) {
          const slot = element("div", "qa-recording-slot");
          item.append(slot);
          readRecording(question.recording).then((blob) => {
            if (!blob) {
              slot.append(element("p", "qa-meta", "Recording not available in this browser."));
              return;
            }
            const url = URL.createObjectURL(blob);
            const player = qaAudio(url, `Play your voice question: ${question.text}`);
            player.preload = "metadata";
            player.addEventListener("loadedmetadata", () => {
              if (player.duration !== Infinity) return;
              player.addEventListener("durationchange", () => { player.currentTime = 0; }, { once: true });
              player.currentTime = 1e101;
            }, { once: true });
            slot.append(player);
            window.addEventListener("pagehide", () => URL.revokeObjectURL(url), { once: true });
          });
        }
        item.append(element("p", "qa-question", question.text));
        if (question.answer) {
          const answer = element("div", "qa-answer");
          const answerText = element("p", "", `${rep} · Sample answer`);
          if (question.answerAudio) answerText.append(element("span", "qa-synthetic", " · Synthetic voice"));
          answerText.append(`: ${question.answer}`);
          answer.append(answerText);
          if (question.answerAudio) answer.append(qaAudio(question.answerAudio, `Play ${rep}'s sample answer`));
          item.append(answer);
        }
        list.append(item);
      }
      asked.append(list);
    } else asked.append(element("p", "chat-empty", "No questions yet. Ask the first one."));
    const voice = element("div", "qa-voice");
    voice.dataset.qaVoice = profile.id;
    container.append(voice);
    renderVoice(profile, voice, container);
    if (hostMode && presenceOf(profile) !== "away") {
      const host = element("div", "qa-voice qa-host");
      host.dataset.qaHost = profile.id;
      container.append(host);
      renderHostControls(profile, host);
    }
    const form = element("form", "chat-form qa-form");
    const inputId = `qa-question-${profile.id}-${++chatSequence}`;
    const label = element("label", "chat-label", "Or type your question");
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
    const actions = element("div", "chat-actions");
    actions.append(submit, dictationButton(textarea, formStatus));
    form.append(label, textarea, actions, formStatus);
    container.append(form, asked);
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
    const stageProfile = resolveProfile(STAGE_COMPANY_ID);
    if (stageProfile && handState[stageProfile.id] === "raised") refreshVoice(stageProfile);
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

  function stagePanelState() {
    const layout = document.querySelector(".expo-layout");
    const sidebar = document.getElementById("expo-sidebar");
    if (!layout || !sidebar) return null;
    const theater = layout.classList.contains("is-theater");
    return { layout, sidebar, theater, open: !theater || layout.classList.contains("is-panel-open") };
  }

  function syncStagePanel() {
    const state = stagePanelState();
    if (!state) return;
    state.sidebar.inert = !state.open;
    const button = document.getElementById("stage-company");
    button?.setAttribute("aria-expanded", String(state.open));
    const hint = button?.querySelector(".stage-company-hint");
    if (hint) hint.textContent = state.theater && state.open ? "Panel open · Video keeps playing" : "Tap for profile, services, and chat";
  }

  function setTheater(on) {
    const state = stagePanelState();
    if (!state) return;
    state.layout.classList.toggle("is-theater", on);
    state.layout.classList.remove("is-panel-open");
    syncStagePanel();
  }

  function openStagePanel(focus = true) {
    const state = stagePanelState();
    if (!state) return;
    if (state.theater) {
      state.layout.classList.add("is-panel-open");
      state.sidebar.scrollTop = 0;
      if (window.matchMedia("(max-width: 760px)").matches) {
        document.querySelector(".expo-stage")?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }
    }
    syncStagePanel();
    if (focus) state.sidebar.querySelector(".expo-panel-tab[aria-selected=true]")?.focus({ preventScroll: true });
  }

  function closeStagePanel() {
    const state = stagePanelState();
    if (!state?.theater) return;
    state.layout.classList.remove("is-panel-open");
    syncStagePanel();
    document.getElementById("stage-company")?.focus({ preventScroll: true });
  }

  function setupStageCompany() {
    const state = stagePanelState();
    const bottom = document.querySelector(".expo-stage .stage-bottom");
    const profile = resolveProfile(STAGE_COMPANY_ID);
    if (!state || !bottom || !profile) return;
    const button = element("button", "stage-company");
    button.type = "button";
    button.id = "stage-company";
    button.setAttribute("aria-controls", "expo-sidebar");
    button.setAttribute("aria-label", `${profile.name}: open profile, services, and chat beside the video`);
    const avatar = element("span", "stage-avatar");
    avatar.classList.toggle("has-uploaded-logo", Boolean(profile.logo));
    avatar.append(companyLogo(profile));
    const text = element("span", "stage-company-text");
    text.append(element("strong", "", profile.name), element("span", "stage-company-hint", ""));
    button.append(avatar, text);
    button.addEventListener("click", () => {
      const current = stagePanelState();
      if (current?.theater && current.open && currentExpoProfile?.id === profile.id) {
        closeStagePanel();
        return;
      }
      showStageCompany("profile");
      openStagePanel();
    });
    const note = bottom.querySelector(".stage-preview-note");
    bottom.replaceChildren(button);
    if (note) bottom.append(note);
    const close = element("button", "expo-panel-close", "Back to the video");
    close.type = "button";
    close.addEventListener("click", closeStagePanel);
    state.sidebar.prepend(close);
    state.sidebar.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && stagePanelState()?.theater) {
        event.stopPropagation();
        closeStagePanel();
      }
    });
    syncStagePanel();
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
    setTheater(true);
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
    if (!activeVoice) showStageCompany("qa");
    setTheater(false);
    center.querySelector("#expo-preview")?.focus();
    announce("The premiere ended. Live Q&A is open.");
  }

  function prepareDialog(kicker, heading) {
    const dialog = document.getElementById("company-dialog");
    const body = document.getElementById("company-dialog-body");
    if (!dialog || !body) return null;
    body.replaceChildren();
    const title = element("h2", "dialog-heading", heading);
    title.id = "company-dialog-title";
    dialog.setAttribute("aria-labelledby", title.id);
    body.append(element("p", "dialog-kicker", kicker), title);
    return { dialog, body };
  }

  function companyPicker(id, labelText, { includeNone = false, selected = "" } = {}) {
    const label = element("label", "", labelText);
    label.htmlFor = id;
    const select = element("select");
    select.id = id;
    select.name = "company";
    const own = profiles.filter((profile) => profile.local);
    if (includeNone) select.append(new Option("Just me (no company yet)", ""));
    if (own.length) {
      const group = element("optgroup");
      group.label = "Your companies";
      own.forEach((profile) => group.append(new Option(profile.name, profile.id)));
      select.append(group);
    }
    const samples = element("optgroup");
    samples.label = "Sample companies (to try it out)";
    sampleProfiles.forEach((profile) => samples.append(new Option(profile.name, profile.id)));
    select.append(samples);
    if (selected && knownProfileId(selected)) select.value = selected;
    return { label, select, hasOwn: own.length > 0 };
  }

  function createProfileHint(body) {
    const hint = element("p", "form-hint");
    hint.append("No company profile in this browser yet, so you can post as a sample company. ");
    const create = element("button", "company-link", "Create your company profile");
    create.type = "button";
    create.addEventListener("click", () => {
      document.getElementById("company-dialog")?.close();
      openJoin(create);
    });
    hint.append(create);
    body.append(hint);
  }

  function opportunityLabel(opportunity) {
    return `${opportunityTypes[opportunity.type]} · ${opportunity.local ? `Posted ${shortDate(opportunity.at)}` : "Sample opportunity"}`;
  }

  function opportunityCard(opportunity, { thumbnail = true } = {}) {
    const profile = resolveProfile(opportunity.companyId);
    const card = element("article", "opportunity-card");
    const title = element("h3", "", opportunity.title);
    title.id = `opportunity-${opportunity.id}`;
    card.setAttribute("aria-labelledby", title.id);
    if (thumbnail) {
      const image = element("img", `opportunity-thumbnail opportunity-thumbnail-${opportunity.type.toLowerCase()}`);
      image.src = opportunity.type === "Partner" ? "assets/networking.png" : "assets/collaboration.png";
      image.alt = "";
      image.width = 720;
      image.height = 480;
      image.loading = "lazy";
      image.decoding = "async";
      card.append(image);
    }
    card.append(element("p", "opportunity-type", opportunityLabel(opportunity)));
    card.append(title, element("p", "opportunity-company", profile ? profile.name : ""));
    card.append(element("p", "opportunity-copy", opportunity.summary));
    const responses = responsesByOpportunity[opportunity.id] || [];
    if (responses.length) {
      card.append(element("p", "opportunity-flag", opportunity.local
        ? `${responses.length} ${responses.length === 1 ? "response" : "responses"}`
        : "You responded"));
    }
    const view = element("button", "company-link", "View and respond");
    view.type = "button";
    view.setAttribute("aria-label", `View and respond: ${opportunity.title}`);
    view.addEventListener("click", () => openOpportunity(opportunity, view));
    card.append(view);
    return card;
  }

  function renderOpportunities() {
    const grid = document.getElementById("opportunity-grid");
    if (!grid) return;
    const all = allOpportunities();
    const visible = all.filter((opportunity) => currentOpportunityFilter === "All" || opportunity.type === currentOpportunityFilter);
    const cards = document.createDocumentFragment();
    for (const opportunity of visible) {
      if (resolveProfile(opportunity.companyId)) cards.append(opportunityCard(opportunity));
    }
    grid.replaceChildren(cards);
    document.querySelectorAll("[data-opportunity-filter]").forEach((button) => {
      const active = button.dataset.opportunityFilter === currentOpportunityFilter;
      button.classList.toggle("is-active", active);
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const status = document.getElementById("opportunity-status");
    if (status) {
      const mine = postedOpportunities.length ? ` ${postedOpportunities.length} posted in this browser.` : "";
      status.textContent = `Showing ${visible.length} of ${all.length} opportunities.${mine}`;
    }
  }

  function renderProfileOpportunities(profile, block) {
    let list = block.querySelector("[data-profile-opportunities]");
    if (!list) {
      list = element("div", "profile-opportunities");
      list.dataset.profileOpportunities = profile.id;
      block.append(list);
    }
    list.replaceChildren();
    const items = allOpportunities().filter((opportunity) => opportunity.companyId === profile.id);
    list.append(element("p", "dialog-copy", items.length
      ? profile.local ? "Requests this company posted. Saved in this browser." : "Opportunities connected to this sample company."
      : "No opportunity posts yet."));
    for (const opportunity of items) list.append(opportunityCard(opportunity, { thumbnail: false }));
    if (profile.local) {
      const post = element("button", "button button-secondary", "Post an opportunity");
      post.type = "button";
      post.addEventListener("click", () => openPostOpportunity(post, profile.id));
      list.append(post);
    }
  }

  function refreshOpportunityLists() {
    renderOpportunities();
    document.querySelectorAll("[data-profile-opportunities]").forEach((list) => {
      const profile = resolveProfile(list.dataset.profileOpportunities);
      if (profile && list.parentElement) renderProfileOpportunities(profile, list.parentElement);
    });
  }

  function opportunityFits(opportunity) {
    const poster = resolveProfile(opportunity.companyId);
    const terms = matchTerms({ description: `${opportunity.title} ${opportunity.summary}`, services: opportunity.scope || [] });
    const relations = poster ? matchRelations[poster.category] || [] : [];
    const results = [];
    for (const candidate of profiles) {
      if (candidate.id === opportunity.companyId) continue;
      const wanted = (opportunity.seeking || []).includes(candidate.category);
      const candidateTerms = matchTerms(candidate);
      const shared = [...terms].filter((term) => candidateTerms.has(term)).slice(0, 3);
      if (!wanted && !shared.length) continue;
      const reasons = [];
      if (wanted) reasons.push(`${candidate.category}: the kind of company this request is looking for`);
      if (shared.length) reasons.push(`Shared focus: ${shared.join(", ")}`);
      const related = relations.some(([category]) => category === candidate.category);
      results.push({ profile: candidate, reasons, score: (wanted ? 3 : 0) + shared.length * 1.5 + (related ? 1 : 0) });
    }
    return results.sort((a, b) => b.score - a.score || a.profile.name.localeCompare(b.profile.name)).slice(0, 3);
  }

  function openOpportunity(opportunity, opener) {
    const profile = resolveProfile(opportunity.companyId);
    if (!profile) return;
    const view = prepareDialog(opportunityLabel(opportunity), opportunity.title);
    if (!view) return;
    const { dialog, body } = view;
    const poster = element("div", "opportunity-poster");
    const avatar = element("div", "company-avatar");
    avatar.classList.toggle("has-uploaded-logo", Boolean(profile.logo));
    avatar.append(companyLogo(profile));
    const who = element("div", "opportunity-poster-name");
    who.append(element("strong", "", profile.name), element("span", "", `${profile.category} · ${profile.location}`));
    const visit = element("button", "company-link", "View company profile");
    visit.type = "button";
    visit.addEventListener("click", () => openCompany(profile, opener));
    poster.append(avatar, who, visit);
    body.append(poster, element("p", "dialog-copy", opportunity.detail));
    if (opportunity.location) body.append(element("p", "opportunity-company", `Location: ${opportunity.location}`));
    if (opportunity.seeking?.length) body.append(element("p", "opportunity-company", `Looking for: ${opportunity.seeking.join(" or ")} companies`));
    if (opportunity.scope?.length) {
      const scope = element("ul", "opportunity-scope");
      for (const item of opportunity.scope) scope.append(element("li", "", item));
      body.append(element("h3", "detail-label", opportunity.local ? "Requirements" : "Sample discussion areas"), scope);
    }
    body.append(element("p", "ownership-note", opportunity.local
      ? "Saved only in this browser. Other visitors will see posts once BOND launches accounts."
      : "Design preview only. This fictional opportunity is not an active solicitation."));
    const respond = element("section", "opportunity-respond");
    renderOpportunityResponses(opportunity, respond);
    body.append(respond);
    const fits = opportunityFits(opportunity);
    if (fits.length) {
      body.append(element("h3", "detail-label", "Companies that could fit"));
      const list = element("ul", "opportunity-fits");
      for (const fit of fits) {
        const item = element("li", "opportunity-fit");
        const open = element("button", "company-link", "View profile");
        open.type = "button";
        open.setAttribute("aria-label", `View ${fit.profile.name} profile`);
        open.addEventListener("click", () => openCompany(fit.profile, opener));
        item.append(element("strong", "", fit.profile.name), element("span", "", fit.reasons[0]), open);
        list.append(item);
      }
      body.append(list, element("p", "match-disclosure", "Suggestions come from the industries the request names and shared capabilities. AI matching that reads full profiles is planned."));
    }
    if (opportunity.local) {
      const remove = element("button", "danger-link", "Remove this post");
      remove.type = "button";
      remove.addEventListener("click", () => {
        if (remove.dataset.confirm !== "yes") {
          remove.dataset.confirm = "yes";
          remove.textContent = "Tap again to remove this post";
          return;
        }
        const index = postedOpportunities.findIndex((item) => item.id === opportunity.id);
        if (index !== -1) postedOpportunities.splice(index, 1);
        delete responsesByOpportunity[opportunity.id];
        savePostedOpportunities();
        writeStoredValue(RESPONSES_KEY, responsesByOpportunity);
        dialog.close();
        refreshOpportunityLists();
        announce("Your opportunity post was removed.");
      });
      body.append(remove);
    }
    showDialog(dialog, opener);
  }

  function renderOpportunityResponses(opportunity, container) {
    container.replaceChildren();
    const profile = resolveProfile(opportunity.companyId);
    const responses = responsesByOpportunity[opportunity.id] || [];
    container.append(element("h3", "detail-label", opportunity.local ? "Responses" : "Interested? Respond"));
    if (responses.length) {
      const list = element("ul", "opportunity-responses");
      for (const response of responses) {
        const item = element("li", "opportunity-response");
        const from = response.from ? resolveProfile(response.from) : null;
        item.append(element("strong", "", from ? from.name : "You"), element("span", "", ` · ${shortDate(response.at)}`));
        item.append(element("p", "", response.text || "Expressed interest."));
        list.append(item);
      }
      container.append(list);
    } else if (opportunity.local) {
      container.append(element("p", "form-hint", "No responses yet. Until accounts launch, only responses sent from this browser appear here."));
    }
    const form = element("form", "chat-form opportunity-response-form");
    const own = profiles.filter((item) => item.local && item.id !== opportunity.companyId);
    const picker = companyPicker(`respond-as-${opportunity.id}`, "Respond as", { includeNone: true, selected: own[0]?.id || "" });
    const messageId = `respond-message-${opportunity.id}-${++chatSequence}`;
    const label = element("label", "chat-label", "Message (optional)");
    label.htmlFor = messageId;
    const textarea = element("textarea", "chat-input");
    textarea.id = messageId;
    textarea.rows = 3;
    textarea.maxLength = 800;
    textarea.placeholder = `Introduce your company and how you could help ${profile ? profile.name : "them"}.`;
    const submit = element("button", "button button-primary", responses.length ? "Send another response" : "I'm interested");
    submit.type = "submit";
    const status = element("p", "chat-status");
    status.setAttribute("role", "status");
    const actions = element("div", "chat-actions");
    actions.append(submit, dictationButton(textarea, status));
    form.append(picker.label, picker.select, label, textarea, actions, status);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const from = knownProfileId(picker.select.value) ? picker.select.value : "";
      if (!responsesByOpportunity[opportunity.id]) responsesByOpportunity[opportunity.id] = [];
      responsesByOpportunity[opportunity.id].push({ text: cleanMessage(textarea.value).slice(0, 800), from, at: new Date().toISOString() });
      const persisted = writeStoredValue(RESPONSES_KEY, responsesByOpportunity);
      renderOpportunityResponses(opportunity, container);
      refreshOpportunityLists();
      const next = container.querySelector(".chat-status");
      if (next) next.textContent = persisted
        ? "Response saved in this browser. BOND will deliver responses to the posting company when it launches."
        : "Response saved for this visit; browser storage is unavailable.";
      container.querySelector("button[type=submit]")?.focus();
    });
    container.append(form);
  }

  function openPostOpportunity(opener, companyId = "") {
    const view = prepareDialog("Opportunity Board · Post a request", "What does your business need?");
    if (!view) return;
    const { dialog, body } = view;
    body.append(element("p", "dialog-copy", "Describe the partner, service, or collaboration you're looking for. Companies that fit can respond to your post."));
    const form = element("form", "opportunity-form");
    const picker = companyPicker("opportunity-company", "Posting as", { selected: companyId });
    if (!picker.hasOwn) createProfileHint(body);
    const field = (tag, id, labelText, attributes = {}) => {
      const label = element("label", "", labelText);
      label.htmlFor = id;
      const input = element(tag);
      input.id = id;
      Object.assign(input, attributes);
      form.append(label, input);
      return input;
    };
    form.append(picker.label, picker.select);
    const typeLabel = element("label", "", "Type of opportunity");
    typeLabel.htmlFor = "opportunity-type";
    const type = element("select");
    type.id = "opportunity-type";
    for (const [value, text] of Object.entries(opportunityTypes)) type.append(new Option(text, value));
    type.value = "Service";
    form.append(typeLabel, type);
    const title = field("input", "opportunity-title", "Headline", { maxLength: 100, required: true, placeholder: "Looking for a website developer" });
    const summary = field("textarea", "opportunity-summary", "What do you need?", { rows: 4, maxLength: 600, required: true, placeholder: "The work, the timeline, and what a good partner looks like." });
    const seekingLabel = element("label", "", "Who could help? (optional)");
    seekingLabel.htmlFor = "opportunity-seeking";
    const seeking = element("select");
    seeking.id = "opportunity-seeking";
    seeking.append(new Option("Any industry", ""));
    categories.filter((category) => category !== "Other industry").forEach((category) => seeking.append(new Option(category, category)));
    form.append(seekingLabel, seeking);
    const scope = field("input", "opportunity-scope", "Requirements (optional)", { maxLength: 300, placeholder: "Licensed in California, available in May" });
    form.append(element("p", "form-hint", "Separate requirements with commas. Up to five."));
    const location = field("input", "opportunity-location", "Location or service area (optional)", { maxLength: 80, placeholder: "San Diego County" });
    const submit = element("button", "button button-primary", "Post opportunity");
    submit.type = "submit";
    const status = element("p", "chat-status");
    status.setAttribute("role", "status");
    form.append(submit, status);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const record = {
        id: newId("opp"), type: opportunityTypes[type.value] ? type.value : "Service",
        companyId: knownProfileId(picker.select.value) ? picker.select.value : "",
        title: cleanText(title.value, 100), summary: cleanText(summary.value, 600),
        scope: parseList(scope.value, 5, 80), seeking: categories.includes(seeking.value) ? [seeking.value] : [],
        location: cleanText(location.value, 80), at: new Date().toISOString(), local: true,
      };
      record.detail = record.summary;
      if (!record.companyId || !record.title || !record.summary) {
        status.textContent = "Choose a company and add a headline and description.";
        (!record.title ? title : summary).focus();
        return;
      }
      postedOpportunities.unshift(record);
      const persisted = savePostedOpportunities();
      currentOpportunityFilter = "All";
      refreshOpportunityLists();
      openOpportunity(record, opener);
      announce(persisted ? "Opportunity posted. It's saved in this browser." : "Opportunity posted for this visit; browser storage is unavailable.");
    });
    body.append(form);
    showDialog(dialog, opener);
    title.focus();
  }

  function openConversation(profile, opener, prefill = "") {
    const view = prepareDialog("Start a conversation", `Message ${profile.name}`);
    if (!view) return;
    const chat = element("div", "profile-demo-chat");
    renderChat(profile, chat);
    view.body.append(chat);
    const textarea = chat.querySelector("textarea");
    if (textarea && prefill) textarea.value = prefill;
    showDialog(view.dialog, opener);
    textarea?.focus();
  }

  function feedPostCard(post, { showCompany = true } = {}) {
    const profile = resolveProfile(post.companyId);
    const card = element("article", "feed-post");
    const head = element("div", "feed-post-head");
    const avatar = element("div", "company-avatar");
    avatar.classList.toggle("has-uploaded-logo", Boolean(profile.logo));
    avatar.append(companyLogo(profile));
    const who = element("div", "feed-post-who");
    const name = element("button", "feed-company", profile.name);
    name.type = "button";
    name.addEventListener("click", () => openCompany(profile, name));
    who.append(name, element("span", "feed-meta", `${profile.category} · ${timeAgo(post.at)} · ${post.local ? "Shared in this browser" : "Sample update"}`));
    head.append(avatar, who);
    if (showCompany && !profile.local) head.append(followButton(profile, "button button-secondary feed-follow"));
    card.setAttribute("aria-label", `${postTypes[post.type]} from ${profile.name}`);
    card.append(head, element("span", "feed-type", postTypes[post.type]), element("p", "feed-text", post.text));
    const actions = element("div", "feed-actions");
    const talk = element("button", "button button-primary", "Start a conversation");
    talk.type = "button";
    talk.addEventListener("click", () => {
      const firstName = (profile.representative || "").split(" ")[0] || "there";
      const snippet = post.text.length > 60 ? `${post.text.slice(0, 60).trim()}…` : post.text;
      openConversation(profile, talk, `Hi ${firstName}, I saw your update: "${snippet}" `);
    });
    if (!profile.local) actions.append(talk);
    if (post.local) {
      const remove = element("button", "danger-link", "Remove");
      remove.type = "button";
      remove.addEventListener("click", () => {
        if (remove.dataset.confirm !== "yes") {
          remove.dataset.confirm = "yes";
          remove.textContent = "Tap again to remove";
          return;
        }
        const index = postedUpdates.findIndex((item) => item.id === post.id);
        if (index !== -1) postedUpdates.splice(index, 1);
        savePostedUpdates();
        refreshFeeds();
        announce("Your update was removed.");
      });
      actions.append(remove);
    }
    card.append(actions);
    return card;
  }

  function paintFeedFilters() {
    document.querySelectorAll("[data-feed-filter]").forEach((button) => {
      const active = button.dataset.feedFilter === currentFeedFilter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
      if (button.dataset.feedFilter === "Following") button.textContent = followedCompanies.size ? `Following (${followedCompanies.size})` : "Following";
    });
  }

  function renderFeed() {
    const feed = document.getElementById("activity-feed");
    if (!feed) return;
    const posts = allPosts().filter((post) => resolveProfile(post.companyId) && (currentFeedFilter === "All" || followedCompanies.has(post.companyId)));
    feed.replaceChildren();
    if (!posts.length) {
      feed.append(element("p", "feed-empty", currentFeedFilter === "Following"
        ? "You're not following any companies yet. Tap Follow on an update or a company profile to see its news here."
        : "No updates yet."));
    }
    posts.slice(0, feedLimit).forEach((post) => feed.append(feedPostCard(post)));
    if (posts.length > feedLimit) {
      const more = element("button", "button button-secondary feed-more", "Show more updates");
      more.type = "button";
      more.addEventListener("click", () => {
        feedLimit += 8;
        renderFeed();
      });
      feed.append(more);
    }
    paintFeedFilters();
    const status = document.getElementById("feed-status");
    if (status) status.textContent = `Showing ${Math.min(posts.length, feedLimit)} of ${posts.length} updates.`;
  }

  function renderCompanyPosts(profile, block) {
    let list = block.querySelector("[data-company-posts]");
    if (!list) {
      list = element("div", "company-posts");
      list.dataset.companyPosts = profile.id;
      block.append(list);
    }
    list.replaceChildren();
    const posts = allPosts().filter((post) => post.companyId === profile.id);
    const intro = element("div", "company-posts-intro");
    intro.append(element("p", "dialog-copy", posts.length ? "Projects, capabilities, partnerships, hiring, and events from this company." : "No updates yet."));
    if (!profile.local) intro.append(followButton(profile, "button button-secondary"));
    list.append(intro);
    posts.forEach((post) => list.append(feedPostCard(post, { showCompany: false })));
    if (profile.local) {
      const share = element("button", "button button-secondary", "Share an update");
      share.type = "button";
      share.addEventListener("click", () => openShareUpdate(share, profile.id));
      list.append(share);
    }
  }

  function refreshFeeds() {
    renderFeed();
    document.querySelectorAll("[data-company-posts]").forEach((list) => {
      const profile = resolveProfile(list.dataset.companyPosts);
      if (profile && list.parentElement) renderCompanyPosts(profile, list.parentElement);
    });
  }

  function openShareUpdate(opener, companyId = "") {
    const view = prepareDialog("Company activity · Share an update", "What's new at your company?");
    if (!view) return;
    const { dialog, body } = view;
    body.append(element("p", "dialog-copy", "Share a project, a new capability, a partnership, a hiring announcement, or an upcoming event. Followers see it in their feed."));
    const picker = companyPicker("update-company", "Posting as", { selected: companyId });
    if (!picker.hasOwn) createProfileHint(body);
    const form = element("form", "chat-form update-form");
    const typeLabel = element("label", "", "Type of update");
    typeLabel.htmlFor = "update-type";
    const type = element("select");
    type.id = "update-type";
    for (const [value, text] of Object.entries(postTypes)) type.append(new Option(text, value));
    const label = element("label", "", "Your update");
    label.htmlFor = "update-text";
    const textarea = element("textarea", "chat-input");
    textarea.id = "update-text";
    textarea.rows = 4;
    textarea.maxLength = 500;
    textarea.required = true;
    textarea.placeholder = "We just finished… / We're hiring… / Join us at…";
    const submit = element("button", "button button-primary", "Share update");
    submit.type = "submit";
    const status = element("p", "chat-status");
    status.setAttribute("role", "status");
    const actions = element("div", "chat-actions");
    actions.append(submit, dictationButton(textarea, status));
    form.append(picker.label, picker.select, typeLabel, type, label, textarea, actions, status);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = cleanMessage(textarea.value).slice(0, 500);
      const companyChoice = knownProfileId(picker.select.value) ? picker.select.value : "";
      if (!text || !companyChoice) {
        status.textContent = "Write your update before sharing.";
        textarea.focus();
        return;
      }
      const post = { id: newId("post"), type: postTypes[type.value] ? type.value : "project", companyId: companyChoice, text, at: new Date().toISOString(), local: true };
      postedUpdates.unshift(post);
      const persisted = savePostedUpdates();
      currentFeedFilter = "All";
      refreshFeeds();
      dialog.close();
      announce(persisted ? "Update shared. It's saved in this browser." : "Update shared for this visit; browser storage is unavailable.");
    });
    body.append(form);
    showDialog(dialog, opener);
    textarea.focus();
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
        if (stagePanelState()?.theater) openStagePanel(false);
      });
    });
    const firstExpoProfile = expoButtons.length ? resolveProfile(expoButtons[0].dataset.expoCompany || expoButtons[0].dataset.company) : sampleProfiles[0];
    if (firstExpoProfile) renderExpoPanel(firstExpoProfile);
    setupStageCompany();
    if (!liveUnavailable && document.getElementById("expo-company-info")) {
      fetch("/api/live-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
        .then((response) => response.status !== 400, () => true)
        .then((unavailable) => {
          if (!unavailable || liveUnavailable) return;
          liveUnavailable = true;
          if (currentExpoProfile) {
            refreshVoice(currentExpoProfile);
            refreshHostControls(currentExpoProfile);
          }
        });
      window.addEventListener("pagehide", () => Object.keys(liveSessions).forEach(leaveLive));
    }
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
    document.querySelectorAll("[data-post-opportunity]").forEach((button) => {
      button.addEventListener("click", () => openPostOpportunity(button));
    });
    document.querySelectorAll("[data-share-update]").forEach((button) => {
      button.addEventListener("click", () => openShareUpdate(button));
    });
    document.querySelectorAll("[data-feed-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = button.dataset.feedFilter;
        if (next !== "All" && next !== "Following") return;
        currentFeedFilter = next;
        feedLimit = 8;
        renderFeed();
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
    renderFeed();
    renderFullCompanyProfile();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();
