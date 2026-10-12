import asyncio
from playwright.async_api import async_playwright

CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=CHROME_PATH, headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        await page.goto("http://localhost:3000", wait_until="domcontentloaded")
        await asyncio.sleep(2)

        # 1. Main Dashboard
        await page.screenshot(path="/Users/dorienvandenabbeele/Projects/ringcare-guardian/screenshot-main.png")
        print("Captured: screenshot-main.png")

        # 2. Ring Sensors Tab
        sensors_tab = page.locator("button:has-text('Ring sensors')")
        if await sensors_tab.count() > 0:
            await sensors_tab.click()
            await asyncio.sleep(1)
            await page.screenshot(path="/Users/dorienvandenabbeele/Projects/ringcare-guardian/screenshot-sensors.png")
            print("Captured: screenshot-sensors.png")

        # 3. Fall Alert with Emergency Modal
        fall_btn = page.locator("button:has-text('A fall')")
        if await fall_btn.count() > 0:
            await fall_btn.click()
            await asyncio.sleep(1.5)
            await page.screenshot(path="/Users/dorienvandenabbeele/Projects/ringcare-guardian/screenshot-fall-alert.png")
            print("Captured: screenshot-fall-alert.png")

        # 4. Dismiss modal and trigger Stove
        cancel_btn = page.locator("button:has-text('CANCEL ALARM')")
        if await cancel_btn.count() > 0:
            await cancel_btn.click()
            await asyncio.sleep(1)

        stove_btn = page.locator("button:has-text('Stove left on')")
        if await stove_btn.count() > 0:
            await stove_btn.click()
            await asyncio.sleep(1.5)
            await page.screenshot(path="/Users/dorienvandenabbeele/Projects/ringcare-guardian/screenshot-stove.png")
            print("Captured: screenshot-stove.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
