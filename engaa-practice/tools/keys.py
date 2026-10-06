import re,subprocess,json,sys
out={}
for y in [2016,2017,2018,2019,2020,2021,2022,2023]:
    t=subprocess.run(['pdftotext','-layout',f'pdfs/ENGAA_{y}_S1_AnswerKey.pdf','-'],capture_output=True,text=True).stdout
    d={}
    for m in re.finditer(r'(?:^|\s)Q?(\d{1,2})\s*([A-H])\b',t,re.M):
        d[int(m.group(1))]=m.group(2)
    n=max(d); missing=[i for i in range(1,n+1) if i not in d]
    print(y,n,len(d),missing)
    out[y]=''.join(d[i] for i in range(1,n+1))
json.dump(out,open('work/keys.json','w'),indent=1)
