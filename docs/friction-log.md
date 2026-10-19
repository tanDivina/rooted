# Friction log

What I tried while building Rooted for the Build, Ship, Shape hackathon (Ring track), what happened, how I worked around it, and a suggestion. Severity in brackets.

**I built most of Rooted before finding the Playground camera (medium).** I wanted to test streaming and device code without owning a Ring camera. The getting-started guide lists a Ring device as a requirement, and I found no simulator or sample stream, so I developed against video files run through the starter's processor pipeline (the same pipeline a live stream feeds), using the public UR Fall dataset and AI-generated living-room clips. Late in the hackathon I registered as a developer, opened the Playground, generated a token and found its sample device. Discovery and live video worked in Rooted on the first try. Suggestion: mention the Playground's streaming device right next to the hardware requirement.

**The second live view on a token showed nothing (medium).** I started a WHEP session in Rooted, then another, then one in the Playground's own Motion player, all on the same token. The first streamed the sample clip. The later ones returned `201 Created` with an SDP answer, but no frames arrived, and `/v1/devices/{id}/status` reported `online: false` the whole time. Rooted now waits 15 seconds for frames, then ends the session and says so instead of showing a black "live" view, and it closes the Ring session when the page closes. Suggestion: return an error, or document the per-token or per-device session limit.

**A live view can't stay open (high for care, from the docs).** Watching for falls needs a continuous stream; sessions end after 30 s (battery) or 60 s (wired). I designed the dashboard to reconnect in a loop and accept the gaps. Suggestion: a longer session or keep-alive for approved care use cases.

**There's no way to ask "Are you okay?" through the camera (medium, from the docs).** I wanted the first escalation step to be a spoken check-in, but the audio track is receive-only. Rooted uses a chime in the home instead. Suggestion: talk-back for partner apps, or a clear note in the docs that audio is receive-only.

**The camera can't turn toward the person (low, from the docs).** I looked for pan-tilt in the public API reference and found nothing, so it's simulated in the demo. Suggestion: expose pan-tilt, or document that it isn't available.

**No footage to test a fall detector on (medium).** I looked for sample media in the docs and the starter and found nothing with a person in a home. I generated living-room clips with Gemini Omni Flash and used the public UR Fall dataset. Suggestion: ship a few reference clips with the starter.

**Headless tests never finish loading (low, not a Ring bug).** Playwright's "network idle" never arrives, because the starter's SSE webhook relay keeps a connection open. Waiting for `load` or `domcontentloaded` works. Suggestion: one line in the template README.
