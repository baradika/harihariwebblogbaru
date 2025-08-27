---
title: dotdotdotv2
category: Cryptography
tags: 
completedDuringEvent: true
submitted: true
points : 418
flag: tjctf{us3fu289312953}
draft: false
---
So we got 2 files, `encode.py` and `encoded.txt`

`encode.py`:
```py
import numpy as np
import random
import sys

sys.stdin = open("flag.txt", "r")
sys.stdout = open("encoded.txt", "w")

n = 64

filler = "In cybersecurity, a CTF (Capture The Flag) challenge is a competitive, gamified event where participants, either individually or in teams, are tasked with finding and exploiting vulnerabilities in systems to capture hidden information known as flags. These flags are typically used to score points. CTFs test skills in areas like cryptography, web security, reverse engineering, and forensics, offering an exciting way to learn, practice, and showcase cybersecurity expertise.  This flag is for you: "     

flag = input()
flag = filler+flag
flag = "".join([bin(ord(i))[2:].zfill(8) for i in flag])
flag = flag + "0"*(n-len(flag)%n)
flag = np.array([list(map(int,list(flag[i:i+n]))) for i in range(0, len(flag), n)])   

key = np.array([[random.randint(0,0xdeadbeef) for _ in range(n)] for _ in range(n)])  

for i in flag: print(*list(np.dot(i,key)))
```

This challenge presents a classic cryptography problem rooted in linear algebra. The provided `encoded.py` script reveals the encryption mechanism: a known filler text is prepended to the flag, converted into a binary matrix `F` (plaintext), and then multiplied by a secret 64x64 key matrix `K` to produce the ciphertext matrix `E`. The core operation is `E = F @ K`

The fatal flaw in this encryption scheme is its linearity. The presence of a large, known `filler` text enables a powerful known-plaintext attack, making it possible to solve for the flag without ever needing to find the secret key `K`

The solution hinges on a key mathematical property. If we can find a vector `c` such that `c.T @ E = 0` (meaning c is in the left null space of E), then a crucial relationship emerges:
1. Start with the equation: `c.T @ E = 0`
2. Substitute the definition of `E: c.T @ (F @ K) = 0`
3. Rearrange using associativity: `(c.T @ F) @ K = 0`

Since the key matrix `K` is large and randomly generated, it is overwhelmingly likely to be invertible. This means the only way for the equation `(c.T @ F) @ K = 0` to hold true is if `c.T @ F = 0`

This is the vulnerability we exploit. The plaintext matrix `F` is partially known (from the filler and the flag prefix `tjctf{`) and partially unknown (the rest of the flag). We can partition both the vector `c` and the matrix `F` into known and unknown components:

`c_known.T @ F_known + c_unknown.T @ F_unknown = 0`

Rearranging this gives us a system of linear equations where the only unknowns are the bits of the flag:

`c_unknown.T @ F_unknown = -c_known.T @ F_known`

`solver.py`:
```py
import numpy as np
import sympy
import sys
from time import sleep

def solve():
    n = 64
    filler = "In cybersecurity, a CTF (Capture The Flag) challenge is a competitive, gamified event where participants, either individually or in teams, are tasked with finding and exploiting vulnerabilities in systems to capture hidden information known as flags. These flags are typically used to score points. CTFs test skills in areas like cryptography, web security, reverse engineering, and forensics, offering an exciting way to learn, practice, and showcase cybersecurity expertise.  This flag is for you: "  
    flag_prefix = "tjctf{" 
    try:
        with open("encoded.txt", "r") as f:
            encoded_data = [int(num) for line in f for num in line.strip().split()] 
        num_rows_total = len(encoded_data) // n
        E_all_np = np.array(encoded_data, dtype=object).reshape(num_rows_total, n)
    except Exception as e:
        print(f"❌ Error memuat encoded.txt: {e}")
        sys.exit(1)

    full_known_plaintext = filler + flag_prefix
    known_bits_str = "".join([bin(ord(c))[2:].zfill(8) for c in full_known_plaintext])
    num_known_rows = len(known_bits_str) // n

    if num_known_rows >= num_rows_total:
        F_all_list = [list(map(int, known_bits_str[i:i+n])) for i in range(0, num_rows_total * n, n)]
        F_all_sympy = sympy.Matrix(F_all_list)
        E_sympy = sympy.Matrix(E_all_np)
        left_null_space = E_sympy.T.nullspace()
        if not left_null_space:
            sys.exit(1)
        c_vector = left_null_space[0]
        residual = c_vector.T * F_all_sympy
        if all(x == 0 for x in residual):
            final_flag = flag_prefix
        else:
            sys.exit(1)
    else:
        num_unknown_rows = num_rows_total - num_known_rows
        num_unknown_bits = num_unknown_rows * n
        F_known_list = [list(map(int, known_bits_str[i:i+n])) for i in range(0, num_known_rows * n, n)]
        F_known_sympy = sympy.Matrix(F_known_list)
        E_sympy = sympy.Matrix(E_all_np)
        left_null_space = E_sympy.T.nullspace()
        unknown_bits = sympy.symbols(f'b0:{num_unknown_bits}')
        F_unknown_sympy = sympy.Matrix(num_unknown_rows, n, unknown_bits)
        equations = []
        for c_vector in left_null_space:
            c_known = c_vector[:num_known_rows, :]
            c_unknown = c_vector[num_known_rows:, :]
            lhs = c_unknown.T * F_unknown_sympy
            rhs = -c_known.T * F_known_sympy
            for i in range(n):
                equations.append(sympy.Eq(lhs[i], rhs[i]))
        try:
            solution = sympy.solve(equations, unknown_bits, dict=True)
            if not solution: raise Exception("SymPy tidak menemukan solusi unik.")    
            solution = solution[0]
        except Exception as e:
            print(f"Gagal menyelesaikan sistem persamaan: {e}")
            print("Pastikan prefix flag yang Anda masukkan sudah benar.")
            sys.exit(1)
        solved_bits = [str(solution.get(sympy.Symbol(f'b{i}'), 0)) for i in range(num_unknown_bits)]
        flag_suffix = ""
        for i in range(0, len(solved_bits), 8):
            byte_list = solved_bits[i:i+8]
            if len(byte_list) == 8:
                byte_str = "".join(byte_list)
                val = int(byte_str, 2)
                if val == 0:
                    print(f"  -> Ditemukan padding (null byte), proses berhenti.")    
                    break
                char = chr(val)
                print(f"  -> Bit: {byte_str}  |  Karakter: {char}")
                if 31 < val < 127:
                    flag_suffix += char
        final_flag = flag_prefix + flag_suffix
    print(final_flag)
if __name__ == "__main__":

    solve() 
```