---
title: make-groups
category: Miscellaneous
tags: 
completedDuringEvent: true
submitted: true
points : 199
flag: tjctf{148042038}
draft: false
---
So we got 2 files, `calc.py` and `chall.txt`,\
`calc.py`:
```py
f = [x.strip() for x in open("chall.txt").read().split('\n')]
n = int(f[0])
a = list(map(int, f[1].split()))
m = 998244353

def factorial(n):
    if n==0: return 1
    if n==1: return 1
    return n * factorial(n-1)

def choose(n, r):
    return (factorial(n) // (factorial(r) * factorial(n-r))) % m

ans = 1
for x in a:
    ans *= choose(n, x)
    ans %= m
print(f"tjctf{{{ans}}}")%    
```

and for the chall.txt, it just digusting `random` number (jk)

So, this challenge requires calculating a product of combinations under a prime modulus, $m=998244353$

the `calc.py` has two critical, first the recursive `factorial` function is slow and will cause a `RecursionError` for the large `n` found in the challenge file, and has incorrect modulat arithmetic.

For the solution,\
instead of re-calculating factorials, it precomputes all values up to `n!` and stores them.\
Crucially, it also precomputes the modular multiplicative inverse of each factorial. This is done efficiently by using `Fermat Little Theorem` and use correct modular combinations.

`solver.py`:
```py
MOD = 998244353

def precompute_factorials(n, mod):
    fact = [1] * (n + 1)
    inv_fact = [1] * (n + 1)

    for i in range(1, n + 1):
        fact[i] = fact[i - 1] * i % mod

    # Fermat's Little Theorem for inverse factorial
    inv_fact[n] = pow(fact[n], mod - 2, mod)
    for i in range(n - 1, -1, -1):
        inv_fact[i] = inv_fact[i + 1] * (i + 1) % mod

    return fact, inv_fact

def comb(n, r, fact, inv_fact, mod):
    if r < 0 or r > n:
        return 0
    return fact[n] * inv_fact[r] % mod * inv_fact[n - r] % mod

with open("chall.txt") as f:
    lines = [x.strip() for x in f]
    n = int(lines[0])
    a = list(map(int, lines[1].split()))

fact, inv_fact = precompute_factorials(n, MOD)

ans = 1
for x in a:
    ans = ans * comb(n, x, fact, inv_fact, MOD) % MOD

print(f"tjctf{{{ans}}}")
```