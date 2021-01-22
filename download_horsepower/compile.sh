#!/bin/sh

# Needs to be run from the root of the v8 directory
gn gen out/download_horsepower --args='v8_use_external_startup_data=false is_component_build=false v8_monolithic=true is_debug=false v8_enable_object_print=true symbol_level=2 target_cpu="x64"'
ninja -C ./out/download_horsepower d8 
