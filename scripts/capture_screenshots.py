import asyncio
import os
from playwright.async_api import async_playwright

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT_DIR = "/Users/dorienvandenabbeele/Projects/ringcare-guardian"

async def capture_state(browser, url, name, action=None):
    page = await browser.new_page(viewport={"width": 1440, "height": 900})
    await page.goto(url, wait_until="domcontentloaded")
    await asyncio.sleep(1.5)
    if action:
        await action(page)
        await asyncio.sleep(1.5)
    target_path = os.path.join(OUT_DIR, name)
    await page.screenshot(path=target_path)
    print(f"Captured: {name}")
    await page.close()

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=CHROME_PATH, headless=True)

        # 1. Dashboard Idle
        await capture_state(browser, "http://localhost:3000", "screenshot-01-dashboard.png")

        # 2. Fall Detection Incident Modal
        async def trigger_fall(page):
            btn = page.locator("button:has-text('A fall')").first
            await btn.click()
        await capture_state(browser, "http://localhost:3000", "screenshot-02-fall-alert.png", trigger_fall)

        # 3. Stove Hazard Alert
        async def trigger_stove(page):
            btn = page.locator("button:has-text('Stove left on')").first
            await btn.click()
        await capture_state(browser, "http://localhost:3000", "screenshot-03-stove-alert.png", trigger_stove)

        # 4. Ring Alarm Multi-Sensor Fusion Grid
        async def trigger_sensors(page):
            tab = page.locator("button:has-text('Ring sensors')").first
            await tab.click()
        await capture_state(browser, "http://localhost:3000", "screenshot-04-sensors.png", trigger_sensors)

        # 5. Redundant Cellular Failsafe / Internet Outage
        async def trigger_failsafe(page):
            btn = page.locator("button:has-text('Wi-Fi goes down')").first
            await btn.click()
        await capture_state(browser, "http://localhost:3000", "screenshot-05-failsafe.png", trigger_failsafe)

        # 6. Why Rooted Philosophy & Architecture
        await capture_state(browser, "http://localhost:3000/why", "screenshot-06-why-rooted.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())


