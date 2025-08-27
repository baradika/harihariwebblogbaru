---
title: bacon-bits
category: Cryptography
tags: 
completedDuringEvent: true
submitted: true
points : 180
flag: tjctf{oinkooinkoooinkooooink}
draft: false
---
So we got a `out.txt` and `enc.py`

`enc.py`:
```py
with open('flag.txt') as f: flag = f.read().strip()
with open('text.txt') as t: text = t.read().strip()

baconian = {
'a': '00000',   'b': '00001',
'c': '00010',   'd': '00011',
'e': '00100',   'f': '00101',
'g': '00110',   'h': '00111',
'i': '01000',    'j': '01000',
'k': '01001',    'l': '01010',
'm': '01011',    'n': '01100',
'o': '01101',    'p': '01110',
'q': '01111',    'r': '10000',
's': '10001',    't': '10010',
'u': '10011',    'v': '10011',
'w': '10100',   'x': '10101',
'y': '10110',   'z': '10111'}

text = [*text]
ciphertext = ""
for i,l in enumerate(flag):
    if not l.isalpha(): continue
    change = baconian[l]
    ciphertext += "".join([ts for ix, lt in enumerate(text[i*5:(i+1)*5]) if int(change[ix]) and (ts:=lt.upper()) or (ts:=lt.lower())]) #python lazy boolean evaluation + walrus operator

with open('out.txt', 'w') as e:
    e.write(''.join([chr(ord(i)-13) for i in ciphertext]))
```

`out.txt`:
```py
BaV8hcBaTg\`XG[8eXJTfT7h7hCBa4g<`Xg[8EXjTFTWHW8Ba6XHCbATG\`Xg;8eXj4fT7h78bAV8HcBa4G\@XG[XeXJ4fTWHWXBa68hCbA4g<`8G[8e8JTFT7hWXbA6XhcBaTG
```

So, the `enc.py` is implements a two-stage encryption process, first is `Baconian Cipher`, the flag's alphabetic char are converted into 5-bit binary strings. These bits then dictate the case of char in a cover text: `1` for uppercase and `0` for lowercase, then `Caesar Cipher`, the resulting mixed-case text is then obfuscated by subtracting 13 from the ordinal value of each char (a ROT-13 variant)

To solve it, we can just by reverse this process, first is reverse `Caesar Cipher` (add 13 to each char value to restore the mixed-case text), then extract binary, mapping uppercase letters to `1` and lowercase to `0` to rebuild the binary string, and decode bacoanian, group the binary string into 5-bit chunk and translate them to letters.

`solver.py`:
```py
baconian_decode_map = {
    '00000': 'a', '00001': 'b', '00010': 'c', '00011': 'd', '00100': 'e',
    '00101': 'f', '00110': 'g', '00111': 'h', '01000': 'i', '01001': 'k',
    '01010': 'l', '01011': 'm', '01100': 'n', '01101': 'o', '01110': 'p',
    '01111': 'q', '10000': 'r', '10001': 's', '10010': 't', '10011': 'u',
    '10100': 'w', '10101': 'x', '10110': 'y', '10111': 'z'
}

with open('out.txt', 'r') as f:
    for char in (chr(ord(c) + 13) for c in encrypted_content)
    if char.isalpha()
)

decoded_chars = "".join(
    baconian_decode_map[binary_string[i:i+5]]
    for i in range(0, len(binary_string), 5)
)

final_flag = f"tjctf{{{decoded_chars[5:]}}}"
print(final_flag)
```