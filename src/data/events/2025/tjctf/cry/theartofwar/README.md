---
title: theartofwar
category: Cryptography
tags: 
completedDuringEvent: true
submitted: true
points : 205
flag: tjctf{the_greatest_victory_is_that_which_require_no_battle}
draft: false
---
So we got 2 file, `output.txt` and `main.py`

`main.py`:
```py
from Crypto.Util.number import bytes_to_long, getPrime, long_to_bytes
import time


flag = open('flag.txt', 'rb').read()
m = bytes_to_long(flag)

e = getPrime(8)
print(f'e = {e}')

def generate_key():
    p, q = getPrime(256), getPrime(256)
    while (p - 1) % e == 0:
        p = getPrime(256)
    while (q - 1) % e == 0:
        q = getPrime(256)
    return p * q

for i in range(e):
    n = generate_key()
    c = pow(m, e, n)
    print(f'n{i} = {n}')
    print(f'c{i} = {c}')
```
`output.txt`:
```py
❯ cat output.txt
e = 229
n0 = 4133000467509364935031235422549250721944804102635126859171287340663853905144304279207722105302316322260373188441296903081565640870622284840397538002237331
c0 = 3948516562901221579319242054999926100356598986131508069290749654122146258185357479755195245759062508504409839795634616384594556630261405196176415874727674
n1 = 10012310178440378644460341473165848881968550265291067580300168032729328228000061345651296737301058801752166581806744841746261097249355596503846722347988833
c1 = 7203369362959462243170744698257523975344935146787494714580742042030559300473546901912861737948713816740624292361174535303284449900823238173178576198697775
...
...
...
...
...
...
n228 = 8436105266779215397600464028220244463194349609028479668519755739586774034522217632224615906136235170783922483076839235183125889204826283386865406369080437
c228 = 89900466013784478553210494829116144898476776253278000711433633982268352924632956071541960485866929379189727059518179434642644257558019991914076483483
```

the `main.py`, it reads a `flag` message and converts it to an int `m`. It also generates a small prime public exponent `e`, also there is multiple ecryptions, it loops `e` times, in each loop it generates a new unique RSA modulus `n_i` and uses it to encrypt the same message `m` with the public exponent `e`, then the output process results in `e` different ciphertexts (`c_i`) and their corresponding moduli (`n_i`). Each spair satifies the congruence:
$$
C_i = m^e (mod n_i)
$$
to recover, we can use `Chinese Reminder Theorem`, it applies to the system of congruences. The CRT solves for a single value, lets call it `M`, that satifies all the conditions simultanenously

`solver.py`:
```py
from Crypto.Util.number import long_to_bytes, inverse
from sympy import integer_nthroot

lines = open('output.txt').read().strip().splitlines()
e = int(lines[0].split('=')[1].strip())

ns = []
cs = []
for i in range(1, len(lines), 2):
    n = int(lines[i].split('=')[1].strip())
    c = int(lines[i+1].split('=')[1].strip())
    ns.append(n)
    cs.append(c)

from functools import reduce

def crt(cs, ns):
    N = reduce(lambda x, y: x * y, ns)
    result = 0
    for c, n in zip(cs, ns):
        Ni = N // n
        inv = inverse(Ni, n)
        result += c * Ni * inv
    return result % N

M = crt(cs, ns)
m, exact = integer_nthroot(M, e)
assert exact, "Root not exact, something went wrong"
print(long_to_bytes(m))
```
