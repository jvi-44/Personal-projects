import json,re,base64,os
d=json.load(open('work/questions.json'))
partb={'2016':29,'2017':29,'2018':29}
manual={('2021',14):'ABCDEF',('2022',16):'ABCDEF',('2023',12):'ABCDE'}
index=[]
meta=[]
for y,qs in d.items():
    ex={}
    for line in open(f'expl/{y}.txt'):
        m=re.match(r'(\d+)\|(.*)',line.strip())
        if m: ex[int(m.group(1))]=m.group(2)
    out=[]
    for q in qs:
        if q['crossed']: continue
        opts=q['opts'] or list(manual[(y,q['n'])])
        assert q['ans'] in opts,(y,q['n'])
        b64=base64.b64encode(open('out/img/'+q['img'],'rb').read()).decode()
        out.append(dict(n=q['n'],a=q['ans'],o=''.join(opts),hs=q['hs'] if q['opts'] else [],w=q['w'],h=q['h'],
            p='B' if q['n']>=partb.get(y,21) else 'A',ex=ex[q['n']],img='data:image/png;base64,'+b64))
    # topic: Part A alternates maths (odd) / physics (even); remaining Part B questions are all maths
    for q in out: q['t']='P' if (q['p']=='A' and q['n']%2==0) else 'M'
    pb=partb.get(y,21); last=max(q['n'] for q in qs)
    def pos(q):
        f=(q['n']-1)/(pb-1) if q['p']=='A' else (q['n']-pb)/(last-pb+1)
        return f*0.5+(0.5 if q['p']=='B' else 0) if q['t']=='M' else f
    for t in 'MP':
        grp=sorted([q for q in out if q['t']==t],key=pos)
        for i,q in enumerate(grp): q['d']='E' if i<len(grp)/3 else 'M' if i<2*len(grp)/3 else 'H'
    js=json.dumps(out,ensure_ascii=False,separators=(",",":"))
    open(f'site/paper-{y}.json','w').write(js)
    meta+=[[int(y),q['n'],q['t'],q['d']] for q in out]
    index.append((y,len(out),os.path.getsize(f'site/paper-{y}.json')))
print(index)

json.dump(meta,open('site/meta.json','w'),separators=(',',':'))
