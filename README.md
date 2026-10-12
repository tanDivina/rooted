# Rooted

> **You can’t transplant an old tree. So we bring the care to its roots.**
> Rooted turns the Ring camera already in the home into a quiet guardian, so older adults can keep living where their roots are.
> Built for the **Build, Ship, Shape: Amazon Developer Hackathon 2026** (Ring track: Caretaking & Accessibility).

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![WebRTC](https://img.shields.io/badge/WebRTC-WHEP-orange)
![Ring Partner API](https://img.shields.io/badge/Ring%20API-AVA%20v1-5C6B37)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Why stay rooted

An old oak has spent decades sending roots into one patch of ground. Move it, and even with the best care it struggles. People are much the same: their neighbours, their routines and their own front door are part of what keeps them well.

| Finding | Source |
| :--- | :--- |
| **77%** of US adults 50+ want to stay in their homes as they age; 79% want to stay in their communities. | [AARP Home and Community Preferences Survey, 2021](https://www.aarp.org/research/topics/community/info-2021/2021-home-community-preferences.html) |
| **50%** greater odds of survival with stronger social relationships (148 studies, 300,000+ people). | [Holt-Lunstad, Smith & Layton, *PLoS Medicine*, 2010](https://doi.org/10.1371/journal.pmed.1000316) |
| **35%** lower 5-year mortality for older adults with the most day-to-day happiness vs. the least, after adjustment. | [Steptoe & Wardle, *PNAS*, 2011](https://pubmed.ncbi.nlm.nih.gov/22042845/) |
| **11–15%** longer lifespan for the most optimistic people, and better odds of living past 85. | [Lee et al., *PNAS*, 2019](https://doi.org/10.1073/pnas.1900712116) |
| Living alone was tied to higher mortality only where people felt little connection to their neighbours. | [Jiang et al., Rutgers (PINE study)](https://www.rutgers.edu/news/strong-connection-neighbors-may-improve-health-outcomes) |
| Relocating older people without preparation carries a higher risk of poor outcomes. | [Holder & Jolley, *Reviews in Clinical Gerontology*, 2012](https://kar.kent.ac.uk/32428/) |

These are observational studies: strong, consistent associations rather than proof of cause. The app’s **Why stay rooted** page (`/why`) tells the same story for families and judges.

What drives families toward a move is usually fear of the fall nobody sees. [About 1 in 4 adults over 65 falls each year](https://www.cdc.gov/falls/data-research/index.html), and panic pendants tend to stay on the nightstand. Rooted is built to take that fear away.

---

## What Rooted watches for: the four roots

1. **A fall.** Pose geometry, centroid velocity and stillness at floor level on the live Ring stream.
2. **A stove left on.** A burner active in the kitchen zone while nobody is there.
3. **A call for help.** Phrases like “Help!”, “I fell!” or “¡Ayuda!” through the camera’s two-way audio.
4. **A quiet camera.** A missed heartbeat (Wi-Fi or power down) moves alerts onto a cellular backup.

## How it reaches out: three steps

When something is wrong, a 45-second check-in countdown starts. One “I’m okay” ends it; silence moves it outward:

1. **At home.** A chime and a voice check through the camera.
2. **Family.** Text and call to the caregiver, over cellular if needed.
3. **Emergency services.** Dispatch, with a structured paramedic brief.

Every moment is kept in **Growth rings**, the caregiver’s timeline.

---

## Architecture

```
Ring camera (AVA: WebRTC stream, status, events)
        │
        ▼
Roots: in-browser vision & audio (MediaPipe Pose, stove zone, keyword listener)
        │  incident
        ▼
Check-in countdown (1 s ticks, heartbeat watch, cellular fallback)
        │  no answer
        ├─► Step 1: in-home chime + voice
        ├─► Step 2: caregiver SMS + call
        └─► Step 3: emergency dispatch + paramedic brief
```

---

## Quick start

### Prerequisites
- Node.js 18+
- npm or pnpm

### 1. Installation
```bash
git clone https://github.com/dorienvandenabbeele/ringcare-guardian.git
cd ringcare-guardian
npm install
```

### 2. Configure Your Ring Token (Optional / Supported in UI)
You can link your Ring Playground access token in `.env.local` or directly inside the dashboard UI:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Paste token from https://developer.amazon.com/ring/console/playground
RING_ACCESS_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to open Rooted.

---

## Demo guide

The dashboard has one-click **Try a moment** buttons, so it works without a live camera:

| Button | What happens |
| :--- | :--- |
| **A fall** | Raises a fall alert and starts the check-in countdown. Watch it climb from step 1 to step 3. |
| **Stove left on** | Raises a kitchen alert for a burner left on with nobody present. |
| **A call for help** | Simulates hearing “Help me, I can’t get up!” through the camera. |
| **Wi-Fi goes down** | Cuts the camera’s heartbeat; Rooted switches to the cellular backup. Click again to restore. |
| **Connect a Ring camera** | Paste a Ring Playground token to stream your camera live over WebRTC. |

---

## Hackathon tracks

- **Primary track:** Ring (Caretaking & Accessibility).
- **AWS Builder mini-challenge:** the paramedic brief is a structured template today; the next step is generating it with AWS Bedrock and sending alerts through AWS SNS.
- **Open source mini-challenge:** MIT licensed.

---

## Product feedback for the Ring Developer Platform

As part of the hackathon submission requirements, here is feedback based on development:
1. **WHEP WebRTC Streaming**: Standard WebRTC HTTP Egress Protocol works exceptionally well in browsers without requiring native RTSP transcoders.
2. **Playground Tokens**: The 30-minute self-serve Playground access token makes initial developer bootstrapping friction-free.
3. **Wishlist**: Adding an indoor camera simulation stream (living room or kitchen) in the Playground alongside outdoor package/car streams would greatly accelerate development for elder care and IoT home automation apps.

---

## License
MIT © 2026 Dorien Van den Abbeele
