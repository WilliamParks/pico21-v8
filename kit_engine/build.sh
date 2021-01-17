#!/bin/sh

# Needs to be run from the root of the v8 directory
gn gen out/kit_engine --args='is_debug=true symbol_level=2 target_cpu="x64"'
ninja -C ./out/kit_engine d8
