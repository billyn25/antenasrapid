from pathlib import Path
from html.parser import HTMLParser
import re,json,random,statistics,sys
class Text(HTMLParser):
 def __init__(self):super().__init__();self.main=False;self.skip=0;self.words=[]
 def handle_starttag(self,t,a):
  if t=='main':self.main=True
  if t in ['script','style','a']:self.skip+=1
 def handle_endtag(self,t):
  if t in ['script','style','a']:self.skip=max(0,self.skip-1)
  if t=='main':self.main=False
 def handle_data(self,d):
  if self.main and not self.skip:self.words.append(d)
root=Path(sys.argv[1] if len(sys.argv)>1 else 'dist')
pages=json.loads((root/'local-pages-manifest.json').read_text());rnd=random.Random(20261020)
sample=rnd.sample(pages,80);sets=[]
for p in sample:
 route=p['path'].lower().removesuffix('.html').rstrip('/')
 file=root/(route.strip('/')+'/index.html')
 if not file.exists():file=root/(route.strip('/')+'.html')
 if not file.exists():file=root/p['path'].lstrip('/')
 parser=Text();parser.feed(file.read_text());s=' '.join(parser.words).lower()
 for name in [p['name'],p['province']]:s=s.replace(name.lower(),' localidad ')
 words=re.findall(r'[a-záéíóúüñ]+',s)
 sets.append(set(tuple(words[i:i+5]) for i in range(len(words)-4)))
values=[100*len(a&b)/len(a|b) for i,a in enumerate(sets) for b in sets[i+1:]]
result={'method':'Jaccard de grupos de cinco palabras del texto principal, sin enlaces, scripts ni estilos; nombre y provincia normalizados; muestra fija de 80 municipios, 3160 pares','median':round(statistics.median(values),2),'p90':round(sorted(values)[int(len(values)*.9)],2),'mean':round(statistics.mean(values),2)}
print(json.dumps(result,ensure_ascii=False,indent=2))
