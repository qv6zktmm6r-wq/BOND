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
- [ ] Click the company logo on the video to open the side panel without leaving the video
- [ ] Real video playback and live streaming (needs video hosting)

## 5. Opportunity Board

- [x] Sample opportunities with filters (partnerships, service needs, collaborations)
- [ ] Companies post their own requests ("Looking for a website developer", "Seeking a logistics partner", "Need a certified subcontractor")
- [ ] Respond to or express interest in a request
- [ ] Opportunities linked to the posting company's profile and matches

## 6. Company Activity Feed

- [ ] Companies publish projects, new capabilities, partnerships, hiring announcements, and upcoming events
- [ ] Follow a company
- [ ] Start a connection from a feed post

## Member Dashboard (medium priority)

- [ ] Connections and saved companies
- [ ] Messages
- [ ] Company profile views
- [ ] Opportunities (posted and responded)
- [ ] Upcoming events

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
- [!] Namecheap DNS: A records for `@` and `www` pointing to 76.76.21.21, and the parking records removed
- [!] Approve the production deploy of `feature/homepage-refresh`
- [!] Unpublish the old ChatGPT Site
