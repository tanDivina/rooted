# Rooted

> **You can’t transplant an old tree. So we bring the care to its roots.**
> Rooted turns the Ring camera already in the home into a quiet guardian, so older adults can keep living where their roots are.
> Built for the **Build, Ship, Shape: Amazon Developer Hackathon 2026** (Ring track: Caretaking & Accessibility).

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![WebRTC](https://img.shields.io/badge/WebRTC-WHEP-orange)
![Ring Partner API](https://img.shields.io/badge/Ring%20API-AVA%20v1-5C6B37)
![License](https://img.shields.io/badge/License-MIT-green)

![Rooted dashboard](docs/screenshots/dashboard.png)

**Demo video (under 3 min):** see the Devpost submission · **Try it:** `npm install && npm run dev`, then press **A fall**.

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

1. **A fall.** [MediaPipe Pose](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker) runs in the browser on every frame of the Ring stream. A fall is the hips dropping sharply (a fifth of the frame height within 1.5 s) with the torso tipping toward horizontal, then 4 seconds of stillness on the floor. Lying down slowly counts as resting, and only raises a gentler alert after a minute still on the floor.
   *Tested on the [UR Fall Detection Dataset](http://fenix.ur.edu.pl/~mkepski/ds/uf.html) (front camera): 7 of 8 fall runs detected, 0 alerts across 9 everyday clips (sitting, bending, lying down on purpose). A small sample, not a clinical validation. The “Try a moment” fall uses generated cartoon footage the pose model can’t read, so that one button is scripted.*
2. **A stove left on.** A burner on in the kitchen while nobody is there (scripted in the demo today; vision on the stove zone is in progress).
3. **A call for help.** Phrases like “Help!” or “I fell!” (scripted in the demo today; speech recognition on the Ring stream’s audio track is in progress).
4. **A quiet camera.** A missed heartbeat (Wi-Fi or power down) moves alerts onto a cellular backup.

## How it reaches out: three steps

When something is wrong, a 45-second check-in countdown starts. One “I’m okay” ends it; silence moves it outward:

1. **At home.** A chime in the home (the Ring API can play a sound on a Ring Chime; it has no talk-back, so there is no voice check).
2. **Family.** Text and call to the caregiver, over cellular if needed.
3. **Emergency services.** Dispatch, with a structured paramedic brief.

Every moment is kept in **Growth rings**, the caregiver’s timeline.

**Hard to cancel by accident, easy to cancel on purpose.** “I’m okay” is a 2.5-second hold, so a stray tap can’t dismiss a real fall. “Send help now” gives a 15-second grace window in case it was pressed by mistake, and every cancel is followed by a 60-second quiet check.

**Daily rhythms.** Ring Alarm contact and motion sensors and the smoke/CO listener add context (medicine cabinet opened, a trip to the fridge, the front door at night), and a Ring Pan-Tilt Indoor Cam can turn toward whatever needs a look.

| A fall, and the check-in | Growth rings | Why stay rooted |
| :---: | :---: | :---: |
| ![Fall alert](docs/screenshots/fall-alert.png) | ![Growth rings](docs/screenshots/growth-rings.png) | ![Why stay rooted](docs/screenshots/why.png) |

---

## Architecture

```
Ring camera (AVA: WebRTC stream, status, events)
        │
        ▼
Roots: in-browser vision & audio (fall heuristic, stove zone, keyword listener)
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
git clone https://github.com/tanDivina/rooted.git
cd rooted
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

## What’s real and what’s simulated

| Real, against the Ring API (AVA v1) | Simulated for the demo |
| :--- | :--- |
| Device discovery (`/v1/devices`) and status / heartbeat (`/v1/devices/{id}/status`) | Stove and call-for-help detections (scripted triggers) |
| Live video over WebRTC (WHEP sessions), with the MediaPipe Pose fall detector running on each frame | Contact, motion and smoke/CO sensor events |
| Playground access tokens and OAuth refresh-token flow | Pan-Tilt motor control (not in the public API) |
| Signed webhooks streamed to the dashboard over SSE | In-home chime, family alerts and the 911 dispatch |

**Making it real (in progress):** vision on the stove zone, speech and smoke-alarm detection on the stream’s audio track, Ring contact and temperature sensors over webhooks, a real Ring Chime sound, family alerts through AWS, and a Bedrock-written paramedic brief. The 911 dispatch will always stay simulated: a hackathon app should never call emergency services on its own.

The **Try a moment** buttons play generated footage of a living room, a kitchen and a porch (`scripts/generate_demo_videos.py`) through the same detectors, so the app works without a camera.

## Built during the hackathon

Rooted started from Amazon’s [Ring API Hello World](https://github.com/AmazonAppDev/ring-api-helloworld) starter (auth, device list, WHEP player, webhook receiver, video-processor framework). Everything else was built for this hackathon: the four care detectors (`lib/video-processors/care/`), the check-in countdown and three-step escalation, the caregiver timeline and paramedic brief, the heartbeat and cellular-fallback model, pan-tilt and sensor fusion, the demo footage generator, the `/why` research page, and the whole Rooted design (palette, type and a custom icon set).

---

## Hackathon tracks

- **Primary track:** Ring (Caretaking & Accessibility).
- **AWS Builder mini-challenge:** the paramedic brief is a structured template today; the next step is generating it with AWS Bedrock and sending alerts through AWS SNS.
- **Open source mini-challenge:** MIT licensed; see [LICENSE](LICENSE).

---

## Product feedback: friction log

What worked well, and what slowed us down, building on the Ring Developer Platform:

**Worked well**
1. **WHEP streaming.** Standard WebRTC egress plays in the browser with no RTSP transcoding, and frames can be read straight into a canvas for on-device analysis.
2. **Playground tokens.** Getting a first token takes minutes, and the starter app runs on the first try.
3. **The starter template.** The video-processor interface (`init` / `process` / `cleanup`) made it easy to drop in new detectors.

**Friction**
1. **Playground tokens last 30 minutes.** Long build or demo sessions mean re-pasting a token, and a care dashboard is meant to stay open all day. A longer-lived development token would help.
2. **Live streams stop after 30 or 60 seconds.** Battery cameras stream for 30s, wired ones for 60s. A care dashboard has to reconnect in a loop, which means gaps in what the detectors see. A longer session for approved care use cases would help.
3. **Audio is receive-only.** The stream’s audio track is great for listening for a call for help, but there is no talk-back, so the gentlest step of an escalation (a voice asking “Are you okay?”) isn’t possible through the camera. Ring Chime playback of a stored sound is the closest option.
4. **No pan-tilt control.** We couldn’t find pan-tilt in the public API, so a care app can’t turn an indoor camera toward the person who needs help.
5. **No care-shaped test footage.** Care and accessibility apps need a living room, a kitchen and a person who sits, stands and falls. We generated our own footage for the demo.
6. **Long-lived event streams and tooling.** Our SSE webhook relay keeps a connection open, so headless test tools that wait for “network idle” never finish. Not a Ring bug, but a short note in the template docs would help.

---

## License
MIT. Rooted © 2026 Dorien Van den Abbeele; portions from the Ring API Hello World starter © 2026 Amazon. See [LICENSE](LICENSE).
