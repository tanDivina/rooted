"""
Generate the demo "camera footage" used by the Try-a-moment buttons.

Draws warm, lived-in rooms in Rooted's bark / moss / parchment palette and
pipes frames straight into ffmpeg (no temp PNGs). Output:
  public/videos/fall-scenario.mp4    living room: walking, a fall, lying still
  public/videos/stove-scenario.mp4   kitchen: pot on a lit burner, nobody there
  public/videos/playground-feed.mp4  front of the house: a car passes, parcel on the step

Run:  python3 scripts/generate_demo_videos.py
"""
import math
import os
import subprocess

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VIDEOS_DIR = os.path.join(ROOT, "public", "videos")
os.makedirs(VIDEOS_DIR, exist_ok=True)

W, H = 1280, 720
SS = 2  # supersampling for smooth edges
FPS = 30
DURATION_SEC = 8
FRAMES = FPS * DURATION_SEC

# Rooted palette
PARCHMENT = (243, 237, 224)
WALL = (233, 223, 201)
WALL_SHADE = (222, 210, 186)
OAK = (185, 140, 94)
OAK_DARK = (160, 117, 76)
BARK = (59, 42, 30)
BARK_SOFT = (107, 82, 66)
MOSS = (92, 107, 55)
MOSS_DEEP = (62, 74, 35)
MOSS_SOFT = (142, 154, 94)
HONEY = (183, 121, 31)
HONEY_GLOW = (244, 214, 150)
EMBER = (168, 67, 43)
SKIN = (224, 184, 154)
HAIR = (214, 208, 198)
CARDIGAN = (156, 90, 60)
TROUSERS = (74, 59, 48)


def font(size):
    for path in ("/System/Library/Fonts/HelveticaNeue.ttc", "/System/Library/Fonts/Helvetica.ttc"):
        if os.path.exists(path):
            return ImageFont.truetype(path, size * SS)
    return ImageFont.load_default()


LABEL_FONT = font(17)


def S(*v):
    """Scale coordinates to the supersampled canvas."""
    return [x * SS for x in v]


def open_ffmpeg(path):
    return subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
         "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", path],
        stdin=subprocess.PIPE,
    )


def camera_label(draw, name, i):
    """Quiet camera chrome: a REC dot and a rounded room label with the time."""
    secs = 14 * 3600 + 32 * 60 + i // FPS
    stamp = f"{secs // 3600:02d}:{secs // 60 % 60:02d}:{secs % 60:02d}"
    text = f"{name}  ·  {stamp}"
    tw = draw.textlength(text, font=LABEL_FONT) / SS
    draw.rounded_rectangle(S(24, H - 62, 24 + tw + 44, H - 24), radius=19 * SS, fill=(59, 42, 30, 170))
    draw.ellipse(S(40, H - 49, 52, H - 37), fill=EMBER if (i // 15) % 2 == 0 else (120, 60, 40))
    draw.text((62 * SS, (H - 53) * SS), text, font=LABEL_FONT, fill=PARCHMENT)


def vignette():
    """Soft darkening at the edges, like a real indoor camera lens."""
    v = Image.new("L", (W * SS, H * SS), 0)
    d = ImageDraw.Draw(v)
    d.ellipse(S(-160, -120, W + 160, H + 120), fill=255)
    v = v.filter(ImageFilter.GaussianBlur(120 * SS))
    shade = Image.new("RGBA", (W * SS, H * SS), (40, 28, 20, 0))
    shade.putalpha(v.point(lambda a: int((255 - a) * 0.55)))
    return shade


def glow(size, color, alpha=150):
    """A soft light pool. The ellipse sits in the middle half of its layer so the blur never hits an edge."""
    g = Image.new("RGBA", (size * SS, size * SS), color + (0,))
    a = Image.new("L", g.size, 0)
    ImageDraw.Draw(a).ellipse([size * SS // 4, size * SS // 4, size * SS * 3 // 4, size * SS * 3 // 4], fill=alpha)
    g.putalpha(a.filter(ImageFilter.GaussianBlur(size * SS // 10)))
    return g


# ---------------------------------------------------------------- living room

def living_room_background():
    img = Image.new("RGBA", (W * SS, H * SS), WALL + (255,))
    d = ImageDraw.Draw(img)
    # wallpaper stripes
    for x in range(0, W, 46):
        d.rectangle(S(x, 0, x + 23, 330), fill=WALL_SHADE + (255,))
    # window with soft garden light
    d.rounded_rectangle(S(820, 70, 1060, 270), radius=6 * SS, fill=(205, 214, 178, 255), outline=OAK_DARK + (255,), width=8 * SS)
    d.line(S(940, 70, 940, 270), fill=OAK_DARK + (255,), width=6 * SS)
    d.line(S(820, 170, 1060, 170), fill=OAK_DARK + (255,), width=6 * SS)
    for cx, cy, r in ((870, 230, 40), (920, 215, 34), (1010, 225, 46)):
        d.ellipse(S(cx - r, cy - r, cx + r, cy + r), fill=MOSS_SOFT + (255,))
    # framed picture
    d.rectangle(S(300, 110, 420, 200), fill=OAK_DARK + (255,))
    d.rectangle(S(310, 120, 410, 190), fill=(226, 214, 186, 255))
    d.ellipse(S(330, 135, 390, 175), fill=MOSS + (255,))
    # skirting board + oak floor with planks
    d.rectangle(S(0, 330, W, 344), fill=PARCHMENT + (255,))
    d.rectangle(S(0, 344, W, H), fill=OAK + (255,))
    for k, y in enumerate(range(344, H, 34)):
        d.line(S(0, y, W, y), fill=OAK_DARK + (255,), width=2 * SS)
        for x in range((k * 170) % 340, W, 340):
            d.line(S(x, y, x, y + 34), fill=OAK_DARK + (255,), width=2 * SS)
    # rug
    d.ellipse(S(250, 450, 1030, 690), fill=MOSS_DEEP + (255,))
    d.ellipse(S(272, 462, 1008, 678), fill=MOSS + (255,))
    # sofa
    d.rounded_rectangle(S(40, 230, 470, 330), radius=30 * SS, fill=MOSS_DEEP + (255,))
    d.rounded_rectangle(S(30, 300, 480, 420), radius=26 * SS, fill=MOSS + (255,))
    d.rounded_rectangle(S(70, 300, 245, 350), radius=14 * SS, fill=MOSS_SOFT + (255,))
    d.rounded_rectangle(S(255, 300, 440, 350), radius=14 * SS, fill=MOSS_SOFT + (255,))
    d.rounded_rectangle(S(100, 245, 170, 305), radius=12 * SS, fill=HONEY + (255,))  # cushion
    # side table, lamp and glow
    d.rectangle(S(1090, 330, 1210, 345), fill=BARK_SOFT + (255,))
    d.rectangle(S(1100, 345, 1110, 440), fill=BARK_SOFT + (255,))
    d.rectangle(S(1190, 345, 1200, 440), fill=BARK_SOFT + (255,))
    img.alpha_composite(glow(520, HONEY_GLOW, 140), (890 * SS, -10 * SS))
    d = ImageDraw.Draw(img)
    d.rectangle(S(1147, 220, 1153, 330), fill=BARK + (255,))
    d.polygon(S(1110, 225, 1190, 225, 1172, 170, 1128, 170), fill=HONEY_GLOW + (255,))
    # potted plant
    d.polygon(S(560, 300, 620, 300, 610, 345, 570, 345), fill=EMBER + (255,))
    for ang in (-60, -30, 0, 30, 60):
        a = math.radians(ang - 90)
        d.ellipse(S(590 + math.cos(a) * 34 - 16, 280 + math.sin(a) * 40 - 26, 590 + math.cos(a) * 34 + 16, 280 + math.sin(a) * 40 + 26), fill=MOSS + (255,))
    return img


def person_layer(step):
    """An older person standing, feet at the bottom centre of a 200x300 layer."""
    p = Image.new("RGBA", (200 * SS, 300 * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(p)
    swing = math.sin(step) * 14
    # legs
    d.line(S(90, 190, 90 + swing, 290), fill=TROUSERS + (255,), width=16 * SS)
    d.line(S(110, 190, 110 - swing, 290), fill=TROUSERS + (255,), width=16 * SS)
    d.ellipse(S(78 + swing, 282, 104 + swing, 296), fill=BARK + (255,))
    d.ellipse(S(98 - swing, 282, 124 - swing, 296), fill=BARK + (255,))
    # cardigan body and arms
    d.rounded_rectangle(S(70, 95, 130, 200), radius=18 * SS, fill=CARDIGAN + (255,))
    d.line(S(76, 110, 66 - swing * 0.5, 185), fill=CARDIGAN + (255,), width=15 * SS)
    d.line(S(124, 110, 134 + swing * 0.5, 185), fill=CARDIGAN + (255,), width=15 * SS)
    d.line(S(100, 100, 100, 195), fill=(130, 72, 46, 255), width=2 * SS)
    # head and grey hair
    d.ellipse(S(78, 40, 122, 92), fill=SKIN + (255,))
    d.chord(S(74, 34, 126, 80), 180, 360, fill=HAIR + (255,))
    d.ellipse(S(112, 50, 128, 72), fill=HAIR + (255,))
    return p


def place_person(frame, layer, feet_x, feet_y, angle=0):
    """Rotate the person around their feet (angle in degrees, positive = falling to the right)."""
    big = Image.new("RGBA", (600 * SS, 600 * SS), (0, 0, 0, 0))
    big.alpha_composite(layer, (200 * SS, 0))  # feet now at (300, 300) of the big layer
    rot = big.rotate(-angle, center=(300 * SS, 300 * SS), resample=Image.BICUBIC)
    frame.alpha_composite(rot, (int((feet_x - 300) * SS), int((feet_y - 300) * SS)))


def create_fall_video():
    bg = living_room_background()
    vig = vignette()
    out = os.path.join(VIDEOS_DIR, "fall-scenario.mp4")
    ff = open_ffmpeg(out)
    for i in range(FRAMES):
        frame = bg.copy()
        if i < 75:  # walking across the rug
            t = i / 75
            place_person(frame, person_layer(i * 0.28), 520 + t * 110, 560)
        elif i < 105:  # slipping and going down
            t = (i - 75) / 30
            ease = t * t * (3 - 2 * t)
            place_person(frame, person_layer(0), 630 + ease * 30, 560 + ease * 40, angle=ease * 88)
        else:  # lying still on the rug
            place_person(frame, person_layer(0), 660, 600, angle=88)
        frame.alpha_composite(vig)
        camera_label(ImageDraw.Draw(frame), "Living room camera", i)
        ff.stdin.write(frame.convert("RGB").resize((W, H), Image.LANCZOS).tobytes())
    ff.stdin.close()
    ff.wait()
    print("Created:", out)


# -------------------------------------------------------------------- kitchen

def kitchen_background():
    img = Image.new("RGBA", (W * SS, H * SS), WALL + (255,))
    d = ImageDraw.Draw(img)
    # tiled backsplash
    d.rectangle(S(0, 170, W, 360), fill=PARCHMENT + (255,))
    for y in range(170, 360, 38):
        d.line(S(0, y, W, y), fill=WALL_SHADE + (255,), width=2 * SS)
        off = 0 if (y // 38) % 2 == 0 else 38
        for x in range(off, W, 76):
            d.line(S(x, y, x, y + 38), fill=WALL_SHADE + (255,), width=2 * SS)
    # upper cabinets
    for x in (40, 250, 900, 1090):
        d.rounded_rectangle(S(x, 20, x + 190, 150), radius=8 * SS, fill=OAK + (255,), outline=OAK_DARK + (255,), width=3 * SS)
        d.line(S(x + 95, 70, x + 95, 100), fill=BARK_SOFT + (255,), width=4 * SS)
    # window over the counter
    d.rounded_rectangle(S(500, 30, 780, 160), radius=6 * SS, fill=(205, 214, 178, 255), outline=OAK_DARK + (255,), width=8 * SS)
    d.line(S(640, 30, 640, 160), fill=OAK_DARK + (255,), width=6 * SS)
    # worktop and lower cabinets
    d.rectangle(S(0, 360, W, 384), fill=BARK_SOFT + (255,))
    d.rectangle(S(0, 384, W, H), fill=OAK + (255,))
    for x in range(0, W, 213):
        d.rectangle(S(x + 6, 400, x + 207, H - 10), outline=OAK_DARK + (255,), width=3 * SS)
        d.line(S(x + 90, 420, x + 120, 420), fill=BARK_SOFT + (255,), width=4 * SS)
    # cream enamel stove
    d.rounded_rectangle(S(400, 330, 880, H + 20), radius=14 * SS, fill=(236, 228, 210, 255), outline=(200, 188, 166, 255), width=3 * SS)
    d.rectangle(S(400, 330, 880, 372), fill=(52, 44, 38, 255))
    for kx in (450, 520, 760, 830):
        d.ellipse(S(kx - 12, 400, kx + 12, 424), fill=BARK_SOFT + (255,))
    d.rounded_rectangle(S(440, 450, 840, 680), radius=10 * SS, outline=(200, 188, 166, 255), width=4 * SS)
    d.line(S(480, 470, 800, 470), fill=(170, 160, 140, 255), width=6 * SS)
    # kettle resting on the counter
    d.ellipse(S(980, 280, 1080, 366), fill=MOSS + (255,))
    d.rectangle(S(1010, 266, 1050, 280), fill=MOSS_DEEP + (255,))
    d.arc(S(995, 240, 1065, 300), 180, 360, fill=BARK + (255,), width=6 * SS)
    # herbs on the sill
    for x in (540, 600, 700):
        d.rectangle(S(x, 135, x + 30, 160), fill=EMBER + (255,))
        d.ellipse(S(x - 8, 105, x + 38, 142), fill=MOSS + (255,))
    return img


def create_stove_video():
    bg = kitchen_background()
    vig = vignette()
    out = os.path.join(VIDEOS_DIR, "stove-scenario.mp4")
    ff = open_ffmpeg(out)
    for i in range(FRAMES):
        frame = bg.copy()
        flick = math.sin(i * 0.5) * 6 + math.sin(i * 1.3) * 3
        frame.alpha_composite(glow(520, (240, 130, 50), 150), (380 * SS, 100 * SS))
        d = ImageDraw.Draw(frame)
        # flame ring under the pot
        d.ellipse(S(560 - flick, 340 - flick / 3, 720 + flick, 372 + flick / 3), fill=(232, 110, 40, 255))
        d.ellipse(S(585, 346, 695, 366), fill=(250, 190, 90, 255))
        # pot
        d.rounded_rectangle(S(560, 250, 720, 352), radius=10 * SS, fill=(150, 146, 140, 255))
        d.rectangle(S(545, 242, 735, 258), fill=(120, 116, 110, 255))
        d.rectangle(S(520, 270, 560, 282), fill=BARK + (255,))
        # rising steam
        steam = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
        sd = ImageDraw.Draw(steam)
        for k in range(7):
            age = ((i * 2.4 + k * 30) % 200) / 200
            sy = 236 - age * 200
            sx = 640 + math.sin(age * 6 + k) * 30
            r = 14 + age * 26
            sd.ellipse(S(sx - r, sy - r, sx + r, sy + r), fill=(255, 252, 245, int(170 * (1 - age))))
        frame.alpha_composite(steam.filter(ImageFilter.GaussianBlur(6 * SS)))
        frame.alpha_composite(vig)
        camera_label(ImageDraw.Draw(frame), "Kitchen camera", i)
        ff.stdin.write(frame.convert("RGB").resize((W, H), Image.LANCZOS).tobytes())
    ff.stdin.close()
    ff.wait()
    print("Created:", out)


# ---------------------------------------------------------------- front porch

def porch_background():
    img = Image.new("RGBA", (W * SS, H * SS), (226, 230, 214, 255))
    d = ImageDraw.Draw(img)
    # brick house front
    d.rectangle(S(0, 60, W, 380), fill=(176, 112, 84, 255))
    for y in range(60, 380, 22):
        d.line(S(0, y, W, y), fill=(150, 92, 68, 255), width=2 * SS)
    d.rounded_rectangle(S(560, 140, 700, 380), radius=8 * SS, fill=MOSS_DEEP + (255,))
    d.ellipse(S(675, 255, 687, 267), fill=HONEY + (255,))
    for x in (180, 920):
        d.rectangle(S(x, 140, x + 180, 270), fill=(205, 214, 178, 255), outline=PARCHMENT + (255,), width=8 * SS)
    # hedges
    for x in range(-20, W, 90):
        d.ellipse(S(x, 330, x + 120, 420), fill=MOSS + (255,))
    # porch step and driveway
    d.rectangle(S(530, 380, 730, 410), fill=PARCHMENT + (255,))
    d.rectangle(S(0, 410, W, H), fill=(196, 182, 160, 255))
    for x in range(0, W, 120):
        d.line(S(x, 410, x - 60, H), fill=(180, 166, 144, 255), width=2 * SS)
    # parcel on the step
    d.rectangle(S(600, 352, 660, 392), fill=(188, 146, 96, 255), outline=(150, 112, 70, 255), width=2 * SS)
    d.line(S(630, 352, 630, 392), fill=(150, 112, 70, 255), width=3 * SS)
    return img


def create_playground_sample_video():
    bg = porch_background()
    vig = vignette()
    out = os.path.join(VIDEOS_DIR, "playground-feed.mp4")
    ff = open_ffmpeg(out)
    for i in range(FRAMES):
        frame = bg.copy()
        d = ImageDraw.Draw(frame)
        cx = (i * 9) % (W + 400) - 300
        d.rounded_rectangle(S(cx, 520, cx + 260, 610), radius=26 * SS, fill=MOSS_DEEP + (255,))
        d.rounded_rectangle(S(cx + 50, 470, cx + 200, 535), radius=22 * SS, fill=MOSS_DEEP + (255,))
        d.rounded_rectangle(S(cx + 66, 482, cx + 184, 528), radius=14 * SS, fill=(205, 214, 178, 255))
        for wx in (cx + 50, cx + 190):
            d.ellipse(S(wx - 26, 586, wx + 26, 638), fill=BARK + (255,))
            d.ellipse(S(wx - 10, 602, wx + 10, 622), fill=(150, 146, 140, 255))
        frame.alpha_composite(vig)
        camera_label(ImageDraw.Draw(frame), "Front door camera", i)
        ff.stdin.write(frame.convert("RGB").resize((W, H), Image.LANCZOS).tobytes())
    ff.stdin.close()
    ff.wait()
    print("Created:", out)


if __name__ == "__main__":
    create_fall_video()
    create_stove_video()
    create_playground_sample_video()
