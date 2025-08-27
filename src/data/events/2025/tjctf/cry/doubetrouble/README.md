---
title: double-trouble
category: Cryptography
tags: 
completedDuringEvent: true
submitted: true
points : 388
flag: tjctf{m33t_in_th3_middl3}
draft: false
---

So we got 2 files, `out.txt` and `enc.py`

`enc.py`:
```py
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad
import random

def gen():
    myrandom = random.Random(42)
    k1 = myrandom.randbytes(8)
    choices = list(myrandom.randbytes(6))
    k2 = b''
    for _ in range(8):
        k2 += bytes([choices[random.randint(0, 3)]])
    return k1, k2

def enc(data, k1, k2,  k3, k4):
    key1 = k1+k2
    cipher = AES.new(key1, mode=AES.MODE_ECB)
    ct1 = cipher.encrypt(pad(data, 16))
    key2 = k4+k3
    cipher = AES.new(key2, mode=AES.MODE_ECB)
    ct2 = cipher.encrypt(ct1)
    return ct2

k1, k2 = gen()
k3, k4 = gen()

pt = b"example"

with open('flag.txt') as f:
    flag = f.read().encode()

with open('out.txt', "w") as f:
    f.write(enc(pt, k1, k2, k3, k4).hex())
    f.write("\n")
    f.write(enc(flag, k1, k2, k3, k4).hex())
```
`out.txt`:
```txt
7125383e330c692c75e0ee0886ec7779
9ecba853742db726fb39e748a0c5cfd06b682c8f15be13bc8ba2b2304897eca2
```

The `enc.py` implements a double AES encryption scheme:\
`ciphertext = AES_ECB(key2, AES_ECB(key1, plaintext))`

This structure is a classic candidate for a Meet-in-the-Middle (MITM) attack. The main vulnerability, however, lies in the `gen()` function responsible for creating the keys

1. Fixed seed, The random number generator is seeded with a constant, `random.Random(42)`. This means the "random" values it produces are completely deterministic and can be reproduced

2. Tiny Key Space, The keys `k2` and `k4` are each constructed from 8 bytes. Each byte is chosen from a pool of just 4 possible bytes (derived from the seeded PRNG). This reduces the search space for each 8-byte key part from an impossible number to a trivial $$4^8=65,536$$ possibilities

3. Key Duplication, Since `gen()` is called twice with the same underlying logic, `k1` and `k3` are identical, as is the pool of bytes used to generate `k2` and `k4`

To solve it, we need:

1. we work forward from the known plaintext. We iterate through all 65,536 possibilities for the key part `k2`. For each `k2`, we construct the full first key `(key1 = k1 + k2)` and encrypt the known plaintext. The result is an intermediate ciphertext.

We store these results in a lookup table that maps the intermediate ciphertext to the k2 that produced it.\
`lookup_table[intermediate_ciphertext] = k2`
```py
# Encrypt forward with every possible k2
for i in range(4**8):
    k2 = generate_key_part(i, k2_choices)
    key1 = k1 + k2
    intermediate_value = AES.new(key1, ...).encrypt(padded_pt_known)
    lookup_table[intermediate_value] = k2
```

2. Next, we work backward from the final known ciphertext. We iterate through all 65,536 possibilities for the key part `k4`. For each `k4`, we construct the full second key `(key2 = k4 + k3)` and decrypt the known ciphertext
```py
# Decrypt backward with every possible k4
for j in range(4**8):
    k4 = generate_key_part(j, k2_choices)
    key2 = k4 + k3
    intermediate_value_dec = AES.new(key2, ...).decrypt(ct_known)
    # Check for a match
    if intermediate_value_dec in lookup_table:
        # Success! Keys found.
```
We check if this decrypted intermediate value exists in our `lookup_table`. A match means we've found the "middle" point from both directions, successfully identifying the correct `k2` (from the table) and `k4` (from our current loop)

`solver.py`:
```py
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import random

def get_deterministic_parts():
    myrandom = random.Random(42)
    k1 = myrandom.randbytes(8)
    choices = list(myrandom.randbytes(6))
    return k1, choices[:4]

def generate_key_part(n, choices):
    key_part = bytearray()
    for _ in range(8):
        key_part.append(choices[n % 4])
        n //= 4
    return bytes(key_part)

def solve_concise():
    k1, key_choices = get_deterministic_parts()
    k3 = k1
    pt_known = pad(b"example", 16)

    with open('out.txt', 'r') as f:
        ct_known_hex, flag_ct_hex = f.read().strip().split('\n')
    ct_known, flag_ct = bytes.fromhex(ct_known_hex), bytes.fromhex(flag_ct_hex)       
    lookup = {
        AES.new(k1 + (k2 := generate_key_part(i, key_choices)), AES.MODE_ECB).encrypt(pt_known): k2
        for i in range(4**8)
    }

    found_k4 = next(
        (k4 for i in range(4**8)
         if AES.new((k4 := generate_key_part(i, key_choices)) + k3, AES.MODE_ECB).decrypt(ct_known) in lookup),
        None
    )

    if not found_k4:
        print("[-] Failed to find the keys.")
        return

    intermediate_dec = AES.new(found_k4 + k3, AES.MODE_ECB).decrypt(ct_known)
    found_k2 = lookup[intermediate_dec]
    print(f"[+] Keys found! k2: {found_k2.hex()}, k4: {found_k4.hex()}")
    dec1 = AES.new(found_k4 + k3, AES.MODE_ECB).decrypt(flag_ct)
    dec2 = AES.new(k1 + found_k2, AES.MODE_ECB).decrypt(dec1)
    flag = unpad(dec2, 16)

    print(flag.decode())

if __name__ == '__main__':
    solve_concise()
```
