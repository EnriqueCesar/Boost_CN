import zipfile, xml.etree.ElementTree as ET, json, os, re, unicodedata, shutil
from datetime import datetime, timedelta
from collections import Counter
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); DATA=os.path.join(ROOT,'data'); SRC=os.path.join(DATA,'Boost_CN.xlsx')
MAIN='http://schemas.openxmlformats.org/spreadsheetml/2006/main'; REL='http://schemas.openxmlformats.org/officeDocument/2006/relationships'; ns={'a':MAIN,'r':REL}
def clean(v): return re.sub(r'\s+',' ',str(v or '')).strip()
def norm(v): return ''.join(c for c in unicodedata.normalize('NFD',clean(v).lower()) if unicodedata.category(c)!='Mn')
def num(v):
 s=clean(v).replace('$','').replace(',','').replace('%','')
 try:return float(s)
 except:return None
def integer(v):
 x=num(v); return None if x is None else int(x)
def datev(v):
 if v in (None,''):return ''
 try:return (datetime(1899,12,30)+timedelta(days=float(v))).strftime('%Y-%m-%d')
 except:pass
 for f in ('%d/%m/%Y','%Y-%m-%d','%d/%m/%y','%m/%d/%Y'):
  try:return datetime.strptime(clean(v),f).strftime('%Y-%m-%d')
  except:pass
 return ''
def col(ref):
 n=0
 for c in re.match(r'[A-Z]+',ref).group(0):n=n*26+ord(c)-64
 return n-1
def read(path):
 out={}
 with zipfile.ZipFile(path) as z:
  wb=ET.fromstring(z.read('xl/workbook.xml')); rels=ET.fromstring(z.read('xl/_rels/workbook.xml.rels')); rm={x.attrib['Id']:x.attrib['Target'] for x in rels}
  ss=[]
  if 'xl/sharedStrings.xml' in z.namelist():
   for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('a:si',ns):ss.append(''.join(t.text or '' for t in si.iter('{%s}t'%MAIN)))
  for sh in wb.find('a:sheets',ns):
   target=rm[sh.attrib['{%s}id'%REL]]; target=target if target.startswith('xl/') else 'xl/'+target.lstrip('/')
   rows=[]
   for row in ET.fromstring(z.read(target)).findall('.//a:sheetData/a:row',ns):
    d={}
    for c in row.findall('a:c',ns):
     i=col(c.attrib['r']); t=c.attrib.get('t'); v=c.find('a:v',ns); val='' if v is None else v.text
     if t=='s' and val!='':val=ss[int(val)]
     elif t=='inlineStr':val=''.join(x.text or '' for x in c.iter('{%s}t'%MAIN))
     d[i]=val
    if d:rows.append([d.get(i,'') for i in range(max(d)+1)])
   out[sh.attrib['name']]=rows
 return out
def recs(sheets,name):
 rows=sheets[name]; hdr=[clean(x) for x in rows[0]]; return hdr,[{hdr[i]:(r+['']*len(hdr))[i] for i in range(len(hdr))} for r in rows[1:]]
s=read(SRC); required=['Instruccion','Base_Boost_CN','Condicion','Base_AT','Item_ADT']; missing=[x for x in required if x not in s]
if missing:raise SystemExit('Missing sheets: '+str(missing))
ih,inst=recs(s,'Instruccion'); bh,base=recs(s,'Base_Boost_CN'); ch,cond=recs(s,'Condicion'); ah,at=recs(s,'Base_AT'); ph,adt=recs(s,'Item_ADT')
checks={'Base_Boost_CN':['Region','DM','Año','Semana','Dia','DayPart','CeCo','Tienda','Categoria','#Producto','Producto','Unidad Vendida'],'Condicion':['Producto','Item','Venta'],'Base_AT':['División','DM','Año','Semana','Ceco','Tienda','AT R','AT AA','AT ppto'],'Item_ADT':['CeCo','Tienda','Semana','DM','TPLH','item/ADT']}
for name,req in checks.items():
 hdr={'Base_Boost_CN':bh,'Condicion':ch,'Base_AT':ah,'Item_ADT':ph}[name]; miss=[x for x in req if x not in hdr]
 if miss:raise SystemExit(f'{name} headers missing {miss}; got {hdr}')
exceptions=[]; cmap={}; cdups=Counter(); invalid_sales=0
for i,r in enumerate(cond,2):
 k=norm(r.get('Producto')); sale=num(r.get('Venta')); item=clean(r.get('Item')); cdups[k]+=1
 if not k:exceptions.append({'sheet':'Condicion','row':i,'error':'Producto vacío'});continue
 if sale is None:invalid_sales+=1;exceptions.append({'sheet':'Condicion','row':i,'error':'Venta no numérica','value':r.get('Venta')})
 if k not in cmap:cmap[k]={'Item':item,'PrecioVenta':sale,'Producto':clean(r.get('Producto')),'Fila':i}
for k,c in cdups.items():
 if c>1:exceptions.append({'sheet':'Condicion','error':'Producto duplicado normalizado','key':k,'count':c})
rows=[]; unmatched=0; maxdate=''
for i,r in enumerate(base,2):
 p=clean(r.get('Producto')); match=cmap.get(norm(p)); dia=datev(r.get('Dia')); units=num(r.get('Unidad Vendida'))
 row={'Region':clean(r.get('Region')),'DM':clean(r.get('DM')),'Anio':integer(r.get('Año')),'Semana':integer(r.get('Semana')),'Dia':dia,'DayPart':clean(r.get('DayPart')),'CeCo':clean(r.get('CeCo')).replace('.0',''),'Tienda':clean(r.get('Tienda')),'Categoria':clean(r.get('Categoria')),'ProductoId':clean(r.get('#Producto')).replace('.0',''),'Producto':p,'UnidadVendida':units,'Item':match['Item'] if match else 'Sin relación','PrecioVenta':match['PrecioVenta'] if match else None}
 errs=[]
 if not match:unmatched+=1;errs.append('Producto sin relación en Condicion')
 if units is None:errs.append('Unidad Vendida inválida')
 if not dia:errs.append('Fecha inválida')
 if dia and dia>maxdate:maxdate=dia
 row['Venta']=round((units or 0)*(row['PrecioVenta'] or 0),6); row['Valid']=not errs
 if errs:exceptions.append({'sheet':'Base_Boost_CN','row':i,'errors':errs,'Producto':p})
 rows.append(row)
atout=[]; atseen=Counter()
for i,r in enumerate(at,2):
 row={'Division':clean(r.get('División')),'DM':clean(r.get('DM')),'Anio':integer(r.get('Año')),'Semana':integer(r.get('Semana')),'CeCo':clean(r.get('Ceco')).replace('.0',''),'Tienda':clean(r.get('Tienda')),'ATR':num(r.get('AT R')),'ATAA':num(r.get('AT AA')),'ATPpto':num(r.get('AT ppto'))}
 row['Key']='|'.join([row['CeCo'],str(row['Semana'] or ''),str(row['Anio'] or '')]); atseen[row['Key']]+=1; row['Valid']=all([row['CeCo'],row['Semana'] is not None,row['Anio'] is not None,row['ATR'] is not None,row['ATAA'] is not None,row['ATPpto'] is not None]); atout.append(row)
adtout=[]; adtseen=Counter()
for r in adt:
 row={'CeCo':clean(r.get('CeCo')).replace('.0',''),'Tienda':clean(r.get('Tienda')),'Semana':integer(r.get('Semana')),'DM':clean(r.get('DM')),'TPLH':num(r.get('TPLH')),'ItemADT':num(r.get('item/ADT'))}; row['Key']='|'.join([row['CeCo'],str(row['Semana'] or '')]); adtseen[row['Key']]+=1; row['Valid']=all([row['CeCo'],row['Semana'] is not None,row['TPLH'] is not None,row['ItemADT'] is not None]); adtout.append(row)
for k,c in atseen.items():
 if c>1:exceptions.append({'sheet':'Base_AT','error':'Duplicado CeCo+Semana+Año consolidado','key':k,'count':c})
# Consolidar sin duplicar: conservar por llave el registro más completo.
atbest={}
for row in atout:
 score=sum(row.get(k) is not None for k in ('ATR','ATAA','ATPpto'))
 if row['Key'] not in atbest or score>sum(atbest[row['Key']].get(k) is not None for k in ('ATR','ATAA','ATPpto')):atbest[row['Key']]=row
atout=list(atbest.values())
for f in os.listdir(DATA):
 if f.startswith('records-') and f.endswith('.json'):os.remove(os.path.join(DATA,f))
chunks=[]
for start in range(0,len(rows),4000):
 name=f'records-{start//4000+1:03d}.json';chunks.append(name);json.dump(rows[start:start+4000],open(os.path.join(DATA,name),'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
json.dump(atout,open(os.path.join(DATA,'base-at.json'),'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'));json.dump(adtout,open(os.path.join(DATA,'item-adt.json'),'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'));json.dump(list(cmap.values()),open(os.path.join(DATA,'condition.json'),'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'));json.dump(inst,open(os.path.join(DATA,'instructions.json'),'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'));json.dump(exceptions,open(os.path.join(DATA,'exceptions.json'),'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
manifest={'version':'8.1.0','sourceFile':'Boost_CN.xlsx','generatedAt':datetime.now().isoformat(timespec='seconds'),'updatedDate':maxdate,'chunks':chunks,'sourceRowsIncludingHeader':len(s['Base_Boost_CN']),'dataRows':len(rows),'loadedRows':len(rows),'validRows':sum(x['Valid'] for x in rows),'discardedRows':0,'conditionRowsIncludingHeader':len(s['Condicion']),'conditionDataRows':len(cond),'conditionDuplicateKeys':sum(1 for c in cdups.values() if c>1),'conditionInvalidSales':invalid_sales,'unmatchedProducts':unmatched,'baseATRowsIncludingHeader':len(s['Base_AT']),'baseATDataRows':len(atout),'atDuplicateKeys':sum(1 for c in atseen.values() if c>1),'itemADTRowsIncludingHeader':len(s['Item_ADT']),'itemADTDataRows':len(adtout),'exceptionCount':len(exceptions),'totals':{'units':sum(x['UnidadVendida'] or 0 for x in rows),'sales':round(sum(x['Venta'] for x in rows),2)}}
for n in ('manifest-data.json','audit-summary.json'):json.dump(manifest,open(os.path.join(DATA,n),'w',encoding='utf-8'),ensure_ascii=False,indent=2)
print(json.dumps(manifest,ensure_ascii=False,indent=2))
