import zipfile, xml.etree.ElementTree as ET, json, os, re, math, unicodedata
from datetime import datetime, timedelta
from collections import Counter, defaultdict

ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=os.path.join(ROOT,'data','Boost_CN.xlsx')
OUT=ROOT
DATA=os.path.join(OUT,'data')
os.makedirs(DATA,exist_ok=True)
MAIN='http://schemas.openxmlformats.org/spreadsheetml/2006/main'
REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
ns={'a':MAIN,'r':REL}

def col_idx(cell_ref):
    letters=re.match(r'[A-Z]+',cell_ref).group(0)
    n=0
    for c in letters: n=n*26+ord(c)-64
    return n-1

def clean_text(v):
    if v is None:return ''
    return re.sub(r'\s+',' ',str(v)).strip()

def norm(v):
    s=clean_text(v).lower()
    s=''.join(c for c in unicodedata.normalize('NFD',s) if unicodedata.category(c)!='Mn')
    return s

def num(v):
    if v is None or v=='': return None
    if isinstance(v,(int,float)): return float(v)
    s=clean_text(v).replace('$','').replace(',','').replace('%','')
    try:return float(s)
    except:return None

def int_or_none(v):
    x=num(v)
    return None if x is None else int(x)

def excel_date(v):
    if v in (None,''): return ''
    if isinstance(v,(int,float)) or re.fullmatch(r'-?\d+(?:\.\d+)?',str(v).strip()):
        try:return (datetime(1899,12,30)+timedelta(days=float(v))).strftime('%Y-%m-%d')
        except:pass
    s=clean_text(v)
    for f in ('%d/%m/%Y','%Y-%m-%d','%d/%m/%y','%m/%d/%Y'):
        try:return datetime.strptime(s,f).strftime('%Y-%m-%d')
        except:pass
    return ''

def read_xlsx(path):
    result={}
    with zipfile.ZipFile(path) as z:
        wb=ET.fromstring(z.read('xl/workbook.xml'))
        rels=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        relmap={x.attrib['Id']:x.attrib['Target'] for x in rels}
        shared=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            root=ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in root.findall('a:si',ns):
                shared.append(''.join(t.text or '' for t in si.iter('{%s}t'%MAIN)))
        for sh in wb.find('a:sheets',ns):
            name=sh.attrib['name']; rid=sh.attrib['{%s}id'%REL]; target=relmap[rid]
            if not target.startswith('xl/'):target='xl/'+target.lstrip('/')
            root=ET.fromstring(z.read(target))
            rows=[]
            for row in root.findall('.//a:sheetData/a:row',ns):
                cells={}
                for c in row.findall('a:c',ns):
                    idx=col_idx(c.attrib['r']); t=c.attrib.get('t'); v=c.find('a:v',ns)
                    val='' if v is None else v.text
                    if t=='s' and val!='': val=shared[int(val)]
                    elif t=='inlineStr': val=''.join(x.text or '' for x in c.iter('{%s}t'%MAIN))
                    cells[idx]=val
                if cells:
                    maxc=max(cells)
                    rows.append([cells.get(i,'') for i in range(maxc+1)])
            result[name]=rows
    return result

sheets=read_xlsx(SRC)
required=['Instruccion','Base_Boost_CN','Base_AT','Item_ADT']
missing=[s for s in required if s not in sheets]
if missing: raise SystemExit(f'Missing sheets: {missing}')

def records_from(name):
    rows=sheets[name]
    headers=[clean_text(x) for x in rows[0]]
    out=[]
    for raw in rows[1:]:
        raw=raw+['']*(len(headers)-len(raw))
        out.append({headers[i]:raw[i] for i in range(len(headers))})
    return headers,out

instr_headers,instr=records_from('Instruccion')
base_headers,base=records_from('Base_Boost_CN')
at_headers,at=records_from('Base_AT')
adt_headers,adt=records_from('Item_ADT')

expected_base=['Region','DM','Año','Semana','Dia','DayPart','CeCo','Tienda','Categoria','#Producto','Producto','Unidad Vendida','Item','Precio Venta']
expected_at=['División','DM','Año','Semana','Ceco','Tienda','Ticket Real','Ticket Ppto']
expected_adt=['CeCo','Tienda','Semana','DM','IPLH','item/ADT']
for n,h,e in [('Base_Boost_CN',base_headers,expected_base),('Base_AT',at_headers,expected_at),('Item_ADT',adt_headers,expected_adt)]:
    miss=[x for x in e if x not in h]
    if miss: raise SystemExit(f'{n} headers missing {miss}; got {h}')

valid=[]; exceptions=[]
seen=Counter()
for i,r in enumerate(base,start=2):
    row={
      'Region':clean_text(r.get('Region')),
      'DM':clean_text(r.get('DM')),
      'Anio':int_or_none(r.get('Año')),
      'Semana':int_or_none(r.get('Semana')),
      'Dia':excel_date(r.get('Dia')),
      'DayPart':clean_text(r.get('DayPart')),
      'CeCo':clean_text(r.get('CeCo')).replace('.0',''),
      'Tienda':clean_text(r.get('Tienda')),
      'Categoria':clean_text(r.get('Categoria')),
      'ProductoId':clean_text(r.get('#Producto')).replace('.0',''),
      'Producto':clean_text(r.get('Producto')),
      'UnidadVendida':num(r.get('Unidad Vendida')),
      'Item':clean_text(r.get('Item')),
      'PrecioVenta':num(r.get('Precio Venta')),
    }
    errs=[]
    if row['Semana'] is None: errs.append('Semana inválida')
    if not row['Dia']: errs.append('Fecha inválida')
    if row['UnidadVendida'] is None or row['UnidadVendida']<0: errs.append('Unidad Vendida inválida')
    if row['PrecioVenta'] is None or row['PrecioVenta']<=0: errs.append('Precio Venta inválido')
    if not row['CeCo']: errs.append('CeCo vacío')
    if not row['Tienda']: errs.append('Tienda vacía')
    if not row['Item']: errs.append('Item vacío')
    key=(row['DM'],row['Semana'],row['Dia'],row['DayPart'],row['CeCo'],row['Tienda'],row['ProductoId'],row['Producto'],row['UnidadVendida'],row['Item'],row['PrecioVenta'])
    seen[key]+=1
    row['Venta']=round((row['UnidadVendida'] or 0)*(row['PrecioVenta'] or 0),6)
    row['Valid']=not errs
    if errs: exceptions.append({'sheet':'Base_Boost_CN','row':i,'errors':errs,**row})
    valid.append(row)
for key,c in seen.items():
    if c>1: exceptions.append({'sheet':'Base_Boost_CN','error':'Posible duplicado exacto','count':c,'key':list(key)})

at_out=[]; at_seen=Counter()
for i,r in enumerate(at,start=2):
    row={'Division':clean_text(r.get('División')),'DM':clean_text(r.get('DM')),'Anio':int_or_none(r.get('Año')),'Semana':int_or_none(r.get('Semana')),'CeCo':clean_text(r.get('Ceco')).replace('.0',''),'Tienda':clean_text(r.get('Tienda')),'TicketReal':num(r.get('Ticket Real')),'TicketPpto':num(r.get('Ticket Ppto'))}
    row['Key']='|'.join([norm(row['DM']),str(row['Anio'] or ''),str(row['Semana'] or ''),row['CeCo']])
    row['Valid']=all([row['DM'],row['Anio'] is not None,row['Semana'] is not None,row['CeCo'],row['TicketReal'] is not None,row['TicketPpto'] is not None])
    at_seen[row['Key']]+=1
    if not row['Valid']: exceptions.append({'sheet':'Base_AT','row':i,'error':'Registro inválido',**row})
    at_out.append(row)

adt_out=[]; adt_seen=Counter()
for i,r in enumerate(adt,start=2):
    row={'CeCo':clean_text(r.get('CeCo')).replace('.0',''),'Tienda':clean_text(r.get('Tienda')),'Semana':int_or_none(r.get('Semana')),'DM':clean_text(r.get('DM')),'IPLH':num(r.get('IPLH')),'ItemADT':num(r.get('item/ADT'))}
    row['Key']='|'.join([norm(row['DM']),str(row['Semana'] or ''),row['CeCo']])
    row['Valid']=all([row['CeCo'],row['DM'],row['Semana'] is not None,row['IPLH'] is not None,row['ItemADT'] is not None])
    adt_seen[row['Key']]+=1
    if not row['Valid']: exceptions.append({'sheet':'Item_ADT','row':i,'error':'Registro inválido',**row})
    adt_out.append(row)

at_dups={k:v for k,v in at_seen.items() if v>1}
adt_dups={k:v for k,v in adt_seen.items() if v>1}
for k,c in at_dups.items():exceptions.append({'sheet':'Base_AT','error':'Duplicado por DM+Año+Semana+CeCo','key':k,'count':c})
for k,c in adt_dups.items():exceptions.append({'sheet':'Item_ADT','error':'Duplicado por CeCo+Semana+DM','key':k,'count':c})

# Write chunks ~4000 rows
for f in os.listdir(DATA):
    if f.startswith('records-') and f.endswith('.json'):os.remove(os.path.join(DATA,f))
chunks=[]
for start in range(0,len(valid),4000):
    name=f'records-{start//4000+1:03d}.json'; chunks.append(name)
    with open(os.path.join(DATA,name),'w',encoding='utf-8') as f:json.dump(valid[start:start+4000],f,ensure_ascii=False,separators=(',',':'))
with open(os.path.join(DATA,'base-at.json'),'w',encoding='utf-8') as f:json.dump(at_out,f,ensure_ascii=False,separators=(',',':'))
with open(os.path.join(DATA,'item-adt.json'),'w',encoding='utf-8') as f:json.dump(adt_out,f,ensure_ascii=False,separators=(',',':'))
with open(os.path.join(DATA,'instructions.json'),'w',encoding='utf-8') as f:json.dump(instr,f,ensure_ascii=False,separators=(',',':'))
with open(os.path.join(DATA,'exceptions.json'),'w',encoding='utf-8') as f:json.dump(exceptions,f,ensure_ascii=False,separators=(',',':'))
manifest={
 'version':'5.0.0','sourceFile':'Boost_CN.xlsx','generatedAt':datetime.now().isoformat(timespec='seconds'),
 'chunks':chunks,'sourceRowsIncludingHeader':len(sheets['Base_Boost_CN']),'dataRows':len(base),'loadedRows':len(valid),
 'validRows':sum(1 for r in valid if r['Valid']),'discardedRows':sum(1 for r in valid if not r['Valid']),
 'baseATRowsIncludingHeader':len(sheets['Base_AT']),'baseATDataRows':len(at_out),
 'itemADTRowsIncludingHeader':len(sheets['Item_ADT']),'itemADTDataRows':len(adt_out),
 'instructionRowsIncludingHeader':len(sheets['Instruccion']),'exceptionCount':len(exceptions),
 'atDuplicateKeys':len(at_dups),'itemADTDuplicateKeys':len(adt_dups),
 'totals':{'units':sum(r['UnidadVendida'] or 0 for r in valid if r['Valid']),'sales':round(sum(r['Venta'] for r in valid if r['Valid']),2)}
}
with open(os.path.join(DATA,'manifest-data.json'),'w',encoding='utf-8') as f:json.dump(manifest,f,ensure_ascii=False,indent=2)
with open(os.path.join(DATA,'audit-summary.json'),'w',encoding='utf-8') as f:json.dump(manifest,f,ensure_ascii=False,indent=2)
# copy latest source
import shutil
dst=os.path.join(DATA,'Boost_CN.xlsx')
if os.path.abspath(SRC)!=os.path.abspath(dst): shutil.copy2(SRC,dst)
print(json.dumps(manifest,ensure_ascii=False,indent=2))
