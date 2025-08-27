---
title: seeds
category: Cryptography
tags: 
completedDuringEvent: true
submitted: true
points : 259
flag: tjctf{the_greatest_victory_is_that_which_require_no_battle}
draft: false
---
So we got a file called `main.py`

`main.py`:
```py
import time, sys, select
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad

class RandomGenerator:
    def __init__(self, seed = None, modulus = 2 ** 32, multiplier = 157, increment = 1):    
        if seed is None:
            seed = time.asctime()
        if type(seed) is int:
            self.seed = seed
        if type(seed) is str:
            self.seed = int.from_bytes(seed.encode(), "big")
        if type(seed) is bytes:
            self.seed = int.from_bytes(seed, "big")
        self.m = modulus
        self.a = multiplier
        self.c = increment

    def randint(self, bits: int):
        self.seed = (self.a * self.seed + self.c) % self.m
        result = self.seed.to_bytes(4, "big") 
        while len(result) < bits // 8:        
            self.seed = (self.a * self.seed + self.c) % self.m
            result += self.seed.to_bytes(4, "big")
        return int.from_bytes(result, "big") % (2 ** bits)

    def randbytes(self, len: int):
        return self.randint(len * 8).to_bytes(len, "big")

def input_with_timeout(prompt, timeout=10):   
    sys.stdout.write(prompt)
    sys.stdout.flush()
    ready, _, _ = select.select([sys.stdin], [], [], timeout)
    if ready:
        return sys.stdin.buffer.readline().rstrip(b'\n')
    raise Exception

def main():
    print("Welcome to the AES Oracle")        

    randgen = RandomGenerator()
    cipher = AES.new(randgen.randbytes(32), AES.MODE_ECB)
    flag = open("flag.txt", "rb").read()      

    ciphertext = cipher.encrypt(pad(flag, AES.block_size))
    print(f'{ciphertext = }')

    while True:
        plaintext = input_with_timeout("What would you like to encrypt? (enter 'quit' to exit) ")
        if plaintext == b"quit": break        
        cipher = AES.new(randgen.randbytes(32), AES.MODE_ECB)
        ciphertext = cipher.encrypt(pad(plaintext, AES.block_size))
        print(f"{ciphertext = }")



if __name__ == "__main__":
    main()
```
 `main.py` has vuln, first is weak PRNG, the script uses a custom `RandomGenerator` class, which is a simple Linear Congruential Generator (LCG), also predicatble seed, and for the key gen process, first it generates 32-byte key to encrypt the flag, second it, generates a new 32-byte key to encrypt and data the user provides, since the entire key sequence is determined by the initial seed time, finding the seed allows the attacker to regenerate both keys.

 To solve it, we can brute force the seed time, as same as `RandomGenerator` using the guessed time as the seed

`solver.py`:
```py
#!/usr/bin/env python3

import time
import sys
import select
import datetime
import pytz
import re
import ast 
from pwn import *
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

class RandomGenerator:
    def __init__(self, seed = None, modulus = 2 ** 32, multiplier = 157, increment = 1):
        if seed is None:
            seed = time.asctime()
        if type(seed) is int:
            self.seed = seed
        if type(seed) is str:
            self.seed = int.from_bytes(seed.encode(), "big")
        if type(seed) is bytes:
            self.seed = int.from_bytes(seed, "big")
        self.m = modulus
        self.a = multiplier
        self.c = increment

    def randint(self, bits: int):
        self.seed = (self.a * self.seed + self.c) % self.m
        result = self.seed.to_bytes(4, "big")
        while len(result) < bits // 8:
            self.seed = (self.a * self.seed + self.c) % self.m
            result += self.seed.to_bytes(4, "big")
        return int.from_bytes(result, "big") % (2 ** bits)

    def randbytes(self, length: int):
        return self.randint(length * 8).to_bytes(length, "big")

def format_asctime_like(dt_obj):
    day_str = str(dt_obj.day)
    return dt_obj.strftime(f'%a %b {day_str:>2} %H:%M:%S %Y')

def parse_ciphertext(line: bytes) -> bytes:
    repr_string = line.strip().decode()
    return ast.literal_eval(repr_string)

def solve():
    HOST = "tjc.tf"
    PORT = 31493

    io = remote(HOST, PORT)
    server_tz = pytz.timezone('America/New_York')
    connect_time = datetime.datetime.now(server_tz)
    log.info(f"Waktu koneksi (ET): {connect_time.strftime('%Y-%m-%d %H:%M:%S')}")     

    io.recvuntil(b"ciphertext = ")
    flag_ciphertext_line = io.recvline()
    flag_ciphertext = parse_ciphertext(flag_ciphertext_line)
    log.info(f"Ciphertext Bendera (hex): {flag_ciphertext.hex()}")
    probe_plaintext = b"a" * 16
    io.sendlineafter(b"What would you like to encrypt? (enter 'quit' to exit) ", probe_plaintext)
    io.recvuntil(b"ciphertext = ")
    probe_ciphertext_line = io.recvline()
    probe_ciphertext = parse_ciphertext(probe_ciphertext_line)
    io.close()
    for i in range(-10, 5):
        guess_time = connect_time + datetime.timedelta(seconds=i)
        seed_str = format_asctime_like(guess_time)

        randgen_guess = RandomGenerator(seed=seed_str)
        _ = randgen_guess.randbytes(32)
        probe_key_guess = randgen_guess.randbytes(32)

        cipher_guess = AES.new(probe_key_guess, AES.MODE_ECB)
        encrypted_probe_guess = cipher_guess.encrypt(pad(probe_plaintext, AES.block_size))

        if encrypted_probe_guess == probe_ciphertext:
            log.success(f"Seed waktu yang benar ditemukan: '{seed_str}'")
            randgen_correct = RandomGenerator(seed=seed_str)
            flag_key = randgen_correct.randbytes(32)
            log.info(f"Kunci bendera yang direkonstruksi: {flag_key.hex()}")

            decipher = AES.new(flag_key, AES.MODE_ECB)
            decrypted_flag_padded = decipher.decrypt(flag_ciphertext)

            flag = unpad(decrypted_flag_padded, AES.block_size)
            log.success(f"FLAG: {flag.decode()}")
            return

    log.failure("Gagal menemukan seed yang benar. Coba jalankan lagi atau perlebar rentang waktu.")

if __name__ == "__main__":
    solve()
```
