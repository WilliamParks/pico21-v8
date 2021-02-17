#!/usr/bin/env python3

# With credit/inspiration to the v8 problem in downUnder CTF 2020

import os
import subprocess
import sys
import tempfile

MAX_SIZE = 5000
input_size = int(input("Provide size. Must be < 5k:"))
if input_size >= MAX_SIZE:
    print(f"Received size of {input_size}, which is too big")
    sys.exit(-1)
print(f"Provide script please!!")
script_contents = sys.stdin.read(input_size)

# Don't buffer
with tempfile.NamedTemporaryFile(buffering=0) as f:
    f.write(script_contents.encode("utf-8"))
    print("File written. Running. Timeout is 20s")
    res = subprocess.run(["./d8", f.name], timeout=20, capture_output=True)
    print("Run Complete")
    print(f"Stdout {res.stdout}")
    print(f"Stderr {res.stderr}")
