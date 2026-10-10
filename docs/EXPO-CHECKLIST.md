# BOND online EXPO checklist

Built from the owner's online EXPO recommendations (October 9, 2026). We work through it top to bottom.

Everything marked done is a **browser-only design preview** on branch `feature/homepage-refresh`: data is sample data or saved in the visitor's own browser. Nothing is sent to a server yet. The "Platform" section at the bottom lists what a real launch needs.

Legend: `[x]` done in the preview · `[~]` partly done · `[ ]` not started · `[!]` waiting on the owner

## Homepage: make the value obvious

- [x] Hero: "Where businesses meet. Opportunities begin." plus the supporting line
- [x] Two main buttons: Explore businesses, Create your company profile
- [x] Visible search field
- [x] Industry strip with photos (aerospace, engineering, construction, software, logistics, manufacturing, energy)
- [x] Featured company profiles
- [x] Next expo preview
- [x] Supporting text under "Find the business behind the opportunity"
- [x] Diverse, natural imagery across industries (7 generated photos, illustrative)
- [!] Industrial grill image for the hero (owner to share)

## Discover Businesses

- [x] Industry tiles with images
- [x] Featured company cards
- [~] Advanced filters: industry, location, and business community exist, and search now covers certifications; dedicated certification, service-area, and company-size filters do not

## 1. Live Expo Floor (signature experience)

- [x] Clickable visual floor with company booths and halls
- [x] Main stage showing what is presenting now
- [x] Representative availability on every booth
- [x] Enter a booth
- [~] Watch a video: there is a video slot, but no real video yet (needs video hosting)
- [x] Start a conversation (demo chat, saved in the browser)
- [x] Request a meeting (demo request, saved in the browser)

## 2. AI Business Matchmaking

- [x] Suggested customers, partners, suppliers, and teaming partners for every company, each with a reason
- [x] Homepage "find my matches" try-it
- [x] Matches on every profile and right after signing up
- [x] "Request introduction" (saved in the browser)
- [ ] Real AI matching that reads full profiles (needs a backend and an AI provider; owner approval for cost)

## 3. Company profiles that feel like mini-websites

- [x] Custom cover image
- [x] Logo
- [x] Services
- [x] Website link
- [x] 30-second introduction video: companies upload a video of up to 30 seconds (checked for length and size); it plays on their profile. Sample companies show a video still.
- [x] Certifications, labeled "Self-reported" or "Sample · Not verified"; a Verified badge waits for real verification
- [x] Portfolio / project gallery: up to three project photos with titles; click a photo to enlarge it
- [x] Direct contact options: a contact bar under the company name (Contact company, Visit website, Watch introduction, Share profile), plus message, meeting, email, and phone
- [x] Mini-website feel: sticky section navigation (Overview, Video, Services, Certifications, Projects, Story, Matches, Contact)
- [ ] Real video hosting so uploaded videos are visible to everyone, not just the uploader's browser (needs a provider; owner approval for cost)
- [ ] Edit an existing profile (today a company creates a new draft instead)

## 4. Live Business Spotlight

- [x] Five-minute presentation format: recorded Spotlight premieres on the main stage, or the company presents live
- [x] Live Q&A after the premiere (demo)
- [x] Side panel with profile, services, and direct chat beside the stage
- [x] Click the company logo on the video to open the side panel without leaving the video (the video widens during the premiere and keeps playing while the panel is open)
- [x] Voice Q&A: raise hand, the representative passes the mic, talk with live captions and an on-air banner on the stage; the recording and text are saved to the Q&A list for replay (in this browser)
- [x] Away representatives: record a voice question to be answered on the replay
- [x] Everyone in the room hears the speaker live, with live captions (LiveKit, free Build plan; Vercel preview and production)
- [x] Representative controls (`?host` + host code): see raised hands, pass or take back the mic, answer live
- [x] Live audio on production: LiveKit variables added to Vercel Production and deployed (October 9, 2026)
- [x] Voice typing: a Speak mic button next to Send in the demo chat, Live Q&A, and opportunity responses
- [ ] Representative accounts instead of a shared host code (needs BOND sign-in)
- [ ] Real video playback and live streaming (needs video hosting)

## 5. Opportunity Board

- [x] Sample opportunities with filters (partnerships, service needs, collaborations)
- [x] Companies post their own requests ("Looking for a website developer", "Seeking a logistics partner", "Need a certified subcontractor"): type, headline, description, who could help, requirements, and location; saved in the browser, with a remove option
- [x] Respond to or express interest in a request, as one of your companies or just yourself, with an optional message (voice typing available)
- [x] Opportunities linked to the posting company's profile (new Opportunities section on every profile) and to "Companies that could fit"
- [ ] Posts and responses visible to everyone and delivered to the posting company (needs accounts and a database)

## 6. Company Activity Feed

- [x] Companies publish projects, new capabilities, partnerships, hiring announcements, and upcoming events (homepage feed, plus an Activity section on every profile)
- [x] Follow a company from the feed, its profile, or the expo side panel; a Following filter shows only followed companies
- [x] Start a conversation from a feed post (opens the demo chat with the post quoted)
- [ ] Shared updates and follows visible across devices, with notifications (needs accounts and a database)

## Member Dashboard (medium priority)

Dashboard page (`dashboard.html`, "Dashboard" in the main menu), with a summary row of counts:

- [x] Connections and saved companies (saved, following, and introduction requests, with a Message button)
- [x] Messages (every demo conversation with its last message; reopen it)
- [~] Company profile views: the dashboard explains that views from other members need accounts, and shows companies you viewed recently
- [x] Opportunities (posted, with response counts, and the ones you responded to)
- [x] Upcoming events (next expo, your meeting requests, and events announced by companies you follow)
- [x] Your companies, with Open profile, Post an opportunity, and Share an update

## Flagship: AI Opportunity Rooms

- [ ] Describe a project in plain language ("I need to build a fleet management platform…")
- [ ] Find companies matching the requirements
- [ ] Show qualifications, capabilities, and verification status
- [ ] Suggest complementary partners to form a project team
- [ ] Open a private Opportunity Room for introductions, chat, video meetings, and proposals
- [ ] Invite a company into a room straight from its Spotlight or profile

## Guiding principles

- [x] No 3D "video game" environment; the expo floor is premium but simple
- [x] Prioritize the directory, profiles, and live networking before flashy extras

## Platform: needed for a real launch (owner decisions)

- [ ] Accounts and sign-in for companies and representatives
- [ ] Database for profiles, messages, meetings, opportunities, and follows
- [ ] Business claiming and verification; certification verification (VOSB/SDVOSB and others)
- [ ] Video hosting and live streaming (cost to scope)
- [ ] AI provider for matchmaking and Opportunity Rooms (cost to scope)
- [ ] Email notifications for introductions, messages, and meetings

## Launch

- [x] Hosting moved to Vercel; joinbond.world and www attached to the project
- [x] Namecheap DNS: A records for `@` and `www` point to 76.76.21.21; parking records removed (October 10, 2026; joinbond.world serves the site)
- [x] Production deploy of `feature/homepage-refresh` (main fast-forwarded and deployed October 9, 2026; attached to joinbond.world and www, waiting on DNS)
- [!] Unpublish the old ChatGPT Site
