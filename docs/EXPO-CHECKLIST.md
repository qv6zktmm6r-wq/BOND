# BOND online EXPO checklist

Built from the owner's online EXPO recommendations (October 9, 2026). We work through it top to bottom.

Everything here is live on joinbond.world. Items marked done that work with published companies (profiles, the Opportunity Board, updates, follows, saves, events, profile views, and messages) are saved in BOND's database for signed-in members; the rest uses sample companies or is saved in the visitor's own browser, as each item says. The "Platform" section at the bottom lists what a full launch still needs.

Legend: `[x]` done in the preview · `[~]` partly done · `[ ]` not started · `[!]` waiting on the owner

## Homepage: make the value obvious

- [x] Hero: "Where businesses meet. Opportunities begin." plus the supporting line
- [x] Two main buttons: Explore businesses, Create your company profile
- [x] Visible search field
- [x] Industry strip with photos (aerospace, engineering, construction, software, logistics, manufacturing, energy)
- [x] Featured company profiles: "New on BOND" shows up to four published member companies and hides itself when there are none, so sample companies aren't repeated above the directory
- [x] Next expo preview
- [x] Live expo advertised as the second section: join the online floor, or host an expo online, in person, or hybrid
- [x] Gold Founding Member badge reserved for the first 100 businesses on the pre-launch list, shown on their profile once they publish
- [x] Join, sign-up, and “Get on the list” open a launching-soon pre-signup for that list
- [x] Feedback form at the bottom of the homepage (stored privately; 3 notes a day per member, 30 a day from visitors who aren't signed in)
- [x] Supporting text under "Find the business behind the opportunity"
- [x] Diverse, natural imagery across industries (7 generated photos, illustrative)
- [!] Industrial grill image for the hero (owner to share)

## Discover Businesses

- [x] Industry tiles with images
- [x] Featured company cards (published members only)
- [x] Condensed lists: the directory, expo floor, Opportunity Board, events, and activity feed show every real company or post plus at most two sample ones, with "Show N more" and "Show fewer"; searching or filtering shows every match. Extra directory filters sit behind "More filters", and no photo repeats within a page
- [x] Advanced filters: industry, headquarters, service area (Southern California, Northern California, nationwide; statewide and nationwide companies count), certification (options built from the certifications companies list; "in progress" ones don't count), company size, and business community, with Clear filters. Company size is a new optional profile field. All of it is self-reported until verification exists

## 1. Live Expo Floor (signature experience)

- [x] Clickable visual floor with company booths and halls
- [x] Main stage showing what is presenting now
- [x] Representative availability on every booth
- [x] Enter a booth
- [~] Watch a video: there is a video slot, but no real video yet (needs video hosting)
- [x] Start a conversation: signed-in members message published companies privately (the company's owner sees it on their dashboard and replies); sample booths keep the demo chat, saved in the browser
- [x] Request a meeting: signed-in members send published companies preferred times and a note, and the company accepts or declines; sample booths keep the demo request

## 2. AI Business Matchmaking

- [x] Suggested customers, partners, suppliers, and teaming partners for every company, each with a reason
- [x] Homepage "find my matches" try-it
- [x] Matches on every profile and right after signing up
- [x] "Request introduction" (signed-in requests to published companies are saved and emailed to the company; example companies stay in the browser)
- [ ] Real AI matching that reads full profiles (needs a backend and an AI provider; owner approval for cost)

## 3. Company profiles that feel like mini-websites

- [x] Custom cover image
- [x] Logo
- [x] Services
- [x] Website link
- [x] Fill from website: a company enters its website first and BOND fills in the name, tagline, description, industry, services, location, contact details, logo, and cover from the public homepage. It never overwrites what the company typed, and the company checks everything before saving. Free (reads public page details, no AI provider).
- [ ] Server-wide limit on website lookups (today each server instance allows 12 per visitor per minute; a Vercel Firewall rule would cover all instances)
- [x] 30-second introduction video: companies upload a video of up to 30 seconds (checked for length and size); it plays on their profile. Sample companies show a video still.
- [x] Certifications, labeled "Self-reported" or "Sample · Not verified"; a Verified badge waits for real verification
- [x] Portfolio / project gallery: up to three project photos with titles; click a photo to enlarge it
- [x] Direct contact options: a contact bar under the company name (Contact company, Visit website, Watch introduction, Share profile), plus message, meeting, email, and phone
- [x] Mini-website feel: sticky section navigation (Overview, Video, Services, Certifications, Projects, Story, Matches, Contact)
- [ ] Real video hosting so uploaded videos are visible to everyone, not just the uploader's browser (needs a provider; owner approval for cost)
- [x] Edit an existing profile: "Edit profile" on your own profile (popup, full page) and on the dashboard reopens the form filled in; empty image, video, and photo fields keep what was uploaded; a failed save changes nothing

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
- [x] Posts from published companies visible to everyone; responses delivered privately to the posting company (with an optional reply contact) and listed on both dashboards
- [x] Email notification when a post gets a response (the email says a company responded; it does not include the response)

## 6. Company Activity Feed

- [x] Companies publish projects, new capabilities, partnerships, hiring announcements, and upcoming events (homepage feed, plus an Activity section on every profile)
- [x] Follow a company from the feed, its profile, or the expo side panel; a Following filter shows only followed companies
- [x] Start a conversation from a feed post (opens the demo chat with the post quoted)
- [x] Shared updates and follows visible across devices: updates from published companies are visible to everyone, and follows of published companies made while signed in are saved to the account (private to the member). Updates from browser drafts and sample companies, event announcements, and follows of sample companies stay in the browser
- [x] Email notification when a followed company shares an update (at most one per company per follower per day; the update text stays on BOND)

## Member Dashboard (medium priority)

Dashboard page (`dashboard.html`, "Dashboard" in the main menu), with a summary row of counts:

- [x] Connections and saved companies (saved, following, and introduction requests, with a Message button); saves of published companies made while signed in are kept in the account (private to the member)
- [x] Messages: private conversations with published companies, from both sides (messages you sent and messages to your companies), with "New" tags, replies, meeting requests to accept, decline, or cancel, and delete (the company can delete and block the sender); demo conversations with sample companies are listed too
- [x] Company profile views: published companies show how many signed-in members viewed them in the last 30 and 7 days, through yesterday (once per member per day, never who), plus companies you viewed recently
- [x] Opportunities (posted, with response counts, and the ones you responded to)
- [x] Upcoming events (events you RSVP'd to, events from companies you follow, the next expo, and your meeting requests)
- [x] Events you're hosting
- [x] Your companies, with Open profile, Post an opportunity, Share an update, and Host an event

## Company-hosted events

Companies host their own demos, workshops, open houses, and Q&As. Free reach only for now (no paid promotion).

- [x] Host an event: name, online / in person / hybrid, date, start time, length, address, join link (https only, shown to people who RSVP), description, optional seat limit
- [x] Listed in a homepage "Upcoming events" section (filters: online, in person, you're going, you're hosting), on the company profile, and in the activity feed; followers see it on their dashboards
- [x] RSVP, attending as yourself or one of your companies; cancel the RSVP; seats left; full events closed
- [x] Add to calendar (downloads a calendar file)
- [x] Hosts can cancel an event, which also removes its feed post
- [x] Events from published companies saved to the database and visible to everyone; signed-in members RSVP, the host sees the attendee list (company name or "A BOND member", never an email), and only the host and attendees see the join link
- [x] Event reminders by email, two hours before a future event, for the host and people who RSVP (no join link in the email; at most 8 notification emails a day per account and 40 a day for the project)
- [ ] Paid promotion or featured placement (owner decision on pricing)

## Flagship: AI Opportunity Rooms

Working: rooms opened as a published company are shared through the database with the published companies they invite; rooms opened as yourself, as a draft, or with only sample companies stay in the visitor's browser as demos. The project reader matches keywords (no paid AI yet).

- [x] Describe a project in plain language ("I need to build a fleet management platform…"), typed or spoken, with three examples on the homepage
- [x] Find companies matching the requirements: BOND reads which kinds of help the project needs (software, logistics, construction, engineering, manufacturing, energy, aerospace, program management), and the visitor can change them
- [x] Show qualifications, capabilities, and verification status (capabilities, certifications, business community, and "Not verified" until BOND verifies)
- [x] Suggest complementary partners to form a project team: one company per need, a suggested lead, optional extras, and a prompt to post on the Opportunity Board when no company covers a need
- [x] Open a private Opportunity Room (`room.html`): project and need coverage, conversation, team, proposals (shortlist, decline), meetings (https meeting link, add to calendar), and close the room; rooms are listed on the homepage and the dashboard
- [x] Invite a company into a room straight from its Spotlight or profile ("Invite to a room" on the profile dialog, full profile, and expo side panel)
- [ ] Real AI project reading and partner reasoning (needs the AI provider below)
- [x] Room invitations reaching the companies, and rooms shared between members: invited companies accept or decline from their dashboard or the room page; joined companies share the conversation and meetings and send sealed proposals only the host can read; the host manages needs, the team, meetings, and proposals and closes the room. Invitation emails say the company was invited and link to the room; they do not include the project brief
- [~] Video meetings: the room stores a meeting link the host pastes (Zoom, Teams, Meet); built-in video needs the video provider

## Guiding principles

- [x] No 3D "video game" environment; the expo floor is premium but simple
- [x] Prioritize the directory, profiles, and live networking before flashy extras

## Platform: needed for a real launch (owner decisions)

- [x] Accounts and sign-in for companies (Supabase, free plan): email sign-in links, company profiles saved to the database with logo and cover uploads, edit and delete, and moving browser drafts into the account. Live on joinbond.world
- [x] BOND's own email sender: sign-in emails go out through Resend from `no-reply@joinbond.world` (domain verified with DKIM, SPF, and DMARC records at Namecheap), with BOND-branded sign-in emails
- [x] Bot protection on the sign-in form (Cloudflare Turnstile, checked by Supabase on every sign-in request); sign-in emails capped at 30 an hour project-wide
- [x] Delete-my-account option (Account dialog, confirmed by typing your email) that also removes the account's company profiles and their logo and cover files from storage
- [x] Profile owners are private: visitors can't tell which company profiles share one account; only the signed-in owner sees which profiles are theirs
- [ ] Representative sign-in and roles (several people managing one company)
- [~] Database for profiles, Opportunity Board posts and responses, company updates, follows, saved companies, events, RSVPs, profile view counts, messages and meeting requests to published companies, introduction requests to published companies, and Opportunity Rooms between published companies (done); demo rooms and introductions to example companies are still in the browser
- [ ] Business claiming and verification; certification verification (VOSB/SDVOSB and others)
- [ ] Video hosting and live streaming (cost to scope)
- [ ] AI provider for matchmaking and Opportunity Rooms (cost to scope)
- [x] Email notifications for messages and meeting requests (the email names the company and links to the dashboard; it does not include the message). Introduction requests are still kept in the browser, so they are not emailed yet

## Launch

- [x] Hosting moved to Vercel; joinbond.world and www attached to the project
- [x] Namecheap DNS: A records for `@` and `www` point to 76.76.21.21; parking records removed (October 10, 2026; joinbond.world serves the site)
- [x] Production deploy of `feature/homepage-refresh` (main fast-forwarded and deployed October 9, 2026; attached to joinbond.world and www). Later work ships from `feature/accounts` the same way
- [!] Unpublish the old ChatGPT Site
