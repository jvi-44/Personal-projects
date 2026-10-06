import pdfplumber,re,json,os,subprocess,sys
from PIL import Image
DPI=144; S=DPI/72
keys=json.load(open('work/keys.json'))
years=sys.argv[1:] or ['2016','2017','2018','2019','2020','2021','2022','2023']
os.makedirs('out/img',exist_ok=True); os.makedirs('work/pages',exist_ok=True)
report={}
for y in years:
    path=f'pdfs/ENGAA_{y}_S1_QuestionPaper.pdf'
    pdf=pdfplumber.open(path)
    if not os.path.exists(f'work/pages/{y}-01.png') and not os.path.exists(f'work/pages/{y}-1.png'):
        subprocess.run(['pdftoppm','-r',str(DPI),'-gray','-png',path,f'work/pages/{y}'],check=True)
    pngs=sorted(f for f in os.listdir('work/pages') if f.startswith(y+'-'))
    qs=[];exp=1
    pagewords={}
    for i,p in enumerate(pdf.pages):
        ws=p.extract_words(extra_attrs=['fontname','size'])
        pagewords[i]=ws
        for w in ws:
            if w['text']==str(exp) and w['x0']<90 and 'Bold' in w['fontname'] and w['top']>45:
                qs.append(dict(n=exp,page=i,x0=w['x0'],top=w['top'],x1=w['x1'],bottom=w['bottom']));exp+=1
    key=keys[y]; assert len(qs)==len(key),(y,len(qs),len(key))
    out=[]
    for k,q in enumerate(qs):
        p=pdf.pages[q['page']]; H=p.height; W=p.width
        nxt=qs[k+1] if k+1<len(qs) else None
        # crossed?
        crossed=False
        for o in p.lines+p.curves+p.rects:
            if o['x1']>q['x0']-4 and o['x0']<q['x1']+4 and o['bottom']>q['top']-4 and o['top']<q['bottom']+4 and (o['x1']-o['x0'])>5 and (o['bottom']-o['top'])>5:
                crossed=True
        top=q['top']-10
        if nxt and nxt['page']==q['page']: bottom=nxt['top']-12
        else:
            bottom=H-58
        # content bounds within [top,bottom]
        objs=[w for w in pagewords[q['page']] if w['top']>=top and w['bottom']<=bottom+2]
        objs+= [o for o in p.lines+p.curves+p.rects+p.images if o['top']>=top-2 and o['bottom']<=bottom+2]
        cb=max(o['bottom'] for o in objs)+10
        cr=max(o['x1'] for o in objs)+12
        bottom=min(bottom,cb)
        left=q['x0']-14; right=min(W-20,max(cr,W*0.75))
        # option labels
        cands=[w for w in pagewords[q['page']] if re.fullmatch(r'[A-H]',w['text']) and w['top']>q['bottom'] and w['bottom']<=bottom]
        best=[]
        for c in cands:
            if c['text']!='A': continue
            seq=[c]
            for L in 'BCDEFGH':
                nx=[d for d in cands if d['text']==L and abs(d['x0']-c['x0'])<4 and d['top']>seq[-1]['top']+2]
                if not nx: break
                seq.append(min(nx,key=lambda d:d['top']))
            if len(seq)>len(best): best=seq
        hs=[]
        if len(best)>=2:
            gaps=[best[j+1]['top']-best[j]['top'] for j in range(len(best)-1)]
            g=min(gaps)
            for j,b in enumerate(best):
                t0=b['top']-(gaps[j-1]/2 if j>0 else g/2)
                t1=b['top']+(gaps[j]/2 if j<len(gaps) else g/2)
                t1=min(t1,bottom)
                hs.append([b['text'],(b['x0']-8-left)/(right-left),(t0-top)/(bottom-top),(right-8-(b['x0']-8))/(right-left),(t1-t0)/(bottom-top)])
        im=Image.open(f"work/pages/{pngs[q['page']]}")
        crop=im.crop((int(left*S),int(top*S),int(right*S),int(bottom*S)))
        crop=crop.quantize(16)
        fn=f"{y}-{q['n']:02d}.png"; crop.save('out/img/'+fn,optimize=True)
        nopts=len(best) if len(best)>=2 else None
        out.append(dict(n=q['n'],img=fn,w=crop.width,h=crop.height,crossed=crossed,ans=key[k],opts=[h[0] for h in hs],hs=[[round(v,4) for v in h[1:]] for h in hs],page=q['page']+1))
    report[y]=out
    print(y,'crossed:',[o['n'] for o in out if o['crossed']],'noopts:',[o['n'] for o in out if len(o['opts'])<2], 'ans not in opts:',[o['n'] for o in out if o['opts'] and o['ans'] not in o['opts']])
json.dump(report,open('work/questions.json','w'))
