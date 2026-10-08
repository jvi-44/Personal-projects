import re,subprocess,json
out={}
pat=re.compile(r'(?:option is|option|answer is|answer:|graph|answer is therefore)\s*\(?([A-H])\)?(?![a-z])')
for y in range(2016,2024):
    f=f'pdfs/TMUA-{y}-paper-1-worked-answers.pdf'
    np_=int(re.search(r'Pages:\s+(\d+)',subprocess.run(['pdfinfo',f],capture_output=True,text=True).stdout).group(1))
    sol={}; cur=None
    for pg in range(1,np_+1):
        t=subprocess.run(['pdftotext','-f',str(pg),'-l',str(pg),f,'-'],capture_output=True,text=True).stdout
        m=re.search(r'^\s*Question (\d{1,2})\s*$',t,re.M)
        if m and 'Contents' not in t: cur=int(m.group(1)); sol[cur]=t[m.end():]
        elif cur and 'Contents' not in t and 'Cambridge CB2' not in t: sol[cur]+=t
    keys={n:(pat.findall(b) or [None])[-1] for n,b in sol.items()}
    print(y,len(sol),''.join(keys.get(n) or '?' for n in range(1,21)))
    out[y]={'keys':keys,'sol':sol}
json.dump(out,open('tmua_sol.json','w'))
