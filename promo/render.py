import asyncio, sys, subprocess, pathlib
from playwright.async_api import async_playwright
HERE=pathlib.Path(__file__).parent.resolve()
async def main():
    mode=sys.argv[1]
    async with async_playwright() as p:
        b=await p.chromium.launch(channel="chrome")
        pg=await b.new_page(viewport={"width":1920,"height":1080})
        await pg.goto((HERE/"promo.html").as_uri()); await pg.wait_for_timeout(800)
        if mode=="stills":
            for t in sys.argv[2:]:
                await pg.evaluate(f"render({t})"); await pg.wait_for_timeout(120)
                await pg.screenshot(path=f"stills/t{t}.jpg",type="jpeg",quality=70)
        else:
            fps=30; dur=await pg.evaluate("DUR"); n=int(dur*fps)
            ff=subprocess.Popen(["ffmpeg","-y","-loglevel","error","-f","image2pipe","-framerate",str(fps),"-c:v","mjpeg","-i","-",
              "-c:v","libx264","-pix_fmt","yuv420p","-crf","18","-preset","medium","video_noaudio.mp4"],stdin=subprocess.PIPE)
            for i in range(n):
                await pg.evaluate(f"render({i/fps})")
                await pg.evaluate("new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))")
                ff.stdin.write(await pg.screenshot(type="jpeg",quality=94))
            ff.stdin.close(); ff.wait()
        await b.close()
asyncio.run(main())
