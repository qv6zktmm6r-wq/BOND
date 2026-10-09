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
- `dist/app.js` — shared interactions, demo profiles, filters, and browser-local behavior.
- `dist/*.css` — styles; `dist/homepage.css` holds the homepage discovery section (search, industry strip, featured businesses, next-expo preview); `dist/expo-floor.css` holds the Live Expos booth floor.
- `dist/assets/` — BOND logos and photography, including the `industry-*.jpg` tiles.
- `vercel.json` — Vercel hosting: serves `dist/` as-is, no build step.
- `ASSET_NOTES.md` — photography provenance and user-selected imagery.
- `docs/original-site-text-snapshot.txt` — earlier content reference.

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
