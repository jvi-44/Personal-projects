import pdfplumber,re,json,os,subprocess,sys
from PIL import Image
DPI=144; S=DPI/72
def dec(t):
    if '(cid:' not in t: return t
    s=''.join(chr(48+int(n)-882) if 882<=int(n)<=891 else chr(65+int(n)-4) if 4<=int(n)<=11 else '' for n in re.findall(r'\(cid:(\d+)\)',t))
    return s[1:] if len(s)>1 else s
def isbold(fn): return 'Bold' in fn or 'BX' in fn or 'CambriaMath' in fn
os.makedirs('img',exist_ok=True); os.makedirs('pages',exist_ok=True)
jobs=[]
for y in range(2016,2024):
    keep=list(range(1,37))+list(range(73,91)) if y<=2019 else list(range(1,41))
    jobs.append(('N',y,f'pdfs/NSAA_{y}_S1_QuestionPaper.pdf',keep))
for y in range(2016,2024):
    jobs.append(('T',y,f'pdfs/TMUA-{y}-paper-1.pdf',list(range(1,21))))
only=sys.argv[1:]
report={}
if os.path.exists('questions.json'): report=json.load(open('questions.json'))
for src,y,path,keep in jobs:
    tag=f'{src}{y}'
    if only and tag not in only: continue
    pdf=pdfplumber.open(path)
    if not os.path.exists(f'pages/{tag}-done'):
        subprocess.run(['pdftoppm','-r',str(DPI),'-gray','-png',path,f'pages/{tag}'],check=True); open(f'pages/{tag}-done','w')
    pngs=sorted(f for f in os.listdir('pages') if f.startswith(tag+'-') and f.endswith('.png'))
    qs=[];exp=1;pagewords={}
    for i,p in enumerate(pdf.pages):
        ws=p.extract_words(extra_attrs=['fontname','size'])
        for w in ws: w['t']=dec(w['text'])
        pagewords[i]=ws
        for w in ws:
            if w['t']==str(exp) and w['x0']<78 and isbold(w['fontname']) and 45<w['top']<760:
                qs.append(dict(n=exp,page=i,x0=w['x0'],top=w['top'],x1=w['x1'],bottom=w['bottom']));exp+=1
    # CambriaMath text layers report glyph boxes too low; measure the real offset from the rendering
    import numpy as np
    shift={}
    for q in qs:
        if q['page'] in shift: continue
        w0=[w for w in pagewords[q['page']] if w['t']==str(q['n']) and abs(w['top']-q['top'])<0.5][0]
        if 'CambriaMath' not in w0['fontname']: shift[q['page']]=0; continue
        arr=np.array(Image.open(f"pages/{pngs[q['page']]}").convert('L'))
        x0,x1=int(w0['x0']*S),int(w0['x1']*S)+1; y0,y1=int((w0['top']-40)*S),int(w0['bottom']*S)
        rows=np.where((arr[y0:y1,x0:x1]<128).any(axis=1))[0]
        shift[q['page']]=(w0['bottom']-(y0+rows[-1])/S) if len(rows) else 0
    for i,ws in pagewords.items():
        sh=shift.get(i,None)
        if sh is None: sh=next((v for v in shift.values() if v),0) if any('CambriaMath' in w['fontname'] for w in ws) else 0
        if sh:
            for w in ws:
                if 'CambriaMath' in w['fontname']: w['top']-=sh; w['bottom']-=sh
    for q in qs:
        w0=[w for w in pagewords[q['page']] if w['t']==str(q['n']) and abs(w['x0']-q['x0'])<0.5]
        w0=[w for w in w0 if abs(w['top']-q['top'])<45]
        if w0: h=q['bottom']-q['top']; q['top']=w0[0]['top']; q['bottom']=q['top']+h
    out=[]
    for k,q in enumerate(qs):
        if q['n'] not in keep: continue
        p=pdf.pages[q['page']]; H=p.height; W=p.width
        nxt=qs[k+1] if k+1<len(qs) else None
        crossed=any(o['x1']>q['x0']-4 and o['x0']<q['x1']+4 and o['bottom']>q['top']-4 and o['top']<q['bottom']+4 and (o['x1']-o['x0'])>5 and (o['bottom']-o['top'])>5 for o in p.lines+p.curves+p.rects)
        top=q['top']-10
        bottom=nxt['top']-12 if nxt and nxt['page']==q['page'] else H-58
        objs=[w for w in pagewords[q['page']] if w['top']>=top and w['bottom']<=bottom+2 and w['text'].replace('(cid:3)','').strip()]
        objs+=[o for o in p.lines+p.curves+p.rects+p.images if o['top']>=top-2 and o['bottom']<=bottom+2]
        bottom=min(bottom,max(o['bottom'] for o in objs)+10)
        cr=max(o['x1'] for o in objs)+12
        left=q['x0']-14; right=min(W-20,max(cr,W*0.75))
        cands=[w for w in pagewords[q['page']] if re.fullmatch(r'[A-H]',w['t']) and w['top']>q['bottom'] and w['bottom']<=bottom]
        best=[]
        for c in cands:
            if c['t']!='A': continue
            seq=[c]
            for L in 'BCDEFGH':
                nx=[d for d in cands if d['t']==L and abs(d['x0']-c['x0'])<4 and d['top']>seq[-1]['top']+2]
                if not nx: break
                seq.append(min(nx,key=lambda d:d['top']))
            if len(seq)>len(best): best=seq
        hs=[]
        if len(best)>=2:
            gaps=[best[j+1]['top']-best[j]['top'] for j in range(len(best)-1)]; g=min(gaps)
            for j,b in enumerate(best):
                t0=b['top']-(gaps[j-1]/2 if j>0 else g/2); t1=min(b['top']+(gaps[j]/2 if j<len(gaps) else g/2),bottom)
                hs.append([round((b['x0']-8-left)/(right-left),4),round((t0-top)/(bottom-top),4),round((right-b['x0'])/(right-left),4),round((t1-t0)/(bottom-top),4)])
        im=Image.open(f"pages/{pngs[q['page']]}")
        crop=im.crop((int(left*S),int(top*S),int(right*S),int(bottom*S))).quantize(4)
        fn=f"{tag}-{q['n']:02d}.png"; crop.save('img/'+fn,optimize=True)
        out.append(dict(n=q['n'],img=fn,w=crop.width,h=crop.height,crossed=crossed,opts=''.join(b['t'] for b in best) if len(best)>=2 else '',hs=hs if len(best)>=2 else []))
    report[tag]=out
    print(tag,'found',len(qs),'kept',len(out),'crossed',[o['n'] for o in out if o['crossed']],'noopts',[o['n'] for o in out if not o['opts']])
json.dump(report,open('questions.json','w'))
