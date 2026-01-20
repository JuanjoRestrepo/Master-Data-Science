import io
f='thesis-tg-ie-pujc.cls'
with io.open(f,'r',encoding='utf-8') as fh:
    lines=fh.readlines()

diff=0
for i,l in enumerate(lines, start=1):
    diff += l.count('{') - l.count('}')
    if 180 <= i <= 230:
        print(f'{i:4d} diff={diff:4d} | {l.rstrip()}')
print('final diff=',diff)
