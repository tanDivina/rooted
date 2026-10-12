# 🛡️ RingCare Guardian

> **Autonomous Aging-in-Place Video Sentinel & Redundant Fail-Safe Emergency Backup for Ring Cameras**  
> Built for the **Build, Ship, Shape: Amazon Developer Hackathon 2026** (Ring Track: Caretaking & Accessibility).

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![WebRTC](https://img.shields.io/badge/WebRTC-WHEP-orange)
![Ring Partner API](https://img.shields.io/badge/Ring%20API-AVA%20v1-cyan)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🌟 Overview

Millions of seniors prefer to age in place with dignity and independence, but families constantly worry about unwitnessed slips, falls, or hazards. Traditional panic pendants are rarely worn (especially at night or during baths), and standard security systems are designed for intruders—not vulnerable residents.

**RingCare Guardian** transforms any Ring camera or doorbell into an autonomous, multimodal caretaking sentinel that monitors for emergencies without compromising personal privacy.

### Key Capabilities:
1. **🚨 Fall & Slip Detection**: Analyzes real-time human pose geometry, centroid velocity, and floor-level immobility to detect slips and falls immediately.
2. **🔥 Unattended Stove & Fire Hazard**: Continuously monitors designated cooking zones (ROI). If a burner is active and the resident leaves the kitchen for $>10$ minutes, a graduated alarm is triggered.
3. **🎙️ Voice Distress & SOS Listener**: Listens for distress cries (*"Help me!"*, *"I fell and can't get up!"*, *"Ayuda!"*) through the camera's two-way audio channel.
4. **🛡️ Redundant Fail-Safe & Cloud Dead-Man's Switch**: **The ultimate safety net.** If the resident falls and cannot speak, or if the Wi-Fi router / power cut causes the camera to go offline, an autonomous cloud dead-man's switch automatically escalates from in-home chimes to caregiver cellular SMS alerts and 911 dispatch.
5. **📋 Paramedic EMS Dispatch Briefs**: Generates standardized clinical incident summaries ready to transmit to local first responders.

---

## 🏗️ Architecture

```
                                  ┌───────────────────────────────────────────────┐
                                  │           Ring Camera System / AVA            │
                                  │ (Live WebRTC Stream + Status + History API)   │
                                  └──────────────────────┬────────────────────────┘
                                                         │
                                  ┌──────────────────────▼────────────────────────┐
                                  │           RingCare AI Vision Engine           │
                                  │  - Fall & Slip Detection (Pose & Velocity)    │
                                  │  - Unattended Stove & Heat Hazard Detection   │
                                  │  - Voice Cry-for-Help Distress Recognition    │
                                  └──────────────────────┬────────────────────────┘
                                                         │ (Incident Detected)
                                  ┌──────────────────────▼────────────────────────┐
                                  │     Fail-Safe Cloud Dead-Man's Escalation     │
                                  │             Heartbeat Sentinel                │
                                  └───────┬───────────────────────────────┬───────┘
                     (Resident OK?)       │                               │ (No Response / Timeout)
             ┌────────────────────────────┘                               └──────────────────────────────┐
             ▼                                                                                           ▼
   [Cancel Alarm via Voice]                                                                 [Level 1: In-Home Chime & Two-Way Voice]
                                                                                            [Level 2: Caregiver Push + SMS + Call]
                                                                                            [Level 3: Neighbor / Emergency Dispatch]
```

---

## 🚀 Quick Start

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

Open [http://localhost:3000](http://localhost:3000) to access the RingCare Guardian dashboard.

---

## 🧪 Interactive Hackathon Demo Guide

For hackathon judges and testers, RingCare Guardian provides single-click demo modes:

| Test Action | Description |
| :--- | :--- |
| **Live Ring Playground** | Connects to Ring's official WebRTC streaming session via `api.amazonvision.com` to verify API integration. |
| **Test Fall & Slip** | Triggers the pose geometry engine, draws the floor-level bounding box, and starts the dead-man's countdown. |
| **Test Stove Hazard** | Simulates active burner in the kitchen ROI without presence, demonstrating graduated fire prevention alerts. |
| **Test Voice SOS** | Simulates an acoustic distress trigger (*"Help me, I fell!"*). |
| **Simulate Network Cut** | Cuts camera connection to demonstrate the Heartbeat Sentinel immediately activating out-of-band cellular backup. |

---

## 🏆 Hackathon Tracks & Mini-Challenges

- **Primary Track**: Ring (Category: *Caretaking & Accessibility*)
- **AWS Builder Mini-Challenge**: Integrates with AWS Bedrock / SNS architecture for automated paramedic brief synthesis and SMS dispatching.
- **Open Source Mini-Challenge**: Licensed under permissive MIT open-source license.

---

## 💬 Product Feedback for Ring Developer Platform

As part of the hackathon submission requirements, here is feedback based on development:
1. **WHEP WebRTC Streaming**: Standard WebRTC HTTP Egress Protocol works exceptionally well in browsers without requiring native RTSP transcoders.
2. **Playground Tokens**: The 30-minute self-serve Playground access token makes initial developer bootstrapping friction-free.
3. **Wishlist**: Adding an indoor camera simulation stream (living room or kitchen) in the Playground alongside outdoor package/car streams would greatly accelerate development for elder care and IoT home automation apps.

---

## 📄 License
MIT © 2026 Dorien Van den Abbeele
