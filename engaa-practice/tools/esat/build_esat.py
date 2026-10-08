import json,re,base64,os,random
q=json.load(open('questions.json'))
nk=json.load(open('nkeys.json')); tk=json.load(open('tkeys.json'))
manual={('N2016',33):'ABCDE',('N2020',22):'ABCDEFG',('N2021',31):'ABCDEF',('N2022',36):'ABCDEF',('N2023',31):'ABCDEFGH',('N2023',32):'ABCDE',('T2018',13):'ABCDEF',('T2021',17):'ABCDE'}
os.makedirs('site',exist_ok=True)
pools={'NM':[], 'NP':[], 'T':[]}
allq={}
for tag in sorted(q):
    src=tag[0]; y=int(tag[1:])
    ex={}
    for line in open(f'expl/{tag}.txt'):
        m=re.match(r'(\d+)\|(.*)',line.strip())
        if m: ex[int(m.group(1))]=m.group(2)
    out=[]
    for o in q[tag]:
        if o['crossed']: continue
        n=o['n']
        a=nk[str(y)][str(n)] if src=='N' else tk[str(y)][n-1]
        opts=o['opts'] or manual[(tag,n)]
        assert a in opts,(tag,n,a,opts)
        if src=='T': t='M'; sec='M2'; f=(n-1)/19; pool='T'
        else:
            if y<=2019:
                if n<=18: t='M'; f=(n-1)/17*0.55
                elif n<=36: t='P'; f=(n-19)/17
                else: t='M'; f=0.55+(n-73)/16*0.45
            else:
                t='M' if n<=20 else 'P'; f=((n-1) if n<=20 else (n-21))/19
            pool='NM' if t=='M' else 'NP'
        b64=base64.b64encode(open('img/'+o['img'],'rb').read()).decode()
        rec=dict(n=n,a=a,o=opts,hs=o['hs'] if o['opts'] else [],w=o['w'],h=o['h'],t=t,ex=ex[n],img='data:image/png;base64,'+b64)
        out.append(rec)
        gid=f'{tag}-{n}'; allq[gid]=rec
        pools[pool].append((f,gid))
    json.dump(out,open(f'site/paper-{tag}.json','w'),ensure_ascii=False,separators=(',',':'))
# difficulty tertiles per pool
diff={}
for p,L in pools.items():
    L.sort()
    for i,(f,g) in enumerate(L): diff[g]='E' if i<len(L)/3 else 'M' if i<2*len(L)/3 else 'H'
# rewrite papers with difficulty
for tag in sorted(q):
    arr=json.load(open(f'site/paper-{tag}.json'))
    for r in arr: r['d']=diff[f'{tag}-{r["n"]}']
    json.dump(arr,open(f'site/paper-{tag}.json','w'),ensure_ascii=False,separators=(',',':'))
NMOCK=5; PER=27
rng=random.Random(2026)
mocks=[{'name':f'ESAT Mock {k+1}','sections':[]} for k in range(NMOCK)]
leftover=set()
for p,key,name in [('NM','M1','Mathematics 1'),('NP','PH','Physics'),('T','M2','Mathematics 2')]:
    L=pools[p][:]  # sorted by f
    nleft=len(L)-NMOCK*PER
    step=len(L)/nleft if nleft else 0
    off=rng.random()*step if nleft else 0
    li=set(min(len(L)-1,int(off+i*step)) for i in range(nleft))
    while len(li)<nleft: li.add(rng.randrange(len(L)))
    used=[x for i,x in enumerate(L) if i not in li]
    for i,x in enumerate(L):
        if i in li: leftover.add(x[1])
    buckets=[[] for _ in range(NMOCK)]
    # deal in chunks of NMOCK, shuffling assignment within each chunk to vary years
    for c in range(0,len(used),NMOCK):
        chunk=used[c:c+NMOCK]; order=list(range(NMOCK)); rng.shuffle(order)
        for j,x in enumerate(chunk): buckets[order[j]].append(x)
    for k in range(NMOCK):
        b=sorted(buckets[k]); assert len(b)==PER,(p,k,len(b))
        mocks[k]['sections'].append({'key':key,'name':name,'qns':[g for f,g in b]})
meta=[[g,allq[g]['t'],diff[g],g[0],1 if g in leftover else 0] for f2 in pools.values() for _,g in f2]
json.dump(mocks,open('site/mocks.json','w'),separators=(',',':'))
json.dump(meta,open('site/esatmeta.json','w'),separators=(',',':'))
print({p:len(L) for p,L in pools.items()}, 'leftover',len(leftover), {p:sum(1 for _,g in L if g in leftover) for p,L in pools.items()})
for m in mocks: print(m['name'],[ (s['key'],len(s['qns']), sorted(set(g[1:5] for g in s['qns']))) for s in m['sections']])
print(sum(os.path.getsize('site/'+f) for f in os.listdir('site'))/1e6,'MB')
