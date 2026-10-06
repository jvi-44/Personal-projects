import json,re,base64,os
d=json.load(open('work/questions.json'))
partb={'2016':29,'2017':29}
manual={('2021',14):'ABCDEF',('2022',16):'ABCDEF',('2023',12):'ABCDE'}
index=[]
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
    js=json.dumps(out,ensure_ascii=False,separators=(",",":"))
    open(f'site/paper-{y}.json','w').write(js)
    index.append((y,len(out),os.path.getsize(f'site/paper-{y}.json')))
print(index)
