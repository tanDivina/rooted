import os
import subprocess
import math
from PIL import Image, ImageDraw, ImageFont

VIDEOS_DIR = "/Users/dorienvandenabbeele/Projects/ringcare-guardian/public/videos"
os.makedirs(VIDEOS_DIR, exist_ok=True)

WIDTH, HEIGHT = 1280, 720
FPS = 30
DURATION_SEC = 8
TOTAL_FRAMES = FPS * DURATION_SEC

def draw_cctv_hud(draw, cam_name, frame_idx):
    # Time stamp overlay
    time_str = f"2026-10-12 14:{30 + frame_idx//(FPS*60):02d}:{ (frame_idx//FPS)%60:02d}.{ (frame_idx%FPS)*33:03d} UTC"
    draw.rectangle([20, 20, 480, 60], fill=(0, 0, 0, 180))
    draw.text((30, 28), f"● REC | {cam_name} | {time_str}", fill=(240, 240, 240))
    
    # Ring Watermark
    draw.rectangle([WIDTH - 180, 20, WIDTH - 20, 60], fill=(0, 0, 0, 180))
    draw.text((WIDTH - 165, 28), "ring GUARDIAN", fill=(6, 182, 212))

def create_fall_video():
    tmp_dir = "/tmp/fall_frames"
    os.makedirs(tmp_dir, exist_ok=True)
    
    for i in range(TOTAL_FRAMES):
        img = Image.new("RGB", (WIDTH, HEIGHT), color=(30, 32, 40))
        draw = ImageDraw.Draw(img)
        
        # Draw Living Room Background (Floor, Rug, Sofa, Lamp)
        # Wall / Floor separator
        draw.rectangle([0, int(HEIGHT * 0.45), WIDTH, HEIGHT], fill=(45, 38, 32)) # Warm floor
        # Rug
        draw.ellipse([WIDTH * 0.2, HEIGHT * 0.55, WIDTH * 0.8, HEIGHT * 0.9], fill=(70, 60, 50))
        # Sofa in background
        draw.rectangle([WIDTH * 0.05, HEIGHT * 0.35, WIDTH * 0.4, HEIGHT * 0.55], fill=(55, 65, 80))
        # Lamp
        draw.rectangle([WIDTH * 0.85, HEIGHT * 0.25, WIDTH * 0.86, HEIGHT * 0.6], fill=(120, 110, 80))
        draw.polygon([(WIDTH * 0.83, HEIGHT * 0.28), (WIDTH * 0.88, HEIGHT * 0.28), (WIDTH * 0.855, HEIGHT * 0.2)], fill=(220, 200, 140))
        
        # Senior Character Movement
        # Phase 1: 0 - 2.5s (Frames 0 - 75): Walking upright
        # Phase 2: 2.5 - 3.5s (Frames 75 - 105): Slipping & falling
        # Phase 3: 3.5 - 8s (Frames 105 - 240): Immobile on floor
        
        if i < 75:
            # Walking upright
            progress = i / 75.0
            cx = int(WIDTH * 0.4 + progress * 80)
            cy = int(HEIGHT * 0.65)
            h = 180
            w = 55
            # Head
            draw.ellipse([cx - 18, cy - h - 18, cx + 18, cy - h + 18], fill=(210, 180, 150))
            # Torso
            draw.rectangle([cx - 22, cy - h + 18, cx + 22, cy - 60], fill=(60, 100, 140))
            # Legs
            draw.line([(cx - 12, cy - 60), (cx - 12 + math.sin(i * 0.3) * 15, cy)], fill=(40, 45, 60), width=10)
            draw.line([(cx + 12, cy - 60), (cx + 12 - math.sin(i * 0.3) * 15, cy)], fill=(40, 45, 60), width=10)
        elif i < 105:
            # Slipping & falling
            t = (i - 75) / 30.0
            cx = int(WIDTH * 0.47 + t * 60)
            cy = int(HEIGHT * 0.65 + t * 80)
            angle = t * 80 # tilting sideways
            
            # Draw falling figure tilted
            draw.ellipse([cx - 20, cy - 40, cx + 20, cy], fill=(210, 180, 150))
            draw.rectangle([cx - 60, cy, cx + 60, cy + 35], fill=(60, 100, 140))
            draw.line([(cx + 60, cy + 20), (cx + 120, cy + 40)], fill=(40, 45, 60), width=10)
        else:
            # Immobile on floor
            cx = int(WIDTH * 0.53)
            cy = int(HEIGHT * 0.74)
            # Lying horizontal
            draw.ellipse([cx - 85, cy - 10, cx - 55, cy + 20], fill=(210, 180, 150)) # head on rug
            draw.rectangle([cx - 55, cy - 5, cx + 45, cy + 30], fill=(60, 100, 140)) # torso
            draw.line([(cx + 45, cy + 15), (cx + 120, cy + 25)], fill=(40, 45, 60), width=11) # legs flat
        
        draw_cctv_hud(draw, "LIVING-ROOM-CAM-01", i)
        img.save(f"{tmp_dir}/frame_{i:04d}.png")
        
    out_path = f"{VIDEOS_DIR}/fall-scenario.mp4"
    cmd = f"ffmpeg -y -framerate {FPS} -i {tmp_dir}/frame_%04d.png -c:v libx264 -pix_fmt yuv420p {out_path}"
    subprocess.run(cmd, shell=True, check=True)
    subprocess.run(f"rm -rf {tmp_dir}", shell=True)
    print("Created:", out_path)

def create_stove_video():
    tmp_dir = "/tmp/stove_frames"
    os.makedirs(tmp_dir, exist_ok=True)
    
    for i in range(TOTAL_FRAMES):
        img = Image.new("RGB", (WIDTH, HEIGHT), color=(25, 28, 34))
        draw = ImageDraw.Draw(img)
        
        # Kitchen counter & stove
        draw.rectangle([0, int(HEIGHT * 0.4), WIDTH, HEIGHT], fill=(50, 55, 60)) # Countertop
        draw.rectangle([WIDTH * 0.2, int(HEIGHT * 0.35), WIDTH * 0.8, int(HEIGHT * 0.85)], fill=(20, 22, 26)) # Cooktop
        
        # Burner grate
        draw.ellipse([WIDTH * 0.4, HEIGHT * 0.45, WIDTH * 0.65, HEIGHT * 0.75], fill=(35, 38, 44), outline=(70, 75, 85), width=4)
        
        # Active flame / glowing burner (flickering)
        flicker = math.sin(i * 0.4) * 8
        draw.ellipse([WIDTH * 0.43 - flicker, HEIGHT * 0.48 - flicker, WIDTH * 0.62 + flicker, HEIGHT * 0.72 + flicker], fill=(220, 80, 20), outline=(255, 180, 40), width=3)
        
        # Cooking pot
        draw.rectangle([WIDTH * 0.44, HEIGHT * 0.42, WIDTH * 0.61, HEIGHT * 0.62], fill=(160, 165, 175))
        draw.rectangle([WIDTH * 0.41, HEIGHT * 0.40, WIDTH * 0.64, HEIGHT * 0.43], fill=(130, 135, 145))
        
        # Rising Steam / Smoke
        for p in range(6):
            sy = HEIGHT * 0.38 - ((i * 3 + p * 35) % 180)
            sx = WIDTH * 0.52 + math.sin(sy * 0.05 + p) * 25
            sr = 12 + (180 - (sy - HEIGHT * 0.2)) * 0.1
            draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(180, 180, 190, 80))
            
        # Empty kitchen banner
        draw.rectangle([WIDTH * 0.05, HEIGHT * 0.88, WIDTH * 0.45, HEIGHT * 0.95], fill=(0, 0, 0, 200))
        draw.text((WIDTH * 0.06, HEIGHT * 0.90), "⚠️ KITCHEN ZONE: 0 OCCUPANTS DETECTED", fill=(245, 158, 11))
        
        draw_cctv_hud(draw, "KITCHEN-STOVE-CAM-02", i)
        img.save(f"{tmp_dir}/frame_{i:04d}.png")
        
    out_path = f"{VIDEOS_DIR}/stove-scenario.mp4"
    cmd = f"ffmpeg -y -framerate {FPS} -i {tmp_dir}/frame_%04d.png -c:v libx264 -pix_fmt yuv420p {out_path}"
    subprocess.run(cmd, shell=True, check=True)
    subprocess.run(f"rm -rf {tmp_dir}", shell=True)
    print("Created:", out_path)

def create_playground_sample_video():
    tmp_dir = "/tmp/pg_frames"
    os.makedirs(tmp_dir, exist_ok=True)
    
    for i in range(TOTAL_FRAMES):
        img = Image.new("RGB", (WIDTH, HEIGHT), color=(40, 50, 60))
        draw = ImageDraw.Draw(img)
        
        # Driveway & Porch
        draw.rectangle([0, int(HEIGHT * 0.5), WIDTH, HEIGHT], fill=(80, 85, 90)) # Asphalt
        draw.rectangle([0, 0, WIDTH, int(HEIGHT * 0.5)], fill=(120, 160, 200)) # Sky / house
        
        # Car moving across driveway
        car_x = int((i * 12) % (WIDTH + 300) - 200)
        draw.rectangle([car_x, int(HEIGHT * 0.55), car_x + 180, int(HEIGHT * 0.7)], fill=(40, 70, 140))
        draw.ellipse([car_x + 25, int(HEIGHT * 0.68), car_x + 55, int(HEIGHT * 0.76)], fill=(20, 20, 20))
        draw.ellipse([car_x + 125, int(HEIGHT * 0.68), car_x + 155, int(HEIGHT * 0.76)], fill=(20, 20, 20))
        
        # Package on porch
        draw.rectangle([WIDTH * 0.8, HEIGHT * 0.65, WIDTH * 0.88, HEIGHT * 0.75], fill=(160, 120, 80), outline=(220, 180, 120), width=2)
        
        draw_cctv_hud(draw, "RING-PLAYGROUND-SIMULATOR", i)
        img.save(f"{tmp_dir}/frame_{i:04d}.png")
        
    out_path = f"{VIDEOS_DIR}/playground-feed.mp4"
    cmd = f"ffmpeg -y -framerate {FPS} -i {tmp_dir}/frame_%04d.png -c:v libx264 -pix_fmt yuv420p {out_path}"
    subprocess.run(cmd, shell=True, check=True)
    subprocess.run(f"rm -rf {tmp_dir}", shell=True)
    print("Created:", out_path)

if __name__ == "__main__":
    create_fall_video()
    create_stove_video()
    create_playground_sample_video()
