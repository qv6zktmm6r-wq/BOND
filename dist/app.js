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
  const VIEWED_KEY = "bond.demo.viewed";
  const EVENTS_KEY = "bond.demo.events";
  const RSVPS_KEY = "bond.demo.rsvps";
  const ROOMS_KEY = "bond.demo.rooms";
  const SUPABASE_URL = "https://mdifopcbcvyzfoflnoxz.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Ciioz3lRi0AzFp1namtbzg_MoTz3Hbj";
  const SUPABASE_SCRIPT = "vendor/supabase-2.117.3.js";
  // Cloudflare Turnstile site key (public). Turnstile only accepts it on the hostnames listed for the widget in Cloudflare.
  const TURNSTILE_SITE_KEY = "0x4AAAAAAFTZ6LSf6m17yJr_";
  const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  const MEDIA_BUCKET = "company-media";
  const PROFILES_TABLE = "company_profiles";
  const OWNERS_TABLE = "company_profile_owners";
  const PROFILE_COLUMNS = "id,name,industry,description,location,tagline,story,services,certifications,projects,service_area,company_size,ownership,representative,website,publish_contact,public_email,public_phone,logo_path,cover_path,updated_at";
  const OPPORTUNITIES_TABLE = "opportunities";
  const OPPORTUNITY_COLUMNS = "id,profile_id,type,title,summary,scope,seeking,location,created_at";
  const RESPONSES_TABLE = "opportunity_responses";
  const RESPONSE_COLUMNS = "id,opportunity_id,profile_id,message,contact,created_at";
  const UPDATES_TABLE = "company_updates";
  const UPDATE_COLUMNS = "id,profile_id,type,text,created_at";
  const FOLLOWS_TABLE = "company_follows";
  const HIDDEN_TEXT_CHARACTERS = /[\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2069\u3164\uFEFF\uFFA0\uFFF9-\uFFFB\u{E0000}-\u{E007F}]/gu;
  const LINE_SEPARATORS = /\r\n|[\r\u0085\u2028\u2029]/g;
  const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B-\u001F\u007F]/g;
  const EVENTS_TABLE = "company_events";
  const EVENT_COLUMNS = "id,profile_id,title,format,starts_at,duration_minutes,location,description,capacity,going,created_at";
  const EVENT_LINKS_TABLE = "company_event_links";
  const RSVPS_TABLE = "company_event_rsvps";
  const AUTH_STORAGE_KEY = "bond.auth";
  const FLASH_KEY = "bond.flash";
  const MAX_MEMBER_PROFILES = 5;
  const MEMBER_ID_PATTERN = /^m-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  // Public sign-in on joinbond.world is a launch decision; previews and local development always have accounts.
  const PUBLIC_ACCOUNTS = true;
  const ACCOUNTS_ENABLED = PUBLIC_ACCOUNTS || !["joinbond.world", "www.joinbond.world"].includes(window.location.hostname);
  const MAX_ROOMS = 12;
  const MAX_ROOM_MEMBERS = 8;
  const MAX_ROOM_MESSAGES = 120;
  const MAX_ROOM_PROPOSALS = 20;
  const MAX_ROOM_MEETINGS = 20;
  const MAX_ROOMS_STORAGE_LENGTH = 480000;
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
  const companySizes = ["1–10 people", "11–50 people", "51–200 people", "More than 200 people"];
  const serviceRegions = [
    { id: "socal", label: "Southern California", words: ["southern california", "socal", "so cal", "san diego", "riverside", "irvine", "los angeles", "orange county", "inland empire", "long beach", "anaheim", "santa ana", "san bernardino", "temecula", "oceanside"] },
    { id: "norcal", label: "Northern California", words: ["northern california", "norcal", "nor cal", "bay area", "san francisco", "san jose", "oakland", "sacramento", "silicon valley", "fresno"] },
  ];
  const statewideWords = ["statewide", "all of california", "throughout california", "across california", "california wide"];
  const nationwideWords = ["nationwide", "national", "united states", "across the us", "usa", "anywhere", "remote", "all 50 states"];
  const certificationGroups = [
    { id: "iso9001", label: "ISO 9001", words: ["iso 9001"] },
    { id: "as9100", label: "AS9100", words: ["as9100", "as 9100"] },
    { id: "itar", label: "ITAR registration", words: ["itar"] },
    { id: "pe", label: "Licensed engineers (PE)", words: ["professional engineer", "professional engineers", "pe"] },
    { id: "contractor", label: "Contractor license", words: ["contractor license", "contractors license", "contractor s license", "cslb"] },
    { id: "osha", label: "OSHA safety", words: ["osha"] },
    { id: "soc2", label: "SOC 2", words: ["soc 2", "soc2"] },
    { id: "pmp", label: "PMP", words: ["pmp"] },
    { id: "sixsigma", label: "Lean Six Sigma", words: ["six sigma"] },
    { id: "leed", label: "LEED", words: ["leed"] },
    { id: "nabcep", label: "NABCEP solar", words: ["nabcep"] },
    { id: "dot", label: "DOT motor carrier", words: ["dot registered", "usdot", "motor carrier"] },
    { id: "hazmat", label: "Hazardous materials", words: ["hazardous materials", "hazmat"] },
    { id: "aws", label: "AWS Partner", words: ["aws partner"] },
    { id: "sdvosb", label: "VOSB / SDVOSB", words: ["vosb", "sdvosb"] },
    { id: "wosb", label: "WOSB / EDWOSB", words: ["wosb", "edwosb"] },
    { id: "8a", label: "SBA 8(a)", words: ["8 a", "8a"] },
    { id: "hubzone", label: "HUBZone", words: ["hubzone"] },
    { id: "dbe", label: "DBE", words: ["dbe", "disadvantaged business enterprise"] },
  ];
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
      size: "51–200 people", serviceArea: "Southern California and Arizona",
      certifications: ["DOT-registered motor carrier", "Hazardous materials handling training"],
      projects: [["Regional distribution launch", "Dock scheduling and same-day routes for a growing retailer.", "assets/project-nova.jpg"], ["Job-site delivery program", "Material deliveries coordinated across multi-site builds.", "assets/industry-logistics.jpg"]],
    },
    helix: {
      size: "11–50 people", serviceArea: "San Diego and Southern California",
      certifications: ["NABCEP PV installation professional", "LEED Green Associate"],
      projects: [["Warehouse rooftop solar", "Planning and installation oversight for a commercial rooftop array.", "assets/project-helix.jpg"], ["Facility efficiency review", "Energy use assessment with a phased upgrade plan.", "assets/industry-energy.jpg"]],
    },
    creston: {
      size: "1–10 people", serviceArea: "Nationwide, remote and on-site",
      certifications: ["PMP-certified program managers", "Lean Six Sigma Green Belt"],
      projects: [["Program kickoff workshop", "Turned a multi-team plan into a shared delivery timeline.", "assets/project-creston.jpg"], ["Operations process redesign", "Mapped and simplified a client's order-to-delivery process.", "assets/collaboration.png"]],
    },
    lumen: {
      size: "11–50 people", serviceArea: "Nationwide (remote)",
      certifications: ["SOC 2 Type II (in progress)", "AWS Partner"],
      projects: [["Fleet operations dashboard", "Live map and reporting wall for a dispatch team.", "assets/project-lumen.jpg"], ["Workflow automation rollout", "Replaced spreadsheet handoffs with an approval workflow.", "assets/industry-software.jpg"]],
    },
    aero: {
      size: "11–50 people", serviceArea: "Southern California",
      certifications: ["AS9100 quality management", "ITAR registration"],
      projects: [["Satellite subassembly integration", "Harness routing and connector integration on a test stand.", "assets/project-aero.jpg"], ["Hangar test support", "Engineering support during ground testing.", "assets/industry-aerospace.jpg"]],
    },
    fieldstone: {
      size: "51–200 people", serviceArea: "San Diego County",
      certifications: ["California general contractor license (Class B)", "OSHA 30 construction safety"],
      projects: [["Two-story office building", "Ground-up commercial build with a glass storefront.", "assets/project-fieldstone.jpg"], ["Site planning and coordination", "Phased site work coordinated with engineering partners.", "assets/industry-construction.jpg"]],
    },
    vector: {
      size: "11–50 people", serviceArea: "California statewide",
      certifications: ["Licensed Professional Engineers (PE) on staff", "ISO 9001 quality management"],
      projects: [["Pedestrian truss bridge", "Structural design support for a park crossing.", "assets/project-vector.jpg"], ["Design review program", "Technical consulting across a multi-phase build.", "assets/industry-engineering.jpg"]],
    },
    forge: {
      size: "51–200 people", serviceArea: "Riverside; ships nationwide",
      certifications: ["ISO 9001 quality management", "AS9100 (in progress)"],
      projects: [["Precision bracket run", "CNC-machined aluminum brackets from prototype to production.", "assets/project-forge.jpg"], ["Prototype fabrication", "Short-run prototypes for design validation.", "assets/industry-manufacturing.jpg"]],
    },
  };
  for (const profile of sampleProfiles) {
    const showcase = sampleShowcase[profile.id];
    profile.certifications = showcase ? showcase.certifications : [];
    profile.projects = showcase ? showcase.projects.map(([title, summary, image]) => ({ title, summary, image })) : [];
    profile.size = showcase ? showcase.size : "";
    profile.serviceArea = showcase ? showcase.serviceArea : "";
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
    { id: "post-creston-event", companyId: "creston", type: "event", eventId: "evt-creston-workshop", daysAgo: 9, text: "Hosting a free workshop on turning a multi-team plan into one delivery timeline. Seats are limited." },
  ].map((post) => ({ ...post, at: new Date(Date.now() - post.daysAgo * DAY_MS).toISOString() }));
  const eventFormats = { online: "Online", "in-person": "In person", hybrid: "Hybrid" };
  const eventDurations = [30, 45, 60, 90, 120, 180, 240];
  const sampleEvents = [
    { id: "evt-lumen-demo", companyId: "lumen", title: "Live demo: dispatch dashboards for logistics teams", format: "online", inDays: 3, hour: 11, duration: 45, going: 18, capacity: 0, location: "",
      description: "A short walkthrough of a sample dispatch dashboard, then open questions. Bring a routing or tracking problem you'd like to see on screen." },
    { id: "evt-creston-workshop", companyId: "creston", title: "Workshop: one delivery timeline for a multi-team plan", format: "online", inDays: 6, hour: 10, duration: 60, going: 26, capacity: 40, location: "",
      description: "A free working session on combining several teams' schedules into one delivery timeline that everyone can follow. Seats are limited." },
    { id: "evt-fieldstone-open-house", companyId: "fieldstone", title: "Site open house: two-story office build", format: "in-person", inDays: 12, hour: 15, duration: 90, going: 9, capacity: 25, location: "San Diego, California",
      description: "Walk the site with the project team, see the structure before the storefront goes in, and meet the trades who built it. Closed-toe shoes required." },
    { id: "evt-helix-solar", companyId: "helix", title: "Commercial rooftop solar: planning Q&A", format: "hybrid", inDays: 20, hour: 13, duration: 60, going: 12, capacity: 0, location: "San Diego, California",
      description: "Our engineers answer questions about rooftop solar for commercial buildings: roof checks, permitting, timelines, and how installation is planned. Join in person or online." },
  ].map(({ inDays, hour, ...event }) => {
    const start = new Date(Date.now() + inDays * DAY_MS);
    start.setHours(hour, 0, 0, 0);
    return { ...event, start: start.toISOString(), link: "", sample: true };
  });

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
  const projectNeeds = [
    { id: "software", label: "Software and apps", category: "Technology", words: ["software", "platform", "app", "apps", "application", "dashboard", "dashboards", "portal", "website", "web", "mobile", "saas", "api", "data", "analytics", "tracking", "automation", "digital", "reporting", "cloud", "ai", "integration", "workflow"] },
    { id: "logistics", label: "Fleet, shipping, and logistics", category: "Logistics", words: ["fleet", "fleets", "logistics", "shipping", "delivery", "deliveries", "distribution", "freight", "warehousing", "dispatch", "routing", "route", "routes", "transport", "transportation", "trucking", "truck", "trucks", "vehicles", "supply chain"] },
    { id: "construction", label: "Construction and site work", category: "Construction", words: ["construction", "construct", "building", "buildings", "facility", "facilities", "renovation", "renovate", "remodel", "job site", "contractor", "hangar", "concrete", "tenant improvement", "expansion", "site work"] },
    { id: "engineering", label: "Engineering and design", category: "Engineering", words: ["engineering", "engineer", "engineers", "design", "cad", "structural", "mechanical", "electrical", "civil", "analysis", "drawings", "specifications", "permitting", "permits"] },
    { id: "manufacturing", label: "Manufacturing and prototyping", category: "Manufacturing", words: ["manufacturing", "manufacture", "fabrication", "fabricate", "prototype", "prototypes", "prototyping", "parts", "machining", "production", "cnc", "assembly", "hardware", "sensor", "sensors", "device", "devices", "enclosure", "enclosures"] },
    { id: "energy", label: "Energy and power", category: "Energy", words: ["solar", "energy", "power", "battery", "batteries", "charging", "chargers", "ev", "electric vehicle", "electric vehicles", "renewable", "efficiency", "microgrid", "grid"] },
    { id: "aerospace", label: "Aerospace and defense", category: "Aerospace & Defense", words: ["aerospace", "aircraft", "aviation", "drone", "drones", "uav", "satellite", "satellites", "defense", "military", "avionics", "spacecraft", "airport"] },
    { id: "program", label: "Program management and advisory", category: "Professional services", words: ["program management", "project management", "change management", "strategy", "consulting", "consultant", "compliance", "process improvement", "training", "rollout", "budget", "procurement", "grant", "grants"] },
  ];
  const briefStopwords = new Set(["need", "want", "planning", "plan", "looking", "about", "would", "like", "build", "make", "some", "also", "they", "them", "what", "where", "which", "while", "have", "will", "more", "than", "very", "just", "around", "each", "unit", "lightweight", "foot", "square"]);
  const meetingDurations = [30, 45, 60, 90];

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
  const memberOpportunities = [];
  // Responses to member opportunities: the ones this account sent, plus the ones its companies received.
  const memberResponses = Object.create(null);
  const postedOpportunities = readPostedOpportunities();
  const responsesByOpportunity = readResponses();
  // Follows of sample companies and anything followed while signed out stay in this browser;
  // follows of member companies made while signed in live in the account (account.follows).
  const localFollows = new Set(readStoredIds(FOLLOWS_KEY));
  const followedCompanies = new Set(localFollows);
  const memberUpdates = [];
  const memberEvents = [];
  const hostedEvents = readHostedEvents();
  const eventRsvps = readRsvps();
  const opportunityRooms = readRooms();
  const postedUpdates = readPostedUpdates();
  const recentlyViewed = readStoredIds(VIEWED_KEY).slice(0, 8);
  let currentFilter = "All";
  let currentOpportunityFilter = "All";
  let currentFeedFilter = "All";
  let currentEventFilter = "All";
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
    if (!isOwn(profile)) return { video: null, photos: [] };
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
          size: companySizes.includes(profile.size) ? profile.size : "",
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
      size: profile.size || "",
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


  // Member profiles arrive from the database after stored records are read, so their ids are accepted by shape.
  function knownProfileId(id) {
    return typeof id === "string" && (MEMBER_ID_PATTERN.test(id) || profiles.some((profile) => profile.id === id));
  }

  function isOwn(profile) {
    return Boolean(profile && (profile.local || profile.mine));
  }

  function byOrigin(profile, local, member, sample) {
    return profile.local ? local : profile.member ? member : sample;
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
    return [...memberOpportunities, ...postedOpportunities, ...sampleOpportunities];
  }

  function opportunityResponses(opportunity) {
    return (opportunity.member ? memberResponses : responsesByOpportunity)[opportunity.id] || [];
  }

  function postedByMe(opportunity) {
    return Boolean(opportunity.local || (opportunity.member && isOwn(resolveProfile(opportunity.companyId))));
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
      const post = { id: item.id, type: item.type, companyId: item.companyId, text, at, local: true };
      if (findEvent(item.eventId)) post.eventId = item.eventId;
      return [post];
    });
  }

  function savePostedUpdates() {
    return writeStoredValue(POSTS_KEY, postedUpdates.map(({ id, type, companyId, text, at, eventId }) => ({ id, type, companyId, text, at, eventId })));
  }

  function normalizeEventLink(value) {
    const text = cleanText(value, 300);
    if (!text) return "";
    try {
      const url = new URL(text);
      return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
    } catch {
      return null;
    }
  }

  function readHostedEvents() {
    const stored = readStoredValue(EVENTS_KEY);
    if (!Array.isArray(stored)) return [];
    return stored.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const title = cleanText(item.title, 100);
      const description = cleanMessage(item.description).slice(0, 800);
      const start = storedTime(item.start);
      const at = storedTime(item.at);
      const link = normalizeEventLink(item.link);
      if (typeof item.id !== "string" || !/^evt-[a-z0-9-]{1,60}$/.test(item.id) || !knownProfileId(item.companyId)
        || !eventFormats[item.format] || !eventDurations.includes(item.duration) || !title || !description || !start || !at || link === null) return [];
      const capacity = Number.isInteger(item.capacity) && item.capacity > 0 && item.capacity <= 5000 ? item.capacity : 0;
      return [{
        id: item.id, companyId: item.companyId, title, format: item.format, start, duration: item.duration,
        location: cleanText(item.location, 120), link, description, capacity, going: 0, at, local: true,
      }];
    });
  }

  function saveHostedEvents() {
    return writeStoredValue(EVENTS_KEY, hostedEvents.map(({ id, companyId, title, format, start, duration, location, link, description, capacity, at }) => (
      { id, companyId, title, format, start, duration, location, link, description, capacity, at })));
  }

  function allEvents() {
    return [...memberEvents, ...hostedEvents, ...sampleEvents].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  }

  function findEvent(id) {
    return typeof id === "string" ? allEvents().find((event) => event.id === id) || null : null;
  }

  function readRsvps() {
    const result = Object.create(null);
    const stored = readStoredValue(RSVPS_KEY);
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return result;
    for (const [id, entry] of Object.entries(stored)) {
      const event = findEvent(id);
      const at = storedTime(entry?.at);
      if (!event || event.local || !at) continue;
      result[id] = { from: knownProfileId(entry.from) ? entry.from : "", at };
    }
    return result;
  }

  function saveRsvps() {
    return writeStoredValue(RSVPS_KEY, eventRsvps);
  }

  function readRooms() {
    const stored = readStoredValue(ROOMS_KEY);
    if (!Array.isArray(stored)) return [];
    const statuses = ["new", "shortlisted", "declined"];
    return stored.slice(0, MAX_ROOMS).flatMap((item) => {
      if (!item || typeof item !== "object" || typeof item.id !== "string" || !/^room-[a-z0-9-]{1,60}$/.test(item.id)) return [];
      const title = cleanText(item.title, 80);
      const at = storedTime(item.at);
      if (!title || !at) return [];
      const owner = knownProfileId(item.owner) ? item.owner : "";
      const list = (value) => (Array.isArray(value) ? value : []);
      const needIds = (value) => [...new Set(list(value).filter((id) => needById(id)))];
      const seen = new Set([owner]);
      const members = list(item.members).flatMap((member) => {
        if (!member || !knownProfileId(member.companyId) || seen.has(member.companyId)) return [];
        seen.add(member.companyId);
        return [{ companyId: member.companyId, needs: needIds(member.needs), at: storedTime(member.at) || at }];
      }).slice(0, MAX_ROOM_MEMBERS);
      const messages = list(item.messages).flatMap((message) => {
        const text = cleanMessage(message?.text).slice(0, 1000);
        const time = storedTime(message?.at);
        if (!text || !time) return [];
        return [{ from: knownProfileId(message.from) ? message.from : "", text, at: time, note: message.note === true }];
      }).slice(-MAX_ROOM_MESSAGES);
      const meetings = list(item.meetings).flatMap((meeting) => {
        const start = storedTime(meeting?.start);
        const topic = cleanText(meeting?.topic, 100);
        const link = normalizeEventLink(meeting?.link);
        if (typeof meeting?.id !== "string" || !/^meet-[a-z0-9-]{1,60}$/.test(meeting.id) || !start || !topic
          || !meetingDurations.includes(meeting.duration) || link === null) return [];
        return [{ id: meeting.id, topic, start, duration: meeting.duration, link, at: storedTime(meeting.at) || at }];
      }).slice(0, MAX_ROOM_MEETINGS);
      const proposals = list(item.proposals).flatMap((proposal) => {
        const proposalTitle = cleanText(proposal?.title, 100);
        const summary = cleanMessage(proposal?.summary).slice(0, 800);
        const time = storedTime(proposal?.at);
        if (typeof proposal?.id !== "string" || !/^prop-[a-z0-9-]{1,60}$/.test(proposal.id) || !knownProfileId(proposal.from)
          || !proposalTitle || !summary || !time) return [];
        return [{
          id: proposal.id, from: proposal.from, title: proposalTitle, summary, at: time,
          price: cleanText(proposal.price, 40), timeline: cleanText(proposal.timeline, 60),
          status: statuses.includes(proposal.status) ? proposal.status : "new",
        }];
      }).slice(0, MAX_ROOM_PROPOSALS);
      return [{
        id: item.id, title, brief: cleanMessage(item.brief).slice(0, 1500), needs: needIds(item.needs),
        city: cleanText(item.city, 80), preference: ownershipOptions.includes(item.preference) ? item.preference : "",
        owner, at, updated: storedTime(item.updated) || at, members, messages, meetings, proposals,
      }];
    });
  }

  function saveRooms() {
    try {
      const json = JSON.stringify(opportunityRooms);
      if (json.length > MAX_ROOMS_STORAGE_LENGTH) return false;
      localStorage.setItem(ROOMS_KEY, json);
      return true;
    } catch {
      return false;
    }
  }

  function eventEnd(event) {
    return Date.parse(event.start) + event.duration * 60 * 1000;
  }

  function eventIsUpcoming(event) {
    return eventEnd(event) > Date.now();
  }

  function eventGoing(event) {
    return event.member ? event.going : event.going + (eventRsvps[event.id] ? 1 : 0);
  }

  function eventWhen(event, { long = false } = {}) {
    const start = new Date(event.start);
    const end = new Date(eventEnd(event));
    const dayOptions = long ? { weekday: "long", month: "long", day: "numeric" } : { weekday: "short", month: "short", day: "numeric" };
    if (start.getFullYear() !== new Date().getFullYear()) dayOptions.year = "numeric";
    const time = (date, zone) => date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", ...(zone ? { timeZoneName: "short" } : {}) });
    const day = start.toLocaleDateString(undefined, dayOptions);
    return long ? `${day} · ${time(start)} – ${time(end, true)}` : `${day} · ${time(start)}`;
  }

  function eventWhere(event) {
    if (event.format === "online") return "Online";
    return `${eventFormats[event.format]} · ${event.location || "Location shared with attendees"}`;
  }

  function downloadEventCalendar(event) {
    const profile = resolveProfile(event.companyId);
    downloadCalendar({
      uid: event.id, title: event.title, start: event.start, end: eventEnd(event),
      location: event.format === "online" ? "Online" : event.location,
      details: `Hosted by ${profile ? profile.name : "a BOND company"} on BOND.\n\n${event.description}${eventJoinLink(event) ? `\n\nJoin: ${eventJoinLink(event)}` : ""}`,
    });
  }

  function downloadCalendar({ uid, title, start, end, location, details }) {
    const stamp = (time) => new Date(time).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const escape = (value) => String(value || "").replace(LINE_SEPARATORS, "\n").replace(CONTROL_CHARACTERS, "")
      .replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    const encoder = new TextEncoder();
    // Calendar lines are limited to 75 bytes; longer ones continue on lines starting with a space.
    const fold = (line) => {
      const parts = [];
      let part = "";
      let bytes = 0;
      for (const character of line) {
        const size = encoder.encode(character).length;
        if (bytes + size > (parts.length ? 74 : 75)) {
          parts.push(part);
          part = "";
          bytes = 0;
        }
        part += character;
        bytes += size;
      }
      parts.push(part);
      return parts.join("\r\n ");
    };
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//BOND//Member events//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      `UID:${uid}@joinbond.world`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
      `SUMMARY:${escape(title)}`, `LOCATION:${escape(location)}`, `DESCRIPTION:${escape(details)}`,
      "END:VEVENT", "END:VCALENDAR",
    ].map(fold);
    const url = URL.createObjectURL(new Blob([`${lines.join("\r\n")}\r\n`], { type: "text/calendar" }));
    const link = element("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "bond-event"}.ics`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function allPosts() {
    const eventPosts = memberEvents.map((event) => ({
      id: `post-${event.id}`, type: "event", companyId: event.companyId, eventId: event.id, at: event.at, member: true, announcement: true,
      text: `We're hosting "${event.title}" on ${eventWhen(event)}. ${eventWhere(event)}.`,
    }));
    return [...memberUpdates, ...eventPosts, ...postedUpdates, ...samplePosts].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
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
    const label = byOrigin(profile, "Local preview", profile.mine ? "Your company · Member" : "BOND member", "Sample company");
    const previewLabel = element("span", "sample-label", label);
    const location = element("p", "company-location", profile.size ? `${profile.location} · ${profile.size}` : profile.location);
    const description = element("p", "company-description", profile.description);
    const button = element("button", "company-link", "View company profile");
    button.type = "button";
    button.setAttribute("aria-label", `View ${profile.name} sample profile`);
    button.dataset.focusKey = `card-${profile.id}`;
    button.addEventListener("click", () => openCompany(profile, button));
    card.append(head, previewLabel, location, description);
    const ownership = ownershipLabel(profile);
    if (ownership) card.append(ownership);
    if (profile.services.length) card.append(serviceTags(profile));
    card.append(button, fullProfileLink(profile));
    return card;
  }

  function servesRegion(profile, regionId) {
    const area = wordText(profile.serviceArea);
    const hasAny = (text, words) => words.some((word) => text.includes(` ${word} `));
    const nationwide = hasAny(area, nationwideWords);
    if (regionId === "nationwide") return nationwide;
    const region = serviceRegions.find((item) => item.id === regionId);
    if (!region || nationwide) return true;
    const text = `${area} ${wordText(profile.location)}`;
    if (hasAny(area, statewideWords) && text.includes(" california ")) return true;
    return hasAny(text, region.words);
  }

  function heldCertificationGroups(profile) {
    const held = (profile.certifications || []).filter((cert) => !/in progress|pending|applying/i.test(cert)).map(wordText);
    return certificationGroups.filter((group) => held.some((text) => group.words.some((word) => text.includes(` ${word} `))));
  }

  const directorySelectIds = ["directory-location", "directory-serves", "directory-ownership", "directory-certification", "directory-size"];

  function refreshCertificationOptions() {
    const select = document.getElementById("directory-certification");
    if (!select) return;
    const counts = new Map();
    for (const profile of profiles) {
      for (const group of heldCertificationGroups(profile)) counts.set(group.id, (counts.get(group.id) || 0) + 1);
    }
    const available = certificationGroups.filter((group) => counts.has(group.id));
    const signature = available.map((group) => `${group.id}:${counts.get(group.id)}`).join(",");
    if (select.dataset.signature === signature) return;
    const current = select.value;
    select.replaceChildren(new Option("Any certification", "All"), ...available.map((group) => new Option(`${group.label} (${counts.get(group.id)})`, group.id)));
    select.value = available.some((group) => group.id === current) ? current : "All";
    select.dataset.signature = signature;
  }

  function resetDirectoryFilters() {
    currentFilter = "All";
    const search = document.getElementById("directory-search");
    if (search) search.value = "";
    for (const id of directorySelectIds) {
      const select = document.getElementById(id);
      if (select) select.value = "All";
    }
  }

  function renderDirectory() {
    const grid = document.getElementById("company-grid");
    if (!grid) return;
    refreshCertificationOptions();
    const search = document.getElementById("directory-search");
    if (profiles.some((profile) => profile.member)) {
      const note = document.getElementById("directory-status")?.previousElementSibling;
      if (note) note.textContent = "BOND members and sample companies.";
      document.querySelector("label[for=\"directory-search\"]")?.replaceChildren("Search businesses");
    }
    const query = (search ? search.value : "").trim().toLocaleLowerCase();
    const [locationFilter, servesFilter, ownershipFilter, certificationFilter, sizeFilter] = directorySelectIds.map((id) => document.getElementById(id)?.value || "All");
    const visible = profiles.filter((profile) => {
      const matchesCategory = currentFilter === "All" || profile.category === currentFilter;
      const matchesLocation = locationFilter === "All" || profile.location.toLocaleLowerCase().includes(locationFilter.toLocaleLowerCase());
      const matchesServes = servesFilter === "All" || servesRegion(profile, servesFilter);
      const matchesOwnership = ownershipFilter === "All" || profile.ownership === ownershipFilter;
      const matchesCertification = certificationFilter === "All" || heldCertificationGroups(profile).some((group) => group.id === certificationFilter);
      const matchesSize = sizeFilter === "All" || profile.size === sizeFilter;
      const searchText = [profile.name, profile.category, profile.location, profile.description, profile.tagline || "", profile.serviceArea || "", profile.story || "", profile.representative || "", profile.ownership || "", ...profile.services, ...(profile.certifications || [])].join(" ").toLocaleLowerCase();
      return matchesCategory && matchesLocation && matchesServes && matchesOwnership && matchesCertification && matchesSize && (!query || searchText.includes(query));
    });
    const content = document.createDocumentFragment();
    for (const profile of visible) content.append(createCompanyCard(profile));
    if (!visible.length) {
      content.append(element("p", "directory-empty", "No companies match all of these filters. Remove a filter or choose Clear filters."));
    }
    grid.replaceChildren(content);
    const filtered = currentFilter !== "All" || Boolean(query) || [locationFilter, servesFilter, ownershipFilter, certificationFilter, sizeFilter].some((value) => value !== "All");
    const clear = document.getElementById("directory-clear");
    if (clear) clear.hidden = !filtered;
    const status = document.getElementById("directory-status");
    if (status) status.textContent = `Showing ${visible.length} of ${profiles.length} company profiles.`;
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
    if (profiles.some((profile) => profile.member)) {
      const note = document.getElementById("floor-status")?.previousElementSibling;
      if (note) note.textContent = "BOND members and sample companies. Availability is a sample.";
    }
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
      booth.append(element("span", "booth-number", isOwn(profile) ? `${boothNumber(profile)} · Your booth` : boothNumber(profile)), logo, element("strong", "booth-name", profile.name), element("span", "booth-category", profile.category), presenceBadge(profile));
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
    body.append(element("p", "dialog-kicker", `Booth ${boothNumber(profile)} · ${byOrigin(profile, "Your local preview", "BOND member", "Sample company")}`));
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
    if (isOwn(profile)) {
      const edit = element("button", "button button-secondary company-edit", "Edit profile");
      edit.type = "button";
      edit.dataset.focusKey = `edit-${profile.id}`;
      edit.setAttribute("aria-label", `Edit ${profile.name} profile`);
      edit.addEventListener("click", () => {
        const host = edit.closest("dialog");
        const back = host ? dialogOpeners.get(host) : edit;
        host?.close();
        openEditProfile(profile, back);
      });
      actions.append(edit);
    }
    actions.append(connect, save);
    if (!isOwn(profile)) actions.append(followButton(profile, "button button-secondary"));
    actions.append(meeting);
    if (!isOwn(profile)) {
      const invite = element("button", "button button-secondary company-room", "Invite to a room");
      invite.type = "button";
      invite.setAttribute("aria-label", `Invite ${profile.name} to an Opportunity Room`);
      invite.addEventListener("click", () => openInviteToRoom(profile, invite));
      actions.append(invite);
    }
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

  function paintFollows() {
    document.querySelectorAll("[data-follow-company]").forEach(paintFollowButton);
    if (currentFeedFilter === "Following") renderFeed();
    else paintFeedFilters();
  }

  async function toggleFollow(profile) {
    const following = !followedCompanies.has(profile.id);
    const inAccount = Boolean(profile.member && account.user && (following || account.follows.has(profile.id)));
    let persisted = true;
    if (inAccount) {
      if (following) account.follows.add(profile.id);
      else account.follows.delete(profile.id);
    } else if (following) localFollows.add(profile.id);
    if (!following) localFollows.delete(profile.id);
    if (!inAccount || !following) persisted = writeStoredValue(FOLLOWS_KEY, [...localFollows]);
    rebuildFollows();
    paintFollows();
    if (inAccount) {
      try {
        await saveMemberFollow(profile, following);
      } catch (error) {
        if (following) account.follows.delete(profile.id);
        else account.follows.add(profile.id);
        rebuildFollows();
        paintFollows();
        announce(error.message);
        return;
      }
    }
    announce(following
      ? `Following ${profile.name}. Its updates appear under Following${inAccount ? " on every device you sign in to" : persisted ? "" : " for this visit"}.`
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
      container.append(element("p", "dialog-kicker", byOrigin(profile, "Your local sample profile", profile.mine ? "Your company profile" : "BOND member profile", "Sample company profile")));
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
    container.append(element("p", "company-location", profile.location === "Location not added" || profile.member ? profile.location : `${profile.location} · ${profile.local ? "Local preview" : "Sample location"}`));
    container.append(element("p", "dialog-copy", profile.description));
    const ownership = ownershipLabel(profile);
    if (ownership) {
      container.append(ownership);
      container.append(element("p", "ownership-note", profile.member ? "Self-reported ownership label. BOND has not verified it yet." : "Self-reported ownership label. This sample does not assert VOSB or SDVOSB certification."));
    }
    if (profile.services.length) {
      container.append(element("h4", "detail-label", "Capabilities"), serviceTags(profile));
    }
    if (profile.certifications?.length) {
      const certifications = element("div", "company-services");
      for (const name of profile.certifications) certifications.append(element("span", "service-tag", name));
      container.append(element("h4", "detail-label", profile.local || profile.member ? "Certifications · Self-reported" : "Certifications · Sample, not verified"), certifications);
    }
    if (profile.story) {
      const story = element("section", "company-story");
      story.append(element("h4", "detail-label", byOrigin(profile, "Company story · Local preview", "Company story", "Company story · Sample")));
      if (profile.founded) story.append(element("p", "company-founded", `Founded ${profile.founded} · Demo company history`));
      story.append(element("p", "dialog-copy", profile.story));
      container.append(story);
    }
    const representative = element("section", "representative-card");
    representative.append(element("h4", "detail-label", profile.member ? "Company representative · Self-reported" : "Authorized representative · Demo"));
    representative.append(element("p", "representative-name", profile.representative || "Representative not specified"));
    representative.append(element("p", "representative-role", profile.member ? profile.representativeRole || "Company representative" : `${profile.representativeRole || "Company representative"} · Sample role`));
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
    const selfReported = profile.local || profile.member ? "Self-reported" : "Sample";
    if (profile.serviceArea) container.append(element("p", "profile-service-area", `Service area: ${profile.serviceArea} · ${selfReported}`));
    if (profile.size) container.append(element("p", "profile-service-area", `Company size: ${profile.size} · ${selfReported}`));
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
      const memberId = Boolean(requestedId?.startsWith("m-"));
      if (memberId && ACCOUNTS_ENABLED && !account.loaded && !account.error) {
        notice.setAttribute("aria-busy", "true");
        notice.append(element("p", "dialog-kicker", "Company profile"), element("h1", "", "Loading this company profile…"));
        container.append(notice);
        return;
      }
      notice.append(element("p", "dialog-kicker", "Company preview"), element("h1", "", requestedId ? "This profile is unavailable here." : "Choose a company profile."));
      notice.append(element("p", "dialog-copy", requestedId?.startsWith("local-")
        ? "Local preview profiles are available only in the browser where they were created. This profile is not available in this browser."
        : memberId ? (account.error || "This company profile could not be found. It may have been removed. Explore the directory to choose a company.")
        : requestedId ? "This sample company profile could not be found. Explore the directory to choose a company." : "Explore the company directory and open a full profile to see the business, its capabilities, and ways to connect."));
      const directory = element("a", "button button-primary", "Explore company directory");
      directory.href = "index.html#businesses";
      notice.append(directory);
      container.append(notice);
      return;
    }
    document.title = `${profile.name} — BOND company preview`;
    recordView(profile);
    const cover = element("div", "company-cover");
    const coverImage = element("img", "");
    const coverNote = element("p", "company-cover-note", profile.cover ? byOrigin(profile, "Uploaded cover · Local preview", "Uploaded cover", "Uploaded cover") : "Concept cover · Design preview");
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
    identityCopy.append(meta, element("span", "profile-preview-status", byOrigin(profile, "Local preview · Stored in this browser", "BOND member · Not verified yet", "Sample company · Design preview")));
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
    const story = section("Company story", profile.story || (profile.local ? "Company history has not been added to this local preview." : "Company history has not been added yet."), "story", "Story");
    if (profile.founded) story.append(element("p", "company-founded", `Founded ${profile.founded} · Demo company history`));
    const representative = section("Company representative", "Representative identity and authorization are illustrated as a demo role here.");
    representative.append(element("p", "representative-name", profile.representative || "Representative not added"));
    representative.append(element("p", "representative-role", `${profile.representativeRole || "Company representative"} · Demo`));
    renderProfileOpportunities(profile, section("Opportunities", "", "opportunities", "Opportunities"));
    renderCompanyEvents(profile, section("Upcoming events", "", "events", "Events"));
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
    const sampleNote = isOwn(profile)
      ? "No introduction video yet. Add one with Edit profile; videos stay in this browser until BOND launches video hosting."
      : profile.member ? "This company hasn't added an introduction video yet."
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
      item.append(element("span", "cert-name", name), element("span", "cert-badge", profile.local || profile.member ? "Self-reported" : "Sample · Not verified"));
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
        caption.append(element("span", "portfolio-label", byOrigin(profile, "Your project · Local preview", "Project · Self-reported", "Sample project · Illustrative photo")));
        card.append(caption);
        grid.append(card);
      }
      empty.hidden = projects.length > 0;
    };
    container.append(grid, empty);
    fill(profile.projects || []);
    if (!isOwn(profile)) return;
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
    body.append(element("p", "ownership-note", isOwn(profile) ? "Uploaded to this browser only." : "Illustrative photo for a sample company."));
    showDialog(dialog, opener);
  }

  function recordView(profile) {
    if (isOwn(profile)) return;
    const index = recentlyViewed.indexOf(profile.id);
    if (index !== -1) recentlyViewed.splice(index, 1);
    recentlyViewed.unshift(profile.id);
    recentlyViewed.length = Math.min(recentlyViewed.length, 8);
    writeStoredValue(VIEWED_KEY, recentlyViewed);
  }

  function openCompany(profile, opener) {
    recordView(profile);
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
    const own = profiles.filter(isOwn).at(-1);
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
    const own = profiles.filter(isOwn);
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

  function memberRsvpPicker(event) {
    const label = element("label", "", "Attending as");
    label.htmlFor = `rsvp-company-${event.id}`;
    const select = element("select");
    select.id = label.htmlFor;
    select.name = "company";
    select.append(new Option("Myself (the host sees \"A BOND member\")", ""));
    const own = profiles.filter((profile) => profile.member && profile.mine);
    if (own.length) {
      const group = element("optgroup");
      group.label = "Your published companies";
      own.forEach((profile) => group.append(new Option(profile.name, profile.id)));
      select.append(group);
    }
    return { label, select };
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
    return `${opportunityTypes[opportunity.type]} · ${opportunity.local || opportunity.member ? `Posted ${shortDate(opportunity.at)}` : "Sample opportunity"}`;
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
    const responses = opportunityResponses(opportunity);
    if (responses.length) {
      card.append(element("p", "opportunity-flag", postedByMe(opportunity)
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
      ? isOwn(profile) ? profile.member ? "Requests this company posted. Everyone on BOND can see them." : "Requests this company posted. Saved in this browser." : "Opportunities connected to this company."
      : "No opportunity posts yet."));
    for (const opportunity of items) list.append(opportunityCard(opportunity, { thumbnail: false }));
    if (isOwn(profile)) {
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
      body.append(element("h3", "detail-label", opportunity.local || opportunity.member ? "Requirements" : "Sample discussion areas"), scope);
    }
    body.append(element("p", "ownership-note", opportunity.member
      ? `Posted by a BOND member company. Responses go only to ${profile.name}.`
      : opportunity.local
        ? "Saved only in this browser. Publish the company to your BOND account so everyone can see its posts."
        : "Design preview only. This fictional opportunity is not an active solicitation."));
    const respond = element("section", "opportunity-respond");
    renderOpportunityResponses(opportunity, respond, opener);
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
    if (postedByMe(opportunity)) {
      const remove = element("button", "danger-link", "Remove this post");
      remove.type = "button";
      const removeStatus = element("p", "chat-status");
      removeStatus.setAttribute("role", "status");
      remove.addEventListener("click", async () => {
        if (remove.dataset.confirm !== "yes") {
          remove.dataset.confirm = "yes";
          remove.textContent = opportunity.member ? "Tap again to remove this post and its responses for everyone" : "Tap again to remove this post";
          return;
        }
        if (opportunity.member) {
          remove.disabled = true;
          try {
            await deleteMemberOpportunity(opportunity);
          } catch (error) {
            remove.disabled = false;
            removeStatus.textContent = error.message;
            return;
          }
        } else {
          const index = postedOpportunities.findIndex((item) => item.id === opportunity.id);
          if (index !== -1) postedOpportunities.splice(index, 1);
          delete responsesByOpportunity[opportunity.id];
          savePostedOpportunities();
          writeStoredValue(RESPONSES_KEY, responsesByOpportunity);
        }
        dialog.close();
        refreshOpportunityLists();
        announce("Your opportunity post was removed.");
      });
      body.append(remove, removeStatus);
    }
    showDialog(dialog, opener);
  }

  function renderMemberOpportunityResponses(opportunity, container, opener, notice = "") {
    container.replaceChildren();
    const poster = resolveProfile(opportunity.companyId);
    const responses = memberResponses[opportunity.id] || [];
    const received = isOwn(poster);
    container.append(element("h3", "detail-label", received ? "Responses" : "Interested? Respond"));
    if (responses.length) {
      const list = element("ul", "opportunity-responses");
      for (const response of responses) {
        const item = element("li", "opportunity-response");
        const from = resolveProfile(response.from);
        const name = from ? from.name : "A company no longer on BOND";
        item.append(element("strong", "", received ? name : `You, as ${name}`), element("span", "", ` · ${shortDate(response.at)}`));
        item.append(element("p", "", response.text || "Expressed interest."));
        if (received && response.contact) item.append(element("p", "form-hint", `Reply to: ${response.contact}`));
        if (received && from) {
          const view = element("button", "company-link", "View company profile");
          view.type = "button";
          view.setAttribute("aria-label", `View ${from.name} profile`);
          view.addEventListener("click", () => openCompany(from, opener));
          item.append(view);
        }
        if (!received) {
          const withdraw = element("button", "danger-link", "Withdraw");
          withdraw.type = "button";
          withdraw.setAttribute("aria-label", `Withdraw your response from ${shortDate(response.at)}`);
          withdraw.addEventListener("click", async () => {
            if (withdraw.dataset.confirm !== "yes") {
              withdraw.dataset.confirm = "yes";
              withdraw.textContent = `Tap again to withdraw it from ${poster.name}`;
              return;
            }
            withdraw.disabled = true;
            try {
              await withdrawMemberResponse(response);
            } catch (error) {
              withdraw.disabled = false;
              withdraw.textContent = error.message;
              return;
            }
            renderMemberOpportunityResponses(opportunity, container, opener, "Response withdrawn.");
            refreshOpportunityLists();
          });
          item.append(withdraw);
        }
        list.append(item);
      }
      container.append(list);
    } else if (received) {
      container.append(element("p", "form-hint", "No responses yet. Responses from other companies show up here and on your dashboard."));
    }
    if (received) return;
    const status = element("p", "chat-status", notice);
    status.setAttribute("role", "status");
    if (!account.user) {
      const signIn = element("button", "button button-primary", "Sign in to respond");
      signIn.type = "button";
      signIn.addEventListener("click", () => openAccount(signIn));
      container.append(element("p", "form-hint", `Sign in and publish your company to respond. Your response goes only to ${poster.name}.`), signIn);
      return;
    }
    const own = profiles.filter((item) => item.member && item.mine);
    if (!own.length) {
      const create = element("button", "button button-primary", "Publish your company profile");
      create.type = "button";
      create.addEventListener("click", () => {
        document.getElementById("company-dialog")?.close();
        openJoin(create);
      });
      container.append(element("p", "form-hint", "Responses are sent as one of your published companies, so the posting company knows who you are."), create);
      return;
    }
    const available = own.filter((profile) => responses.filter((response) => response.from === profile.id).length < 3);
    if (!available.length) {
      container.append(element("p", "form-hint", `You've sent the most responses allowed to this request. ${poster.name} can reach you through your company profile.`), status);
      return;
    }
    const form = element("form", "chat-form opportunity-response-form");
    const sequence = ++chatSequence;
    const pickerLabel = element("label", "", "Respond as");
    pickerLabel.htmlFor = `respond-as-${opportunity.id}-${sequence}`;
    const picker = element("select");
    picker.id = pickerLabel.htmlFor;
    available.forEach((profile) => picker.append(new Option(profile.name, profile.id)));
    const label = element("label", "chat-label", "Message (optional)");
    label.htmlFor = `respond-message-${opportunity.id}-${sequence}`;
    const textarea = element("textarea", "chat-input");
    textarea.id = label.htmlFor;
    textarea.rows = 3;
    textarea.maxLength = 800;
    textarea.placeholder = `Introduce your company and how you could help ${poster.name}.`;
    const contactLabel = element("label", "chat-label", "How should they reply? (optional)");
    contactLabel.htmlFor = `respond-contact-${opportunity.id}-${sequence}`;
    const contact = element("input", "chat-input");
    contact.id = contactLabel.htmlFor;
    contact.maxLength = 160;
    contact.autocomplete = "email";
    contact.placeholder = "Email or phone. Only the posting company sees it.";
    const submit = element("button", "button button-primary", responses.length ? "Send another response" : "I'm interested");
    submit.type = "submit";
    const actions = element("div", "chat-actions");
    actions.append(submit, dictationButton(textarea, status));
    form.append(pickerLabel, picker, label, textarea, contactLabel, contact, actions, status);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const from = available.find((profile) => profile.id === picker.value);
      if (!from) return;
      const reply = cleanText(contact.value, 160);
      if (!validReplyContact(reply)) {
        status.textContent = "Enter an email address or phone number for the reply, or leave it empty.";
        contact.focus();
        return;
      }
      submit.disabled = true;
      status.textContent = "Sending…";
      try {
        await sendMemberResponse(opportunity, from, cleanMessage(textarea.value).slice(0, 800), reply);
      } catch (error) {
        submit.disabled = false;
        status.textContent = error.message;
        return;
      }
      renderMemberOpportunityResponses(opportunity, container, opener, `Response sent to ${poster.name}.`);
      refreshOpportunityLists();
      container.querySelector("button[type=submit]")?.focus();
    });
    container.append(form);
  }

  function renderOpportunityResponses(opportunity, container, opener) {
    if (opportunity.member) {
      renderMemberOpportunityResponses(opportunity, container, opener);
      return;
    }
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
    const own = profiles.filter((item) => isOwn(item) && item.id !== opportunity.companyId);
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
    if (ACCOUNTS_ENABLED) body.append(element("p", "form-hint", "Posts from your published companies are visible to everyone on BOND. Posts from browser drafts and sample companies stay in this browser."));
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
    const title = field("input", "opportunity-headline", "Headline", { maxLength: 100, required: true, placeholder: "Looking for a website developer" });
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
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submit.disabled) return;
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
      const poster = resolveProfile(record.companyId);
      if (poster?.member) {
        submit.disabled = true;
        status.textContent = "Posting…";
        let posted;
        try {
          posted = await postMemberOpportunity(record, poster);
        } catch (error) {
          submit.disabled = false;
          status.textContent = error.message;
          return;
        }
        currentOpportunityFilter = "All";
        refreshOpportunityLists();
        openOpportunity(posted, opener);
        announce("Opportunity posted. Everyone on BOND can see it now.");
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
    who.append(name, element("span", "feed-meta", `${profile.category} · ${timeAgo(post.at)} · ${post.member ? "Member update" : post.local ? "Shared in this browser" : "Sample update"}`));
    head.append(avatar, who);
    if (showCompany && !isOwn(profile)) head.append(followButton(profile, "button button-secondary feed-follow"));
    card.setAttribute("aria-label", `${postTypes[post.type]} from ${profile.name}`);
    card.append(head, element("span", "feed-type", postTypes[post.type]), element("p", "feed-text", post.text));
    const actions = element("div", "feed-actions");
    const linkedEvent = findEvent(post.eventId);
    if (linkedEvent) {
      const viewText = hostingEvent(linkedEvent) || myRsvp(linkedEvent) || !eventIsUpcoming(linkedEvent) ? "View event" : "View and RSVP";
      const viewEvent = element("button", "button button-primary", viewText);
      viewEvent.type = "button";
      viewEvent.setAttribute("aria-label", `${viewText}: ${linkedEvent.title}`);
      viewEvent.addEventListener("click", () => openEvent(linkedEvent, viewEvent));
      actions.append(viewEvent);
    }
    const talk = element("button", `button ${linkedEvent ? "button-secondary" : "button-primary"}`, "Start a conversation");
    talk.type = "button";
    talk.addEventListener("click", () => {
      const firstName = (profile.representative || "").split(" ")[0] || "there";
      const snippet = post.text.length > 60 ? `${post.text.slice(0, 60).trim()}…` : post.text;
      openConversation(profile, talk, `Hi ${firstName}, I saw your update: "${snippet}" `);
    });
    if (!isOwn(profile)) actions.append(talk);
    if (post.local || (post.member && !post.announcement && isOwn(profile))) {
      const remove = element("button", "danger-link", "Remove");
      remove.type = "button";
      remove.addEventListener("click", async () => {
        if (remove.dataset.confirm !== "yes") {
          remove.dataset.confirm = "yes";
          remove.textContent = "Tap again to remove";
          return;
        }
        if (post.member) {
          remove.disabled = true;
          try {
            await deleteMemberUpdate(post);
          } catch (error) {
            remove.disabled = false;
            announce(error.message);
            return;
          }
          refreshFeeds();
          announce("Your update was removed.");
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
      const followCount = [...followedCompanies].filter((id) => resolveProfile(id)).length;
      if (button.dataset.feedFilter === "Following") button.textContent = followCount ? `Following (${followCount})` : "Following";
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
    if (!isOwn(profile)) intro.append(followButton(profile, "button button-secondary"));
    list.append(intro);
    posts.forEach((post) => list.append(feedPostCard(post, { showCompany: false })));
    if (isOwn(profile)) {
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
    if (ACCOUNTS_ENABLED) body.append(element("p", "form-hint", "Updates from your published companies are visible to everyone on BOND. Updates from browser drafts and sample companies stay in this browser."));
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
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submit.disabled) return;
      const text = cleanMessage(textarea.value).slice(0, 500);
      const companyChoice = knownProfileId(picker.select.value) ? picker.select.value : "";
      if (!text || !companyChoice) {
        status.textContent = "Write your update before sharing.";
        textarea.focus();
        return;
      }
      const postType = postTypes[type.value] ? type.value : "project";
      const poster = resolveProfile(companyChoice);
      if (poster?.member) {
        const visibleText = visibleUpdateText(text);
        if (!visibleText) {
          status.textContent = "Write your update before sharing.";
          textarea.focus();
          return;
        }
        submit.disabled = true;
        status.textContent = "Sharing…";
        try {
          await postMemberUpdate(postType, visibleText, poster);
        } catch (error) {
          submit.disabled = false;
          status.textContent = error.message;
          return;
        }
        currentFeedFilter = "All";
        refreshFeeds();
        dialog.close();
        announce("Update shared. Everyone on BOND can see it now.");
        return;
      }
      const post = { id: newId("post"), type: postType, companyId: companyChoice, text, at: new Date().toISOString(), local: true };
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

  function eventCard(event, { showHost = true } = {}) {
    const profile = resolveProfile(event.companyId);
    const card = element("article", "event-card");
    const title = element("h3", "", event.title);
    title.id = `event-${event.id}-${showHost ? "card" : "profile"}`;
    card.setAttribute("aria-labelledby", title.id);
    const start = new Date(event.start);
    const date = element("div", "event-date");
    date.setAttribute("aria-hidden", "true");
    date.append(element("span", "", start.toLocaleDateString(undefined, { month: "short" })), element("strong", "", String(start.getDate())));
    const main = element("div", "event-card-main");
    main.append(element("p", "event-kicker", `${eventFormats[event.format]} · ${eventWhen(event)}`), title);
    if (showHost && profile) {
      const host = element("button", "feed-company", `Hosted by ${profile.name}`);
      host.type = "button";
      host.addEventListener("click", () => openCompany(profile, host));
      main.append(host);
    }
    if (event.format !== "online") main.append(element("p", "event-meta", event.location || "Location shared with attendees"));
    const flags = element("p", "event-meta");
    if (!eventIsUpcoming(event)) flags.append("Ended");
    else if (event.local) flags.append("Your event · Saved in this browser, so members can't RSVP");
    else {
      const going = eventGoing(event);
      flags.append(`${hostingEvent(event) ? "Your event · " : ""}${going} going${event.capacity ? ` · ${Math.max(event.capacity - going, 0)} ${event.capacity - going === 1 ? "seat" : "seats"} left` : ""}`);
      if (myRsvp(event)) flags.append(element("span", "event-going", "You're going"));
    }
    main.append(flags);
    const viewText = hostingEvent(event) || myRsvp(event) || !eventIsUpcoming(event) ? "View event" : "View and RSVP";
    const view = element("button", "button button-secondary", viewText);
    view.type = "button";
    view.setAttribute("aria-label", `${viewText}: ${event.title}`);
    view.addEventListener("click", () => openEvent(event, view));
    main.append(view);
    card.append(date, main);
    return card;
  }

  function filteredEvents() {
    return allEvents().filter((event) => eventIsUpcoming(event) && resolveProfile(event.companyId) && (
      currentEventFilter === "All"
      || (currentEventFilter === "Going" && myRsvp(event))
      || (currentEventFilter === "Hosting" && hostingEvent(event))
      || (currentEventFilter === "online" && event.format !== "in-person")
      || (currentEventFilter === "in-person" && event.format !== "online")));
  }

  function renderEvents() {
    const grid = document.getElementById("events-grid");
    if (!grid) return;
    const upcoming = allEvents().filter((event) => eventIsUpcoming(event) && resolveProfile(event.companyId));
    const visible = filteredEvents();
    grid.replaceChildren();
    if (!visible.length) {
      grid.append(element("p", "feed-empty", currentEventFilter === "Going"
        ? "You haven't RSVP'd to an event yet. Open an event and tap RSVP to save your spot."
        : currentEventFilter === "Hosting" ? "You're not hosting an event yet. Tap Host an event to schedule one." : "No upcoming events match this filter."));
    }
    visible.forEach((event) => grid.append(eventCard(event)));
    document.querySelectorAll("[data-event-filter]").forEach((button) => {
      const active = button.dataset.eventFilter === currentEventFilter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const status = document.getElementById("events-status");
    if (status) {
      const mine = upcoming.filter(hostingEvent).length;
      status.textContent = `Showing ${visible.length} of ${upcoming.length} upcoming events.${mine ? ` You're hosting ${mine}.` : ""}`;
    }
  }

  function renderCompanyEvents(profile, block) {
    let list = block.querySelector("[data-company-events]");
    if (!list) {
      list = element("div", "company-events");
      list.dataset.companyEvents = profile.id;
      block.append(list);
    }
    list.replaceChildren();
    const events = allEvents().filter((event) => event.companyId === profile.id && eventIsUpcoming(event));
    list.append(element("p", "dialog-copy", events.length
      ? "Demos, workshops, open houses, and Q&As this company is hosting."
      : isOwn(profile) ? "You haven't scheduled an event yet." : "No upcoming events."));
    events.forEach((event) => list.append(eventCard(event, { showHost: false })));
    if (isOwn(profile)) {
      const host = element("button", "button button-secondary", "Host an event");
      host.type = "button";
      host.addEventListener("click", () => openHostEvent(host, profile.id));
      list.append(host);
    }
  }

  function refreshEvents() {
    renderEvents();
    document.querySelectorAll("[data-company-events]").forEach((list) => {
      const profile = resolveProfile(list.dataset.companyEvents);
      if (profile && list.parentElement) renderCompanyEvents(profile, list.parentElement);
    });
    refreshFeeds();
  }

  function cancelHostedEvent(event) {
    const index = hostedEvents.findIndex((item) => item.id === event.id);
    if (index !== -1) hostedEvents.splice(index, 1);
    for (let i = postedUpdates.length - 1; i >= 0; i -= 1) {
      if (postedUpdates[i].eventId === event.id) postedUpdates.splice(i, 1);
    }
    saveHostedEvents();
    savePostedUpdates();
    refreshEvents();
  }

  function openEvent(event, opener) {
    const profile = resolveProfile(event.companyId);
    const view = prepareDialog(`${eventFormats[event.format]} event · ${hostingEvent(event) ? "Hosted by you" : "Hosted on BOND"}`, event.title);
    if (!view || !profile) return;
    const { dialog, body } = view;
    const host = element("div", "opportunity-poster");
    const avatar = element("div", "company-avatar");
    avatar.classList.toggle("has-uploaded-logo", Boolean(profile.logo));
    avatar.append(companyLogo(profile));
    const name = element("div", "opportunity-poster-name");
    name.append(element("strong", "", profile.name), element("span", "", `Host · ${profile.category} · ${profile.location}`));
    const openProfile = element("button", "company-link", "View company");
    openProfile.type = "button";
    openProfile.addEventListener("click", () => openCompany(profile, opener));
    host.append(avatar, name, openProfile);
    body.append(host);
    const facts = element("dl", "event-facts");
    const fact = (term, value) => {
      const detail = element("dd", "", value);
      facts.append(element("dt", "", term), detail);
      return detail;
    };
    fact("When", eventWhen(event, { long: true }));
    fact("Where", eventWhere(event));
    if (event.capacity) fact("Seats", `${event.capacity} total`);
    if (!event.local) fact("Going", "").classList.add("event-going-count");
    body.append(facts, element("p", "dialog-copy event-description", event.description));
    const rsvp = element("div", "event-rsvp");
    body.append(rsvp);
    renderEventRsvp(event, rsvp);
    showDialog(dialog, opener);
    rsvp.querySelector("button")?.focus();
  }

  function renderEventRsvp(event, container) {
    container.replaceChildren();
    const goingCount = container.parentElement?.querySelector(".event-going-count");
    if (goingCount) goingCount.textContent = `${eventGoing(event)}${event.sample ? " (sample count)" : ""}`;
    const calendar = () => {
      const button = element("button", "button button-secondary", "Add to calendar");
      button.type = "button";
      button.addEventListener("click", () => {
        downloadEventCalendar(event);
        announce("Calendar file downloaded. Open it to add the event to your calendar.");
      });
      return button;
    };
    const joinLink = () => {
      const href = eventJoinLink(event);
      if (!href || event.format === "in-person") return null;
      const link = element("a", "company-link event-join", "Join link");
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      return link;
    };
    const actions = element("div", "chat-actions");
    if (!eventIsUpcoming(event)) {
      container.append(element("p", "dialog-copy", "This event has ended."));
      return;
    }
    if (event.local) {
      container.append(element("h3", "detail-label", "You're hosting this event"));
      container.append(element("p", "dialog-copy", "It's listed under Upcoming events, on your company profile, and in the activity feed, so followers see it on their dashboards. It's saved in this browser, so other members can't RSVP. Publish the hosting company to your account to take RSVPs."));
      actions.append(calendar());
      const link = joinLink();
      if (link) actions.append(link);
      const cancel = element("button", "danger-link", "Cancel this event");
      cancel.type = "button";
      cancel.addEventListener("click", () => {
        if (cancel.dataset.confirm !== "yes") {
          cancel.dataset.confirm = "yes";
          cancel.textContent = "Tap again to cancel the event";
          return;
        }
        cancelHostedEvent(event);
        document.getElementById("company-dialog")?.close();
        announce("Your event was cancelled and removed.");
      });
      actions.append(cancel);
      container.append(actions);
      return;
    }
    const status = element("p", "chat-status");
    status.setAttribute("role", "status");
    const rerender = (message) => {
      refreshEvents();
      renderEventRsvp(event, container);
      container.querySelector("button")?.focus();
      announce(message);
    };
    if (event.member && hostingEvent(event)) {
      const attendees = eventAttendees(event);
      container.append(element("h3", "detail-label", "You're hosting this event"));
      container.append(element("p", "dialog-copy", "Everyone on BOND can see it under Upcoming events, on your company profile, and in the activity feed. Only you and the people who RSVP see the join link."));
      const list = element("ul", "event-attendees");
      list.setAttribute("aria-label", "RSVPs");
      for (const row of attendees) {
        const company = resolveProfile(row.from);
        list.append(element("li", "", `${company ? company.name : "A BOND member"} · RSVP'd ${shortDate(row.at)}`));
      }
      container.append(element("p", "form-hint", attendees.length
        ? `${attendees.length} ${attendees.length === 1 ? "RSVP" : "RSVPs"}. Members attending as themselves are shown as "A BOND member".`
        : "No RSVPs yet."));
      if (attendees.length) container.append(list);
      if (!container.dataset.attendeesLoaded) {
        container.dataset.attendeesLoaded = "yes";
        loadEventAttendees(event).then((loaded) => {
          if (loaded && container.isConnected) renderEventRsvp(event, container);
        });
      }
      actions.append(calendar());
      const link = joinLink();
      if (link) actions.append(link);
      const cancel = element("button", "danger-link", "Cancel this event");
      cancel.type = "button";
      cancel.addEventListener("click", async () => {
        if (cancel.dataset.confirm !== "yes") {
          cancel.dataset.confirm = "yes";
          cancel.textContent = attendees.length ? "Tap again to cancel the event and its RSVPs" : "Tap again to cancel the event";
          return;
        }
        cancel.disabled = true;
        try {
          await cancelMemberEvent(event);
        } catch (error) {
          cancel.disabled = false;
          status.textContent = error.message;
          return;
        }
        refreshEvents();
        document.getElementById("company-dialog")?.close();
        announce("Your event was cancelled and removed.");
      });
      actions.append(cancel);
      container.append(actions, status);
      return;
    }
    const mine = myRsvp(event);
    if (mine) {
      const as = resolveProfile(mine.from);
      const host = resolveProfile(event.companyId);
      container.append(element("h3", "detail-label", "You're going"));
      container.append(element("p", "dialog-copy", event.member
        ? `RSVP'd ${shortDate(mine.at)}${as ? ` as ${as.name}` : ""}. ${host ? host.name : "The host"} can see ${as ? "that your company is coming" : "an RSVP from a BOND member"}.`
        : `RSVP'd ${shortDate(mine.at)}${as ? ` as ${as.name}` : ""}. Saved in this browser; sample events can't receive RSVPs.`));
      actions.append(calendar());
      const link = joinLink();
      if (link) actions.append(link);
      const cancel = element("button", "danger-link", "Cancel my RSVP");
      cancel.type = "button";
      cancel.addEventListener("click", async () => {
        if (event.member) {
          cancel.disabled = true;
          try {
            await cancelMemberRsvp(event);
          } catch (error) {
            cancel.disabled = !memberEvents.includes(event);
            status.textContent = error.message;
            if (cancel.disabled) refreshEvents();
            return;
          }
        } else {
          delete eventRsvps[event.id];
          saveRsvps();
        }
        rerender("Your RSVP was cancelled.");
      });
      actions.append(cancel);
      container.append(actions, status);
      return;
    }
    if (event.capacity && eventGoing(event) >= event.capacity) {
      container.append(element("p", "dialog-copy", "This event is full."));
      return;
    }
    container.append(element("h3", "detail-label", "Save your spot"));
    if (event.member && !account.user) {
      const signIn = element("button", "button button-primary", "Sign in to RSVP");
      signIn.type = "button";
      signIn.addEventListener("click", () => openAccount(signIn));
      container.append(element("p", "form-hint", "Sign in to RSVP. The host sees your company name if you attend as a company, and never your email address."), signIn);
      return;
    }
    const form = element("form", "chat-form");
    const picker = event.member
      ? memberRsvpPicker(event)
      : companyPicker(`rsvp-company-${event.id}`, "Attending as", { includeNone: true });
    const submit = element("button", "button button-primary", "RSVP: I'll be there");
    submit.type = "submit";
    form.append(picker.label, picker.select, submit, status);
    form.addEventListener("submit", async (submitEvent) => {
      submitEvent.preventDefault();
      if (submit.disabled) return;
      if (event.member) {
        const as = resolveProfile(picker.select.value);
        submit.disabled = true;
        status.textContent = "Saving your RSVP…";
        try {
          await rsvpMemberEvent(event, as?.member && as.mine ? as : null);
        } catch (error) {
          if (/cancelled by its host/.test(error.message)) forgetMemberEvents((item) => item.id === event.id);
          submit.disabled = !memberEvents.includes(event);
          status.textContent = error.message;
          if (submit.disabled) refreshEvents();
          return;
        }
        rerender(`You're going. ${resolveProfile(event.companyId)?.name || "The host"} can see your RSVP.`);
        return;
      }
      eventRsvps[event.id] = { from: knownProfileId(picker.select.value) ? picker.select.value : "", at: new Date().toISOString() };
      const persisted = saveRsvps();
      refreshEvents();
      renderEventRsvp(event, container);
      container.querySelector("button")?.focus();
      announce(persisted ? "You're going. Your RSVP is saved in this browser." : "You're going for this visit; browser storage is unavailable.");
    });
    container.append(form);
  }

  function localDateValue(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function openHostEvent(opener, companyId = "") {
    const view = prepareDialog("Events · Host an event", "Schedule your event");
    if (!view) return;
    const { dialog, body } = view;
    body.append(element("p", "dialog-copy", "Host a demo, workshop, open house, or Q&A. It's listed under Upcoming events, on your company profile, and in the activity feed, where followers see it."));
    const form = element("form", "opportunity-form event-form");
    const picker = companyPicker("event-company", "Hosted by", { selected: companyId });
    if (!picker.hasOwn) createProfileHint(body);
    if (ACCOUNTS_ENABLED) body.append(element("p", "form-hint", "Events from your published companies are visible to everyone on BOND, and members can RSVP. Events from browser drafts and sample companies stay in this browser."));
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
    const title = field("input", "event-title", "Event name", { maxLength: 100, required: true, placeholder: "Open house at our new shop" });
    const formatLabel = element("label", "", "Format");
    formatLabel.htmlFor = "event-format";
    const format = element("select");
    format.id = "event-format";
    for (const [value, text] of Object.entries(eventFormats)) format.append(new Option(text, value));
    form.append(formatLabel, format);
    const tomorrow = new Date(Date.now() + DAY_MS);
    const date = field("input", "event-date", "Date", { type: "date", required: true, value: localDateValue(tomorrow), min: localDateValue(new Date()), max: localDateValue(new Date(Date.now() + 365 * DAY_MS)) });
    const time = field("input", "event-time", "Start time", { type: "time", required: true, value: "10:00" });
    const durationLabel = element("label", "", "Length");
    durationLabel.htmlFor = "event-duration";
    const duration = element("select");
    duration.id = "event-duration";
    eventDurations.forEach((minutes) => duration.append(new Option(minutes < 60 ? `${minutes} minutes` : `${minutes / 60} ${minutes === 60 ? "hour" : "hours"}`, String(minutes))));
    duration.value = "60";
    form.append(durationLabel, duration);
    const location = field("input", "event-location", "Address or city", { maxLength: 120, placeholder: "1200 Harbor Dr, San Diego" });
    const locationHint = element("p", "form-hint", "Needed for in-person and hybrid events.");
    form.append(locationHint);
    const link = field("input", "event-link", "Join link (optional)", { type: "url", maxLength: 300, placeholder: "https://…" });
    const linkHint = element("p", "form-hint", "For online and hybrid events. Only people who RSVP see it.");
    form.append(linkHint);
    const description = field("textarea", "event-description", "What will happen?", { rows: 4, maxLength: 800, required: true, placeholder: "What attendees will see, learn, or get to ask." });
    description.classList.add("chat-input");
    const capacity = field("input", "event-capacity", "Seats (optional)", { type: "number", min: "1", max: "5000", inputMode: "numeric", placeholder: "No limit" });
    const status = element("p", "chat-status");
    status.setAttribute("role", "status");
    const submit = element("button", "button button-primary", "Host this event");
    submit.type = "submit";
    const actions = element("div", "chat-actions");
    actions.append(submit, dictationButton(description, status));
    form.append(actions, status);
    const syncFormat = () => {
      const online = format.value === "online";
      location.required = !online;
      location.disabled = online;
      link.disabled = format.value === "in-person";
      locationHint.textContent = online ? "Not needed for online events." : "Needed for in-person and hybrid events.";
      linkHint.textContent = format.value === "in-person" ? "Not needed for in-person events." : "For online and hybrid events. Only people who RSVP see it.";
    };
    format.addEventListener("change", syncFormat);
    format.value = "in-person";
    syncFormat();
    form.addEventListener("submit", async (submitEvent) => {
      submitEvent.preventDefault();
      if (submit.disabled) return;
      const fail = (message, input) => {
        status.textContent = message;
        input.focus();
      };
      const host = knownProfileId(picker.select.value) ? picker.select.value : "";
      const name = cleanText(title.value, 100);
      const details = cleanMessage(description.value).slice(0, 800);
      const chosenFormat = eventFormats[format.value] ? format.value : "in-person";
      const start = /^\d{4}-\d{2}-\d{2}$/.test(date.value) && /^\d{2}:\d{2}$/.test(time.value) ? new Date(`${date.value}T${time.value}`) : null;
      const where = chosenFormat === "online" ? "" : cleanText(location.value, 120);
      const joinUrl = chosenFormat === "in-person" ? "" : normalizeEventLink(link.value);
      const seats = capacity.value ? Number(capacity.value) : 0;
      if (!host) return fail("Choose the company hosting this event.", picker.select);
      if (!name) return fail("Give your event a name.", title);
      if (!start || !Number.isFinite(start.getTime()) || start.getTime() <= Date.now()) return fail("Pick a date and start time in the future.", date);
      if (start.getTime() > Date.now() + 366 * DAY_MS) return fail("Pick a date within the next year.", date);
      if (chosenFormat !== "online" && !where) return fail("Add an address or city for in-person and hybrid events.", location);
      if (joinUrl === null) return fail("Use a secure https:// join link.", link);
      if (!Number.isInteger(seats) || seats < 0 || seats > 5000) return fail("Seats must be a whole number up to 5,000.", capacity);
      if (!details) return fail("Describe what will happen at the event.", description);
      const record = {
        id: newId("evt"), companyId: host, title: name, format: chosenFormat, start: start.toISOString(),
        duration: eventDurations.includes(Number(duration.value)) ? Number(duration.value) : 60,
        location: where, link: joinUrl, description: details, capacity: seats, going: 0, at: new Date().toISOString(), local: true,
      };
      const hostProfile = resolveProfile(host);
      if (hostProfile?.member) {
        const visible = (value) => value.replace(HIDDEN_TEXT_CHARACTERS, "").replace(LINE_SEPARATORS, "\n").replace(/\t/g, " ").replace(CONTROL_CHARACTERS, "").trim();
        const oneLine = (value) => visible(value).replace(/\s+/g, " ");
        Object.assign(record, { title: oneLine(record.title), location: oneLine(record.location), description: visible(record.description) });
        if (!record.title) return fail("Give your event a name.", title);
        if (!record.description) return fail("Describe what will happen at the event.", description);
        submit.disabled = true;
        status.textContent = "Scheduling…";
        let hosted;
        try {
          hosted = await hostMemberEvent(record, hostProfile);
        } catch (error) {
          submit.disabled = false;
          status.textContent = error.message;
          return;
        }
        currentEventFilter = "All";
        refreshEvents();
        openEvent(hosted, opener);
        announce("Your event is scheduled. Everyone on BOND can see it and RSVP.");
        return;
      }
      hostedEvents.push(record);
      const persisted = saveHostedEvents();
      postedUpdates.unshift({
        id: newId("post"), type: "event", companyId: host, eventId: record.id, at: record.at, local: true,
        text: `We're hosting "${name}" on ${eventWhen(record)}. ${eventWhere(record)}.`,
      });
      savePostedUpdates();
      currentEventFilter = "All";
      refreshEvents();
      openEvent(record, opener);
      announce(persisted ? "Your event is scheduled. It's saved in this browser." : "Your event is scheduled for this visit; browser storage is unavailable.");
    });
    body.append(form);
    showDialog(dialog, opener);
    title.focus();
  }

  function wordText(value) {
    return ` ${String(value || "").toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
  }

  function needById(id) {
    return projectNeeds.find((need) => need.id === id);
  }

  function needForCategory(category) {
    return projectNeeds.find((need) => need.category === category);
  }

  function detectNeeds(brief) {
    const text = wordText(brief);
    return projectNeeds
      .map((need, index) => ({ id: need.id, index, hits: need.words.filter((word) => text.includes(` ${word} `)).length }))
      .filter((entry) => entry.hits)
      .sort((a, b) => b.hits - a.hits || a.index - b.index)
      .slice(0, 5)
      .map((entry) => entry.id);
  }

  function joinNames(names) {
    if (typeof Intl !== "undefined" && typeof Intl.ListFormat === "function") return new Intl.ListFormat("en", { type: "conjunction" }).format(names);
    return names.join(", ");
  }

  function verificationLabel(profile) {
    return profile.local || profile.member ? "Self-reported · Not verified yet" : "Sample company · Not verified";
  }

  function scoreCompanyForNeed(profile, need, { briefTerms, city, preference }) {
    const inIndustry = profile.category === need.category;
    const text = wordText([profile.description, profile.tagline || "", ...profile.services].join(" "));
    const hits = need.words.filter((word) => text.includes(` ${word} `)).length;
    if (!inIndustry && !hits) return null;
    const services = profile.services.filter((service) => need.words.some((word) => wordText(service).includes(` ${word} `)));
    const terms = matchTerms(profile);
    const shared = [...briefTerms].filter((term) => terms.has(term)).slice(0, 3);
    const sameCity = Boolean(city) && cityOf(profile) === city;
    const preferred = Boolean(preference) && profile.ownership === preference;
    const reasons = [];
    if (shared.length) reasons.push(`Mentions what you need: ${shared.join(", ")}`);
    if (sameCity) reasons.push(`Based in ${profile.location.split(",")[0]}`);
    if (preferred) reasons.push(`${profile.ownership} (self-reported)`);
    return { score: (inIndustry ? 3 : 0) + Math.min(hits, 3) * 1.5 + shared.length + (sameCity ? 1 : 0) + (preferred ? 1 : 0), reasons, services };
  }

  function suggestTeam(brief, needIds, { city = "", preference = "", exclude = [] } = {}) {
    const briefTerms = new Set([...matchTerms({ description: brief, services: [] })].filter((term) => !briefStopwords.has(term)));
    const context = { briefTerms, city: city.split(",")[0].trim().toLocaleLowerCase(), preference };
    const skip = new Set(exclude);
    const candidates = profiles.filter((profile) => !isOwn(profile) && !skip.has(profile.id));
    const members = new Map();
    const extras = new Map();
    const uncovered = [];
    for (const id of needIds) {
      const need = needById(id);
      if (!need) continue;
      const ranked = candidates.flatMap((profile) => {
        const fit = scoreCompanyForNeed(profile, need, context);
        return fit ? [{ profile, ...fit }] : [];
      }).sort((a, b) => b.score - a.score || a.profile.name.localeCompare(b.profile.name));
      if (!ranked.length) {
        uncovered.push(need);
        continue;
      }
      const [best, next] = ranked;
      const member = members.get(best.profile.id);
      if (member) {
        member.needs.push(need.id);
        member.score = Math.max(member.score, best.score);
        best.reasons.forEach((reason) => { if (!member.reasons.includes(reason)) member.reasons.push(reason); });
        best.services.forEach((service) => { if (!member.services.includes(service)) member.services.push(service); });
      } else {
        members.set(best.profile.id, { profile: best.profile, needs: [need.id], score: best.score, reasons: best.reasons, services: best.services });
      }
      if (next && next.score >= 3 && !extras.has(next.profile.id)) {
        extras.set(next.profile.id, { profile: next.profile, needs: [need.id], score: next.score, reasons: [`Another option for ${need.label.toLocaleLowerCase()}`, ...next.reasons], services: next.services });
      }
    }
    for (const id of members.keys()) extras.delete(id);
    const team = [...members.values()];
    if (team.length) {
      const lead = team[0].profile;
      for (const match of findMatches(lead)) {
        if (extras.size >= 4) break;
        if (match.type === "Customer" || match.reasons[0] === "Overlapping capabilities") continue;
        if (isOwn(match.profile) || skip.has(match.profile.id) || members.has(match.profile.id) || extras.has(match.profile.id)) continue;
        const reason = match.reasons[0];
        extras.set(match.profile.id, { profile: match.profile, needs: [], score: match.score, services: [],
          reasons: [`${matchTypes[match.type]} for ${lead.name}: ${reason.charAt(0).toLocaleLowerCase()}${reason.slice(1)}`] });
      }
    }
    return { team, extras: [...extras.values()].slice(0, 4), uncovered };
  }

  function roomTitleFrom(brief) {
    const first = cleanText(brief.split(/[.!?\n]/)[0], 200)
      .replace(/^(?:i|we)(?:'m|'re| am| are)?\s+(?:need|want|would like|looking|planning|plan|hope)\s+(?:to\s+|for\s+)?/i, "")
      .replace(/^(?:looking|planning|hoping)\s+(?:to|for)\s+/i, "");
    let title = first.charAt(0).toLocaleUpperCase() + first.slice(1);
    if (title.length > 60) {
      const clause = [...title.matchAll(/, | that | which | so | with | for (?:our|my|the) /g)].find((match) => match.index >= 12);
      if (clause) title = title.slice(0, clause.index);
    }
    if (title.length > 80) title = `${title.slice(0, 79).replace(/\s+\S*$/, "")}…`;
    return title || "New project";
  }

  function roomHref(room) {
    return `room.html?id=${encodeURIComponent(room.id)}`;
  }

  function roomSummary(room) {
    const companies = room.members.length;
    const proposals = room.proposals.length;
    const next = room.meetings.filter(eventIsUpcoming).sort((a, b) => Date.parse(a.start) - Date.parse(b.start))[0];
    return [
      `${companies} ${companies === 1 ? "company" : "companies"}`,
      proposals ? `${proposals} ${proposals === 1 ? "proposal" : "proposals"}` : "",
      next ? `Next meeting ${eventWhen(next)}` : `Updated ${shortDate(room.updated)}`,
    ].filter(Boolean).join(" · ");
  }

  function pushRoomMessage(room, message) {
    room.messages.push(message);
    if (room.messages.length > MAX_ROOM_MESSAGES) room.messages.splice(0, room.messages.length - MAX_ROOM_MESSAGES);
    room.updated = message.at;
  }

  function createRoom({ title, brief, needs, city = "", preference = "", owner = "", members }) {
    const at = new Date().toISOString();
    const room = {
      id: newId("room"), title, brief, needs: [...needs], city, preference, owner, at, updated: at,
      members: members.map((member) => ({ companyId: member.companyId, needs: member.needs, at })), messages: [], meetings: [], proposals: [],
    };
    const names = room.members.map((member) => resolveProfile(member.companyId)?.name).filter(Boolean);
    pushRoomMessage(room, { from: "", note: true, at, text: `Room opened with ${joinNames(names)}. Invitations are sent when BOND launches accounts; until then this room stays in this browser.` });
    opportunityRooms.unshift(room);
    if (saveRooms()) return room;
    opportunityRooms.shift();
    return null;
  }

  function addRoomMember(room, companyId, needIds) {
    const profile = resolveProfile(companyId);
    const covers = needIds || room.needs.filter((id) => needById(id).category === profile.category);
    const at = new Date().toISOString();
    room.members.push({ companyId: profile.id, needs: covers, at });
    const forText = covers.length ? ` for ${joinNames(covers.map((id) => needById(id).label.toLocaleLowerCase()))}` : "";
    pushRoomMessage(room, { from: "", note: true, at, text: `You invited ${profile.name}${forText}.` });
    return saveRooms();
  }

  function roomCandidateCard(entry, { lead = false, extra = false } = {}) {
    const { profile } = entry;
    const item = element("li", "match-card room-candidate");
    const head = element("div", "match-head");
    const logo = element("span", "company-avatar match-logo");
    logo.append(companyLogo(profile));
    const name = element("div", "match-name");
    name.append(element("strong", "", profile.name), element("span", "", profile.category));
    head.append(logo, name);
    const tags = element("p", "match-tags");
    tags.append(element("span", "match-type", extra ? "Optional" : lead ? "Lead" : "Team member"));
    if (entry.needs.length) tags.append(element("span", "match-strength", matchStrength(entry.score)));
    item.append(head, tags);
    if (!extra && entry.needs.length) item.append(element("p", "room-covers", `Covers ${joinNames(entry.needs.map((id) => needById(id).label.toLocaleLowerCase()))}`));
    const reasons = element("ul", "match-reasons");
    entry.reasons.slice(0, 3).forEach((reason) => reasons.append(element("li", "", reason)));
    if (entry.reasons.length) item.append(reasons);
    const facts = element("dl", "room-quals");
    const fact = (term, value) => {
      if (value) facts.append(element("dt", "", term), element("dd", "", value));
    };
    fact("Capabilities", (entry.services.length ? entry.services : profile.services).slice(0, 3).join(", "));
    fact("Certifications", (profile.certifications || []).slice(0, 2).join(", "));
    fact("Community", ownershipOptions.includes(profile.ownership) ? `${profile.ownership} · Self-reported` : "");
    fact("Verified", verificationLabel(profile));
    const pick = element("label", "room-pick");
    const box = element("input");
    box.type = "checkbox";
    box.name = "room-member";
    box.value = profile.id;
    box.checked = !extra;
    pick.append(box, element("span", "", `Invite ${profile.name}`));
    const view = element("button", "company-link", "View company profile");
    view.type = "button";
    view.setAttribute("aria-label", `View ${profile.name} profile`);
    view.addEventListener("click", () => openCompany(profile, view));
    item.append(facts, pick, view);
    return item;
  }

  function renderRoomBuilder() {
    const form = document.getElementById("room-brief-form");
    const results = document.getElementById("room-results");
    renderRoomList();
    if (!form || !results) return;
    const brief = form.elements.namedItem("brief");
    const status = document.getElementById("room-brief-status");
    form.querySelector(".room-brief-actions")?.prepend(dictationButton(brief, status));
    form.querySelectorAll("[data-room-example]").forEach((button) => {
      button.addEventListener("click", () => {
        brief.value = button.dataset.roomExample;
        form.requestSubmit();
      });
    });
    brief.addEventListener("input", () => { status.textContent = ""; });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = cleanMessage(brief.value).slice(0, 1500);
      if (text.length < 12) {
        status.textContent = "Describe the project in a sentence or two: what you're building, where, and the help you need.";
        brief.focus();
        return;
      }
      const data = new FormData(form);
      const preference = cleanText(data.get("preference"), 40);
      const state = {
        brief: text, needs: detectNeeds(text), city: cleanText(data.get("city"), 80),
        preference: ownershipOptions.includes(preference) ? preference : "",
      };
      renderRoomSuggestions(state, results);
      results.hidden = false;
      const heading = results.querySelector("h3");
      heading.tabIndex = -1;
      heading.focus();
    });
  }

  function renderRoomSuggestions(state, results) {
    results.replaceChildren();
    const found = state.needs.length > 0;
    results.append(element("h3", "matchmaker-heading", found ? "What this project needs" : "What kind of help does this project need?"));
    results.append(element("p", "room-copy", found
      ? "BOND picked these out of your description. Add or remove any, and the team updates."
      : "BOND couldn't tell from the description. Pick what applies, or add more detail and search again."));
    const picker = element("fieldset", "room-needs-picker");
    picker.append(element("legend", "sr-only", "Project needs"));
    for (const need of projectNeeds) {
      const label = element("label", "room-need-chip");
      const box = element("input");
      box.type = "checkbox";
      box.value = need.id;
      box.checked = state.needs.includes(need.id);
      box.addEventListener("change", () => {
        state.needs = box.checked ? [...state.needs, need.id] : state.needs.filter((id) => id !== need.id);
        drawTeam();
      });
      label.append(box, element("span", "", need.label));
      picker.append(label);
    }
    const teamBox = element("div", "room-team-box");
    const teamStatus = element("p", "sr-only");
    teamStatus.setAttribute("role", "status");
    const create = element("form", "room-form room-create");
    const titleLabel = element("label", "", "Room name");
    titleLabel.htmlFor = "room-title-input";
    const title = element("input");
    title.id = "room-title-input";
    title.maxLength = 80;
    title.required = true;
    title.value = roomTitleFrom(state.brief);
    const owner = companyPicker("room-owner", "Opening the room as", { includeNone: true, selected: profiles.find(isOwn)?.id || "" });
    const submit = element("button", "button button-primary", "Open the Opportunity Room");
    submit.type = "submit";
    const createStatus = element("p", "chat-status");
    createStatus.setAttribute("role", "status");
    const ownerField = element("div");
    ownerField.append(owner.label, owner.select);
    const titleField = element("div");
    titleField.append(titleLabel, title);
    const row = element("div", "room-form-row");
    row.append(titleField, ownerField);
    create.append(element("h3", "matchmaker-heading", "Open a private room for this team"), element("p", "room-copy", "Bring the companies you picked into one place for introductions, conversation, meetings, and proposals."), row, submit, createStatus);
    let suggestion = { team: [], extras: [], uncovered: [] };
    const drawTeam = () => {
      suggestion = suggestTeam(state.brief, state.needs, { city: state.city, preference: state.preference });
      teamBox.replaceChildren();
      if (!state.needs.length) {
        teamBox.append(element("p", "room-copy", "Pick at least one kind of help to see companies."));
        create.hidden = true;
        teamStatus.textContent = "No needs picked.";
        return;
      }
      teamBox.append(element("h3", "matchmaker-heading", "Suggested team"));
      if (suggestion.team.length) {
        const list = element("ul", "match-grid room-team");
        suggestion.team.forEach((entry, index) => list.append(roomCandidateCard(entry, { lead: index === 0 })));
        teamBox.append(list);
      }
      for (const need of suggestion.uncovered) {
        const note = element("p", "room-uncovered");
        note.append(`No company on BOND covers ${need.label.toLocaleLowerCase()} yet. `);
        const post = element("button", "company-link", "Post it on the Opportunity Board");
        post.type = "button";
        post.addEventListener("click", () => openPostOpportunity(post));
        note.append(post);
        teamBox.append(note);
      }
      if (suggestion.extras.length) {
        teamBox.append(element("h3", "detail-label", "Also worth inviting"));
        const list = element("ul", "match-grid room-team");
        suggestion.extras.forEach((entry) => list.append(roomCandidateCard(entry, { extra: true })));
        teamBox.append(list);
      }
      create.hidden = !suggestion.team.length && !suggestion.extras.length;
      teamStatus.textContent = `${suggestion.team.length} ${suggestion.team.length === 1 ? "company" : "companies"} suggested for the team.`;
    };
    create.addEventListener("submit", (event) => {
      event.preventDefault();
      const fail = (message, input) => {
        createStatus.textContent = message;
        input?.focus();
      };
      const ownerId = knownProfileId(owner.select.value) ? owner.select.value : "";
      const name = cleanText(title.value, 80);
      const chosen = [...teamBox.querySelectorAll('input[name="room-member"]:checked')].map((box) => box.value).filter((id) => id !== ownerId && knownProfileId(id));
      if (!name) return fail("Give the room a name.", title);
      if (!chosen.length) return fail("Choose at least one company to invite.", teamBox.querySelector('input[name="room-member"]'));
      if (chosen.length > MAX_ROOM_MEMBERS) return fail(`A room holds up to ${MAX_ROOM_MEMBERS} companies. Uncheck a few.`, teamBox.querySelector('input[name="room-member"]:checked'));
      if (opportunityRooms.length >= MAX_ROOMS) return fail(`You have ${MAX_ROOMS} rooms already. Close one from its room page first.`, submit);
      const entries = [...suggestion.team, ...suggestion.extras];
      const room = createRoom({
        title: name, brief: state.brief, needs: state.needs, city: state.city, preference: state.preference, owner: ownerId,
        members: chosen.map((id) => ({ companyId: id, needs: entries.find((entry) => entry.profile.id === id)?.needs || [] })),
      });
      if (!room) return fail("This browser couldn't save the room. Its storage may be full or turned off.", submit);
      window.location.href = roomHref(room);
    });
    results.append(picker, teamStatus, teamBox, create, element("p", "match-disclosure", "Project reader preview: BOND picks out needs from words in your description and matches them to company profiles, certifications, and locations. AI that reads full project descriptions is planned."));
    drawTeam();
  }

  function renderRoomList() {
    const box = document.getElementById("room-list");
    if (!box) return;
    box.replaceChildren();
    if (!opportunityRooms.length) return;
    box.append(element("h3", "detail-label", "Your Opportunity Rooms"));
    const list = element("ul", "room-list");
    for (const room of opportunityRooms) {
      const item = element("li");
      const link = element("a", "room-list-link");
      link.href = roomHref(room);
      link.append(element("strong", "", room.title), element("span", "", roomSummary(room)));
      item.append(link);
      list.append(item);
    }
    box.append(list);
  }

  function openInviteToRoom(profile, opener) {
    const view = prepareDialog("Opportunity Rooms", `Invite ${profile.name} to a project`);
    if (!view) return;
    const { dialog, body } = view;
    body.append(element("p", "dialog-copy", "An Opportunity Room is a private space for one project: introductions, conversation, meetings, and proposals with the companies you invite."));
    let firstFocus = null;
    if (opportunityRooms.length) {
      body.append(element("h3", "detail-label", "Add to one of your rooms"));
      const status = element("p", "chat-status");
      status.setAttribute("role", "status");
      const list = element("ul", "room-invite-list");
      for (const room of opportunityRooms) {
        const inRoom = room.owner === profile.id || room.members.some((member) => member.companyId === profile.id);
        const full = room.members.length >= MAX_ROOM_MEMBERS;
        const item = element("li");
        const copy = element("div");
        copy.append(element("strong", "", room.title), element("span", "", roomSummary(room)));
        const add = element("button", "button button-secondary", inRoom ? "Already in this room" : full ? "Room is full" : "Add to this room");
        add.type = "button";
        add.disabled = inRoom || full;
        add.setAttribute("aria-label", `${add.textContent}: ${room.title}`);
        add.addEventListener("click", () => {
          const persisted = addRoomMember(room, profile.id);
          add.textContent = "Added";
          add.setAttribute("aria-label", `Added to ${room.title}`);
          add.disabled = true;
          const link = element("a", "company-link", "Open the room");
          link.href = roomHref(room);
          status.replaceChildren(`${profile.name} was added to "${room.title}"${persisted ? "" : " for this visit; browser storage is full or unavailable"}. `, link);
          link.focus();
        });
        if (!add.disabled && !firstFocus) firstFocus = add;
        item.append(copy, add);
        list.append(item);
      }
      body.append(list, status);
    }
    body.append(element("h3", "detail-label", opportunityRooms.length ? "Or start a new room" : "Start a room"));
    const form = element("form", "opportunity-form");
    const field = (tag, id, labelText, attributes = {}) => {
      const label = element("label", "", labelText);
      label.htmlFor = id;
      const input = element(tag);
      input.id = id;
      Object.assign(input, attributes);
      form.append(label, input);
      return input;
    };
    const title = field("input", "invite-room-title", "Project name", { maxLength: 80, required: true, placeholder: "Fleet management platform" });
    const brief = field("textarea", "invite-room-brief", "What's the project? (optional)", { rows: 3, maxLength: 1500, placeholder: "What you're building, where, and the help you need." });
    brief.classList.add("chat-input");
    const owner = companyPicker("invite-room-owner", "Opening the room as", { includeNone: true, selected: profiles.find(isOwn)?.id || "" });
    form.append(owner.label, owner.select);
    const status = element("p", "chat-status");
    status.setAttribute("role", "status");
    const submit = element("button", "button button-primary", `Open a room with ${profile.name}`);
    submit.type = "submit";
    const actions = element("div", "chat-actions");
    actions.append(submit, dictationButton(brief, status));
    form.append(actions, status);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const fail = (message, input) => {
        status.textContent = message;
        input.focus();
      };
      const name = cleanText(title.value, 80);
      const ownerId = knownProfileId(owner.select.value) ? owner.select.value : "";
      if (!name) return fail("Give the project a name.", title);
      if (ownerId === profile.id) return fail(`Choose who is opening the room. ${profile.name} is the company you're inviting.`, owner.select);
      if (opportunityRooms.length >= MAX_ROOMS) return fail(`You have ${MAX_ROOMS} rooms already. Close one from its room page first.`, submit);
      const text = cleanMessage(brief.value).slice(0, 1500);
      const own = needForCategory(profile.category);
      const room = createRoom({
        title: name, brief: text, needs: [...new Set([...(own ? [own.id] : []), ...detectNeeds(text)])], owner: ownerId,
        members: [{ companyId: profile.id, needs: own ? [own.id] : [] }],
      });
      if (!room) return fail("This browser couldn't save the room. Its storage may be full or turned off.", submit);
      window.location.href = roomHref(room);
    });
    body.append(form);
    showDialog(dialog, opener);
    (firstFocus || title).focus();
  }

  function renderOpportunityRoom() {
    const container = document.getElementById("opportunity-room");
    if (!container) return;
    container.replaceChildren();
    const requestedId = new URLSearchParams(window.location.search).get("id");
    const room = opportunityRooms.find((entry) => entry.id === requestedId);
    if (!room) {
      const notice = element("section", "profile-not-found");
      notice.append(element("p", "dialog-kicker", "Opportunity Room"), element("h1", "", requestedId ? "This room isn't available here." : "Choose an Opportunity Room."));
      notice.append(element("p", "dialog-copy", requestedId
        ? "In this preview, rooms are saved in the browser where they were opened, so this one may be in another browser or it was closed."
        : "Describe a project and BOND suggests companies to build it with, then opens a private room for the team."));
      const start = element("a", "button button-primary", "Start an Opportunity Room");
      start.href = "index.html#rooms";
      const dashboard = element("a", "company-link", "Your rooms on the dashboard");
      dashboard.href = "dashboard.html#rooms";
      notice.append(start, dashboard);
      container.append(notice);
      return;
    }
    document.title = `${room.title} — BOND Opportunity Room`;
    const ownerProfile = resolveProfile(room.owner);
    const ownerName = ownerProfile ? ownerProfile.name : "You";
    const save = () => {
      room.updated = new Date().toISOString();
      return saveRooms();
    };
    const saved = (persisted, text) => persisted ? text : `${text} Saved for this visit only; browser storage is full or unavailable.`;
    const memberIds = () => room.members.map((member) => member.companyId);
    const button = (text, className, key, onClick, label) => {
      const node = element("button", className, text);
      node.type = "button";
      node.dataset.roomKey = key;
      if (label) node.setAttribute("aria-label", label);
      node.addEventListener("click", () => onClick(node));
      return node;
    };
    const confirmButton = (text, confirmText, key, onConfirm, label) => {
      const node = button(text, "button button-secondary room-danger", key, () => {
        if (node.dataset.armed) return onConfirm();
        node.dataset.armed = "true";
        node.textContent = confirmText;
        node.setAttribute("aria-label", label ? `${confirmText}: ${label}` : confirmText);
      }, label ? `${text}: ${label}` : undefined);
      node.addEventListener("blur", () => {
        delete node.dataset.armed;
        node.textContent = text;
        if (label) node.setAttribute("aria-label", `${text}: ${label}`);
        else node.removeAttribute("aria-label");
      });
      return node;
    };
    const field = (form, tag, id, labelText, attributes = {}) => {
      const label = element("label", "", labelText);
      label.htmlFor = id;
      const input = element(tag);
      input.id = id;
      Object.assign(input, attributes);
      form.append(label, input);
      return input;
    };

    const head = element("header", "room-head");
    head.append(element("p", "dialog-kicker", "Opportunity Room · Private"), element("h1", "", room.title));
    head.append(element("p", "room-meta", `Opened ${shortDate(room.at)} by ${ownerProfile ? ownerProfile.name : "you"}`));
    head.append(element("p", "room-privacy", "Only the companies you invite can see this room. In this preview it is saved in this browser, and invitations are sent when BOND launches accounts."));
    const nav = element("nav", "profile-section-nav room-nav");
    nav.setAttribute("aria-label", "Room sections");
    const layout = element("div", "room-layout");
    const mainColumn = element("div", "room-main");
    const sideColumn = element("div", "room-side");
    layout.append(mainColumn, sideColumn);
    const parts = {};
    const section = (column, id, title, copy) => {
      const block = element("section", "profile-section room-section");
      block.id = id;
      const heading = element("h2", "", title);
      heading.id = `${id}-heading`;
      heading.tabIndex = -1;
      block.setAttribute("aria-labelledby", heading.id);
      block.append(heading);
      if (copy) block.append(element("p", "dialog-copy", copy));
      const content = element("div", "room-section-body");
      block.append(content);
      column.append(block);
      const link = element("a", "", title);
      link.href = `#${id}`;
      nav.append(link);
      parts[id] = { block, heading, content, draw: () => {} };
      return parts[id];
    };
    const update = (...names) => {
      for (const name of names) {
        const part = parts[name];
        const active = document.activeElement;
        const hadFocus = part.block.contains(active);
        const key = hadFocus ? active.dataset.roomKey : "";
        part.draw();
        if (!hadFocus || part.block.contains(document.activeElement)) continue;
        const next = key && [...part.block.querySelectorAll("[data-room-key]")].find((node) => node.dataset.roomKey === key);
        (next && !next.disabled ? next : part.heading).focus();
      }
    };

    const project = section(mainColumn, "project", "Project");
    let editingNeeds = false;
    project.draw = () => {
      const body = project.content;
      body.replaceChildren();
      body.append(element("p", room.brief ? "room-brief-text" : "room-copy", room.brief || "No project description was added."));
      body.append(element("h3", "detail-label", "What the project needs"));
      if (!room.needs.length) body.append(element("p", "room-copy", "Nothing picked yet. Choose below."));
      const list = element("ul", "room-needs");
      for (const id of room.needs) {
        const need = needById(id);
        const covering = room.members
          .filter((member) => member.needs.includes(id) || resolveProfile(member.companyId)?.category === need.category)
          .map((member) => resolveProfile(member.companyId)).filter(Boolean);
        const item = element("li", covering.length ? "room-need is-covered" : "room-need");
        const copy = element("div");
        copy.append(element("strong", "", need.label), element("span", "", covering.length ? `Covered by ${joinNames(covering.map((profile) => profile.name))}` : "Not covered yet"));
        item.append(copy);
        if (!covering.length) {
          const next = suggestTeam(room.brief, [id], { city: room.city, preference: room.preference, exclude: [room.owner, ...memberIds()] }).team[0];
          if (next && room.members.length < MAX_ROOM_MEMBERS) {
            item.append(button(`Invite ${next.profile.name}`, "button button-secondary", `need-${id}`, () => {
              const persisted = addRoomMember(room, next.profile.id, [id]);
              update("project", "team", "conversation", "proposals");
              announce(saved(persisted, `${next.profile.name} was invited.`));
            }, `Invite ${next.profile.name} for ${need.label.toLocaleLowerCase()}`));
          } else if (!next) {
            item.append(button("Post it on the Opportunity Board", "button button-secondary", `post-${id}`, (node) => openPostOpportunity(node, room.owner)));
          }
        }
        list.append(item);
      }
      body.append(list);
      const edit = element("details", "room-edit-needs");
      edit.open = editingNeeds;
      edit.addEventListener("toggle", () => { editingNeeds = edit.open; });
      edit.append(element("summary", "", "Change what this project needs"));
      const picker = element("fieldset", "room-needs-picker");
      picker.append(element("legend", "sr-only", "Project needs"));
      for (const need of projectNeeds) {
        const label = element("label", "room-need-chip");
        const box = element("input");
        box.type = "checkbox";
        box.checked = room.needs.includes(need.id);
        box.dataset.roomKey = `pick-${need.id}`;
        box.addEventListener("change", () => {
          room.needs = box.checked ? [...room.needs, need.id] : room.needs.filter((id) => id !== need.id);
          save();
          update("project");
        });
        label.append(box, element("span", "", need.label));
        picker.append(label);
      }
      edit.append(picker);
      body.append(edit);
    };

    const team = section(sideColumn, "team", "Team");
    team.draw = () => {
      const body = team.content;
      body.replaceChildren();
      const list = element("ul", "room-members");
      const ownerRow = element("li", "room-member");
      const ownerAvatar = element("span", "company-avatar");
      ownerAvatar.setAttribute("aria-hidden", "true");
      if (ownerProfile) ownerAvatar.append(companyLogo(ownerProfile));
      else ownerAvatar.append("You");
      const ownerMain = element("div", "room-member-main");
      ownerMain.append(element("strong", "", ownerName), element("span", "feed-meta", "Room owner · you"));
      ownerRow.append(ownerAvatar, ownerMain);
      list.append(ownerRow);
      room.members.forEach((member, index) => {
        const profile = resolveProfile(member.companyId);
        if (!profile) return;
        const item = element("li", "room-member");
        const avatar = element("span", "company-avatar");
        avatar.classList.toggle("has-uploaded-logo", Boolean(profile.logo));
        avatar.append(companyLogo(profile));
        const main = element("div", "room-member-main");
        const covers = member.needs.map((id) => needById(id)?.label).filter(Boolean);
        main.append(
          button(profile.name, "feed-company", `member-${profile.id}`, (node) => openCompany(profile, node), `View ${profile.name} profile`),
          element("span", "feed-meta", `${index === 0 ? "Lead" : "Team member"} · ${covers.length ? covers.join(", ") : profile.category}`),
          element("span", "room-member-status", `Invited · ${verificationLabel(profile)}`),
        );
        const actions = element("div", "room-member-actions");
        actions.append(
          button("Message", "button button-secondary", `message-${profile.id}`, (node) => openConversation(profile, node), `Message ${profile.name}`),
          confirmButton("Remove", "Tap again to remove", `remove-${profile.id}`, () => {
            room.members = room.members.filter((entry) => entry.companyId !== profile.id);
            pushRoomMessage(room, { from: "", note: true, at: new Date().toISOString(), text: `You removed ${profile.name} from the room.` });
            const persisted = save();
            update("project", "team", "conversation", "proposals");
            announce(saved(persisted, `${profile.name} was removed from the room.`));
          }, profile.name),
        );
        item.append(avatar, main, actions);
        list.append(item);
      });
      body.append(list);
      const available = profiles.filter((profile) => !isOwn(profile) && profile.id !== room.owner && !memberIds().includes(profile.id));
      if (room.members.length >= MAX_ROOM_MEMBERS) {
        body.append(element("p", "room-copy", `A room holds up to ${MAX_ROOM_MEMBERS} companies.`));
      } else if (available.length) {
        const form = element("form", "room-form room-invite");
        const select = field(form, "select", "room-invite-company", "Invite another company");
        select.dataset.roomKey = "invite-company";
        available.forEach((profile) => select.append(new Option(`${profile.name} · ${profile.category}`, profile.id)));
        const invite = element("button", "button button-secondary", "Invite");
        invite.type = "submit";
        invite.dataset.roomKey = "invite-submit";
        form.append(invite);
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          if (!available.some((profile) => profile.id === select.value)) return;
          const profile = resolveProfile(select.value);
          const persisted = addRoomMember(room, profile.id);
          update("project", "team", "conversation", "proposals");
          announce(saved(persisted, `${profile.name} was invited.`));
        });
        body.append(form);
      }
      body.append(element("p", "form-hint", "Invitations are saved here and sent when BOND launches accounts."));
    };

    const conversation = section(mainColumn, "conversation", "Conversation", "Share the brief, timelines, and questions with the whole team.");
    const thread = element("div", "chat-thread room-thread");
    thread.setAttribute("role", "log");
    thread.setAttribute("aria-live", "polite");
    thread.setAttribute("aria-relevant", "additions");
    thread.setAttribute("aria-label", "Room conversation");
    conversation.content.append(thread);
    conversation.draw = () => {
      thread.replaceChildren();
      if (!room.messages.some((message) => !message.note)) thread.append(element("p", "chat-empty", "Start the conversation: introduce the project and ask the team what they need from you."));
      for (const message of room.messages) {
        const entry = element("article", message.note ? "room-note" : "chat-message");
        if (!message.note) entry.append(element("p", "chat-message-author", resolveProfile(message.from)?.name || "You"));
        entry.append(element("p", message.note ? "" : "chat-message-text", message.text));
        const when = new Date(message.at);
        const time = element("time", "chat-message-time", `${shortDate(message.at)}, ${when.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
        time.dateTime = message.at;
        entry.append(time);
        thread.append(entry);
      }
      thread.scrollTop = thread.scrollHeight;
    };
    const chatForm = element("form", "chat-form room-chat-form");
    const chatInput = field(chatForm, "textarea", "room-message", "Message the team", { rows: 3, maxLength: 1000, required: true, placeholder: "Share the timeline, budget range, or a question for the team…" });
    chatInput.classList.add("chat-input");
    const chatStatus = element("p", "chat-status");
    chatStatus.setAttribute("role", "status");
    const send = element("button", "button button-primary", "Send to the room");
    send.type = "submit";
    const chatActions = element("div", "chat-actions");
    chatActions.append(send, dictationButton(chatInput, chatStatus));
    chatForm.append(chatActions, chatStatus);
    chatInput.addEventListener("input", () => chatInput.setCustomValidity(""));
    chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = cleanMessage(chatInput.value).slice(0, 1000);
      if (!text) {
        chatInput.setCustomValidity("Write a message before sending.");
        chatInput.reportValidity();
        return;
      }
      pushRoomMessage(room, { from: room.owner, text, at: new Date().toISOString(), note: false });
      const persisted = saveRooms();
      conversation.draw();
      chatInput.value = "";
      chatInput.focus();
      chatStatus.textContent = saved(persisted, "Saved in this room. The team sees it when BOND launches accounts.");
    });
    conversation.block.append(chatForm);

    const proposals = section(mainColumn, "proposals", "Proposals", "Invited companies send proposals here so you can compare price, timeline, and approach side by side.");
    const proposalList = element("div", "room-proposals");
    proposals.content.append(proposalList);
    const proposalForm = element("form", "room-form room-proposal-form");
    const fromSelect = field(proposalForm, "select", "proposal-from", "From");
    const proposalTitle = field(proposalForm, "input", "proposal-title", "Proposal title", { maxLength: 100, required: true, placeholder: "Platform build, phase one" });
    const proposalRow = element("div", "room-form-row");
    const priceBox = element("div");
    const price = field(priceBox, "input", "proposal-price", "Price (optional)", { maxLength: 40, placeholder: "$48,000 fixed" });
    const timelineBox = element("div");
    const timeline = field(timelineBox, "input", "proposal-timeline", "Timeline (optional)", { maxLength: 60, placeholder: "10 weeks" });
    proposalRow.append(priceBox, timelineBox);
    proposalForm.append(proposalRow);
    const summary = field(proposalForm, "textarea", "proposal-summary", "Approach", { rows: 4, maxLength: 800, required: true, placeholder: "What the company will deliver and how." });
    summary.classList.add("chat-input");
    const proposalStatus = element("p", "chat-status");
    proposalStatus.setAttribute("role", "status");
    const addProposal = element("button", "button button-primary", "Add proposal");
    addProposal.type = "submit";
    const proposalActions = element("div", "chat-actions");
    proposalActions.append(addProposal, dictationButton(summary, proposalStatus));
    proposalForm.append(proposalActions, proposalStatus);
    const proposalDetails = element("details", "room-add");
    proposalDetails.append(element("summary", "", "Add a sample proposal to try it"), proposalForm);
    proposals.block.append(proposalDetails);
    const statusLabels = { new: "New", shortlisted: "Shortlisted", declined: "Declined" };
    proposals.draw = () => {
      const current = fromSelect.value;
      fromSelect.replaceChildren();
      room.members.forEach((member) => {
        const profile = resolveProfile(member.companyId);
        if (profile) fromSelect.append(new Option(profile.name, profile.id));
      });
      if (memberIds().includes(current)) fromSelect.value = current;
      fromSelect.disabled = !room.members.length;
      addProposal.disabled = !room.members.length;
      proposalList.replaceChildren();
      if (!room.proposals.length) {
        proposalList.append(element("p", "room-copy", "No proposals yet. When BOND launches, invited companies submit them here. To see how comparing works, add a sample one below."));
        return;
      }
      const order = { shortlisted: 0, new: 1, declined: 2 };
      const list = element("ul", "room-proposal-list");
      [...room.proposals].sort((a, b) => order[a.status] - order[b.status] || Date.parse(b.at) - Date.parse(a.at)).forEach((proposal) => {
        const from = resolveProfile(proposal.from);
        const card = element("li", `room-proposal is-${proposal.status}`);
        const top = element("div", "room-proposal-head");
        top.append(element("strong", "", proposal.title), element("span", "room-tag", statusLabels[proposal.status]));
        card.append(top, element("p", "feed-meta", `${from ? from.name : "A company"} · added ${shortDate(proposal.at)} · Sample you added`));
        if (proposal.price || proposal.timeline) {
          const facts = element("dl", "event-facts");
          if (proposal.price) facts.append(element("dt", "", "Price"), element("dd", "", proposal.price));
          if (proposal.timeline) facts.append(element("dt", "", "Timeline"), element("dd", "", proposal.timeline));
          card.append(facts);
        }
        card.append(element("p", "room-proposal-summary", proposal.summary));
        const actions = element("div", "room-proposal-actions");
        const setStatus = (next, message) => {
          proposal.status = next;
          const persisted = save();
          update("proposals");
          announce(saved(persisted, message));
        };
        actions.append(
          button(proposal.status === "shortlisted" ? "Remove from shortlist" : "Shortlist", "button button-secondary", `shortlist-${proposal.id}`,
            () => setStatus(proposal.status === "shortlisted" ? "new" : "shortlisted", proposal.status === "shortlisted" ? "Removed from the shortlist." : "Added to the shortlist."), `${proposal.status === "shortlisted" ? "Remove from shortlist" : "Shortlist"}: ${proposal.title}`),
          button(proposal.status === "declined" ? "Reconsider" : "Decline", "button button-secondary", `decline-${proposal.id}`,
            () => setStatus(proposal.status === "declined" ? "new" : "declined", proposal.status === "declined" ? "Proposal moved back to new." : "Proposal declined."), `${proposal.status === "declined" ? "Reconsider" : "Decline"}: ${proposal.title}`),
          confirmButton("Delete", "Tap again to delete", `delete-${proposal.id}`, () => {
            room.proposals = room.proposals.filter((entry) => entry.id !== proposal.id);
            const persisted = save();
            update("proposals");
            announce(saved(persisted, "Proposal deleted."));
          }, proposal.title),
        );
        card.append(actions);
        list.append(card);
      });
      proposalList.append(list);
    };
    proposalForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const fail = (message, input) => {
        proposalStatus.textContent = message;
        input.focus();
      };
      const from = memberIds().includes(fromSelect.value) ? fromSelect.value : "";
      const titleText = cleanText(proposalTitle.value, 100);
      const approach = cleanMessage(summary.value).slice(0, 800);
      if (!from) return fail("Invite a company first; proposals come from team members.", fromSelect);
      if (!titleText) return fail("Give the proposal a title.", proposalTitle);
      if (!approach) return fail("Describe the approach.", summary);
      if (room.proposals.length >= MAX_ROOM_PROPOSALS) return fail(`A room holds up to ${MAX_ROOM_PROPOSALS} proposals. Delete one first.`, addProposal);
      room.proposals.push({ id: newId("prop"), from, title: titleText, price: cleanText(price.value, 40), timeline: cleanText(timeline.value, 60), summary: approach, at: new Date().toISOString(), status: "new" });
      const persisted = save();
      proposals.draw();
      proposalForm.reset();
      fromSelect.value = from;
      proposalTitle.focus();
      proposalStatus.textContent = saved(persisted, "Proposal added. Shortlist or decline it above.");
    });

    const meetings = section(sideColumn, "meetings", "Meetings", "Schedule video calls with the team. Paste a Zoom, Teams, or Google Meet link; video calls inside BOND are planned.");
    const meetingList = element("div");
    meetings.content.append(meetingList);
    const meetingForm = element("form", "room-form room-meeting-form");
    const topic = field(meetingForm, "input", "meeting-topic", "Topic", { maxLength: 100, required: true, defaultValue: "Project kickoff" });
    const meetingRow = element("div", "room-form-row");
    const dateBox = element("div");
    const tomorrow = new Date(Date.now() + DAY_MS);
    const meetingDate = field(dateBox, "input", "meeting-date", "Date", { type: "date", required: true, value: localDateValue(tomorrow), min: localDateValue(new Date()), max: localDateValue(new Date(Date.now() + 365 * DAY_MS)) });
    const timeBox = element("div");
    const meetingTime = field(timeBox, "input", "meeting-time", "Start time", { type: "time", required: true, value: "10:00" });
    meetingRow.append(dateBox, timeBox);
    meetingForm.append(meetingRow);
    const length = field(meetingForm, "select", "meeting-length", "Length");
    meetingDurations.forEach((minutes) => length.append(new Option(minutes < 60 ? `${minutes} minutes` : minutes === 60 ? "1 hour" : `${minutes / 60} hours`, String(minutes))));
    length.value = "30";
    const meetingLink = field(meetingForm, "input", "meeting-link", "Video link (optional)", { type: "url", maxLength: 300, placeholder: "https://…" });
    const meetingStatus = element("p", "chat-status");
    meetingStatus.setAttribute("role", "status");
    const schedule = element("button", "button button-primary", "Schedule meeting");
    schedule.type = "submit";
    meetingForm.append(schedule, meetingStatus);
    const meetingDetails = element("details", "room-add");
    meetingDetails.append(element("summary", "", "Schedule a meeting"), meetingForm);
    meetings.block.append(meetingDetails);
    const memberNames = () => joinNames(room.members.map((member) => resolveProfile(member.companyId)?.name).filter(Boolean));
    meetings.draw = () => {
      meetingList.replaceChildren();
      if (!room.meetings.length) {
        meetingList.append(element("p", "room-copy", "No meetings yet."));
        return;
      }
      const list = element("ul", "room-meetings");
      [...room.meetings].sort((a, b) => Number(eventIsUpcoming(b)) - Number(eventIsUpcoming(a)) || Date.parse(a.start) - Date.parse(b.start)).forEach((meeting) => {
        const upcoming = eventIsUpcoming(meeting);
        const item = element("li", upcoming ? "room-meeting" : "room-meeting is-past");
        item.append(element("strong", "", meeting.topic), element("span", "feed-meta", `${eventWhen(meeting, { long: true })}${upcoming ? "" : " · Ended"}`));
        const actions = element("div", "room-proposal-actions");
        if (meeting.link && upcoming) {
          const join = element("a", "button button-secondary", "Join meeting");
          join.href = meeting.link;
          join.target = "_blank";
          join.rel = "noopener noreferrer";
          actions.append(join);
        }
        if (upcoming) {
          actions.append(button("Add to calendar", "button button-secondary", `calendar-${meeting.id}`, () => downloadCalendar({
            uid: meeting.id, title: `${room.title}: ${meeting.topic}`, start: meeting.start, end: eventEnd(meeting),
            location: meeting.link || "Video meeting",
            details: `Opportunity Room on BOND with ${memberNames() || "your team"}.${meeting.link ? `\n\nJoin: ${meeting.link}` : ""}`,
          }), `Add ${meeting.topic} to your calendar`));
        }
        actions.append(confirmButton(upcoming ? "Cancel" : "Remove", upcoming ? "Tap again to cancel" : "Tap again to remove", `cancel-${meeting.id}`, () => {
          room.meetings = room.meetings.filter((entry) => entry.id !== meeting.id);
          if (upcoming) pushRoomMessage(room, { from: "", note: true, at: new Date().toISOString(), text: `You canceled "${meeting.topic}" on ${eventWhen(meeting)}.` });
          const persisted = save();
          update("meetings", "conversation");
          announce(saved(persisted, upcoming ? "Meeting canceled." : "Meeting removed."));
        }, meeting.topic));
        item.append(actions);
        list.append(item);
      });
      meetingList.append(list);
    };
    meetingForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const fail = (message, input) => {
        meetingStatus.textContent = message;
        input.focus();
      };
      const topicText = cleanText(topic.value, 100);
      const start = /^\d{4}-\d{2}-\d{2}$/.test(meetingDate.value) && /^\d{2}:\d{2}$/.test(meetingTime.value) ? new Date(`${meetingDate.value}T${meetingTime.value}`) : null;
      const link = normalizeEventLink(meetingLink.value);
      if (!topicText) return fail("Add a topic for the meeting.", topic);
      if (!start || !Number.isFinite(start.getTime()) || start.getTime() <= Date.now()) return fail("Pick a date and start time in the future.", meetingDate);
      if (start.getTime() > Date.now() + 366 * DAY_MS) return fail("Pick a date within the next year.", meetingDate);
      if (link === null) return fail("Use a secure https:// video link.", meetingLink);
      if (room.meetings.length >= MAX_ROOM_MEETINGS) return fail(`A room holds up to ${MAX_ROOM_MEETINGS} meetings. Remove an old one first.`, schedule);
      const meeting = { id: newId("meet"), topic: topicText, start: start.toISOString(), duration: meetingDurations.includes(Number(length.value)) ? Number(length.value) : 30, link, at: new Date().toISOString() };
      room.meetings.push(meeting);
      pushRoomMessage(room, { from: "", note: true, at: meeting.at, text: `You scheduled "${topicText}" for ${eventWhen(meeting)}.` });
      const persisted = save();
      meetings.draw();
      conversation.draw();
      meetingForm.reset();
      meetingDate.value = localDateValue(tomorrow);
      meetingTime.value = "10:00";
      length.value = "30";
      topic.focus();
      meetingStatus.textContent = saved(persisted, `Scheduled for ${eventWhen(meeting)}. Use Add to calendar to save it.`);
    });

    const closing = element("section", "room-close");
    closing.setAttribute("aria-label", "Close this room");
    closing.append(element("p", "room-copy", "Done with this project? Closing the room deletes its conversation, meetings, and proposals from this browser."));
    closing.append(confirmButton("Close this room", "Tap again to close and delete", "close-room", () => {
      opportunityRooms.splice(opportunityRooms.indexOf(room), 1);
      saveRooms();
      window.location.href = "dashboard.html#rooms";
    }));
    sideColumn.append(closing);

    nav.replaceChildren(...[...mainColumn.children, ...sideColumn.children]
      .map((block) => block.id && nav.querySelector(`a[href="#${block.id}"]`)).filter(Boolean));
    container.append(head, nav, layout);
    Object.values(parts).forEach((part) => part.draw());
  }

  function dashboardSection(container, id, title, copy) {
    const block = element("section", "dashboard-section");
    block.id = id;
    const heading = element("h2", "", title);
    heading.id = `${id}-heading`;
    block.setAttribute("aria-labelledby", heading.id);
    block.append(heading);
    if (copy) block.append(element("p", "dialog-copy", copy));
    container.append(block);
    return block;
  }

  function dashboardButton(text, className, key, onClick, label) {
    const button = element("button", className, text);
    button.type = "button";
    if (label) button.setAttribute("aria-label", label);
    button.dataset.dashKey = key;
    button.addEventListener("click", () => onClick(button));
    return button;
  }

  function dashboardEmpty(block, text, action) {
    const empty = element("div", "dashboard-empty");
    empty.append(element("p", "", text));
    if (action) empty.append(action);
    block.append(empty);
  }

  function dashboardLink(text, href, className = "company-link") {
    const link = element("a", className, text);
    link.href = href;
    return link;
  }

  function dashboardCompanyRow(profile, detail, { tags = [], snippet = "" } = {}) {
    const row = element("li", "dashboard-row");
    const avatar = element("div", "company-avatar");
    avatar.classList.toggle("has-uploaded-logo", Boolean(profile.logo));
    avatar.append(companyLogo(profile));
    const main = element("div", "dashboard-row-main");
    const name = dashboardButton(profile.name, "feed-company", `name-${detail}-${profile.id}`, (button) => openCompany(profile, button));
    main.append(name, element("span", "feed-meta", detail));
    if (snippet) main.append(element("p", "dashboard-snippet", snippet));
    if (tags.length) {
      const list = element("span", "dashboard-tags");
      tags.forEach((tag) => list.append(element("span", "dashboard-tag", tag)));
      main.append(list);
    }
    const actions = element("div", "dashboard-row-actions");
    row.append(avatar, main, actions);
    return { row, actions };
  }

  function dashboardItemRow(title, detail, action) {
    const row = element("li", "dashboard-row dashboard-row-plain");
    const main = element("div", "dashboard-row-main");
    main.append(element("strong", "dashboard-item-title", title), element("span", "feed-meta", detail));
    const actions = element("div", "dashboard-row-actions");
    if (action) actions.append(action);
    row.append(main, actions);
    return row;
  }

  function renderDashboard() {
    const container = document.getElementById("member-dashboard");
    if (!container) return;
    const activeKey = document.activeElement?.dataset?.dashKey;
    container.replaceChildren();
    const own = profiles.filter(isOwn);
    const conversations = profiles
      .map((profile) => ({ profile, messages: messagesByCompany[profile.id] || [] }))
      .filter((entry) => entry.messages.length)
      .sort((a, b) => Date.parse(b.messages.at(-1).at) - Date.parse(a.messages.at(-1).at));
    const meetings = Object.entries(meetingRequests)
      .map(([id, at]) => ({ profile: resolveProfile(id), at }))
      .filter((entry) => entry.profile)
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
    const postedByYou = allOpportunities().filter((opportunity) => postedByMe(opportunity) && resolveProfile(opportunity.companyId));
    const responded = allOpportunities().filter((opportunity) => !postedByMe(opportunity) && opportunityResponses(opportunity).length && resolveProfile(opportunity.companyId));
    const responsesSent = responded.reduce((total, opportunity) => total + opportunityResponses(opportunity).length, 0);
    const hosting = allEvents().filter((event) => hostingEvent(event) && resolveProfile(event.companyId));
    const hostingUpcoming = hosting.filter(eventIsUpcoming);
    const attending = allEvents().filter((event) => myRsvp(event) && eventIsUpcoming(event) && resolveProfile(event.companyId));

    const head = element("header", "dashboard-head");
    head.append(element("p", "dialog-kicker", "Your BOND"), element("h1", "", "Your dashboard"));
    head.append(element("p", "dialog-copy", account.user
      ? "Your companies, connections, messages, opportunities, and events in one place. Published companies are saved to your account; everything else is still saved in this browser for now."
      : "Your companies, connections, messages, opportunities, and events in one place. Everything here is saved in this browser; accounts that sync across devices come with BOND's launch."));
    const stats = element("ul", "dashboard-stats");
    stats.setAttribute("aria-label", "Summary");
    for (const [count, label, anchor] of [
      [own.length, own.length === 1 ? "Your company" : "Your companies", "companies"],
      [savedCompanies.size, "Saved companies", "connections"],
      [followedCompanies.size, "Following", "connections"],
      [conversations.length, conversations.length === 1 ? "Conversation" : "Conversations", "messages"],
      [postedByYou.length, "Opportunities posted", "opportunities"],
      [responsesSent, responsesSent === 1 ? "Response sent" : "Responses sent", "opportunities"],
      [hostingUpcoming.length, "Events hosting", "hosting"],
      [attending.length, "Events attending", "events"],
    ]) {
      const item = element("li");
      const link = dashboardLink("", `#${anchor}`, "dashboard-stat");
      link.append(element("strong", "", String(count)), element("span", "", label));
      item.append(link);
      stats.append(item);
    }
    container.append(head, stats);

    if (ACCOUNTS_ENABLED) {
      const panel = element("section", "dashboard-account");
      panel.setAttribute("aria-label", "Your account");
      if (account.user) {
        panel.append(element("p", "dialog-copy", `Signed in as ${account.user.email}. Companies you publish show in the directory for everyone.`));
        const drafts = own.filter((profile) => profile.local);
        if (drafts.length) panel.append(importPanel(drafts, "dashboard"));
        panel.append(dashboardButton("Account", "button button-outline", "account-open", (button) => openAccount(button)));
      } else {
        panel.append(element("p", "dialog-copy", account.error || "Sign in to publish your companies so everyone can find them, and to manage them from any device."));
        if (!account.error) panel.append(dashboardButton("Sign in", "button button-primary", "account-sign-in", (button) => openAccount(button)));
      }
      container.append(panel);
    }

    const companies = dashboardSection(container, "companies", "Your companies");
    if (own.length) {
      const list = element("ul", "dashboard-list");
      for (const profile of own) {
        const status = ACCOUNTS_ENABLED ? (profile.member ? "Published" : "Draft in this browser") : profile.location;
        const { row, actions } = dashboardCompanyRow(profile, `${profile.category} · ${status}`);
        actions.append(
          dashboardLink("Open profile", `company.html?id=${encodeURIComponent(profile.id)}`, "button button-secondary"),
          dashboardButton("Edit profile", "button button-secondary", `edit-${profile.id}`, (button) => openEditProfile(profile, button), `Edit ${profile.name} profile`),
          dashboardButton("Post an opportunity", "button button-secondary", `post-${profile.id}`, (button) => openPostOpportunity(button, profile.id)),
          dashboardButton("Share an update", "button button-secondary", `share-${profile.id}`, (button) => openShareUpdate(button, profile.id)),
          dashboardButton("Host an event", "button button-secondary", `host-${profile.id}`, (button) => openHostEvent(button, profile.id)),
        );
        list.append(row);
      }
      companies.append(list);
    } else {
      dashboardEmpty(companies, account.user ? "You haven't published a company yet." : "You haven't made a company profile in this browser yet.",
        dashboardButton("Create your company profile", "button button-primary", "create-profile", (button) => openJoin(button)));
    }
    companies.append(element("p", "form-hint", "Profile views from other members will appear here once BOND launches accounts. This preview can't count visits from other people's browsers."));

    const connections = dashboardSection(container, "connections", "Connections", "Companies you saved, follow, or asked to be introduced to.");
    const connectionIds = [...new Set([...savedCompanies, ...followedCompanies, ...introRequests])];
    if (connectionIds.length) {
      const list = element("ul", "dashboard-list");
      for (const id of connectionIds) {
        const profile = resolveProfile(id);
        if (!profile) continue;
        const tags = [];
        if (savedCompanies.has(id)) tags.push("Saved");
        if (followedCompanies.has(id)) tags.push("Following");
        if (introRequests.has(id)) tags.push("Introduction requested");
        const { row, actions } = dashboardCompanyRow(profile, `${profile.category} · ${profile.location}`, { tags });
        actions.append(dashboardButton("Message", "button button-secondary", `message-${id}`, (button) => openConversation(profile, button), `Message ${profile.name}`));
        list.append(row);
      }
      connections.append(list);
    } else {
      dashboardEmpty(connections, "Save or follow a company, or request an introduction, and it shows up here.", dashboardLink("Explore businesses", "index.html#businesses"));
    }

    const messages = dashboardSection(container, "messages", "Messages", "Your demo conversations. They stay in this browser until BOND launches messaging.");
    if (conversations.length) {
      const list = element("ul", "dashboard-list");
      for (const { profile, messages: thread } of conversations) {
        const last = thread.at(-1);
        const snippet = last.text.length > 110 ? `${last.text.slice(0, 110).trim()}…` : last.text;
        const { row, actions } = dashboardCompanyRow(profile, `${thread.length} ${thread.length === 1 ? "message" : "messages"} · last ${shortDate(last.at)}`, { snippet: `You: ${snippet}` });
        actions.append(dashboardButton("Open conversation", "button button-secondary", `conversation-${profile.id}`, (button) => openConversation(profile, button)));
        list.append(row);
      }
      messages.append(list);
    } else {
      dashboardEmpty(messages, "No conversations yet. Use Message company on any profile, or Start a conversation on a company update.", dashboardLink("Explore businesses", "index.html#businesses"));
    }

    const opportunities = dashboardSection(container, "opportunities", "Opportunities");
    opportunities.append(element("h3", "detail-label", "Posted by you"));
    if (postedByYou.length) {
      const list = element("ul", "dashboard-list");
      for (const opportunity of postedByYou) {
        const poster = resolveProfile(opportunity.companyId);
        const count = opportunityResponses(opportunity).length;
        list.append(dashboardItemRow(opportunity.title,
          `${poster ? poster.name : ""} · ${opportunityTypes[opportunity.type]} · posted ${shortDate(opportunity.at)} · ${count} ${count === 1 ? "response" : "responses"}`,
          dashboardButton("View", "button button-secondary", `opportunity-${opportunity.id}`, (button) => openOpportunity(opportunity, button), `View ${opportunity.title}`)));
      }
      opportunities.append(list);
    } else {
      dashboardEmpty(opportunities, "You haven't posted a request yet.",
        dashboardButton("Post an opportunity", "button button-primary", "post-any", (button) => openPostOpportunity(button, own[0]?.id || "")));
    }
    opportunities.append(element("h3", "detail-label", "You responded to"));
    if (responded.length) {
      const list = element("ul", "dashboard-list");
      for (const opportunity of responded) {
        const poster = resolveProfile(opportunity.companyId);
        const last = opportunityResponses(opportunity).at(-1);
        list.append(dashboardItemRow(opportunity.title,
          `${poster ? poster.name : ""} · you responded ${shortDate(last.at)}`,
          dashboardButton("View", "button button-secondary", `responded-${opportunity.id}`, (button) => openOpportunity(opportunity, button), `View ${opportunity.title}`)));
      }
      opportunities.append(list);
    } else {
      dashboardEmpty(opportunities, "Respond to a request on the Opportunity Board to keep track of it here.", dashboardLink("Open the Opportunity Board", "index.html#opportunities"));
    }

    const roomsBlock = dashboardSection(container, "rooms", "Opportunity Rooms", "Private project rooms with the companies you invited: conversation, meetings, and proposals.");
    if (opportunityRooms.length) {
      const list = element("ul", "dashboard-list");
      for (const room of opportunityRooms) {
        list.append(dashboardItemRow(room.title, roomSummary(room), dashboardLink("Open room", roomHref(room), "button button-secondary")));
      }
      roomsBlock.append(list);
      const more = element("p", "form-hint");
      more.append(dashboardLink("Start another Opportunity Room", "index.html#rooms"));
      roomsBlock.append(more);
    } else {
      dashboardEmpty(roomsBlock, "Describe a project and BOND suggests companies to build it with, then opens a private room for the team.",
        dashboardLink("Start an Opportunity Room", "index.html#rooms", "button button-primary"));
    }

    const viewEventButton = (event, key, text = "View") => dashboardButton(text, "button button-secondary", key, (button) => openEvent(event, button), `${text}: ${event.title}`);

    const hostingBlock = dashboardSection(container, "hosting", "Events you're hosting", "Demos, workshops, open houses, and Q&As your companies scheduled. Followers see them in their feed and on their dashboards.");
    if (hosting.length) {
      const list = element("ul", "dashboard-list");
      for (const event of hosting) {
        const host = resolveProfile(event.companyId);
        const going = event.member ? ` · ${eventGoing(event)} going` : "";
        list.append(dashboardItemRow(event.title,
          `${host.name} · ${eventWhen(event)} · ${eventWhere(event)}${going}${eventIsUpcoming(event) ? "" : " · Ended"}`,
          viewEventButton(event, `hosting-${event.id}`)));
      }
      hostingBlock.append(list);
      hostingBlock.append(element("p", "form-hint", hosting.some((event) => event.local)
        ? "Open an event to see who RSVP'd. Events from browser drafts stay in this browser, so members can't RSVP to them."
        : "Open an event to see who RSVP'd."));
    } else {
      dashboardEmpty(hostingBlock, "You haven't scheduled an event yet.",
        dashboardButton("Host an event", "button button-primary", "host-any", (button) => openHostEvent(button, own[0]?.id || "")));
    }

    const events = dashboardSection(container, "events", "Upcoming events");
    const eventList = element("ul", "dashboard-list");
    for (const event of attending) {
      const host = resolveProfile(event.companyId);
      const row = dashboardItemRow(event.title, `${host.name} · ${eventWhen(event)} · ${eventWhere(event)}`, viewEventButton(event, `upcoming-${event.id}`));
      const tags = element("span", "dashboard-tags");
      tags.append(element("span", "dashboard-tag", "You're going"));
      row.querySelector(".dashboard-row-main").append(tags);
      eventList.append(row);
    }
    eventList.append(dashboardItemRow("Nova Logistics Spotlight premiere, then live Q&A", "Live expos · Main stage · Sample event",
      dashboardLink("Go to the expo", "expos.html", "button button-secondary")));
    const followedUpcoming = allEvents().filter((event) => !hostingEvent(event) && !myRsvp(event) && eventIsUpcoming(event) && followedCompanies.has(event.companyId));
    for (const event of followedUpcoming) {
      const host = resolveProfile(event.companyId);
      if (!host) continue;
      const row = dashboardItemRow(event.title, `${host.name} · ${eventWhen(event)} · ${eventWhere(event)}`, viewEventButton(event, `upcoming-${event.id}`, "View and RSVP"));
      const tags = element("span", "dashboard-tags");
      tags.append(element("span", "dashboard-tag", "From a company you follow"));
      row.querySelector(".dashboard-row-main").append(tags);
      eventList.append(row);
    }
    for (const meeting of meetings) {
      eventList.append(dashboardItemRow(`Meeting request: ${meeting.profile.name}`, `Requested ${shortDate(meeting.at)} · scheduling opens when BOND launches`,
        dashboardButton("Message", "button button-secondary", `meeting-${meeting.profile.id}`, (button) => openConversation(meeting.profile, button))));
    }
    const followedAnnouncements = allPosts().filter((post) => post.type === "event" && !post.eventId && followedCompanies.has(post.companyId));
    for (const post of followedAnnouncements) {
      const profile = resolveProfile(post.companyId);
      if (!profile) continue;
      eventList.append(dashboardItemRow(`${profile.name}: ${post.text}`, `Event announcement · shared ${timeAgo(post.at).toLocaleLowerCase()}`,
        dashboardButton("View company", "button button-secondary", `event-${post.id}`, (button) => openCompany(profile, button))));
    }
    events.append(eventList);
    const hint = element("p", "form-hint");
    hint.append(followedCompanies.size ? "Events you RSVP to and events from companies you follow show up here. " : "RSVP to an event, or follow companies to see the events they host here. ");
    hint.append(dashboardLink("Browse all upcoming events", "index.html#events"));
    events.append(hint);

    if (recentlyViewed.length) {
      const viewed = dashboardSection(container, "viewed", "Recently viewed companies");
      const list = element("ul", "dashboard-list dashboard-list-compact");
      for (const id of recentlyViewed) {
        const profile = resolveProfile(id);
        if (profile) list.append(dashboardCompanyRow(profile, profile.category).row);
      }
      viewed.append(list);
    }

    if (activeKey) {
      const match = [...container.querySelectorAll("[data-dash-key]")].find((node) => node.dataset.dashKey === activeKey);
      match?.focus();
    }
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
    paintJoinMode(null);
    showDialog(document.getElementById("join-dialog"), opener);
  }

  let editingProfileId = "";

  function paintJoinMode(profile) {
    const dialog = document.getElementById("join-dialog");
    if (!dialog) return;
    const heading = dialog.querySelector(".dialog-heading");
    const copy = dialog.querySelector(".dialog-copy");
    const submitLabel = dialog.querySelector("#join-form button[type=submit]")?.firstChild;
    if (!dialog.dataset.createHeading) {
      dialog.dataset.createHeading = heading?.textContent || "";
      dialog.dataset.createCopy = copy?.textContent || "";
      dialog.dataset.createSubmit = submitLabel?.textContent || "";
    }
    if (heading) heading.textContent = profile ? `Edit ${profile.name}.` : dialog.dataset.createHeading;
    if (copy) {
      copy.textContent = profile?.member ? "Change anything and save. Everyone sees your changes right away. Leave the image, video, and photo fields empty to keep what you already uploaded; videos and project photos stay in this browser."
        : profile ? "Change anything and save. Leave the image, video, and photo fields empty to keep what you already uploaded. Changes stay in this browser."
        : account.user ? "Start with your website and BOND fills in what it can. Your profile is published to your BOND account and shows in the directory for everyone. Videos and project photos stay in this browser for now."
        : ACCOUNTS_ENABLED ? "Start with your website and BOND fills in what it can. You're not signed in, so this profile is saved as a draft in this browser. Sign in first to publish it to your BOND account."
        : dialog.dataset.createCopy;
    }
    if (submitLabel) submitLabel.textContent = profile ? "Save changes " : account.user ? "Publish profile " : dialog.dataset.createSubmit;
    dialog.querySelector("#profile-delete")?.remove();
    const submit = dialog.querySelector("#join-form button[type=submit]");
    if (profile && submit) submit.after(profileDeleteButton(profile));
  }

  function profileDeleteButton(profile) {
    const button = element("button", "danger-link profile-delete", "Delete this profile");
    button.type = "button";
    button.id = "profile-delete";
    let armed = false;
    let timer;
    button.addEventListener("click", async () => {
      if (!armed) {
        armed = true;
        button.textContent = `Select again to permanently delete ${profile.name}`;
        timer = window.setTimeout(() => {
          armed = false;
          button.textContent = "Delete this profile";
        }, 6000);
        return;
      }
      window.clearTimeout(timer);
      button.disabled = true;
      button.textContent = "Deleting…";
      try {
        await deleteOwnProfile(profile);
      } catch (error) {
        button.disabled = false;
        armed = false;
        button.textContent = "Delete this profile";
        setFormMessage(error.message || "This profile couldn't be deleted.", true);
        return;
      }
      renderDirectory();
      renderExpoFloor();
      renderFullCompanyProfile();
      renderDashboard();
      const joinDialog = document.getElementById("join-dialog");
      joinDialog?.addEventListener("close", () => window.setTimeout(() => {
        const active = document.activeElement;
        if (active && active !== document.body && active.isConnected && !joinDialog.contains(active)) return;
        const focusTarget = document.querySelector("#member-dashboard h1, #full-company-profile h1, #company-grid");
        if (!focusTarget) return;
        if (!focusTarget.hasAttribute("tabindex")) focusTarget.setAttribute("tabindex", "-1");
        focusTarget.focus();
      }, 0), { once: true });
      joinDialog?.close();
      announce(`${profile.name} was deleted.`);
    });
    return button;
  }

  function openEditProfile(profile, opener) {
    const dialog = document.getElementById("join-dialog");
    const form = document.getElementById("join-form");
    if (!dialog || !form || !isOwn(profile)) return;
    form.reset();
    editingProfileId = profile.id;
    const values = {
      website: profile.website || "", company: profile.name, industry: profile.category, description: profile.description,
      tagline: profile.tagline || "", story: profile.story || "", services: profile.services.join(", "),
      certifications: (profile.certifications || []).join(", "), projects: (profile.projects || []).map((project) => project.title).join("\n"),
      location: profile.location === "Location not added" ? "" : profile.location, serviceArea: profile.serviceArea || "",
      representative: profile.representative || "", ownership: ownershipOptions.includes(profile.ownership) ? profile.ownership : "Not specified",
      size: profile.size || "", publicEmail: profile.publicEmail || "", publicPhone: profile.publicPhone || "",
    };
    for (const [name, value] of Object.entries(values)) {
      const field = form.elements.namedItem(name);
      if (field && field.type !== "file") field.value = value;
    }
    const publish = form.elements.namedItem("publishContact");
    if (publish) publish.checked = profile.publishContact === true;
    for (const kind of ["logo", "cover"]) {
      const preview = document.getElementById(`${kind}-upload-preview`);
      if (!preview || !profile[kind]) continue;
      const image = element("img", "upload-preview-image");
      image.src = profile[kind];
      image.alt = kind === "logo" ? "Current logo" : "Current cover image";
      preview.replaceChildren(image);
    }
    form.querySelectorAll(".profile-form-details").forEach((details) => { details.open = true; });
    const status = document.getElementById("join-success");
    if (status) { status.hidden = true; status.replaceChildren(); }
    paintJoinMode(profile);
    showDialog(dialog, opener);
    form.elements.namedItem("company")?.focus();
  }

  const account = {
    client: null, user: null, ownIds: new Set(), follows: new Set(), rsvpRows: [], eventLinks: Object.create(null), loaded: false, error: "",
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("The sign-in service could not load."));
      document.head.append(script);
    });
  }

  let turnstileReady = null;
  function loadTurnstile() {
    turnstileReady ||= loadScript(TURNSTILE_SCRIPT).then(() => {
      if (!window.turnstile) throw new Error("missing");
      return window.turnstile;
    }).catch(() => {
      turnstileReady = null;
      throw new Error("The bot check couldn't load. If you use a content blocker, allow challenges.cloudflare.com and try again.");
    });
    return turnstileReady;
  }

  function botCheck(container, status) {
    let widgetId = null;
    let token = "";
    let waiting = null;
    let failure = "";
    const settle = (value) => {
      token = value;
      if (waiting) waiting(value);
      waiting = null;
    };
    loadTurnstile().then((turnstile) => {
      widgetId = turnstile.render(container, {
        sitekey: TURNSTILE_SITE_KEY,
        action: "sign-in",
        appearance: "interaction-only",
        callback: (value) => { failure = ""; settle(value); },
        "expired-callback": () => { token = ""; },
        "error-callback": () => {
          failure = "The bot check didn't pass. Reload the page and try again.";
          settle("");
          return true;
        },
      });
    }).catch((error) => {
      failure = error.message;
      status.textContent = failure;
      settle("");
    });
    return {
      token() {
        if (token || failure) return Promise.resolve(token);
        return new Promise((resolve) => {
          waiting = resolve;
          setTimeout(() => settle(token), 20000);
        });
      },
      failure: () => failure || "The bot check is taking too long. Reload the page and try again.",
      reset() {
        token = "";
        if (widgetId !== null) window.turnstile?.reset(widgetId);
      },
    };
  }

  function memberMediaUrl(path, version) {
    if (typeof path !== "string" || !/^[0-9a-f-]{36}\/(logo|cover)\.(png|jpg|webp)$/.test(path)) return "";
    const stamp = Date.parse(version);
    return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${path}${Number.isFinite(stamp) ? `?v=${stamp}` : ""}`;
  }

  function memberProfileFromRow(row) {
    if (!row || typeof row !== "object" || typeof row.id !== "string") return null;
    const id = `m-${row.id}`;
    const name = cleanText(row.name, 80);
    const description = cleanText(row.description, 500);
    const category = cleanText(row.industry, 40);
    if (!MEMBER_ID_PATTERN.test(id) || !name || !description || !categories.includes(category)) return null;
    const publishContact = row.publish_contact === true;
    const logo = memberMediaUrl(row.logo_path, row.updated_at);
    const cover = memberMediaUrl(row.cover_path, row.updated_at);
    return {
      id, remoteId: row.id, member: true, mine: Boolean(account.user && account.ownIds.has(row.id)),
      name, category, description,
      location: cleanText(row.location, 100) || "Location not added",
      tagline: cleanText(row.tagline, 100), story: cleanText(row.story, 1200),
      services: parseServices(row.services), certifications: parseCertifications(row.certifications), projects: parseProjects(row.projects),
      serviceArea: cleanText(row.service_area, 150),
      size: companySizes.includes(row.company_size) ? row.company_size : "",
      ownership: ownershipOptions.includes(row.ownership) ? row.ownership : "Not specified",
      representative: cleanText(row.representative, 80), representativeRole: "Company representative",
      website: normalizeWebsite(row.website),
      publishContact, publicEmail: publishContact ? normalizeEmail(row.public_email) : "", publicPhone: publishContact ? normalizePhone(row.public_phone) : "",
      logo, cover, logoPath: logo ? row.logo_path : "", coverPath: cover ? row.cover_path : "",
    };
  }

  function placeMemberProfile(profile) {
    const index = profiles.findIndex((entry) => entry.id === profile.id);
    if (index >= 0) {
      profiles[index] = profile;
      return;
    }
    const firstDraft = profiles.findIndex((entry) => entry.local);
    profiles.splice(firstDraft < 0 ? profiles.length : firstDraft, 0, profile);
  }

  async function loadOwnProfileIds() {
    if (!account.user) {
      account.ownIds = new Set();
      return true;
    }
    const { data, error } = await account.client.from(OWNERS_TABLE).select("profile_id").limit(MAX_MEMBER_PROFILES * 4);
    if (error) return false;
    account.ownIds = new Set((Array.isArray(data) ? data : []).map((row) => row.profile_id).filter((id) => typeof id === "string"));
    return true;
  }

  async function loadMemberProfiles() {
    const [{ data, error }, ownLoaded] = await Promise.all([
      account.client.from(PROFILES_TABLE).select(PROFILE_COLUMNS).order("created_at", { ascending: true }).limit(500),
      loadOwnProfileIds(),
    ]);
    if (error || !ownLoaded) {
      account.error = "Member companies couldn't load right now. Refresh the page to try again.";
      return;
    }
    for (let index = profiles.length - 1; index >= 0; index -= 1) if (profiles[index].member) profiles.splice(index, 1);
    for (const row of Array.isArray(data) ? data : []) {
      const profile = memberProfileFromRow(row);
      if (profile) placeMemberProfile(profile);
    }
    account.error = "";
    account.loaded = true;
  }

  function memberOpportunityFromRow(row) {
    if (!row || typeof row !== "object" || typeof row.id !== "string" || typeof row.profile_id !== "string") return null;
    const title = cleanText(row.title, 100);
    const summary = cleanText(row.summary, 600);
    const at = storedTime(row.created_at);
    if (!opportunityTypes[row.type] || !title || !summary || !at) return null;
    return {
      id: `mo-${row.id}`, remoteId: row.id, member: true, type: row.type, companyId: `m-${row.profile_id}`,
      title, summary, detail: summary, scope: parseList(row.scope, 5, 80),
      seeking: categories.includes(row.seeking) ? [row.seeking] : [], location: cleanText(row.location, 80), at,
    };
  }

  function memberResponseFromRow(row) {
    if (!row || typeof row !== "object" || typeof row.id !== "string" || typeof row.opportunity_id !== "string" || typeof row.profile_id !== "string") return null;
    const at = storedTime(row.created_at);
    if (!at) return null;
    return {
      id: row.id, opportunityId: `mo-${row.opportunity_id}`, from: `m-${row.profile_id}`,
      text: cleanMessage(row.message).slice(0, 800), contact: cleanText(row.contact, 160), at,
    };
  }

  function addMemberResponse(response) {
    if (!response) return;
    if (!memberResponses[response.opportunityId]) memberResponses[response.opportunityId] = [];
    memberResponses[response.opportunityId].push(response);
  }

  async function loadMemberOpportunities() {
    const { data, error } = await account.client.from(OPPORTUNITIES_TABLE).select(OPPORTUNITY_COLUMNS)
      .order("created_at", { ascending: false }).limit(200);
    if (error) return false;
    const rows = (Array.isArray(data) ? data : []).map(memberOpportunityFromRow).filter(Boolean);
    memberOpportunities.splice(0, memberOpportunities.length, ...rows);
    return true;
  }

  async function loadMemberResponses() {
    for (const key of Object.keys(memberResponses)) delete memberResponses[key];
    if (!account.user) return true;
    const { data, error } = await account.client.from(RESPONSES_TABLE).select(RESPONSE_COLUMNS)
      .order("created_at", { ascending: false }).limit(500);
    if (error) return false;
    for (const row of (Array.isArray(data) ? data : []).reverse()) addMemberResponse(memberResponseFromRow(row));
    return true;
  }

  async function postMemberOpportunity(record, profile) {
    if (!account.client || !account.user) throw new Error("Your sign-in expired. Sign in again, then post.");
    const { data, error } = await account.client.from(OPPORTUNITIES_TABLE).insert({
      profile_id: profile.remoteId, type: record.type, title: record.title, summary: record.summary,
      scope: record.scope, seeking: record.seeking[0] || "", location: record.location,
    }).select(OPPORTUNITY_COLUMNS).single();
    if (error && /^Each company can have up to/.test(error.message || "")) {
      throw new Error(`${profile.name} already has 20 opportunity posts. Remove one to post another.`);
    }
    if (error && /^You can post up to/.test(error.message || "")) throw new Error(`${error.message} Try again tomorrow.`);
    const opportunity = error ? null : memberOpportunityFromRow(data);
    if (!opportunity) throw new Error("Your opportunity couldn't be posted. Check your connection and try again.");
    memberOpportunities.unshift(opportunity);
    return opportunity;
  }

  async function sendMemberResponse(opportunity, profile, message, contact) {
    if (!account.client || !account.user) throw new Error("Your sign-in expired. Sign in again, then respond.");
    const { data, error } = await account.client.from(RESPONSES_TABLE)
      .insert({ opportunity_id: opportunity.remoteId, profile_id: profile.remoteId, message, contact })
      .select(RESPONSE_COLUMNS).single();
    if (error) {
      if (/^You can send up to/.test(error.message || "")) throw new Error(error.message);
      if (error.code === "23503") throw new Error("This opportunity was removed by the company that posted it.");
      throw new Error("Your response couldn't be sent. Check your connection and try again.");
    }
    addMemberResponse(memberResponseFromRow(data));
  }

  function validReplyContact(value) {
    return !value || Boolean(normalizeEmail(value)) || /^\+?[0-9][0-9 ().-]{5,24}$/.test(value);
  }

  async function withdrawMemberResponse(response) {
    if (!account.client || !account.user) throw new Error("Your sign-in expired. Sign in again, then withdraw.");
    const { data, error } = await account.client.from(RESPONSES_TABLE).delete().eq("id", response.id).select("id");
    if (error || !Array.isArray(data) || data.length !== 1) throw new Error("Your response couldn't be withdrawn. Check your connection and try again.");
    const list = memberResponses[response.opportunityId] || [];
    memberResponses[response.opportunityId] = list.filter((item) => item.id !== response.id);
  }

  function forgetMemberOpportunities(match) {
    for (let index = memberOpportunities.length - 1; index >= 0; index -= 1) {
      if (!match(memberOpportunities[index])) continue;
      delete memberResponses[memberOpportunities[index].id];
      memberOpportunities.splice(index, 1);
    }
  }

  async function deleteMemberOpportunity(opportunity) {
    if (!account.client || !account.user) throw new Error("Your sign-in expired. Sign in again, then remove the post.");
    const { data, error } = await account.client.from(OPPORTUNITIES_TABLE).delete().eq("id", opportunity.remoteId).select("id");
    if (error || !Array.isArray(data) || data.length !== 1) throw new Error("This post couldn't be removed. Check your connection and try again.");
    forgetMemberOpportunities((item) => item.id === opportunity.id);
  }

  async function moveDraftOpportunities(draft, profile) {
    for (const record of postedOpportunities.filter((item) => item.companyId === draft.id)) {
      try {
        await postMemberOpportunity(record, profile);
      } catch {
        continue;
      }
      postedOpportunities.splice(postedOpportunities.indexOf(record), 1);
      delete responsesByOpportunity[record.id];
    }
    savePostedOpportunities();
    writeStoredValue(RESPONSES_KEY, responsesByOpportunity);
  }

  function visibleUpdateText(value) {
    return cleanMessage(typeof value === "string" ? value.replace(HIDDEN_TEXT_CHARACTERS, "") : "").slice(0, 500);
  }

  function memberUpdateFromRow(row) {
    if (!row || typeof row !== "object" || typeof row.id !== "string" || typeof row.profile_id !== "string") return null;
    const text = visibleUpdateText(row.text);
    const at = storedTime(row.created_at);
    if (!postTypes[row.type] || !text || !at) return null;
    return { id: `mu-${row.id}`, remoteId: row.id, member: true, type: row.type, companyId: `m-${row.profile_id}`, text, at };
  }

  async function loadMemberUpdates() {
    const pageId = document.getElementById("full-company-profile") ? new URLSearchParams(window.location.search).get("id") || "" : "";
    const updates = () => account.client.from(UPDATES_TABLE).select(UPDATE_COLUMNS).order("created_at", { ascending: false });
    const [feed, page] = await Promise.all([
      updates().limit(200),
      MEMBER_ID_PATTERN.test(pageId) ? updates().eq("profile_id", pageId.slice(2)).limit(100) : null,
    ]);
    if (feed.error) return false;
    const byId = new Map();
    for (const row of [...(feed.data || []), ...(page && !page.error && Array.isArray(page.data) ? page.data : [])]) {
      const update = memberUpdateFromRow(row);
      if (update) byId.set(update.id, update);
    }
    memberUpdates.splice(0, memberUpdates.length, ...byId.values());
    return true;
  }

  async function postMemberUpdate(type, text, profile) {
    if (!account.client || !account.user) throw new Error("Your sign-in expired. Sign in again, then share.");
    const { data, error } = await account.client.from(UPDATES_TABLE)
      .insert({ profile_id: profile.remoteId, type, text }).select(UPDATE_COLUMNS).single();
    if (error && /^Each company can have up to/.test(error.message || "")) {
      throw new Error(`${profile.name} already has 100 updates. Remove an older one to share another.`);
    }
    if (error && /^You can share up to/.test(error.message || "")) throw new Error(`${error.message} Try again tomorrow.`);
    const update = error ? null : memberUpdateFromRow(data);
    if (!update) throw new Error("Your update couldn't be shared. Check your connection and try again.");
    memberUpdates.unshift(update);
    return update;
  }

  function forgetMemberUpdates(match) {
    for (let index = memberUpdates.length - 1; index >= 0; index -= 1) if (match(memberUpdates[index])) memberUpdates.splice(index, 1);
  }

  async function deleteMemberUpdate(update) {
    if (!account.client || !account.user) throw new Error("Your sign-in expired. Sign in again, then remove the update.");
    const { data, error } = await account.client.from(UPDATES_TABLE).delete().eq("id", update.remoteId).select("id");
    if (error || !Array.isArray(data) || data.length !== 1) throw new Error("This update couldn't be removed. Check your connection and try again.");
    forgetMemberUpdates((item) => item.id === update.id);
  }

  async function moveDraftUpdates(draft, profile) {
    const drafts = postedUpdates.filter((post) => post.companyId === draft.id && !post.eventId).reverse();
    for (const post of drafts) {
      try {
        await postMemberUpdate(post.type, post.text, profile);
      } catch {
        continue;
      }
      postedUpdates.splice(postedUpdates.indexOf(post), 1);
    }
    savePostedUpdates();
  }

  function rebuildFollows() {
    followedCompanies.clear();
    for (const id of localFollows) followedCompanies.add(id);
    for (const id of account.follows) followedCompanies.add(id);
  }

  async function loadMemberFollows() {
    account.follows = new Set();
    if (account.user) {
      const { data, error } = await account.client.from(FOLLOWS_TABLE).select("profile_id").limit(500);
      if (error) {
        rebuildFollows();
        return false;
      }
      for (const row of Array.isArray(data) ? data : []) if (typeof row.profile_id === "string") account.follows.add(`m-${row.profile_id}`);
    }
    rebuildFollows();
    return true;
  }

  async function saveMemberFollow(profile, following) {
    if (!account.client || !account.user) throw new Error("Your sign-in expired. Sign in again, then follow.");
    const table = account.client.from(FOLLOWS_TABLE);
    const { error } = following
      ? await table.insert({ profile_id: profile.remoteId })
      : await table.delete().eq("profile_id", profile.remoteId);
    if (!error || (following && error.code === "23505")) return;
    if (/^You can follow up to .* a day\.$/.test(error.message || "")) throw new Error(`${error.message} Try again tomorrow.`);
    if (/^You can follow up to/.test(error.message || "")) throw new Error(`${error.message} Unfollow one to follow ${profile.name}.`);
    throw new Error(`${following ? "Following" : "Unfollowing"} ${profile.name} didn't save. Check your connection and try again.`);
  }

  function memberEventFromRow(row) {
    if (!row || typeof row !== "object" || typeof row.id !== "string" || typeof row.profile_id !== "string") return null;
    const title = cleanText(row.title, 100);
    const description = cleanMessage(row.description).slice(0, 800);
    const start = storedTime(row.starts_at);
    const at = storedTime(row.created_at);
    if (!eventFormats[row.format] || !eventDurations.includes(row.duration_minutes) || !title || !description || !start || !at) return null;
    return {
      id: `me-${row.id}`, remoteId: row.id, member: true, companyId: `m-${row.profile_id}`, title, format: row.format, start,
      duration: row.duration_minutes, location: row.format === "online" ? "" : cleanText(row.location, 120), description,
      capacity: Number.isInteger(row.capacity) && row.capacity > 0 ? row.capacity : 0,
      going: Number.isInteger(row.going) && row.going > 0 ? row.going : 0, at,
    };
  }

  function placeMemberEvent(event) {
    const index = memberEvents.findIndex((item) => item.id === event.id);
    if (index === -1) memberEvents.push(event);
    else memberEvents[index] = event;
  }

  async function loadMemberEvents() {
    const pageId = document.getElementById("full-company-profile") ? new URLSearchParams(window.location.search).get("id") || "" : "";
    const since = new Date(Date.now() - (Math.max(...eventDurations) + 60) * 60 * 1000).toISOString();
    const events = () => account.client.from(EVENTS_TABLE).select(EVENT_COLUMNS).gte("starts_at", since).order("starts_at", { ascending: true });
    const [list, page] = await Promise.all([
      events().limit(300),
      MEMBER_ID_PATTERN.test(pageId) ? events().eq("profile_id", pageId.slice(2)).limit(40) : null,
    ]);
    if (list.error) return false;
    memberEvents.splice(0, memberEvents.length);
    for (const row of [...(list.data || []), ...(page && !page.error && Array.isArray(page.data) ? page.data : [])]) {
      const event = memberEventFromRow(row);
      if (event) placeMemberEvent(event);
    }
    return true;
  }

  function memberRsvpFromRow(row) {
    if (!row || typeof row.event_id !== "string") return null;
    const at = storedTime(row.created_at);
    if (!at) return null;
    return { eventId: `me-${row.event_id}`, from: typeof row.profile_id === "string" ? `m-${row.profile_id}` : "", at };
  }

  // Rows are the caller's own RSVPs plus, for events their companies host, everyone's RSVPs to them.
  async function loadMemberRsvps() {
    account.rsvpRows = [];
    account.eventLinks = Object.create(null);
    if (!account.user) return true;
    const [rsvps, links] = await Promise.all([
      account.client.from(RSVPS_TABLE).select("event_id,profile_id,created_at").order("created_at", { ascending: true }).limit(2000),
      account.client.from(EVENT_LINKS_TABLE).select("event_id,link").limit(1000),
    ]);
    if (!rsvps.error) account.rsvpRows = (rsvps.data || []).map(memberRsvpFromRow).filter(Boolean);
    if (!links.error) {
      for (const row of links.data || []) {
        const link = normalizeEventLink(row.link);
        if (typeof row.event_id === "string" && link) account.eventLinks[`me-${row.event_id}`] = link;
      }
    }
    return !rsvps.error && !links.error;
  }

  function hostingEvent(event) {
    if (event.local) return true;
    return Boolean(event.member && isOwn(resolveProfile(event.companyId)));
  }

  function myRsvp(event) {
    if (!event.member) return eventRsvps[event.id] || null;
    if (hostingEvent(event)) return null;
    return account.rsvpRows.find((row) => row.eventId === event.id) || null;
  }

  function eventAttendees(event) {
    return hostingEvent(event) ? account.rsvpRows.filter((row) => row.eventId === event.id) : [];
  }

  function eventJoinLink(event) {
    return event.member ? account.eventLinks[event.id] || "" : event.link;
  }

  async function refreshMemberEvent(event) {
    const [row, link] = await Promise.all([
      account.client.from(EVENTS_TABLE).select(EVENT_COLUMNS).eq("id", event.remoteId).maybeSingle(),
      account.user && event.format !== "in-person"
        ? account.client.from(EVENT_LINKS_TABLE).select("link").eq("event_id", event.remoteId).maybeSingle() : null,
    ]);
    if (!row.error && !row.data) {
      forgetMemberEvents((item) => item.id === event.id);
      return false;
    }
    const fresh = row.error ? null : memberEventFromRow(row.data);
    if (fresh) Object.assign(event, { going: fresh.going, capacity: fresh.capacity });
    const joinUrl = link && !link.error ? normalizeEventLink(link.data?.link) : "";
    if (joinUrl) account.eventLinks[event.id] = joinUrl;
    else if (link && !link.error) delete account.eventLinks[event.id];
    return true;
  }

  async function loadEventAttendees(event) {
    const { data, error } = await account.client.from(RSVPS_TABLE).select("event_id,profile_id,created_at")
      .eq("event_id", event.remoteId).order("created_at", { ascending: true }).limit(5000);
    if (error) return false;
    account.rsvpRows = account.rsvpRows.filter((row) => row.eventId !== event.id).concat((data || []).map(memberRsvpFromRow).filter(Boolean));
    return true;
  }

  async function hostMemberEvent(record, profile) {
    if (!account.client || !account.user) throw new Error("Your sign-in expired. Sign in again, then host the event.");
    const { data, error } = await account.client.from(EVENTS_TABLE).insert({
      profile_id: profile.remoteId, title: record.title, format: record.format, starts_at: record.start,
      duration_minutes: record.duration, location: record.location, description: record.description, capacity: record.capacity,
    }).select(EVENT_COLUMNS).single();
    if (error && /^(Each company can have up to|You can schedule up to|Pick a start time)/.test(error.message || "")) {
      throw new Error(/a day\.$/.test(error.message) ? `${error.message} Try again tomorrow.` : error.message);
    }
    const event = error ? null : memberEventFromRow(data);
    if (!event) throw new Error("Your event couldn't be scheduled. Check your connection and try again.");
    if (record.link) {
      const { error: linkError } = await account.client.from(EVENT_LINKS_TABLE).insert({ event_id: event.remoteId, link: record.link });
      if (linkError) {
        await account.client.from(EVENTS_TABLE).delete().eq("id", event.remoteId);
        throw new Error("The join link couldn't be saved. Check it starts with https:// and try again.");
      }
      account.eventLinks[event.id] = record.link;
    }
    placeMemberEvent(event);
    return event;
  }

  function forgetMemberEvents(match) {
    for (let index = memberEvents.length - 1; index >= 0; index -= 1) {
      const event = memberEvents[index];
      if (!match(event)) continue;
      account.rsvpRows = account.rsvpRows.filter((row) => row.eventId !== event.id);
      delete account.eventLinks[event.id];
      memberEvents.splice(index, 1);
    }
  }

  async function cancelMemberEvent(event) {
    if (!account.client || !account.user) throw new Error("Your sign-in expired. Sign in again, then cancel the event.");
    const { data, error } = await account.client.from(EVENTS_TABLE).delete().eq("id", event.remoteId).select("id");
    if (error || !Array.isArray(data) || data.length !== 1) throw new Error("This event couldn't be cancelled. Check your connection and try again.");
    forgetMemberEvents((item) => item.id === event.id);
  }

  async function rsvpMemberEvent(event, profile) {
    if (!account.client || !account.user) throw new Error("Your sign-in expired. Sign in again, then RSVP.");
    // Insert without returning the row: user_id is not readable, so a representation request is refused.
    const { error } = await account.client.from(RSVPS_TABLE)
      .insert({ event_id: event.remoteId, profile_id: profile ? profile.remoteId : null });
    if (error && error.code !== "23505") {
      if (/^(This event is full|This event has ended|You can RSVP to up to)/.test(error.message || "")) throw new Error(error.message);
      if (error.code === "23503" || /cancelled/.test(error.message || "")) throw new Error("This event was cancelled by its host.");
      throw new Error("Your RSVP didn't go through. Check your connection and try again.");
    }
    await loadMemberRsvps();
    await refreshMemberEvent(event);
  }

  async function cancelMemberRsvp(event) {
    if (!account.client || !account.user) throw new Error("Your sign-in expired. Sign in again, then cancel your RSVP.");
    const { count, error } = await account.client.from(RSVPS_TABLE).delete({ count: "exact" }).eq("event_id", event.remoteId);
    if (error || typeof count !== "number") throw new Error("Your RSVP couldn't be cancelled. Check your connection and try again.");
    account.rsvpRows = account.rsvpRows.filter((row) => row.eventId !== event.id);
    delete account.eventLinks[event.id];
    if (!(await refreshMemberEvent(event))) throw new Error("This event was cancelled by its host.");
  }

  async function moveDraftEvents(draft, profile) {
    for (const record of hostedEvents.filter((event) => event.companyId === draft.id && Date.parse(event.start) > Date.now())) {
      try {
        await hostMemberEvent(record, profile);
      } catch {
        continue;
      }
      hostedEvents.splice(hostedEvents.indexOf(record), 1);
      for (let index = postedUpdates.length - 1; index >= 0; index -= 1) if (postedUpdates[index].eventId === record.id) postedUpdates.splice(index, 1);
    }
    saveHostedEvents();
    savePostedUpdates();
  }

  function markOwnMemberProfiles() {
    for (const profile of profiles) if (profile.member) profile.mine = Boolean(account.user && account.ownIds.has(profile.remoteId));
  }

  function refreshAccountViews() {
    renderAccountButton();
    renderDirectory();
    renderExpoFloor();
    renderFullCompanyProfile();
    renderDashboard();
    refreshOpportunityLists();
    refreshEvents();
    document.querySelectorAll("[data-follow-company]").forEach(paintFollowButton);
  }

  function cleanAuthParams() {
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(url.hash.slice(1));
    const keys = ["code", "error", "error_code", "error_description"];
    const linkError = url.searchParams.get("error_description") || hash.get("error_description") || "";
    const hadCode = url.searchParams.has("code");
    keys.forEach((key) => url.searchParams.delete(key));
    if (keys.some((key) => hash.has(key)) || hash.has("access_token")) url.hash = "";
    window.history.replaceState(window.history.state, "", url.href);
    return { hadCode, linkError };
  }

  function signInRedirect() {
    const url = new URL(window.location.href);
    url.hash = "";
    ["code", "error", "error_code", "error_description"].forEach((key) => url.searchParams.delete(key));
    return url.href;
  }

  async function initAccounts() {
    if (!ACCOUNTS_ENABLED) return;
    const arriving = new URLSearchParams(window.location.search).has("code") || /error_description=/.test(window.location.hash + window.location.search);
    try {
      await loadScript(SUPABASE_SCRIPT);
      if (!window.supabase?.createClient) throw new Error("missing client");
      account.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true, autoRefreshToken: true, storageKey: AUTH_STORAGE_KEY },
      });
      const { data } = await account.client.auth.getSession();
      account.user = data?.session?.user || null;
      account.client.auth.onAuthStateChange((event, session) => {
        const next = session?.user || null;
        const changed = (next?.id || "") !== (account.user?.id || "");
        account.user = next;
        if (!changed) return;
        window.setTimeout(async () => {
          const [ownLoaded] = await Promise.all([loadOwnProfileIds(), loadMemberResponses(), loadMemberFollows(), loadMemberRsvps()]);
          if (!ownLoaded) account.ownIds = new Set();
          markOwnMemberProfiles();
          refreshAccountViews();
        }, 0);
      });
      await Promise.all([
        loadMemberProfiles(), loadMemberOpportunities(), loadMemberResponses(), loadMemberUpdates(), loadMemberFollows(),
        loadMemberEvents(), loadMemberRsvps(),
      ]);
    } catch {
      account.error = "Sign-in isn't available right now. Refresh the page to try again.";
    }
    if (arriving) {
      const { linkError } = cleanAuthParams();
      if (account.user) announce(`You're signed in as ${account.user.email}.`);
      else if (linkError || !account.error) announce("That sign-in link expired or was already used. Request a new one from Sign in.");
    }
  }

  function renderAccountButton() {
    if (!ACCOUNTS_ENABLED) return;
    const nav = document.getElementById("nav-links");
    if (!nav) return;
    let button = nav.querySelector(".header-account");
    if (!button) {
      button = element("button", "button button-outline button-small header-account");
      button.type = "button";
      button.addEventListener("click", () => {
        document.querySelector(".menu-toggle[aria-expanded=\"true\"]")?.click();
        openAccount(button);
      });
      nav.insertBefore(button, nav.querySelector("[data-open-join]"));
    }
    button.textContent = account.user ? "Account" : "Sign in";
    button.setAttribute("aria-label", account.user ? `Account, signed in as ${account.user.email}` : "Sign in");
  }

  function signInErrorMessage(error) {
    const text = String(error?.message || "");
    if (error?.status === 429 || /rate limit|too many/i.test(text)) return "Too many sign-in emails were requested. Wait a few minutes and try again.";
    if (/captcha/i.test(text)) return "The bot check didn't pass. Reload the page and try again.";
    if (/invalid.*email|email.*invalid/i.test(text)) return "Enter a valid email address.";
    return "The sign-in email couldn't be sent. Check your connection and try again.";
  }

  function openAccount(opener) {
    const view = prepareDialog("Your BOND account", account.user ? "You're signed in." : "Sign in to BOND");
    if (!view) return;
    const { dialog, body } = view;
    if (!account.client) {
      body.append(element("p", "dialog-copy", account.error || "Sign-in is still loading. Try again in a moment."));
      showDialog(dialog, opener);
      return;
    }
    if (account.user) {
      body.append(element("p", "dialog-copy", `Signed in as ${account.user.email}. Company profiles you create or edit now are published to your account and show in the directory for everyone.`));
      const drafts = profiles.filter((profile) => profile.local);
      if (drafts.length) body.append(importPanel(drafts, "account"));
      const actions = element("div", "account-actions");
      const dashboard = element("a", "button button-secondary", "Open your dashboard");
      dashboard.href = "dashboard.html";
      const signOut = element("button", "button button-outline", "Sign out");
      signOut.type = "button";
      signOut.addEventListener("click", async () => {
        signOut.disabled = true;
        const { error } = await account.client.auth.signOut();
        if (error) {
          signOut.disabled = false;
          announce("You couldn't be signed out. Check your connection and try again.");
          return;
        }
        dialog.close();
        announce("You're signed out.");
      });
      actions.append(dashboard, signOut);
      const remove = element("button", "danger-link account-delete", "Delete your account");
      remove.type = "button";
      remove.addEventListener("click", () => openDeleteAccount(opener));
      body.append(actions, remove);
      showDialog(dialog, opener);
      return;
    }
    body.append(element("p", "dialog-copy", "We'll email you a sign-in link. There's no password. New to BOND? The same link creates your account."));
    const form = element("form", "account-form");
    form.noValidate = true;
    const label = element("label", "", "Work email");
    label.htmlFor = "account-email";
    const input = element("input");
    Object.assign(input, { id: "account-email", type: "email", name: "email", autocomplete: "email", maxLength: 160, required: true });
    input.setAttribute("aria-describedby", "account-status");
    const submit = element("button", "button button-primary", "Email me a sign-in link");
    submit.type = "submit";
    const status = element("p", "form-help", "");
    status.id = "account-status";
    status.setAttribute("role", "status");
    const captcha = TURNSTILE_SITE_KEY ? element("div", "account-captcha") : null;
    form.append(label, input, ...(captcha ? [captcha] : []), submit, status);
    const check = captcha ? botCheck(captcha, status) : null;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = normalizeEmail(cleanText(input.value, 160));
      if (!email) {
        input.setAttribute("aria-invalid", "true");
        status.textContent = "Enter a valid email address.";
        input.focus();
        return;
      }
      input.removeAttribute("aria-invalid");
      submit.disabled = true;
      const options = { emailRedirectTo: signInRedirect(), shouldCreateUser: true };
      if (check) {
        status.textContent = "Checking that you're not a bot…";
        options.captchaToken = await check.token();
        if (!options.captchaToken) {
          submit.disabled = false;
          status.textContent = check.failure();
          return;
        }
      }
      status.textContent = "Sending your sign-in link…";
      const { error } = await account.client.auth.signInWithOtp({ email, options });
      check?.reset();
      submit.disabled = false;
      if (error) {
        status.textContent = signInErrorMessage(error);
        return;
      }
      status.textContent = "";
      const sent = element("div", "account-sent");
      sent.append(element("p", "dialog-copy", `Check your email. We sent a sign-in link to ${email}. Open it in this browser within 30 minutes.`));
      const again = element("button", "button button-outline", "Use a different email");
      again.type = "button";
      again.addEventListener("click", () => {
        sent.remove();
        form.hidden = false;
        input.focus();
      });
      sent.append(again);
      // Hidden rather than detached, so the Turnstile frame inside the form keeps working.
      form.hidden = true;
      form.after(sent);
      sent.setAttribute("tabindex", "-1");
      sent.focus();
      announce(`Sign-in link sent to ${email}.`);
    });
    body.append(form);
    showDialog(dialog, opener);
    input.focus();
  }

  async function signedInRecently() {
    const { data } = await account.client.auth.getSession();
    try {
      const part = (data?.session?.access_token || "").split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const claims = JSON.parse(window.atob(part.padEnd(Math.ceil(part.length / 4) * 4, "=")));
      const times = (Array.isArray(claims.amr) ? claims.amr : []).map((entry) => Number(entry?.timestamp)).filter(Number.isFinite);
      // The database allows 30 minutes; one minute of slack leaves time to confirm.
      return times.length > 0 && Date.now() / 1000 - Math.max(...times) < 29 * 60;
    } catch {
      return false;
    }
  }

  function openRecentSignIn(opener) {
    const view = prepareDialog("Your BOND account", "Sign in again to delete your account");
    if (!view) return;
    const { dialog, body } = view;
    body.append(element("p", "dialog-copy", "For your security, deleting your account needs a sign-in from the last 30 minutes. Sign out, request a new sign-in link, open it, then come back here to delete your account."));
    const actions = element("div", "account-actions");
    const again = element("button", "button button-primary", "Sign out and get a new link");
    again.type = "button";
    again.addEventListener("click", async () => {
      again.disabled = true;
      const { error } = await account.client.auth.signOut();
      if (error) {
        again.disabled = false;
        announce("You couldn't be signed out. Check your connection and try again.");
        return;
      }
      openAccount(opener);
    });
    const keep = element("button", "button button-outline", "Keep my account");
    keep.type = "button";
    keep.addEventListener("click", () => openAccount(opener));
    actions.append(again, keep);
    body.append(actions);
    showDialog(dialog, opener);
    again.focus();
  }

  async function openDeleteAccount(opener) {
    if (account.client && account.user && !(await signedInRecently())) {
      openRecentSignIn(opener);
      return;
    }
    const view = prepareDialog("Your BOND account", "Delete your account?");
    if (!view) return;
    const { dialog, body } = view;
    if (!account.client || !account.user) {
      body.append(element("p", "dialog-copy", "Your sign-in expired. Sign in again to delete your account."));
      showDialog(dialog, opener);
      return;
    }
    const email = account.user.email || "";
    const published = profiles.filter((profile) => profile.member && profile.mine).length;
    body.append(element("p", "dialog-copy", published
      ? `This permanently deletes the BOND account for ${email} and its ${published} published company ${published === 1 ? "profile" : "profiles"}, including logos and cover images. Other members won't see ${published === 1 ? "it" : "them"} anymore.`
      : `This permanently deletes the BOND account for ${email}.`));
    body.append(element("p", "dialog-copy", "It can't be undone. Drafts, messages, and anything else saved only in this browser stay here."));
    const form = element("form", "account-form");
    form.noValidate = true;
    const label = element("label", "", "Type your email to confirm");
    label.htmlFor = "account-delete-email";
    const input = element("input");
    Object.assign(input, { id: "account-delete-email", type: "email", name: "email", autocomplete: "off", maxLength: 160, required: true });
    input.setAttribute("aria-describedby", "account-delete-status");
    const actions = element("div", "account-actions");
    const submit = element("button", "button account-delete-confirm", "Delete my account");
    submit.type = "submit";
    const keep = element("button", "button button-outline", "Keep my account");
    keep.type = "button";
    keep.addEventListener("click", () => openAccount(opener));
    actions.append(submit, keep);
    const status = element("p", "form-help", "");
    status.id = "account-delete-status";
    status.setAttribute("role", "status");
    form.append(label, input, actions, status);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (cleanText(input.value, 160).toLowerCase() !== email.toLowerCase()) {
        input.setAttribute("aria-invalid", "true");
        status.textContent = `Type ${email} exactly to confirm.`;
        input.focus();
        return;
      }
      input.removeAttribute("aria-invalid");
      submit.disabled = true;
      keep.disabled = true;
      status.textContent = "Deleting your account…";
      try {
        await deleteAccount();
      } catch (error) {
        if (error.stale) {
          openRecentSignIn(opener);
          return;
        }
        submit.disabled = false;
        keep.disabled = false;
        status.textContent = error.shown ? error.message : "Your account couldn't be deleted. Check your connection and try again.";
        return;
      }
      dialog.close();
      announce("Your BOND account and its company profiles were deleted.");
    });
    body.append(form);
    showDialog(dialog, opener);
    input.focus();
  }

  async function deleteAccount() {
    const fail = (message, extra) => Object.assign(new Error(message), { shown: true }, extra);
    if (!account.client || !account.user) throw fail("Your sign-in expired. Sign in again to delete your account.");
    if (!(await signedInRecently())) throw fail("Sign in again to delete your account.", { stale: true });
    const failed = "Your account couldn't be deleted. Check your connection and try again.";
    if (!(await loadOwnProfileIds())) throw fail(failed);
    const bucket = account.client.storage.from(MEDIA_BUCKET);
    const paths = [];
    for (const folder of account.ownIds) {
      const { data: entries, error } = await bucket.list(folder, { limit: 100 });
      if (error) throw fail(failed);
      for (const entry of entries || []) if (entry.id) paths.push(`${folder}/${entry.name}`);
    }
    if (paths.length) {
      const { error } = await bucket.remove(paths);
      if (error) throw fail(failed);
    }
    const { error } = await account.client.rpc("delete_my_account");
    if (error) {
      if (error.code === "28000") throw fail("Sign in again to delete your account.", { stale: true });
      const partly = paths.length ? "Your logos and cover images were removed, but your account and profiles weren't deleted. " : "";
      if (error.code === "55000") throw fail(`${partly}Some images were still being saved. Try again in a moment.`);
      if (error.code === "42501" || error.status === 401) throw fail(`${partly}Your sign-in expired. Sign in again, then delete your account.`);
      throw fail(`${partly || "Your account couldn't be deleted. "}Check your connection and try again.`);
    }
    const removed = profiles.filter((profile) => profile.member && account.ownIds.has(profile.remoteId));
    for (let index = profiles.length - 1; index >= 0; index -= 1) if (removed.includes(profiles[index])) profiles.splice(index, 1);
    forgetMemberOpportunities((item) => removed.some((profile) => profile.id === item.companyId));
    forgetMemberUpdates((item) => removed.some((profile) => profile.id === item.companyId));
    forgetMemberEvents((item) => removed.some((profile) => profile.id === item.companyId));
    account.rsvpRows = [];
    account.eventLinks = Object.create(null);
    for (const key of Object.keys(memberResponses)) delete memberResponses[key];
    account.follows = new Set();
    for (const id of [...localFollows]) if (id.startsWith("m-")) localFollows.delete(id);
    writeStoredValue(FOLLOWS_KEY, [...localFollows]);
    rebuildFollows();
    await Promise.all(removed.map((profile) => mediaRequest("readwrite", (store) => store.delete(profile.id)).catch(() => {})));
    await account.client.auth.signOut({ scope: "local" }).catch(() => {});
    account.user = null;
    account.ownIds = new Set();
    markOwnMemberProfiles();
    refreshAccountViews();
  }

  function dataUrlToBlob(dataUrl) {
    const match = /^data:(image\/(png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || "");
    if (!match) throw new Error("This image couldn't be prepared. Choose a PNG, JPG, or WebP file.");
    const binary = window.atob(match[3]);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return { blob: new Blob([bytes], { type: match[1] }), type: match[1], extension: { png: "png", jpeg: "jpg", webp: "webp" }[match[2]] };
  }

  async function uploadMemberImage(remoteId, kind, dataUrl, previousPath) {
    const { blob, type, extension } = dataUrlToBlob(dataUrl);
    const path = `${remoteId}/${kind}.${extension}`;
    const bucket = account.client.storage.from(MEDIA_BUCKET);
    const { error } = await bucket.upload(path, blob, { upsert: true, contentType: type, cacheControl: "3600" });
    if (error) throw error;
    if (previousPath && previousPath !== path) await bucket.remove([previousPath]).catch(() => {});
    return path;
  }

  function memberRow(details) {
    return {
      name: details.name, industry: details.category, description: details.description,
      location: details.location === "Location not added" ? "" : details.location,
      tagline: details.tagline || "", story: details.story || "",
      services: details.services, certifications: details.certifications || [], projects: (details.projects || []).map((project) => project.title),
      service_area: details.serviceArea || "", company_size: details.size || "", ownership: details.ownership,
      representative: details.representative || "", website: details.website || "",
      publish_contact: details.publishContact === true,
      public_email: details.publishContact ? details.publicEmail || "" : "",
      public_phone: details.publishContact ? details.publicPhone || "" : "",
    };
  }

  function memberSaveError(error) {
    const text = String(error?.message || "");
    if (/up to 5 company profiles/i.test(text)) return `Your account can have up to ${MAX_MEMBER_PROFILES} company profiles. Delete one to add another.`;
    if (error?.status === 401 || error?.code === "42501" || /jwt|row-level security/i.test(text)) return "Your sign-in expired. Sign in again, then save.";
    return "Your profile couldn't be saved. Check your connection and try again.";
  }

  async function saveMemberProfile(details, images, existing) {
    if (!account.client || !account.user) throw new Error("Your sign-in expired. Sign in again, then save.");
    const table = account.client.from(PROFILES_TABLE);
    const request = existing ? table.update(memberRow(details)).eq("id", existing.remoteId) : table.insert(memberRow(details));
    const { data, error } = await request.select(PROFILE_COLUMNS).single();
    if (error) throw new Error(memberSaveError(error));
    let row = data;
    account.ownIds.add(row.id);
    let imagesSaved = true;
    const paths = {};
    for (const kind of ["logo", "cover"]) {
      if (!images[kind]) continue;
      try {
        paths[`${kind}_path`] = await uploadMemberImage(row.id, kind, images[kind], existing?.[`${kind}Path`]);
      } catch {
        imagesSaved = false;
      }
    }
    if (Object.keys(paths).length) {
      const updated = await account.client.from(PROFILES_TABLE).update(paths).eq("id", row.id).select(PROFILE_COLUMNS).single();
      if (updated.error) imagesSaved = false;
      else row = updated.data;
    }
    const profile = memberProfileFromRow(row);
    if (!profile) throw new Error("Your profile was saved but couldn't be shown. Refresh the page.");
    placeMemberProfile(profile);
    return { profile, imagesSaved };
  }

  async function deleteOwnProfile(profile) {
    if (profile.member) {
      if (!account.client || !account.user) throw new Error("Your sign-in expired. Sign in again, then delete.");
      const failed = "This profile couldn't be deleted. Check your connection and try again.";
      // Images go first: once the profile row is gone, its owner can no longer remove them.
      const bucket = account.client.storage.from(MEDIA_BUCKET);
      const { data: files, error: listError } = await bucket.list(profile.remoteId, { limit: 100 });
      if (listError) throw new Error(failed);
      const paths = (files || []).filter((file) => file.id).map((file) => `${profile.remoteId}/${file.name}`);
      if (paths.length) {
        const { error: removeError } = await bucket.remove(paths);
        if (removeError) throw new Error(failed);
      }
      const { data, error } = await account.client.from(PROFILES_TABLE).delete().eq("id", profile.remoteId).select("id");
      if (error || !Array.isArray(data) || data.length !== 1) throw new Error(failed);
      account.ownIds.delete(profile.remoteId);
      forgetMemberOpportunities((item) => item.companyId === profile.id);
      forgetMemberUpdates((item) => item.companyId === profile.id);
      forgetMemberEvents((item) => item.companyId === profile.id);
      account.rsvpRows = account.rsvpRows.filter((row) => row.from !== profile.id);
      for (const [key, list] of Object.entries(memberResponses)) memberResponses[key] = list.filter((response) => response.from !== profile.id);
    }
    const index = profiles.indexOf(profile);
    if (index >= 0) profiles.splice(index, 1);
    if (profile.local && !saveLocalProfiles()) {
      profiles.splice(index, 0, profile);
      throw new Error("This draft couldn't be removed from browser storage. Try again.");
    }
    await mediaRequest("readwrite", (store) => store.delete(profile.id)).catch(() => {});
  }

  function remapStoredCompanyId(oldId, newId) {
    const from = JSON.stringify(oldId);
    const to = JSON.stringify(newId);
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key || !key.startsWith("bond.demo.") || key === STORAGE_KEY) continue;
        const value = localStorage.getItem(key);
        if (value && value.includes(from)) localStorage.setItem(key, value.split(from).join(to));
      }
    } catch {
      // Remapping is best effort; references that miss it point at a draft that no longer exists.
    }
  }

  function detailsFromProfile(profile) {
    return {
      name: profile.name, category: profile.category, description: profile.description, location: profile.location,
      tagline: profile.tagline || "", story: profile.story || "", services: profile.services || [],
      certifications: profile.certifications || [], projects: profile.projects || [],
      serviceArea: profile.serviceArea || "", size: profile.size || "", ownership: profile.ownership,
      representative: profile.representative || "", website: profile.website || "",
      publishContact: profile.publishContact === true, publicEmail: profile.publicEmail || "", publicPhone: profile.publicPhone || "",
    };
  }

  async function importLocalDrafts(status) {
    const drafts = profiles.filter((profile) => profile.local);
    const room = MAX_MEMBER_PROFILES - profiles.filter((profile) => profile.member && profile.mine).length;
    if (!drafts.length) return;
    if (room <= 0) {
      status.textContent = `Your account already has ${MAX_MEMBER_PROFILES} company profiles. Delete one to move a draft.`;
      return;
    }
    let moved = 0;
    let failure = "";
    for (const draft of drafts.slice(0, room)) {
      status.textContent = `Moving ${draft.name}…`;
      let profile;
      try {
        const saved = await saveMemberProfile(detailsFromProfile(draft), { logo: draft.logo || "", cover: draft.cover || "" }, null);
        profile = saved.profile;
        if (!saved.imagesSaved) {
          await deleteOwnProfile(profile).catch(() => {});
          throw new Error(`The images for ${draft.name} couldn't be uploaded, so it stays a draft in this browser. Try again in a moment.`);
        }
        const media = await readProfileMedia(draft);
        if (media.video || media.photos.length) await saveProfileMedia(profile.id, media).catch(() => {});
        await moveDraftOpportunities(draft, profile);
        await moveDraftUpdates(draft, profile);
        await moveDraftEvents(draft, profile);
        remapStoredCompanyId(draft.id, profile.id);
      } catch (error) {
        failure = error.message || "A draft couldn't be moved.";
        break;
      }
      moved += 1;
      try {
        await deleteOwnProfile(draft);
      } catch {
        failure = `${draft.name} is published, but its browser draft couldn't be removed. Delete the draft yourself so it isn't moved twice.`;
        break;
      }
    }
    const skipped = drafts.length - moved - (failure ? 1 : 0);
    const parts = [];
    if (moved) parts.push(`${moved} ${moved === 1 ? "draft is" : "drafts are"} now published to your account.`);
    if (failure) parts.push(failure);
    if (skipped > 0 && !failure) parts.push(`${skipped} ${skipped === 1 ? "draft stays" : "drafts stay"} in this browser because your account is full.`);
    if (!moved) {
      status.textContent = parts.join(" ");
      return;
    }
    try { sessionStorage.setItem(FLASH_KEY, parts.join(" ")); } catch { /* the reload still shows the result */ }
    window.location.reload();
  }

  function importPanel(drafts, key) {
    const panel = element("div", "account-import");
    panel.append(element("p", "dialog-copy", `You have ${drafts.length} company ${drafts.length === 1 ? "draft" : "drafts"} saved only in this browser. Move ${drafts.length === 1 ? "it" : "them"} to your account to publish ${drafts.length === 1 ? "it" : "them"} in the directory. Videos and project photos stay in this browser.`));
    const status = element("p", "form-help", "");
    status.setAttribute("role", "status");
    const button = element("button", "button button-primary", drafts.length === 1 ? "Move draft to your account" : "Move drafts to your account");
    button.type = "button";
    button.dataset.dashKey = `import-${key}`;
    button.addEventListener("click", async () => {
      button.disabled = true;
      await importLocalDrafts(status);
      button.disabled = false;
    });
    panel.append(button, status);
    return panel;
  }

  function showFlash() {
    try {
      const message = sessionStorage.getItem(FLASH_KEY);
      if (!message) return;
      sessionStorage.removeItem(FLASH_KEY);
      announce(message.slice(0, 300));
    } catch {
      // Session storage can be unavailable; the flash is only a courtesy.
    }
  }

  function resolveProfile(value) {
    const key = String(value || "").trim().toLocaleLowerCase();
    return profiles.find((profile) => profile.id === key)
      || profiles.find((profile) => !profile.member && (profile.name.toLocaleLowerCase() === key || profile.name.toLocaleLowerCase().replace(/\s+/g, "-") === key));
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
      const message = errors[0] || (pending ? "Loading company images…" : loaded ? account.user ? "Image previews ready." : "Image previews ready. Uploads stay in this browser." : "");
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

  function withScheme(value) {
    return value && !/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? `https://${value}` : value;
  }

  function fitText(text, max) {
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    const sentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
    return sentence > max * 0.5 ? cut.slice(0, sentence + 1) : `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
  }

  function configureWebsiteAutofill(form) {
    const input = form.elements.namedItem("website");
    const button = document.getElementById("website-autofill");
    const status = document.getElementById("website-autofill-status");
    if (!input || !button || !status) return;
    const help = status.textContent;
    const buttonText = button.textContent;
    let busy = false;
    const setField = (name, value) => {
      const field = form.elements.namedItem(name);
      if (!field || !value || (field.value.trim() && !field.classList.contains("is-autofilled"))) return false;
      field.value = value;
      if (field.value !== value) return false;
      field.classList.add("is-autofilled");
      return true;
    };
    const setImage = (name, dataUrl) => {
      const field = form.elements.namedItem(name);
      const match = typeof dataUrl === "string" && /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
      if (!field || !match || (field.files?.length && !field.classList.contains("is-autofilled")) || typeof DataTransfer !== "function") return false;
      try {
        const bytes = Uint8Array.from(atob(match[2]), (character) => character.charCodeAt(0));
        const transfer = new DataTransfer();
        transfer.items.add(new File([bytes], `${name}-from-website.${match[1].split("/")[1]}`, { type: match[1] }));
        field.files = transfer.files;
        field.classList.add("is-autofilled");
        field.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      } catch {
        return false;
      }
    };
    const run = async () => {
      if (busy) return;
      const value = cleanText(input.value, 500);
      if (!value) {
        status.textContent = "Enter your website first, for example yourcompany.com.";
        input.focus();
        return;
      }
      busy = true;
      button.disabled = true;
      button.textContent = "Reading…";
      status.textContent = `Reading ${value}…`;
      try {
        const response = await fetch("/api/website-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: value }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "We couldn't read that website. Fill in the profile yourself.");
        const fields = data.fields && typeof data.fields === "object" ? data.fields : {};
        const text = (key, max) => {
          const raw = typeof fields[key] === "string" ? cleanText(fields[key], 1200) : "";
          return raw ? fitText(raw, max) : "";
        };
        const description = typeof fields.description === "string" ? cleanText(fields.description, 1200) : "";
        const services = Array.isArray(fields.services) ? fields.services.filter((item) => typeof item === "string").map((item) => cleanText(item, 40)).filter(Boolean).slice(0, 6) : [];
        if (normalizeWebsite(data.website)) input.value = data.website;
        const filled = [];
        for (const [name, fieldValue, label] of [
          ["company", text("name", 80), "name"],
          ["industry", categories.includes(fields.industry) ? fields.industry : "", "industry"],
          ["description", description && fitText(description, 240), "description"],
          ["tagline", text("tagline", 100), "one-line introduction"],
          ["story", description.length > 240 ? fitText(description, 1200) : "", "story"],
          ["services", fitText(services.join(", "), 250), "services"],
          ["location", text("location", 80), "headquarters"],
          ["publicEmail", normalizeEmail(fields.email), "email"],
          ["publicPhone", normalizePhone(fields.phone) ? cleanText(fields.phone, 40) : "", "phone"],
        ]) {
          if (setField(name, fieldValue)) filled.push(label);
        }
        const images = data.images && typeof data.images === "object" ? data.images : {};
        if (setImage("logo", images.logo)) filled.push("logo");
        if (setImage("cover", images.cover)) filled.push("cover image");
        form.dispatchEvent(new Event("change"));
        const details = form.querySelector(".profile-form-details");
        if (details && filled.some((label) => !["name", "industry", "description"].includes(label))) details.open = true;
        const source = cleanText(data.source, 120) || "your website";
        const missing = [["company", "name"], ["industry", "industry"], ["description", "description"]]
          .filter(([name]) => !form.elements.namedItem(name)?.value.trim()).map(([, label]) => label);
        let message = filled.length
          ? `Filled from ${source}: ${filled.join(", ")}. Check each field and change anything that's off.`
          : `We opened ${source} but couldn't find details to fill in.`;
        if (missing.length) message += ` Still needed: ${missing.join(", ")}.`;
        if (filled.includes("email") || filled.includes("phone")) message += " Contact details stay hidden unless you tick the box to show them.";
        status.textContent = message;
        const firstMissing = { name: "company", industry: "industry", description: "description" }[missing[0]];
        form.elements.namedItem(firstMissing || "company")?.focus();
      } catch (error) {
        status.textContent = error instanceof TypeError ? "We couldn't reach BOND to read that website. Check your connection, or fill in the profile yourself." : error.message;
      } finally {
        busy = false;
        button.disabled = false;
        button.textContent = buttonText;
      }
    };
    button.addEventListener("click", run);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        run();
      }
    });
    form.addEventListener("input", (event) => {
      if (event.isTrusted) event.target.classList?.remove("is-autofilled");
    });
    form.addEventListener("change", (event) => {
      if (event.isTrusted && event.target !== form) event.target.classList?.remove("is-autofilled");
    });
    form.addEventListener("reset", () => {
      form.querySelectorAll(".is-autofilled").forEach((field) => field.classList.remove("is-autofilled"));
      status.textContent = help;
    });
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
    for (const id of directorySelectIds) document.getElementById(id)?.addEventListener("change", renderDirectory);
    document.getElementById("directory-clear")?.addEventListener("click", () => {
      resetDirectoryFilters();
      renderDirectory();
      document.getElementById("directory-search")?.focus();
      announce("Filters cleared. Showing every company.");
    });
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
        let opener = dialogOpeners.get(dialog);
        const focusKey = opener?.dataset?.focusKey;
        if (opener && !opener.isConnected && focusKey) opener = [...document.querySelectorAll("[data-focus-key]")].find((node) => node.dataset.focusKey === focusKey);
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
    document.querySelectorAll("[data-host-event]").forEach((button) => {
      button.addEventListener("click", () => openHostEvent(button));
    });
    document.querySelectorAll("[data-event-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = button.dataset.eventFilter;
        if (!["All", "online", "in-person", "Going", "Hosting"].includes(next)) return;
        currentEventFilter = next;
        renderEvents();
      });
    });

    const form = document.getElementById("join-form");
    const uploads = form ? configureProfileUploads(form) : null;
    if (form) configureWebsiteAutofill(form);
    const showcase = form ? configureShowcaseUploads(form) : null;
    document.getElementById("join-dialog")?.addEventListener("close", () => {
      if (!editingProfileId) return;
      editingProfileId = "";
      form?.reset();
      paintJoinMode(null);
    });
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
      const website = normalizeWebsite(withScheme(websiteInput));
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
      const details = {
        name, category, location, description, representative, ownership,
        tagline: cleanText(data.get("tagline"), 100), services: parseServices(data.get("services")),
        certifications: parseCertifications(data.get("certifications")), projects: parseProjects(data.get("projects")),
        story: cleanText(data.get("story"), 1200),
        serviceArea: cleanText(data.get("serviceArea"), 150), website,
        size: companySizes.includes(data.get("size")) ? data.get("size") : "",
        publicEmail, publicPhone, publishContact: data.has("publishContact"),
      };
      if (editingProfileId) {
        const existing = profiles.find((profile) => isOwn(profile) && profile.id === editingProfileId);
        if (!existing) {
          setFormMessage("This profile is no longer available to edit. Refresh the page and try again.", true);
          return;
        }
        if (existing.member) {
          const { profile: updated, imagesSaved } = await saveMemberProfile(details, images, existing);
          let mediaSaved = true;
          if (media.video || media.photos.length) {
            const current = await readProfileMedia(updated);
            mediaSaved = await saveProfileMedia(updated.id, { video: media.video || current.video, photos: media.photos.length ? media.photos : current.photos }).then(() => true, () => false);
          }
          renderDirectory();
          renderExpoFloor();
          renderFullCompanyProfile();
          document.getElementById("join-dialog")?.close();
          announce(!imagesSaved ? `Changes to ${name} are published, but a new image couldn't be uploaded. Try it again.`
            : mediaSaved ? `Changes to ${name} are published.` : `Changes to ${name} are published, but the new video or photos couldn't be stored in this browser.`);
          return;
        }
        const previous = { ...existing };
        Object.assign(existing, details, { logo: images.logo || existing.logo || "", cover: images.cover || existing.cover || "" });
        if (!saveLocalProfiles()) {
          for (const key of Object.keys(existing)) delete existing[key];
          Object.assign(existing, previous);
          setFormMessage("Your changes could not be saved in this browser. Storage may be full; try smaller images.", true);
          return;
        }
        let mediaSaved = true;
        if (media.video || media.photos.length) {
          const current = await readProfileMedia(existing);
          mediaSaved = await saveProfileMedia(existing.id, { video: media.video || current.video, photos: media.photos.length ? media.photos : current.photos }).then(() => true, () => false);
        }
        renderDirectory();
        renderExpoFloor();
        renderFullCompanyProfile();
        document.getElementById("join-dialog")?.close();
        announce(mediaSaved ? `Changes to ${name} are saved in this browser.` : `Changes to ${name} are saved, but the new video or photos could not be stored in this browser.`);
        return;
      }
      if (account.user) {
        const { profile: published, imagesSaved } = await saveMemberProfile(details, images, null);
        const hasMedia = Boolean(media.video || media.photos.length);
        const mediaSaved = hasMedia ? await saveProfileMedia(published.id, media).then(() => true, () => false) : true;
        resetDirectoryFilters();
        renderDirectory();
        renderExpoFloor();
        form.reset();
        setFormMessage(`${name} is published to your BOND account and shows in the directory for everyone.`);
        const success = document.getElementById("join-success");
        if (success && !imagesSaved) success.append(element("p", "ownership-note", "Your logo or cover image couldn't be uploaded. Use Edit profile to try again."));
        if (success && !mediaSaved) success.append(element("p", "ownership-note", "Your video and project photos couldn't be stored in this browser, so they won't appear on the profile."));
        if (success) {
          success.append(fullProfileLink(published));
          success.append(element("h3", "detail-label", "Your first matches"));
          renderMatchList(published, success, { limit: 3, compact: true });
        }
        announce("Your company profile is published.");
        return;
      }
      const createdProfile = { id: newProfileId(), ...details, representativeRole: "Company representative", local: true, ...images };
      profiles.push(createdProfile);
      const saved = saveLocalProfiles();
      const hasMedia = Boolean(media.video || media.photos.length);
      const mediaSaved = saved && hasMedia ? await saveProfileMedia(createdProfile.id, media).then(() => true, () => false) : !hasMedia;
      resetDirectoryFilters();
      renderDirectory();
      renderExpoFloor();
      form.reset();
      const hasDirectory = Boolean(document.getElementById("company-grid"));
      setFormMessage(saved
        ? `${name} is now a sample profile in this browser. ${hasDirectory ? "Close this preview to find it in the directory." : "Open the company directory below to find it."} ${ACCOUNTS_ENABLED ? "Sign in to publish it to your BOND account." : "This does not register a BOND account."}`
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

    const renderAll = () => {
      renderDirectory();
      renderFeatured();
      renderMatchmaker();
      renderRoomBuilder();
      renderOpportunityRoom();
      renderExpoFloor();
      renderOpportunities();
      renderEvents();
      renderFeed();
      renderFullCompanyProfile();
      if (document.getElementById("member-dashboard")) {
        renderDashboard();
        ["company-dialog", "join-dialog"].forEach((id) => document.getElementById(id)?.addEventListener("close", renderDashboard));
      }
      showFlash();
    };
    if (!ACCOUNTS_ENABLED) {
      renderAll();
      return;
    }
    renderAccountButton();
    let rendered = false;
    const renderOnce = () => {
      if (rendered) return false;
      rendered = true;
      renderAll();
      return true;
    };
    const slowNetwork = window.setTimeout(renderOnce, 2500);
    initAccounts().finally(() => {
      window.clearTimeout(slowNetwork);
      if (!renderOnce()) refreshAccountViews();
      else renderAccountButton();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup, { once: true });
  else setup();
})();
