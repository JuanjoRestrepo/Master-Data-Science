import io
f='thesis-tg-ie-pujc.cls'
try:
    with io.open(f,'r',encoding='utf-8') as fh:
        lines=fh.readlines()
except Exception:
    with open(f,'r',errors='ignore') as fh:
        lines=fh.readlines()

diff=0
for i,l in enumerate(lines, start=1):
    diff += l.count('{') - l.count('}')
    if diff < 0:
        start = max(1, i-8)
        print('Negative diff at line', i)
        for j in range(start, i+3):
            print(f'{j:4d}: {lines[j-1].rstrip()}')
        break
else:
    print('No negative diff; final diff =', diff)
