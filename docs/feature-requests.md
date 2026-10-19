# Feature requests

In order of how much they'd change a care app:

1. **Let approved care apps keep a stream open (critical).** Per the docs, a live view stops after 30 s on battery cameras and 60 s on wired ones. A care app has to reconnect in a loop, and its detectors miss whatever happens in the gaps, including a fall.
2. **Put the Playground camera on the first page of the docs.** Its sample device is what a developer without hardware needs, but the getting-started guide lists a Ring device as a requirement, so I built most of Rooted before I found it.
3. **Say so when a live view sends no video.** After the first stream on a token, later sessions came back `201 Created` with no frames, in Rooted and in the Playground's own player. An error or a documented limit would have told me the session was dead instead of leaving a black screen.
4. **Two-way audio.** Audio is receive-only, so the gentlest step, a voice asking "Are you okay?" through the camera, isn't possible. Ring Chime playback of a stored sound is the closest option.
5. **Development tokens that last a day.** Playground tokens last 30 minutes; a care dashboard stays open all day.
6. **Pan-tilt in the public API,** so a care app can turn an indoor camera toward the person who needs help.
7. **A sample clip with a person in it.** The Playground clip is a bird feeder. A living room with someone sitting, standing and falling would let care developers test without staging falls. I generated my own.
