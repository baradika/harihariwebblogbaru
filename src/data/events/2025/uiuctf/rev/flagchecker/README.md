---
title: flag_checker
category: Reverse Engineering
tags: 
completedDuringEvent: true
submitted: true
flag: sigpwny{CrackingDiscreteLogs4TheFun}
draft: false
---
So we are given a binary named `flagchecker`, so i decided to decompile it.
```c
undefined8 main(void)

{
  char cVar1;
  long in_FS_OFFSET;
  undefined1 local_38 [40];
  long local_10;
  
  local_10 = *(long *)(in_FS_OFFSET + 0x28);
  get_input(local_38);
  cVar1 = check_input(local_38);
  if (cVar1 != '\0') {
    puts("PRINTING FLAG: ");
    print_flag(local_38);
  }
  if (local_10 != *(long *)(in_FS_OFFSET + 0x28)) {
                    /* WARNING: Subroutine does not return */
    __stack_chk_fail();
  }
  return 0;
}
```
```c
void get_input(long param_1)

{
  int local_10;
  int local_c;
  
  for (local_10 = 0; local_10 < 8; local_10 = local_10 + 1) {
    printf("> ");
    __isoc99_scanf(&DAT_001020a3,param_1 + (long)local_10 * 4);
  }
  for (local_c = 0; local_c < 8; local_c = local_c + 1) {
    *(uint *)((long)local_c * 4 + param_1) = *(uint *)(param_1 + (long)local_c * 4) % 0xffffff2f;
  }
  return;
}
```
```c
undefined8 check_input(long param_1)

{
  int iVar1;
  int local_10;
  
  local_10 = 0;
  while( true ) {
    if (7 < local_10) {
      return 1;
    }
    iVar1 = F(*(undefined4 *)(test_pt + (long)local_10 * 4),
              *(undefined4 *)(param_1 + (long)local_10 * 4),0xffffff2f);
    if (iVar1 != *(int *)(test_ct + (long)local_10 * 4)) break;
    local_10 = local_10 + 1;
  }
  return 0;
}
```
```c
ulong F(long param_1,ulong param_2,ulong param_3)

{
  undefined8 local_28;
  undefined8 local_18;
  undefined8 local_10;
  
  local_18 = 1;
  local_10 = param_1 % (long)param_3;
  for (local_28 = param_2; 0 < (long)local_28; local_28 = (long)local_28 >> 1) {
    if ((local_28 & 1) != 0) {
      local_18 = (local_18 * local_10) % param_3;
    }
    local_10 = (local_10 * local_10) % param_3;
  }
  return local_18;
}
```
You have to enter 8 numbers `x[0]..x[7]` (each number is taken mod `0xffffff2f`)
```c 
F(test_pt[i], x[i], 0xffffff2f) == test_ct[i] 
```
Then the value of `x[0]..x[7]` will be used to decrypt `flag_enc`

**function F:**
```c
ulong F(base, exp, mod) {
    ulong res = 1;
    base = base % mod;
    while (exp > 0) {
        if (exp & 1)
            res = (res * base) % mod;
        base = (base * base) % mod;
        exp >>= 1;
    }
    return res;
}
```
That's **modular exponentiation**:
```c
F(a, b, p) = pow(a, b, p)
```
Find the array `x[0..7] ∈ [0, 0xffffff2f)` so that:
```c
pow(test_pt[i], x[i], 0xffffff2f) == test_ct[i]
```
In other words, we need to:
```c
x[i] == discrete_log(test_pt[i], test_ct[i], 0xffffff2f)
```
First, we need to find the values of `test_pt` and `test_ct` from the memory dump by using signature `flag_enc` from `.rodata` section:
```c
                             test_pt                                         XREF[3]:     Entry Point(*), 
                                                                                          check_input:0010131f(*), 
                                                                                          check_input:00101326(*)  
        00102040 f5 b1 65        undefine
                 22 4a 58 
                 b7 91 df 
                             test_ct                                         XREF[3]:     Entry Point(*), 
                                                                                          check_input:00101349(*), 
                                                                                          check_input:00101350(*)  
        00102060 5e bf 44        undefine
                 dc ec 1c 
                 ff 5a c2 
                             flag_enc                                        XREF[3]:     Entry Point(*), 
                                                                                          print_flag:001013c4(*), 
                                                                                          print_flag:001013cb(*)  
        00102080 11 91 18        undefine
                 24 45 e9 
                 94 fd a6 
```
```python
from pwn import *

e = ELF('./flagchecker', checksec=False)
needle = bytes([0x11, 0x91, 0x18, 0x24, 0x45, 0xe9, 0x94, 0xfd])
addr = e.search(needle).__next__()
print(f"Found flag_enc at file offset: {hex(addr)}")
flag_enc_offset = addr
test_ct_offset = flag_enc_offset - 0x20 
test_pt_offset = flag_enc_offset - 0x40 
test_pt = [u32(e.read(test_pt_offset + i*4, 4)) for i in range(8)]
test_ct = [u32(e.read(test_ct_offset + i*4, 4)) for i in range(8)]
print("test_pt =", test_pt)
print("test_ct =", test_ct)
```
**Output:**
```txt
Found flag_enc at file offset: 0x2080
test_pt = [577090037, 2444712010, 3639700191, 3445702192, 3280387012, 271041745, 1095513148, 506456969]
test_ct = [3695492958, 1526668524, 3790189762, 20093842, 2409408810, 239453620, 1615481745, 1887562585]
```
We already have `test_pt`, `test_ct`, and `mod = 0xffffff2f = 4294967087`, just solve the equation:
```python
pow(test_pt[i], x[i], mod) == test_ct[i]
```
which means we need a discrete log:
```python
x[i] = discrete_log(mod, test_ct[i], test_pt[i])
```
But because the mod is so big (32-bit prime), discrete_log will take a long time using the general method. So we use Baby-step Giant-step (BSGS) to find the discrete log (https://en.wikipedia.org/wiki/Baby-step_giant-step) This is much faster than brute-force and can handle large moduli like `0xffffff2f`
Here is the implementation:
```python
mod = 0xffffff2f

test_pt = [577090037, 2444712010, 3639700191, 3445702192, 3280387012, 271041745, 1095513148, 506456969]
test_ct = [3695492958, 1526668524, 3790189762, 20093842, 2409408810, 239453620, 1615481745, 1887562585]

from math import isqrt

def bsgs(g, h, p):
    m = isqrt(p) + 1
    table = {}
    baby = 1
    for j in range(m):
        if baby not in table:
            table[baby] = j
        baby = (baby * g) % p

    g_m_inv = pow(g, -m, p)
    giant = h
    for i in range(m):
        if giant in table:
            return i * m + table[giant]
        giant = (giant * g_m_inv) % p
    return None

x = []
for i in range(8):
    xi = bsgs(test_pt[i], test_ct[i], mod)
    if xi is None:
        print(f"FAILED at index {i}")
    else:
        print(f"x[{i}] = {xi}")
        x.append(xi)
```
**Output**:
```txt
x[0] = 2127877499
x[1] = 1930549411
x[2] = 2028277857
x[3] = 2798570523
x[4] = 901749037
x[5] = 1674216077
x[6] = 3273968005
x[7] = 3294916953
```
### Solve
```bash
❯ ./flagchecker
> 2127877499
> 1930549411
> 2028277857
> 2798570523
> 901749037
> 1674216077
> 3273968005
> 3294916953
PRINTING FLAG:
sigpwny{CrackingDiscreteLogs4TheFun/Lols؂���}
```