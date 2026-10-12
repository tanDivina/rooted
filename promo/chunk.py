import asyncio, sys, subprocess, pathlib
from playwright.async_api import async_playwright
HERE=pathlib.Path(__file__).parent.resolve(); FPS=30
async def main(a,b,out):
    async with async_playwright() as p:
        br=await p.chromium.launch(channel="chrome",args=["--disable-gpu-shader-disk-cache","--disk-cache-size=1"])
        pg=await br.new_page(viewport={"width":1920,"height":1080})
        await pg.goto((HERE/"promo.html").as_uri()); await pg.wait_for_timeout(600)
        ff=subprocess.Popen(["ffmpeg","-y","-loglevel","error","-f","image2pipe","-framerate",str(FPS),"-c:v","mjpeg","-i","-",
          "-c:v","libx264","-pix_fmt","yuv420p","-crf","18","-preset","fast","-threads","2",out],stdin=subprocess.PIPE)
        for i in range(a*FPS,b*FPS):
            await pg.evaluate(f"render({i/FPS})")
            ff.stdin.write(await pg.screenshot(type="jpeg",quality=92))
        ff.stdin.close(); ff.wait(); await br.close()
a,b=int(sys.argv[1]),int(sys.argv[2])
asyncio.run(main(a,b,f"seg_{a:02d}.mp4"))
