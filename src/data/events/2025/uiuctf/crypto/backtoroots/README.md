---
title: back to roots
category: Cryptography
tags: 
completedDuringEvent: true
submitted: true
flag: uiuctf{SQu4Re_Ro0T5_AR3nT_R4nD0M}
draft: false
---
We are given a Python script (chal.py):
```py
from random import randint
from decimal import Decimal, getcontext
from hashlib import md5

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad

from secret import FLAG

K = randint(10**10, 10**11)
print('K', K)
leak = int( str( Decimal(K).sqrt() ).split('.')[-1] )

print(f"leak = {leak}")
ct = AES.new(
        md5(f"{K}".encode()).digest(),
        AES.MODE_ECB
).encrypt(pad(FLAG, 16))

print(f"ct = {ct.hex()}")
```
and a `output.txt` file:
```txt
leak = 4336282047950153046404
ct = 7863c63a4bb2c782eb67f32928a1deceaee0259d096b192976615fba644558b2ef62e48740f7f28da587846a81697745
```
So the `chal.py` performs the following steps:
1. Generates a random integer `K` between `10^10` and `10^11`.
2. Computes the square root of `K` using high-precision arithmetic (`Decimal`).
3. Extracts the **fractional part** (22 digits after the decimal) of `√K` and leaks it.
4. Uses `K` to derive an AES key (via MD5) and encrypts the flag in ECB mode.

Our goal is to:
* **Recove** `K` from the leaked fractional part.
* **Decrypt** the ciphertext to obtain the flag.

#### Understanding the Leak
The leak is the **fractional part** of `√K`, stored as a 22-digit integer:
```txt
leak = 4336282047950153046404
```
This means:
```txt
√K ≈ n.4336282047950153046404
```
where `n` is the integer part of `√K`.

**Constraints**

* `K` is between `10^10` and `10^11`.
* Therefore, `√K` is between `10^5`(`100000.0`) and `~316227.766` (since `316227.766^2 ≈ 1e11`).

Thus, `n` (the integer part of `√K`) must be in `[100000, 316227]`.

#### Mathematical Approach to Recover `K`
We need to find `K` such that:
```txt
√K ≈ n + (leak / 10^22)
```
Squaring both sides:
```txt
K ≈ (n + (leak / 10^22))^2
```
Expending:
```txt
K ≈ n² + (2 * n * leak) / 10^22 + (leak² / 10^44)
```
Since `leak² / 10^44` is extremely small (~`1.88e-1`), we can approximate:
```text
K ≈ n² + (2 * n * leak) / 10^22
```
But `K` must be an integer, so:
```txt
K = round(n² + (2 * n * leak) / 10^22)
```
**Verification**

We can verify `K` by computing `√K` and checking if its fractional part matches the leak.

#### Algorithm to Find K
1. **Iterate over possible integer parts `n` (`100000 ≤ n ≤ 316227`).**
2. **Compute** `K` = `round(n² + (2 * n * leak) / 10^22)`. 
3. **Check if `K` is within bounds (`10^10 ≤ K ≤ 10^11`).**
4. **Compute `√K` with high precision** and extract the fractional part.
5. **Compare with the leak** to confirm correctness.

#### Solver
```python
from decimal import Decimal, getcontext
from hashlib import md5
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad

def recover_K_and_decrypt(leak, ct_hex):
    M = 10**22
    n_min = 100000
    n_max = 316227

    for n in range(n_min, n_max + 1):
        # Compute K ≈ n² + (2 * n * leak) / 10^22
        K = round(n**2 + (2 * n * leak) / M)

        if K < 10**10 or K > 10**11:
            continue

        # Verify fractional part of √K matches leak
        getcontext().prec = 30
        sqrt_K = Decimal(K).sqrt()
        fractional_part = str(sqrt_K).split('.')[-1][:22]

        if len(fractional_part) < 22:
            fractional_part = fractional_part.ljust(22, '0')

        if int(fractional_part) == leak:
            # Decrypt the flag
            key = md5(str(K).encode()).digest()
            cipher = AES.new(key, AES.MODE_ECB)
            ct = bytes.fromhex(ct_hex)
            flag = unpad(cipher.decrypt(ct), 16).decode()
            return flag

    return None

leak = 4336282047950153046404
ct_hex = "7863c63a4bb2c782eb67f32928a1deceaee0259d096b192976615fba644558b2ef62e48740f7f28da587846a81697745"

flag = recover_K_and_decrypt(leak, ct_hex)
print(flag)
```