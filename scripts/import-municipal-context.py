"""Extract an attributable IGN snapshot from the official XLSX, using only stdlib.
Usage: python scripts/import-municipal-context.py /tmp/IGN_INFOGEO_MUNICIPIOS.xlsx
"""
import hashlib,json,re,sys,zipfile
from pathlib import Path
import xml.etree.ElementTree as ET
SOURCE='https://www.ign.es/resources/ane/Informacion_Geografica_Destacada/IGN_INFOGEO_MUNICIPIOS.xlsx'
PROVINCES={'01','48','09','39','20','31','26','24','47','49','05','34','37','40','42','28','33','45','19'}
ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
raw=Path(sys.argv[1]).read_bytes()
with zipfile.ZipFile(Path(sys.argv[1])) as z:
 shared=[''.join(n.itertext()) for n in ET.fromstring(z.read('xl/sharedStrings.xml'))]
 def rows(file):
  for row in ET.fromstring(z.read(file)).findall('.//m:row',ns):
   record={}
   for c in row:
    v=c.find('m:v',ns);value=v.text if v is not None else ''.join(c.itertext())
    record[re.sub(r'\d','',c.get('r'))]=shared[int(value)] if c.get('t')=='s' else value
   yield record
 meta=list(rows('xl/worksheets/sheet1.xml'))
 revision=next(r['B'] for r in meta if r.get('A')=='Fecha de revisión')
 license=next(r['B'] for r in meta if r.get('A')=='Licencia')
 records={}
 for r in rows('xl/worksheets/sheet2.xml'):
  code=r.get('A','').zfill(5)
  if not re.fullmatch(r'\d{5}',code) or code[:2] not in PROVINCES:continue
  position=re.search(r'center=([-\d.]+),([-\d.]+)',r.get('G',''))
  assert position,(code,'falta referencia cartográfica')
  assert code not in records,code
  records[code]=[r['B'],int(float(r['C'])),round(float(r['D']),2),r['E'],round(float(position[2]),6),round(float(position[1]),6)]
 data={'source':SOURCE,'sourcePage':'https://www.ign.es/web/ign/portal/ane-datos-geograficos','revision':revision,'license':license,'sha256':hashlib.sha256(raw).hexdigest(),'fields':['name','population','areaKm2','capital','latitude','longitude'],'notes':'Population is the value in this dated IGN edition. Its census reference year is not specified in the workbook; do not label it as current population. Coordinates refer to the approximate municipal map location, not boundaries or a road route.','municipalities':dict(sorted(records.items()))}
 Path('content/municipal-context.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
 print('IGN snapshot:',len(records),'municipios; revisión',revision)
