# BOND — Business Opportunity Network & Discovery

**Domain:** https://joinbond.world (registered at Namecheap; not yet connected to Vercel)  
**Hosting:** Vercel (project `bond`, static files from `dist/`)  
**Original site:** https://joinbond.mejia1604.chatgpt.site (ChatGPT Sites; retire after the Vercel site is live)  
**GitHub repository:** https://github.com/qv6zktmm6r-wq/BOND  
**Tagline:** Where businesses connect.

This repository contains the original BOND website source and image assets exported from its existing ChatGPT Sites project on October 9, 2026. The export matches saved Site version 5, source commit `92bb394e8ad61fcbb605a93c26c3146727514222`. All 18 original tracked files were copied byte-for-byte.

## Open and run locally

Clone this repository and open the folder in Cursor:

```bash
git clone https://github.com/qv6zktmm6r-wq/BOND.git
cd BOND
python3 -m http.server 3000 --directory dist
```

Open http://localhost:3000. The site is plain HTML, CSS, and JavaScript; it needs no dependency installation or build step. To stop the local server, press Ctrl+C.

## Project files

- `dist/index.html` — homepage and business discovery.
- `dist/expos.html` — interactive expo preview.
- `dist/company.html` — company profile preview.
- `dist/dashboard.html` — member dashboard (connections, messages, opportunities, events you host and attend), built from what the visitor saved in this browser; styles in `dist/dashboard.css`.
- `dist/room.html` — an Opportunity Room (project, team, conversation, proposals, meetings), opened from the homepage "Opportunity Rooms" section or the dashboard; rooms are saved in this browser (`localStorage` key `bond.demo.rooms`); styles in `dist/rooms.css`.
- `dist/app.js` — shared interactions, demo profiles, filters, and browser-local behavior.
- `dist/*.css` — styles; `dist/homepage.css` holds the homepage discovery section (search, industry strip, featured businesses, next-expo preview); `dist/expo-floor.css` holds the Live Expos booth floor; `dist/spotlight.css` holds the Spotlight premiere timeline and Live Q&A panel; `dist/matches.css` holds business matchmaking (homepage try-it, suggested matches on profiles, post-signup matches); `dist/profiles.css` holds the company profile page, including the contact bar, section navigation, intro video, certifications, and projects. `dist/board.css` holds the Opportunity Board (posting, responses, companies that could fit) the Company Activity feed (updates, follow, start a conversation), and company-hosted events (homepage Upcoming events, Host an event form, RSVP, add to calendar).
- `dist/assets/` — BOND logos and photography, including the `industry-*.jpg` tiles and the `project-*.jpg` sample portfolio photos.
- `dist/assets/qa/` — synthetic sample voice clips for the Live Q&A tab (see `ASSET_NOTES.md`).
- Uploaded intro videos and project photos are stored in the visitor's browser (IndexedDB database `bond-demo-media`); profile text stays in `localStorage`.
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

## Hosting and current behavior

BOND is hosted on Vercel. The repository is no longer linked to ChatGPT Sites (the `.openai/hosting.json` project file was removed). The original ChatGPT Site at https://joinbond.mejia1604.chatgpt.site stays up until it is unpublished from the ChatGPT account; do that only after the Vercel site is live.

The `og:url` and `og:image` share-preview tags in `dist/index.html`, `dist/expos.html`, and `dist/company.html` point at https://joinbond.world. Link previews will only show images once that domain is connected to the Vercel project.

The current implementation is an interactive static prototype with fictional demo companies and browser-local behavior. Real shared accounts, persistent messaging, and live broadcasting still require backend implementation.

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

## Planned improvements

1. Improve the current homepage hero, searchable industries, featured profiles, and expo preview.
2. Expand searchable business discovery with useful filters.
3. Expand company profiles with branding, video, services, portfolios, representatives, contact controls, and certification status.
4. Build live expos with company spotlights, clickable profile panels, private chat, and Q&A within the presentation.
5. Build an opportunity board and company activity feed.
6. Add company dashboards and private networking.
7. Build **AI Opportunity Rooms** for capability-based matching, teaming introductions, and opportunity collaboration.

Develop improvements on a feature branch, verify the routes and assets on its Vercel preview, then publish by deploying to Vercel production.

## Export verification

- Original source commit matches saved Site version 5.
- All original file hashes match their imported GitHub blobs.
- JavaScript syntax check passed with `node --check dist/app.js`.
- Local HTML and CSS asset references resolve.
- Browser behavior was not retested during this source-only transfer.
