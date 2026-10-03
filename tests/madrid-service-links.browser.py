from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
import json,threading
from playwright.sync_api import sync_playwright
root=Path('dist').resolve();out=Path('.quality');out.mkdir(exist_ok=True)
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
threading.Thread(target=server.serve_forever,daemon=True).start()
base='http://127.0.0.1:'+str(server.server_port);results=[]
try:
  with sync_playwright() as p:
    for engine,widths in [(p.chromium,[320,390,768,1280]),(p.webkit,[390])]:
      browser=engine.launch()
      for width in widths:
        page=browser.new_page(viewport={'width':width,'height':900})
        page.route('**/*',lambda route:route.continue_() if route.request.url.startswith(base) else route.abort())
        page.goto(base+'/',wait_until='domcontentloaded')
        card=page.locator('[data-madrid-service-links="1"]');card.scroll_into_view_if_needed()
        assert card.locator('.featured-towns .madrid-service-link').count()==8
        assert card.locator('.featured-more-links .madrid-service-link').count()==12
        if engine.name=='chromium' and width==390:card.screenshot(path=str(out/'madrid-portada-servicios-390.png'))
        card.locator('summary').click()
        assert card.locator('.featured-more-links .madrid-service-link:visible').count()==12
        assert card.locator('.featured-more-links').evaluate('(e)=>!(["auto","scroll"].includes(getComputedStyle(e).overflowY)&&e.scrollHeight>e.clientHeight+1)')
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        page.goto(base+'/Antenas-Madrid/#localidades',wait_until='domcontentloaded')
        links=page.locator('.town-list .madrid-service-link');assert links.count()==179
        assert page.locator('.postal-directory-codes').count()==179
        for label in ['Antenista en','Reparación de porteros automáticos en','Instalación de videoporteros en']:
          assert label in page.locator('#localidades').inner_text()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        assert links.evaluate_all('(xs)=>xs.every(e=>e.scrollWidth<=e.clientWidth+1)')
        if engine.name=='chromium' and width==390:
          page.locator('#town-search').scroll_into_view_if_needed()
          page.screenshot(path=str(out/'madrid-directorio-servicios-390.png'))
        search=page.locator('#town-search');search.fill('28801');page.wait_for_timeout(300)
        visible=page.locator('.town-list li:visible')
        assert visible.count()==1 and 'Alcalá de Henares' in visible.inner_text()
        assert visible.locator('.madrid-service-link').count()==1
        search.fill('alcala');page.wait_for_timeout(200)
        assert 'Alcalá de Henares' in page.locator('.town-list li:visible').all_inner_texts()[0]
        search.fill('zzzzzzzz');page.wait_for_timeout(200)
        assert page.locator('.town-list li:visible').count()==0
        search.fill('');page.wait_for_timeout(200)
        assert page.locator('.town-list li:visible').count()==179
        results.append({'engine':engine.name,'width':width,'passed':True});page.close()
      context=browser.new_context(java_script_enabled=False)
      page=context.new_page();page.route('**/*',lambda route:route.continue_() if route.request.url.startswith(base) else route.abort())
      page.goto(base+'/Antenas-Madrid/',wait_until='domcontentloaded')
      assert page.locator('.town-list .madrid-service-link').count()==179
      context.close();browser.close()
finally:server.shutdown()
(out/'browser-service-links.json').write_text(json.dumps(results,indent=2));print(json.dumps(results))
