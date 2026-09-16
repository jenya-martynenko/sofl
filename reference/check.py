"""Browser validation; install playwright in a separate QA environment."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 1005}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto('http://127.0.0.1:4173', wait_until='networkidle')
    page.evaluate('document.fonts.ready')
    page.screenshot(path=str(ROOT / 'desktop.png'), full_page=True)
    boxes = page.locator('.header,.title-block,h1,.tagline,.intro,.search-shell,.search-field,.statistics,.stat dd').evaluate_all('(els) => els.map(el => ({selector:el.className||el.tagName,rect:el.getBoundingClientRect().toJSON(),font:getComputedStyle(el).font}))')
    assert page.locator('img').evaluate_all('(els) => els.every(img => img.complete && img.naturalWidth > 0)'), 'Missing image'
    page.get_by_role('button', name='Перейти к поиску игры').click()
    assert page.locator('#game-search').evaluate('(el) => el === document.activeElement')
    page.locator('#game-search').fill('Genshin Impact')
    page.get_by_role('button', name='Найти игру', exact=True).click()
    assert page.get_by_role('status').inner_text() == 'Поиск игр пока недоступен.'
    page.keyboard.press('Escape')
    assert page.get_by_role('status').count() == 0
    page.locator('#game-search').fill('')
    page.locator('#game-search').blur()
    for width in [390, 768, 1024]:
        page.set_viewport_size({'width':width,'height':844})
        page.screenshot(path=str(ROOT / f'width-{width}.png'), full_page=True)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Overflow at {width}'
    assert not errors, errors
    (ROOT / 'browser-check.json').write_text(json.dumps({'errors':errors,'boxes':boxes,'checks':['images loaded','search focus','search submit feedback','Escape dismiss','no overflow: 390, 768, 1024']},indent=2,ensure_ascii=False))
    browser.close()
print('Browser checks passed.')
