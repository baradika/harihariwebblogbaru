---
title: the shortest crypto chal
category: Cryptography
tags: 
completedDuringEvent: true
submitted: true
flag: uiuctf{D1oPh4nTine__Destr0yer__}
draft: false
---
We are given the following Python code in `chal.py`:
```py
from Crypto.Cipher import AES
from hashlib import md5
from secret import a,b,c,d, FLAG

assert a**4 + b**4 == c**4 + d**4 + 17 and max(a,b,c,d) < 2e4 and AES.new( f"{a*b*c*d}".zfill(16).encode() , AES.MODE_ECB).encrypt(FLAG).hex() == "41593455378fed8c3bd344827a193bde7ec2044a3f7a3ca6fb77448e9de55155"
```
This script defines an assertion over 4 integers `a`, `b`, `c`, `d`, such that their fourth powers satisfy a specific relationship, and a given AES-ECB ciphertext must be the encryption of the flag using the key derived from `a*b*c*d`.

#### Observations
1. The flag is encrypted with AES in ECB mode.
2. The encryption key is derived by computing the product `a*b*c*d`, converting it to a zero-padded string of length 16.
3. The values `a, b, c, d` are all less than 20,000.
4. The equation to solve is: `a^4 + b^4 = c^4 + d^4 + 17` which is a Diophantine equation with a small offset.

This resembles a variation of the taxicab number problem (sums of two fourth powers), which is solvable by precomputing possibilities.

#### Strategy
To recover the plaintext flag:
1. Precompute all valid right-hand sides (RHS) of the equation `c^4 + d^4` for all `1 <= c,d < n` with `d <= c`
2. For each possible pair `(a, b)` (with `b <= a`), compute the left-hand side `a^4 + b^4 - 17`.
3. Binary search the RHS list for a match. If found:
* Compute the possible c and check if d^4 = lhs - c^4 gives an integer d.
4. If all constraints are met, compute `k = str(a*b*c*d).zfill(16).encode()` and decrypt the ciphertext.
5. If the plaintext starts with `uiuctf{`, we have found the correct key and decrypted the flag.

#### Solver
```python
from Crypto.Cipher import AES
from array import array
from bisect import bisect_left

n = 20000
fourth = [i**4 for i in range(n)]

# Precompute all c^4 + d^4 pairs
rhs = sorted(fourth[c] + fourth[d] for c in range(1, n) for d in range(1, c + 1))

ct = bytes.fromhex("41593455378fed8c3bd344827a193bde7ec2044a3f7a3ca6fb77448e9de55155")

for a in range(1, n):
    for b in range(1, a + 1):
        t = fourth[a] + fourth[b] - 17
        if t > rhs[-1]: break
        if rhs[bisect_left(rhs, t)] != t: continue
        for c in range(1, n):
            d4 = t - fourth[c]
            if d4 < 1: break
            d = round(d4 ** 0.25)
            if 1 <= d <= c and fourth[d] == d4:
                k = str(a * b * c * d).zfill(16).encode()
                pt = AES.new(k, AES.MODE_ECB).decrypt(ct)
                if pt.startswith(b'uiuctf{'):
                    print(pt.decode())
                    exit()
```