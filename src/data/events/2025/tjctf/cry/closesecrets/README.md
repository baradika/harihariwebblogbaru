---
title: close-secrets
category: Cryptography
tags: 
completedDuringEvent: true
submitted: true
points : 289
flag: tjctf{sm4ll_r4ng3_sh0rt_s3cr3t}
draft: false
---
So we got 3 files, `params.txt`, `enc_flag`, and `encrypt.py`

`encrypt.py`:
```py
import random
from random import randint
import sys
from Crypto.Util import number
import hashlib 

def encrypt_outer(plaintext_ords, key):
    cipher = []
    key_offset = key % 256
    for val in plaintext_ords:
        if not isinstance(val, int):
            raise TypeError
        cipher.append((val + key_offset) * key)
    return cipher

def dynamic_xor_encrypt(plaintext_bytes, text_key_bytes):
    encrypted_ords = []
    key_length = len(text_key_bytes)
    if not isinstance(plaintext_bytes, bytes):
        raise TypeError
    for i, byte_val in enumerate(plaintext_bytes[::-1]):
        key_byte = text_key_bytes[i % key_length]
        encrypted_ords.append(byte_val ^ key_byte)
    return encrypted_ords

def generate_dh_key():
    p = number.getPrime(1024)
    g = number.getPrime(1024)
    a = randint(p - 10, p)
    b = randint(g - 10, g)
    u = pow(g, a, p)
    v = pow(g, b, p)
    key = pow(v, a, p)
    b_key = pow(u, b, p)
    if key != b_key:
        sys.exit(1)
    return p, g, u, v, key

def generate_challenge_files(flag_file="flag.txt", params_out="params.txt", enc_flag_out="enc_flag"):
    try:
        with open(flag_file, "r") as f:
            flag_plaintext = f.read().strip()
    except FileNotFoundError:
        sys.exit(1)
    flag_bytes = flag_plaintext.encode('utf-8')
    p, g, u, v, shared_key = generate_dh_key()
    xor_key_str = hashlib.sha256(str(shared_key).encode()).hexdigest()
    xor_key_bytes = xor_key_str.encode('utf-8')
    intermediate_ords = dynamic_xor_encrypt(flag_bytes, xor_key_bytes)
    final_cipher = encrypt_outer(intermediate_ords, shared_key)
    with open(params_out, "w") as f:
        f.write(f"p = {p}\n")
        f.write(f"g = {g}\n")
        f.write(f"u = {u}\n")
        f.write(f"v = {v}\n")
    with open(enc_flag_out, "w") as f:
        f.write(str(final_cipher))

if __name__ == "__main__":
    try:
        with open("flag.txt", "x") as f:
            f.write("tjctf{d3f4ult_fl4g_f0r_t3st1ng}")
    except FileExistsError:
        pass
    generate_challenge_files()
```

So, this chall uses a two-layer custom encryption scheme based on a Diffie-Hellman key exchange. The vuln lies in the gen of the private keys, `a` and `b`.

The `generate_dh_key` function selects the private key `a` from an extremely small range:
```py
a = randint(p - 10, p)
```
Since `p` is public param, we know that `a` must be one of only 11 possible values, this makes it trivial to brute force the private key `a`, once `a` is known, we can calculate the shared secret key and reverse the two encryption layers 

To solve it, we can brute forcing the private key `a`, with param `p`, `g`, `u`, and `v` from `params.txt`. With these we can find `a` by checking which of the 11 possible values satifies the equation $u = g^a (mod p)$
```py
# The range for 'a' is very small (p-10 to p)
for test_a in range(p - 10, p + 1):
    if pow(g, test_a, p) == u:
        found_a = test_a
        break
```
after that, calculating the shared secret, with the correct `a` and the public value `v`, we can compute the Diffie-Hellman shared secret key
```py
# shared_key = (v^a) mod p
shared_key = pow(v, found_a, p)
```
the last, reversing the enc layers, we can simply reverse two enc func in the opposite order. The original function calculates `cipher = (val + key_offset) * shared_key`. We reverse this with simple algebra: `val = (cipher // shared_key) - key_offset, where key_offset is shared_key % 256`. And for the Inner layers, the original function performs a repeating-key XOR on the reversed flag bytes. We first regenerate the same XOR key by hashing the `shared_key`. Then, we apply the XOR operation again to the intermediate data, which decrypts it.

`solver.py`:
```py
import hashlib
import ast

def solve():
    try:
        with open("params.txt", "r") as f:
            lines = f.readlines()
            p = int(lines[0].strip().split(" = ")[1])
            g = int(lines[1].strip().split(" = ")[1])
            u = int(lines[2].strip().split(" = ")[1])
            v = int(lines[3].strip().split(" = ")[1])

        with open("enc_flag", "r") as f:
            final_cipher = ast.literal_eval(f.read())
    except FileNotFoundError as e:
        print(f"Error: Make sure '{e.filename}' is in the same directory.")
        return

    found_a = None
    for test_a in range(p - 10, p + 1):
        if pow(g, test_a, p) == u:
            found_a = test_a
            break

    if found_a is None:
        return

    shared_key = pow(v, found_a, p)
    key_offset = shared_key % 256
    intermediate_ords = []
    for val in final_cipher:
        decrypted_val = (val // shared_key) - key_offset
        intermediate_ords.append(decrypted_val)
    xor_key_str = hashlib.sha256(str(shared_key).encode()).hexdigest()
    xor_key_bytes = xor_key_str.encode('utf-8')
    key_length = len(xor_key_bytes)
    decrypted_reversed_ords = []
    for i, byte_val in enumerate(intermediate_ords):
        key_byte = xor_key_bytes[i % key_length]
        decrypted_reversed_ords.append(byte_val ^ key_byte)
    try:
        flag_bytes = bytes(decrypted_reversed_ords[::-1])
        flag = flag_bytes.decode('utf-8')
        print(f"   Flag: {flag}")
    except (UnicodeDecodeError, TypeError) as e:
        print(f"[!] Failed to decode the final flag bytes: {e}")
        print(f"    Raw bytes: {flag_bytes}")

if __name__ == "__main__":
    solve()
```
