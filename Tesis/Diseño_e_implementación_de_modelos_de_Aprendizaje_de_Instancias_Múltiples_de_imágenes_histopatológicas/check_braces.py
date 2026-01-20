import glob
import io

files = glob.glob('**/*.tex', recursive=True) + glob.glob('**/*.cls', recursive=True)
for f in files:
    try:
        with io.open(f, 'r', encoding='utf-8') as fh:
            t = fh.read()
    except Exception:
        with open(f,'r',errors='ignore') as fh:
            t = fh.read()
    o = t.count('{')
    c = t.count('}')
    if o != c:
        print(f, ':', o, 'open vs', c, 'close')
