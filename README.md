This series of challenges focuses on V8 at an introductory level.

While knowledge of V8 specifics is required to complete these problems, we're trying to avoid overfitting to v8.

Not intended to be too difficult. 

## Problem 1 - Kit Engine
### Goal
Basic familiarity with the v8 codebase & writing exploits in JS
### Implementation
Adds a builtin that takes a Number array, copies it to RWX memory, and executes it. Gets the player comfortable with writing exploits in JS and looking at the V8 codebase.

## Problem 2 - Download Horsepower
### Goal
Familiarity with V8 memory layout, and how to leverage arbitrary read/write techniques to get code execution
### Implementation
Adds a builtin to set JSArray length to arbitrary value. 

## Problem 4 - Turboflan
### Goal
Baby's first turbofan exploit
### Implementation
Removes the interals of CheckMaps, so easy typeconfusion

## Thanks
The Docker build process is a modified version of the one from [Fuzzilli](https://github.com/googleprojectzero/fuzzilli/tree/master/Cloud/Docker/V8Builder)
Server.py is based on the infra from DownUnder CTF 2020 (which contained my first v8 challenge solve!)