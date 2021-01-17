This series of challenges focuses on V8 at an introductory level.

While knowledge of V8 specifics is obviously required to complete these problems, we're trying to avoid overfitting to v8.

Not intended to be too difficult. 

## Problem 1 - Kit Engine
### Goal
Basic familiarity with the v8 codebase & writing exploits in JS
### Implementation
Adds a builtin fucntion that accepts a float, does a comparison against a hex constant, and provides the flag if they're equal

## Problem 2
### Goal
Familiarity with V8 memory layout, and how to leverage arbitrary read/write techniques to get code execution
### Implementation
Adds a builtin to set JSArray length to arbitrary value. 

## Problem 3
### Goal
More complex memory corruption, requiring understanding of maps and data representations.
### Implemntation
Map switch between two objects (Arrays? What data type make sense here? TBD)

## Problem 4 - Turboflan
### Goal
Baby's first turbofan exploit
### Implementation
TBD. Need to figure out how to make something that isn't too crazy

## TODO List
- Easy build process (maybe model after v8builder in Fuzzilli)? Provide everything to the players
- Basic unintended soltuion prevention (have problems served over the network to avoid CLI flag weirdness, etc)
    - Need to remove load, import. What else??
- Integrate into the pico platform
    - Witty challenge names, descriptions, and flags!
- Ensure problems are updated to recent v8 version close to the competition, to prevent public N-days from being repurposed

## Good ideas
Implement if time
- Add a problem that takes one of these vulns, adds it to Chromium, and then visits a url provided by the player
    - Maybe chain with an XSS problem?

## Thanks
