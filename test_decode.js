const str = "🌾";
const buf = Buffer.from(str, 'utf-8');
const str2 = buf.toString('binary');
const buf2 = Buffer.from(str2, 'utf-8');
const str3 = buf2.toString('utf-8');
console.log(str3, 'or', buf2.toString('binary'));
