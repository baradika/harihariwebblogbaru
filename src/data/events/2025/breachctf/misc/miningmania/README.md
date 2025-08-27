---
title: Mining Mania
category: Miscellaneous
tags: 
completedDuringEvent: true
submitted: true
points : 267
flag: Breach{d0nt_cl0ne_3x31st1ng_c01ns!}
draft: false
---
so i got a web service and `bitcoin_sim_public.py`

`bitcoin_sim_public.py`:
```python
import hashlib
import time
import struct
import json
import threading
from typing import List
from flask import Flask, request, jsonify

def little_endian(hex_str, length):
    """Convert a hex string to little-endian format with a fixed length."""
    return bytes.fromhex(hex_str)[::-1].hex().ljust(length * 2, '0')

class Block:
    def __init__(self, index, prev_hash, merkle_root, timestamp, bits, nonce):
        self.index = index
        self.version = 1
        self.prev_hash = prev_hash
        self.merkle_root = merkle_root
        self.timestamp = timestamp
        self.bits = bits
        self.nonce = nonce
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        version = struct.pack('<I', self.version).hex()  # 4 bytes, little-endian
        prev_block = little_endian(self.prev_hash, 32)  # 32 bytes, little-endian
        merkle_root = little_endian(self.merkle_root, 32)  # 32 bytes, little-endian
        timestamp = struct.pack('<I', self.timestamp).hex()  # 4 bytes, little-endian
        bits = little_endian(self.bits, 4)  # 4 bytes, little-endian
        nonce = struct.pack('<I', self.nonce).hex()  # 4 bytes, little-endian

        # Concatenate block header fields
        block_header_hex = version + prev_block + merkle_root + timestamp + bits + nonce
        block_header_bin = bytes.fromhex(block_header_hex)

        # Perform double SHA-256
        hash1 = hashlib.sha256(block_header_bin).digest()
        hash2 = hashlib.sha256(hash1).digest()

        # Convert final hash to little-endian
        block_hash = hash2[::-1].hex()
        return block_hash

    def to_dict(self):
        return {
            "index": self.index,
            "hash": self.hash,
            "prev_hash": self.prev_hash,
            "merkle_root": self.merkle_root,
            "timestamp": self.timestamp,
            "bits": self.bits,
            "nonce": self.nonce,
        }

class Blockchain:
    def __init__(self):
        self.chain: List[Block] = []
        self.create_genesis_block()

    def create_genesis_block(self):
        genesis_block = Block(
            index=0,
            prev_hash="0" * 64,
            merkle_root="4bf5122e388ed8b9231b1ba9276b71b7",
            timestamp=int(time.time()),
            bits="1d00ffff",
            nonce=0,
        )
        self.chain.append(genesis_block)

    def add_block(self, merkle_root, nonce):
        prev_block = self.chain[-1]
        new_block = Block(
            index=len(self.chain),
            prev_hash=prev_block.hash,
            merkle_root=merkle_root,
            timestamp=int(time.time()),
            bits="1d00ffff",
            nonce=nonce,
        )
        self.chain.append(new_block)

    def validate_block(self, prev_hash, merkle_root, timestamp, bits, nonce):
        temp_block = Block(
            index=len(self.chain),
            prev_hash=prev_hash,
            merkle_root=merkle_root,
            timestamp=timestamp,
            bits=bits,
            nonce=nonce,
        )
        return temp_block.hash.startswith("0000000")


    def get_chain(self):
        return [block.to_dict() for block in self.chain]

app = Flask(__name__)
blockchain = Blockchain()

@app.route("/add_block", methods=["POST"])
def add_block():
    data = request.json
    blockchain.add_block(data["merkle_root"], data["nonce"])
    return jsonify({"message": "Block added", "hash": blockchain.chain[-1].hash})

@app.route("/validate_block", methods=["POST"])
def validate_block():
    data = request.json
    is_valid = blockchain.validate_block(
        data["prev_hash"], data["merkle_root"], data["timestamp"], data["bits"], data["nonce"]
    )

    if not is_valid:
        return jsonify({"valid": is_valid, "message": "Invalid Block Try Again"})

    else:
        return jsonify({"valid": is_valid, "message": "Congratulations! You mined a valid block. Here's your reward : [REDACTED]"})



@app.route("/get_chain", methods=["GET"])
def get_chain():
    return jsonify(blockchain.get_chain())

def run_server():
    app.run(host="0.0.0.0", port=5000)

if __name__ == "__main__":
    try:
        threading.Thread(target=run_server, daemon=True).start()
        print("Blockchain simulation is running...")
        while True:
            time.sleep(10)  # Keep the process alive
    except:
        print("Something went wrong. Exiting...")
```

### Code Analysis
`Block` class:
* Represents a single block in the blockchain
* `calculate_hash()` constructs a block header by concatenating version, previous hash, merkle root, timestamp, bits, and nonce — all in **little-endian** format.
*It then applies `double SHA-256` (as in Bitcoin) to generate the block hash.
* A block is considered valid if its hash starts with **7 zeroes (`0000000`)**, indicating a mining difficulty.

`Blockchain` class:
* Manages a list of blocks (`self.chain`) and initializes with **a genesis block**
*`add_block()` adds a new block by specifying `merkle_root` and `nonce`; `timestamp` is current system time
* `validate_block()` reconstructs a block and checks whether the hash satisfies the difficulty condition.

`Flask Endpoints`:
* `POST /add_block`: Adds a new block to the chain without validating the PoW (for simulation purposes). 
* `POST /validate_block`: Validates a block by reconstructing it and checking whether its hash starts with `0000000`.
* `GET /get_chain`: Returns the entire blockchain as a list of JSON objects.

`Notable Functions`:
* `little_endian()`: Converts hex strings to little-endian byte order and pads them to a fixed length — important for correct Bitcoin-style block hashing.
* `calculate_hash()`: Core hashing logic mimicking real blockchain mining.
* `run_server()`: Runs Flask app on `0.0.0.0:5000` in a background thread.

### Strategy
To solve this challenge, we must **mine a valid block** by finding a `nonce` such that the resulting block hash starts with **seven zeroes** (`0000000`). The server will validate the block using the same hashing logic as Bitcoin (double SHA-256 of the block header). Here's the approach:
* Get the prev_hash from `/get_chain`
* Set a constant `merkle_root` (e.g., `"41414141"`) and `bits = "1d00ffff"`
* Use current UNIX timestamp (`int(time.time())`)
* Brute-force the `nonce` (32-bit integer) to meet the hash condition
* Concatenate the fields to form the full block header
* Apply **double SHA-256** to get the block hash
* Check if the resulting hash satisfies the condition
* Utilize multi-threading based on CPU core count to accelerate mining
* Each thread searches in a different nonce range (e.g., `nonce = start + i * step`)
* Once a valid nonce is found, all threads stop

### Solver
```py
import hashlib
import struct
import time
import requests
import threading
import multiprocessing

URL = "https://bitcoin.challs.breachers.in"
merkle_root = "41414141"
bits = "1d00ffff"

def little_endian(hex_str, length):
    return bytes.fromhex(hex_str)[::-1].hex().ljust(length * 2, '0')

def calculate_hash(prev_hash, merkle_root, timestamp, bits, nonce):
    version = struct.pack('<I', 1).hex()
    prev_block = little_endian(prev_hash, 32)
    merkle_root_le = little_endian(merkle_root, 32)
    timestamp_hex = struct.pack('<I', timestamp).hex()
    bits_le = little_endian(bits, 4)
    nonce_hex = struct.pack('<I', nonce).hex()

    block_header_hex = version + prev_block + merkle_root_le + timestamp_hex + bits_le + nonce_hex
    block_header_bin = bytes.fromhex(block_header_hex)

    hash1 = hashlib.sha256(block_header_bin).digest()
    hash2 = hashlib.sha256(hash1).digest()

    return hash2[::-1].hex()

def get_prev_hash():
    r = requests.get(f"{URL}/get_chain")
    r.raise_for_status()
    chain = r.json()
    return chain[-1]['hash']

def mine_worker(start_nonce, step, prev_hash, timestamp, found_event, result):
    nonce = start_nonce
    while not found_event.is_set():
        hash_result = calculate_hash(prev_hash, merkle_root, timestamp, bits, nonce)
        if hash_result.startswith("0000000"):
            found_event.set()
            result["nonce"] = nonce
            result["hash"] = hash_result
            break
        nonce += step

def submit_block(prev_hash, timestamp, nonce):
    data = {
        "prev_hash": prev_hash,
        "merkle_root": merkle_root,
        "timestamp": timestamp,
        "bits": bits,
        "nonce": nonce
    }
    r = requests.post(f"{URL}/validate_block", json=data)
    print(r.text)

def mine_multithread():
    prev_hash = get_prev_hash()
    timestamp = int(time.time())
    num_threads = multiprocessing.cpu_count()
    found_event = threading.Event()
    result = {}

    print(f"[+] Starting mining with {num_threads} threads...")

    threads = []
    for i in range(num_threads):
        t = threading.Thread(target=mine_worker, args=(i, num_threads, prev_hash, timestamp, found_event, result))
        threads.append(t)
        t.start()

    for t in threads:
        t.join()

    print(f"[+] Nonce found: {result['nonce']}")
    print(f"[+] Hash: {result['hash']}")
    submit_block(prev_hash, timestamp, result['nonce'])

if __name__ == "__main__":
    mine_multithread()
```