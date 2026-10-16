# BOND — Business Opportunity Network & Discovery

**Domain:** https://joinbond.world (registered at Namecheap; served by Vercel, with www)  
**Hosting:** Vercel (project `bond`, static files from `dist/` plus the functions in `api/`)  
**Original site:** https://joinbond.mejia1604.chatgpt.site (ChatGPT Sites; still published until the owner unpublishes it)  
**GitHub repository:** https://github.com/qv6zktmm6r-wq/BOND  
**Tagline:** Where businesses connect.

This repository contains the original BOND website source and image assets exported from its existing ChatGPT Sites project on October 9, 2026. The export matches saved Site version 5, source commit `92bb394e8ad61fcbb605a93c26c3146727514222`. All 18 original tracked files were copied byte-for-byte.

## Open and run locally

Clone this repository and open the folder in Cursor:

```bash
git clone https://github.com/qv6zktmm6r-wq/BOND.git
cd BOND
PORT=3018 node scripts/dev-server.js
```

Open http://127.0.0.1:3018 (use `127.0.0.1`, not `localhost`, so the sign-in bot check accepts the page). The site is plain HTML, CSS, and JavaScript; it needs no dependency installation or build step. The dev server applies the security headers from `vercel.json` and runs the functions in `api/`; live audio needs the LiveKit variables described below. Sign-in and published profiles use the live Supabase project. To stop the server, press Ctrl+C.

## Project files

- `dist/index.html` — homepage and business discovery.
- `dist/expos.html` — interactive expo preview.
- `dist/company.html` — company profile preview.
- `dist/dashboard.html` — member dashboard (your companies, connections, messages, opportunities, profile views, events you host and attend), built from the signed-in account plus what the visitor saved in this browser; styles in `dist/dashboard.css`.
- `dist/room.html` — an Opportunity Room (project, team, conversation, proposals, meetings), opened from the homepage "Opportunity Rooms" section or the dashboard; shared rooms between published companies are saved in the database (`room.html?id=r-<id>`, see below), and demo rooms are saved in this browser (`localStorage` key `bond.demo.rooms`); styles in `dist/rooms.css`.
- `dist/app.js` — shared interactions, demo profiles, filters, and browser-local behavior.
- `dist/*.css` — styles; `dist/homepage.css` holds the homepage discovery section (search, industry strip, "New on BOND" member companies, next-expo preview) and the directory filter bar with its "More filters" panel; `dist/expo-floor.css` holds the Live Expos booth floor; `dist/spotlight.css` holds the Spotlight premiere timeline and Live Q&A panel; `dist/matches.css` holds business matchmaking (homepage try-it, suggested matches on profiles, post-signup matches); `dist/profiles.css` holds the company profile page, including the contact bar, section navigation, intro video, certifications, and projects. `dist/board.css` holds the Opportunity Board (posting, responses, companies that could fit) the Company Activity feed (updates, follow, start a conversation), and company-hosted events (homepage Upcoming events, Host an event form, RSVP, add to calendar).
- `dist/assets/` — BOND logos and photography, including the `industry-*.jpg` tiles and the `project-*.jpg` sample portfolio photos.
- `dist/assets/qa/` — synthetic sample voice clips for the Live Q&A tab (see `ASSET_NOTES.md`).
- Uploaded intro videos and project photos are stored in the visitor's browser (IndexedDB database `bond-demo-media`); browser drafts of profiles stay in `localStorage`, and published profiles are in Supabase (below).
- Voice Q&A: a visitor raises a hand, the representative passes the mic, and the visitor talks with live captions and an on-air banner on the stage. A copy of the recording is saved in the same IndexedDB database (`qa-recording:<id>`), and its caption text is stored with the question in `localStorage`.

## Live audio (LiveKit)

Live Q&A audio runs on [LiveKit Cloud](https://cloud.livekit.io) (project "BOND", free Build plan: 5,000 participant-minutes a month, hard cap, no charges).

- `api/live-token.js` issues short-lived (2 hour) room passes. Guests can listen and raise a hand but cannot publish audio or data. Representatives get a speaking pass only with the host code.
- `api/live-mic.js` passes or takes back the mic (host code required), or lets a speaker hand back their own mic (verified against their pass).
- `api/website-profile.js` reads a company's public homepage and returns profile details (name, tagline, description, industry, services, location, contact details, logo, cover) for the "Fill from website" button. It only accepts requests from the BOND site and allows 12 lookups per visitor per minute on each server instance.
- `api/_lib/website.js` fetches and parses the page. It only connects to public addresses (every DNS answer and redirect is checked; private, local, and IP-literal addresses are refused), and it caps time, redirects, and page and image sizes.
- `api/_lib/live.js` signs LiveKit tokens with Node's `crypto` (no npm dependencies) and calls LiveKit's RoomService.
- `dist/live-audio.js` connects the browser, plays whoever holds the mic, and sends live captions to the room. It loads `dist/vendor/livekit-client-2.22.3.umd.js` (Apache-2.0, npm integrity verified, served from this site) only when someone joins.
- Representatives open any expo page with `?host` at the end of the address, go to Live Q&A, and enter the host code to see raised hands, pass or take back the mic, and answer live.
- Without the API (for example, a static-only server) the page falls back to the recorded preview automatically.

Environment variables (set in Vercel **Preview** and **Production**; never commit them): `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `BOND_HOST_CODE` (12+ characters). Local copies live in macOS Keychain under project `bond` (`dev-secret list --project bond`).

Local test without real keys:

```bash
livekit-server --dev --bind 127.0.0.1
PORT=3017 LIVEKIT_URL=ws://127.0.0.1:7880 LIVEKIT_API_KEY=devkey LIVEKIT_API_SECRET=secret BOND_HOST_CODE=local-test-host-code node scripts/dev-server.js
```

Then open `http://127.0.0.1:3017/expos.html?host` in one tab and `http://127.0.0.1:3017/expos.html` in another.
- `vercel.json` — Vercel hosting: serves `dist/` as-is, no build step.
- `ASSET_NOTES.md` — photography provenance and user-selected imagery.
- `docs/original-site-text-snapshot.txt` — earlier content reference.
- `docs/EXPO-CHECKLIST.md` — the online EXPO roadmap checklist we work through in order.

## Accounts and company profiles (Supabase)

Company sign-in and published profiles run on [Supabase](https://supabase.com) (organization "BOND", project `bond`, free plan, region us-west-1).

- Sign-in uses one-time email links (no passwords). The same link creates an account the first time.
- Sign-in emails are sent by [Resend](https://resend.com) from `no-reply@joinbond.world` through Supabase's custom SMTP setting (`smtp.resend.com`, port 465). The domain's DKIM, SPF (`send` and `rsend`), and DMARC records live in Namecheap Advanced DNS. The Resend key is a sending-only key limited to joinbond.world, stored in macOS Keychain under project `bond` as `RESEND_API_KEY`.
- Branded email templates live in `supabase/templates/` (`magic_link.html` for returning members, `confirmation.html` for first sign-in) and are applied to the project through the Supabase Management API (`config/auth`, fields `mailer_templates_*_content` and `mailer_subjects_*`).
- Bot protection uses Cloudflare Turnstile (widget "BOND sign-in", Managed mode, in the owner's Cloudflare account). The sign-in form loads it when `TURNSTILE_SITE_KEY` in `dist/app.js` is set, and Supabase rejects any sign-in request without a valid token (Supabase settings `security_captcha_enabled`, provider `turnstile`; the Turnstile secret is in macOS Keychain under project `bond` as `TURNSTILE_SECRET_KEY`). The widget accepts joinbond.world, www.joinbond.world, the `feature/accounts` preview (`bond-git-feature-accounts-qv6zktmm6r-wqs-projects.vercel.app`), and `127.0.0.1` for local development (use `http://127.0.0.1:3018`, not `localhost`). Sign-in on any other preview address fails the bot check until that hostname is added to the widget. The site's Content Security Policy in `vercel.json` allows `https://challenges.cloudflare.com` for scripts and frames.
- Supabase sends at most 30 sign-in emails an hour across the whole project (`rate_limit_email_sent`).
- Signed-in members publish company profiles to the `company_profiles` table; everyone can read them, and only the owner can change or delete their own (row-level security, at most 5 profiles per account). Joining before launch (`join_founding_list`) saves a place on the founding list. The first 100 places reserve the gold Founding Member badge; that place stays with the email, and deleting a signup does not hand it to a later business. When that email publishes a company, the profile keeps the reserved place (`founding_place`) and shows the badge. The homepage says how many of the 100 places are still open (`founding_spots_remaining`). At most 25 new emails can join per day. Checks: `supabase db query --linked -f supabase/tests/founding_list.sql`. Anyone can send a short note from the bottom of the homepage (`site_feedback`); notes are not readable through the API, a member can send 3 a day, and unsigned visitors share a limit of 30 a day. Checks: `supabase db query --linked -f supabase/tests/founding_feedback.sql`. Logos and covers go to the public `company-media` storage bucket as `<profile id>/logo.<ext>` and `<profile id>/cover.<ext>` (PNG, JPEG, or WebP, up to 1 MB).
- Who owns a profile is not public. Visitors and other members can read every profile column except `owner_id`; ownership is recorded in `company_profile_owners`, which signed-in members can read only for their own profiles, and image addresses contain no account id. The site uses that table to show Edit on the member's own profiles. The database assigns profile ids and always records the signed-in member as the owner, and a profile can't be deleted while its images remain (the site removes them first).
- Published companies post Opportunity Board requests to the `opportunities` table, which everyone can read; the posting company can remove its own posts. Other signed-in members respond as one of their published companies, with an optional message and an optional reply contact (an email address or phone number), in `opportunity_responses`. A response is visible only to the account that sent it and to the posting company's owner, the sender can withdraw it, and neither table exposes an account id. Limits, enforced by the database: 20 live posts per company, 10 new posts a day per account (deleted posts still count, tracked in `private.opportunity_post_log`), 3 responses per opportunity from one company, and 30 responses a day per account. Posts from browser drafts and sample companies stay in the browser; moving a draft into the account also publishes its posts. Checks: `supabase db query --linked -f supabase/tests/opportunities_rls.sql`.
- Published companies share activity-feed updates to the `company_updates` table, which everyone can read; the sharing company can remove its own updates. Limits, enforced by the database: 100 updates per company and 20 new updates a day per account (deleted updates still count, tracked in `private.company_update_log`); update text can't contain invisible or direction-changing characters. Signed-in members' follows of published companies are saved in `company_follows`, readable only by the member who follows (no account id is exposed, and a company can't see its followers); up to 500 per account and 200 new follows a day (`private.company_follow_log`). A company's profile page loads all of its updates; the homepage feed shows the newest 200. Updates from browser drafts and sample companies, announcements of browser-draft events, and follows of sample companies or made while signed out stay in the browser; moving a draft into the account also publishes its updates. Checks: `supabase db query --linked -f supabase/tests/feed_rls.sql`.
- Published companies host events in the `company_events` table, which everyone can read; the host can cancel its own events, which also removes their RSVPs and join links. Each event is announced in the activity feed automatically. Online and hybrid join links are kept separately in `company_event_links` and are readable only by the host and by members who RSVP'd. Signed-in members RSVP in `company_event_rsvps`, as themselves or as one of their published companies; an RSVP is visible only to the member and the host, the host sees the company name or "A BOND member" (never an account id or email), and only the member can cancel it. The database keeps the going count, closes full and ended events, and refuses RSVPs to your own events. Limits, enforced by the database: events must start in the future and within a year, 20 upcoming events per company, 10 new events and 50 new RSVPs a day per account (`private.company_event_log`, `private.company_event_rsvp_log`). Events from browser drafts and sample companies, and RSVPs to sample events, stay in the browser; moving a draft into the account also publishes its upcoming events. Reminders aren't sent yet. Checks: `supabase db query --linked -f supabase/tests/events_rls.sql`.
- Signed-in members' saves of published companies ("Save company") are kept in `company_saves`, readable only by the member who saved (no account id is exposed, and a company can't see who saved it); up to 500 per account and 200 new saves a day (`private.company_save_log`; removing a save doesn't free up the daily limit, and saving a company that is already saved is skipped and doesn't count). Saves of sample companies and saves made while signed out stay in the browser; removing a save while signed in removes it from both. Checks: `supabase db query --linked -f supabase/tests/saves_rls.sql`.
- Signed-in members message published companies privately ("Message company" on the profile, or Messages on the dashboard), writing as one of their published companies or as themselves. A conversation (`company_conversations`) belongs to the member who started it and the contacted company's owner; only those two can read it and its messages (`company_messages`), the company sees the sending company's name or "A BOND member" (never an account id or email), and the company sees a conversation only once it has a message. Either side can reply. The member can send a meeting request (preferred times and an optional note); the company accepts or declines it, the member can cancel it while it is waiting, and only one request can wait at a time. Messages can't be edited. Either side can delete the conversation for both; when the company deletes it, that member can't start a new conversation with that company (`private.company_conversation_blocks`, unreadable by members). Read times are kept per member in `company_conversation_reads` to show "New" on the dashboard and on the Account button. Open conversations refresh every 20 seconds; there are no email notifications yet. Limits, enforced by the database: 20 new conversations and 200 messages a day per account (`private.company_conversation_log`, `private.company_message_log`), 2,000 characters per message and 200 for preferred times, and no messaging your own companies. Deleting a company or an account deletes its conversations. Messages to sample companies stay a browser demo. Checks: `supabase db query --linked -f supabase/tests/messages_rls.sql`.
- Shared Opportunity Rooms: a signed-in member opens a room as one of their published companies (the host) and invites other published companies (`opportunity_rooms`, `opportunity_room_members`). An invited company's owner sees the room's name, project description, needs, and host on their dashboard and the room page, and accepts or declines; only the host and companies that joined see the team, the conversation (`opportunity_room_messages`), and meetings with their join links (`opportunity_room_meetings`). Proposals (`opportunity_room_proposals`) are sealed: only the host and the company that sent one can read it. Only the host changes the project's needs, invites or removes companies, schedules or cancels meetings, shortlists or declines proposals, and closes the room, which deletes everything in it. Members post messages, send or withdraw their own proposals (up to 3 per company per room), and leave, which withdraws their proposals. The database writes notes into the conversation when the room opens, companies are invited, join, decline, leave, or are removed, and meetings are scheduled or canceled. No table exposes an account id, and invited companies can't read a room's conversation, meetings, or proposals. Limits, enforced by the database: 20 open rooms and 10 new rooms a day per account, 8 invited companies per room (declined invitations count until the host removes them), 40 invitations, 300 room messages, and 20 proposals a day per account, and 20 meetings per room (`private.opportunity_room_log`). The site refreshes an open room every 20 seconds and marks rooms with activity since the member last opened them in this browser (`bond.rooms.seen`, kept only for the signed-in account). Rooms opened as yourself, as a browser draft, or with only sample companies stay in the browser as demos (`bond.demo.rooms`); sample companies picked for a shared room are left out. Checks: `supabase db query --linked -f supabase/tests/rooms_rls.sql`.
- When a signed-in member opens a published company's profile (the full page or the directory dialog), the visit is recorded in `company_profile_views`, once per member, company, and UTC day; owners' visits to their own companies and visitors who aren't signed in aren't counted. The company's owner reads daily totals through yesterday (UTC) from the `company_profile_view_counts` view (shown on the dashboard as views in the last 30 and 7 days); today's visits stay hidden so a count can't be watched change the moment one person looks. Owners can never see who viewed, and viewers can't read the rows back. Every counted view prunes visits older than 90 days across all companies, and each account is limited to 300 counted views a day. The Account dialog tells members what is recorded and for how long. Checks: `supabase db query --linked -f supabase/tests/profile_views_rls.sql`.
- Text that members publish (company profiles, Opportunity Board posts and responses, activity-feed updates, events, messages and meeting requests, and Opportunity Room names, descriptions, messages, meetings, and proposals) can't contain invisible or direction-changing characters or control characters; line breaks are allowed only in descriptions, stories, details, messages, and updates. Names, descriptions, headlines, details, update text, and in-person event locations must have at least one visible character (no-break or wide spaces and blank Braille patterns don't count). The database refuses anything else (`private.text_is_plain`, `private.text_has_content`); the site strips those characters before saving and asks for letters or numbers when nothing visible is left. Zero-width joiners are among the stripped characters, so emoji built from several joined emoji show as separate emoji and Persian or Urdu words that need a zero-width non-joiner lose it. Checks: `supabase db query --linked -f supabase/tests/text_rules.sql`.
- Members can delete their account from the Account dialog after typing their email. Deletion needs a sign-in from the last 30 minutes (checked by the database from the token's `amr` sign-in time, which survives token refreshes); otherwise the dialog asks the member to sign in again. The site first removes every image in the member's profile folders through the Storage API, then calls `public.delete_my_account()`, which refuses to run while any of the member's files remain and then deletes the sign-in account; their company profiles are deleted with it. Supabase's security advisor flags this function because signed-in members can run it with elevated rights; that is intended, since it only ever deletes the caller's own account.
- Intro videos and project photos still stay in the browser (IndexedDB).
- Browser drafts made before signing in can be moved into the account from the dashboard or the Account dialog.
- `dist/app.js` loads `dist/vendor/supabase-2.117.3.js` (MIT, npm integrity verified, served from this site) only where accounts are switched on. Accounts are on everywhere, including joinbond.world (`PUBLIC_ACCOUNTS` in `dist/app.js`; set it to `false` to hide sign-in on joinbond.world while keeping it on previews and local development).
- The publishable key in `dist/app.js` is public by design. The secret key and database password live only in macOS Keychain under project `bond`.
- `supabase/migrations/` holds the schema, policies, and storage rules; apply with `supabase db push` after `supabase link --project-ref mdifopcbcvyzfoflnoxz`. Each file in `supabase/tests/` checks one area's access rules inside a transaction that is rolled back and prints PASS or FAIL per check; profiles: `supabase db query --linked -f supabase/tests/company_profiles_rls.sql` (the other files are listed with their features above).

## Hosting and current behavior

BOND is hosted on Vercel and served at joinbond.world. The repository is no longer linked to ChatGPT Sites (the `.openai/hosting.json` project file was removed). The original ChatGPT Site at https://joinbond.mejia1604.chatgpt.site stays up until the owner unpublishes it from the ChatGPT account.

The `og:url` and `og:image` share-preview tags in `dist/index.html`, `dist/expos.html`, and `dist/company.html` point at https://joinbond.world.

The site mixes fictional sample companies with real member accounts. Sign-in and published company profiles run on Supabase (see above) everywhere, including joinbond.world; Opportunity Board posts and responses, company updates, follows and saves of published companies, events and RSVPs, profile view counts, messages and meeting requests to published companies, and Opportunity Rooms between published companies are shared through the database. Demo chats and meeting requests with sample companies, introduction requests, demo Opportunity Rooms, intro videos, and project photos still live in the visitor's browser.

Routes:

- Homepage: `/`
- Live expo preview: `/expos.html`
- Company profile preview: `/company.html?id=nova`

## Brand decisions

- Brand: **BOND** (Business Opportunity Network & Discovery).
- Identity: preserve the existing integrated BOND logo and wordmark.
- Colors: midnight `#060D1B`, cobalt `#0057FF`, cyan `#00A8FF`, white `#FFFFFF`, deep surface `#111D30`, muted `#A3B3CC`.
- Positioning: permanent company-first business network with live expos.
- Tone: confident, practical, welcoming; clear distinctions between demos, real accounts, self-reported ownership, and certification.
- Imagery: representative business owners across industries and backgrounds.

## Roadmap and releases

The roadmap and the status of each item live in `docs/EXPO-CHECKLIST.md`.

Work happens on the `feature/accounts` branch, which Vercel deploys as a preview. Each change is checked locally and with the database tests in `supabase/tests/`, then `main` is fast-forwarded to the branch; Vercel deploys `main` to joinbond.world.

## Export verification

- Original source commit matches saved Site version 5.
- All original file hashes match their imported GitHub blobs.
- JavaScript syntax check passed with `node --check dist/app.js`.
- Local HTML and CSS asset references resolve.
- Browser behavior was not retested during this source-only transfer.
