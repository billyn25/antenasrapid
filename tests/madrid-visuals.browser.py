"""Check Madrid's photo hero and shared gallery against generated HTML."""
import functools
import http.server
import json
import os
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(os.environ.get('SITE_ROOT', 'dist')).resolve()
QA = Path(os.environ.get('QA_DIR', '.quality/madrid-visuals'))
QA.mkdir(parents=True, exist_ok=True)

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
manifest = json.loads((ROOT / 'local-pages-manifest.json').read_text())
longest = max((p for p in manifest if p['path'].startswith('/Antenas-Madrid/')), key=lambda p: len(p['name']))
routes = [('/Antenas-Madrid/', 'madrid'), ('/Antenas-Madrid/alcala-de-henares.html', 'alcala'), (longest['path'], 'nombre-largo')]
results = []
try:
    with sync_playwright() as pw:
        for engine, widths in [(pw.chromium, [320, 390, 768, 1440]), (pw.webkit, [390])]:
            browser = engine.launch()
            for width in widths:
                context = browser.new_context(viewport={'width': width, 'height': 900}, device_scale_factor=1)
                page = context.new_page()
                page.goto(base + '/', wait_until='networkidle')
                home_background = page.locator('.home-clean-hero').evaluate('(e) => getComputedStyle(e, "::before").backgroundImage')
                assert 'hero-antenasrapid-HQ.jpg' in home_background
                for route, stem in routes:
                    page.goto(base + route, wait_until='networkidle')
                    assert page.locator('.hero.home-clean-hero[data-madrid-visuals="1"]').count() == 1
                    assert page.locator('.hero').evaluate('(e) => getComputedStyle(e, "::before").backgroundImage') == home_background
                    assert page.locator('h1').count() == 1
                    assert page.locator('.hero h1').is_visible()
                    assert page.locator('.hero .service-desk').is_hidden()
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
                    if width in (390, 1440):
                        page.screenshot(path=str(QA / f'{stem}-hero-{engine.name}-{width}.png'))
                    assert page.locator('#galeria').count() == 1
                    assert page.locator('#galeria .gallery-grid img').count() == 12
                    for image in page.locator('#galeria img').all():
                        image.scroll_into_view_if_needed()
                        page.wait_for_function('(i) => i.complete && i.naturalWidth > 0', arg=image.element_handle())
                    first = page.locator('.gallery-open').first
                    first.scroll_into_view_if_needed()
                    page.wait_for_function("Array.from(document.querySelectorAll('#galeria img')).slice(0, 2).every(i => i.complete && i.naturalWidth > 0)")
                    if width == 390 and stem == 'madrid':
                        page.locator('#galeria').screenshot(path=str(QA / f'madrid-galeria-{engine.name}-{width}.png'))
                    first.click()
                    assert page.locator('#gallery-lightbox').evaluate('(e) => e.open')
                    page.wait_for_function("document.querySelector('#gallery-lightbox img').naturalWidth > 0")
                    page.locator('.gallery-lightbox-close').click()
                    assert not page.locator('#gallery-lightbox').evaluate('(e) => e.open')
                    assert first.evaluate('(e) => document.activeElement === e')
                    first.click()
                    page.keyboard.press('Escape')
                    assert not page.locator('#gallery-lightbox').evaluate('(e) => e.open')
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
                    if route == '/Antenas-Madrid/':
                        page.locator('#town-search').fill('28801')
                        assert 'Alcalá de Henares' in ' '.join(page.locator('.town-list li:visible').all_text_contents())
                    results.append({'engine': engine.name, 'width': width, 'route': route, 'hero': True, 'galleryZoom': True, 'noOverflow': True})
                page.goto(base + '/Antenas-Burgos/', wait_until='networkidle')
                assert page.locator('[data-madrid-visuals]').count() == 0
                assert page.locator('#galeria').count() == 0
                context.close()
            browser.close()
finally:
    server.shutdown()
(QA / 'browser-report.json').write_text(json.dumps(results, ensure_ascii=False, indent=2))
print(f'MADRID VISUAL BROWSER OK: {len(results)} casos; hero, galería, ampliación, códigos postales y aislamiento.')
