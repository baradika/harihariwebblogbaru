---
title: alchemist-recipe
category: Cryptography
tags: 
completedDuringEvent: true
submitted: true
points : 180
flag: tjctf{thank_you_for_making_me_normal_again_yay}
draft: false
---
So we got 2 file, `chall.py` and `encrypted.txt`

`chall.py`:
```py
import hashlib

SNEEZE_FORK = "AurumPotabileEtChymicumSecretum"
WUMBLE_BAG = 8

def glorbulate_sprockets_for_bamboozle(blorbo):
    zing = {}
    yarp = hashlib.sha256(blorbo.encode()).digest()
    zing['flibber'] = list(yarp[:WUMBLE_BAG])
    zing['twizzle'] = list(yarp[WUMBLE_BAG:WUMBLE_BAG+16])
    glimbo = list(yarp[WUMBLE_BAG+16:])
    snorb = list(range(256))
    sploop = 0
    for _ in range(256):
        for z in glimbo:
            wob = (sploop + z) % 256
            snorb[sploop], snorb[wob] = snorb[wob], snorb[sploop]
            sploop = (sploop + 1) % 256
    zing['drizzle'] = snorb
    return zing

def scrungle_crank(dingus, sprockets):
    if len(dingus) != WUMBLE_BAG:
        raise ValueError(f"Must be {WUMBLE_BAG} wumps for crankshaft.")
    zonked = bytes([sprockets['drizzle'][x] for x in dingus])
    quix = sprockets['twizzle']
    splatted = bytes([zonked[i] ^ quix[i % len(quix)] for i in range(WUMBLE_BAG)])    
    wiggle = sprockets['flibber']
    waggly = sorted([(wiggle[i], i) for i in range(WUMBLE_BAG)])
    zort = [oof for _, oof in waggly]
    plunk = [0] * WUMBLE_BAG
    for y in range(WUMBLE_BAG):
        x = zort[y]
        plunk[y] = splatted[x]
    return bytes(plunk)

def snizzle_bytegum(bubbles, jellybean):
    fuzz = WUMBLE_BAG - (len(bubbles) % WUMBLE_BAG)
    if fuzz == 0:
        fuzz = WUMBLE_BAG
    bubbles += bytes([fuzz] * fuzz)
    glomp = b""
    for b in range(0, len(bubbles), WUMBLE_BAG):
        splinter = bubbles[b:b+WUMBLE_BAG]
        zap = scrungle_crank(splinter, jellybean)
        glomp += zap
    return glomp

def main():
    try:
        with open("flag.txt", "rb") as f:
            flag_content = f.read().strip()
    except FileNotFoundError:
        print("Error: flag.txt not found. Create it with the flag content.")
        return

    if not flag_content:
        print("Error: flag.txt is empty.")
        return

    print(f"Original Recipe (for generation only): {flag_content.decode(errors='ignore')}")

    jellybean = glorbulate_sprockets_for_bamboozle(SNEEZE_FORK)
    encrypted_recipe = snizzle_bytegum(flag_content, jellybean)

    with open("encrypted.txt", "w") as f_out:
        f_out.write(encrypted_recipe.hex())

    print(f"\nEncrypted recipe written to encrypted.txt:")
    print(encrypted_recipe.hex())

if __name__ == "__main__":
    main()
```

`encrypted.txt`:
```txt
b80854d7b5920901192ea91ccd9f588686d69684ec70583abe46f6747e940c027bdeaa848ecb316e11d9a99c7e87b09e
```

`chall.py` implements a custom 8-byte block cipher, it encrypts in an ECB, where each block is processed independently, the enc key `jellybean` is generated from the SHA256 hash of the string `AurumPotabileEtChymicumSecretum`

`scrungle_crank` function involves three steps of encryption,
1. Substitution: Each byte of the plaintext block is replaced with a value from a key-dependent substitution box (S-box) named `drizzle`

2. XOR: The result is XORed against a 16-byte key named `twizzle`

3. ermutation: The bytes of the XORed block are reordered based on the sorted order of an 8-byte key named `flibber`

To solve it, we can reverse the encryption process, first inverse permutation (revert the byte reordering), then inverse XOR (XOR the block with the same `twizzle` key, as XOR is its own inverse), after that inverse substitution (use an inverted S-box to map the subtituted bytes back)

`solver.py`:
```py
import hashlib

SNEEZE_FORK = "AurumPotabileEtChymicumSecretum"
WUMBLE_BAG = 8

def glorbulate_sprockets_for_bamboozle(blorbo):
    zing = {}
    yarp = hashlib.sha256(blorbo.encode()).digest()
    zing['flibber'] = list(yarp[:WUMBLE_BAG]) 
    zing['twizzle'] = list(yarp[WUMBLE_BAG:WUMBLE_BAG+16])
    glimbo = list(yarp[WUMBLE_BAG+16:])       
    snorb = list(range(256))
    sploop = 0
    for _ in range(256):
        for z in glimbo:
            wob = (sploop + z) % 256
            snorb[sploop], snorb[wob] = snorb[wob], snorb[sploop]
            sploop = (sploop + 1) % 256       
    zing['drizzle'] = snorb
    return zing

def reverse_scrungle_crank(block, sprockets): 
    wiggle = sprockets['flibber']
    perm_map = [old_idx for val, old_idx in sorted([(wiggle[i], i) for i in range(WUMBLE_BAG)])]
    unpermuted = [0] * WUMBLE_BAG
    for i in range(WUMBLE_BAG):
        unpermuted[perm_map[i]] = block[i]    

    twizzle = sprockets['twizzle']
    unxored = bytes([unpermuted[i] ^ twizzle[i % len(twizzle)] for i in range(WUMBLE_BAG)]) 

    drizzle = sprockets['drizzle']
    inv_drizzle = [0] * 256
    for i in range(256):
        inv_drizzle[drizzle[i]] = i

    original_block = bytes([inv_drizzle[x] for x in unxored])
    return original_block

def reverse_snizzle_bytegum(ciphertext, jellybean):
    decrypted_padded = b""
    for i in range(0, len(ciphertext), WUMBLE_BAG):
        block = ciphertext[i:i+WUMBLE_BAG]    
        decrypted_padded += reverse_scrungle_crank(block, jellybean)

    pad_len = decrypted_padded[-1]
    return decrypted_padded[:-pad_len]        

def main():
    with open("encrypted.txt", "r") as f:     
        encrypted_hex = f.read().strip()      

    encrypted_bytes = bytes.fromhex(encrypted_hex)

    jellybean = glorbulate_sprockets_for_bamboozle(SNEEZE_FORK)

    flag = reverse_snizzle_bytegum(encrypted_bytes, jellybean)

    print(flag.decode())


if __name__ == "__main__":
    main()
```
