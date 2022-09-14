function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object.keys(descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object.defineProperty(target, property, desc);
    desc = null;
  }

  return desc;
}

var PromiseResult;

(function (PromiseResult) {
  PromiseResult[PromiseResult["NotReady"] = 0] = "NotReady";
  PromiseResult[PromiseResult["Successful"] = 1] = "Successful";
  PromiseResult[PromiseResult["Failed"] = 2] = "Failed";
})(PromiseResult || (PromiseResult = {}));

var PromiseError;

(function (PromiseError) {
  PromiseError[PromiseError["Failed"] = 0] = "Failed";
  PromiseError[PromiseError["NotReady"] = 1] = "NotReady";
})(PromiseError || (PromiseError = {}));

function u8ArrayToBytes(array) {
  let ret = "";

  for (let e of array) {
    ret += String.fromCharCode(e);
  }

  return ret;
} // TODO this function is a bit broken and the type can't be string
function bytes(strOrU8Array) {
  if (typeof strOrU8Array == "string") {
    return checkStringIsBytes(strOrU8Array);
  } else if (strOrU8Array instanceof Uint8Array) {
    return u8ArrayToBytes(strOrU8Array);
  }

  throw new Error("bytes: expected string or Uint8Array");
}

function checkStringIsBytes(str) {
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 255) {
      throw new Error(`string ${str} at index ${i}: ${str[i]} is not a valid byte`);
    }
  }

  return str;
}

function assert(b, str) {
  if (b) {
    return;
  } else {
    throw Error("assertion failed: " + str);
  }
}

/*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function assertNumber(n) {
  if (!Number.isSafeInteger(n)) throw new Error(`Wrong integer: ${n}`);
}

function chain(...args) {
  const wrap = (a, b) => c => a(b(c));

  const encode = Array.from(args).reverse().reduce((acc, i) => acc ? wrap(acc, i.encode) : i.encode, undefined);
  const decode = args.reduce((acc, i) => acc ? wrap(acc, i.decode) : i.decode, undefined);
  return {
    encode,
    decode
  };
}

function alphabet(alphabet) {
  return {
    encode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('alphabet.encode input should be an array of numbers');
      return digits.map(i => {
        assertNumber(i);
        if (i < 0 || i >= alphabet.length) throw new Error(`Digit index outside alphabet: ${i} (alphabet: ${alphabet.length})`);
        return alphabet[i];
      });
    },
    decode: input => {
      if (!Array.isArray(input) || input.length && typeof input[0] !== 'string') throw new Error('alphabet.decode input should be array of strings');
      return input.map(letter => {
        if (typeof letter !== 'string') throw new Error(`alphabet.decode: not string element=${letter}`);
        const index = alphabet.indexOf(letter);
        if (index === -1) throw new Error(`Unknown letter: "${letter}". Allowed: ${alphabet}`);
        return index;
      });
    }
  };
}

function join(separator = '') {
  if (typeof separator !== 'string') throw new Error('join separator should be string');
  return {
    encode: from => {
      if (!Array.isArray(from) || from.length && typeof from[0] !== 'string') throw new Error('join.encode input should be array of strings');

      for (let i of from) if (typeof i !== 'string') throw new Error(`join.encode: non-string input=${i}`);

      return from.join(separator);
    },
    decode: to => {
      if (typeof to !== 'string') throw new Error('join.decode input should be string');
      return to.split(separator);
    }
  };
}

function padding(bits, chr = '=') {
  assertNumber(bits);
  if (typeof chr !== 'string') throw new Error('padding chr should be string');
  return {
    encode(data) {
      if (!Array.isArray(data) || data.length && typeof data[0] !== 'string') throw new Error('padding.encode input should be array of strings');

      for (let i of data) if (typeof i !== 'string') throw new Error(`padding.encode: non-string input=${i}`);

      while (data.length * bits % 8) data.push(chr);

      return data;
    },

    decode(input) {
      if (!Array.isArray(input) || input.length && typeof input[0] !== 'string') throw new Error('padding.encode input should be array of strings');

      for (let i of input) if (typeof i !== 'string') throw new Error(`padding.decode: non-string input=${i}`);

      let end = input.length;
      if (end * bits % 8) throw new Error('Invalid padding: string should have whole number of bytes');

      for (; end > 0 && input[end - 1] === chr; end--) {
        if (!((end - 1) * bits % 8)) throw new Error('Invalid padding: string has too much padding');
      }

      return input.slice(0, end);
    }

  };
}

function normalize(fn) {
  if (typeof fn !== 'function') throw new Error('normalize fn should be function');
  return {
    encode: from => from,
    decode: to => fn(to)
  };
}

function convertRadix(data, from, to) {
  if (from < 2) throw new Error(`convertRadix: wrong from=${from}, base cannot be less than 2`);
  if (to < 2) throw new Error(`convertRadix: wrong to=${to}, base cannot be less than 2`);
  if (!Array.isArray(data)) throw new Error('convertRadix: data should be array');
  if (!data.length) return [];
  let pos = 0;
  const res = [];
  const digits = Array.from(data);
  digits.forEach(d => {
    assertNumber(d);
    if (d < 0 || d >= from) throw new Error(`Wrong integer: ${d}`);
  });

  while (true) {
    let carry = 0;
    let done = true;

    for (let i = pos; i < digits.length; i++) {
      const digit = digits[i];
      const digitBase = from * carry + digit;

      if (!Number.isSafeInteger(digitBase) || from * carry / from !== carry || digitBase - digit !== from * carry) {
        throw new Error('convertRadix: carry overflow');
      }

      carry = digitBase % to;
      digits[i] = Math.floor(digitBase / to);
      if (!Number.isSafeInteger(digits[i]) || digits[i] * to + carry !== digitBase) throw new Error('convertRadix: carry overflow');
      if (!done) continue;else if (!digits[i]) pos = i;else done = false;
    }

    res.push(carry);
    if (done) break;
  }

  for (let i = 0; i < data.length - 1 && data[i] === 0; i++) res.push(0);

  return res.reverse();
}

const gcd = (a, b) => !b ? a : gcd(b, a % b);

const radix2carry = (from, to) => from + (to - gcd(from, to));

function convertRadix2(data, from, to, padding) {
  if (!Array.isArray(data)) throw new Error('convertRadix2: data should be array');
  if (from <= 0 || from > 32) throw new Error(`convertRadix2: wrong from=${from}`);
  if (to <= 0 || to > 32) throw new Error(`convertRadix2: wrong to=${to}`);

  if (radix2carry(from, to) > 32) {
    throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${radix2carry(from, to)}`);
  }

  let carry = 0;
  let pos = 0;
  const mask = 2 ** to - 1;
  const res = [];

  for (const n of data) {
    assertNumber(n);
    if (n >= 2 ** from) throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
    carry = carry << from | n;
    if (pos + from > 32) throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
    pos += from;

    for (; pos >= to; pos -= to) res.push((carry >> pos - to & mask) >>> 0);

    carry &= 2 ** pos - 1;
  }

  carry = carry << to - pos & mask;
  if (!padding && pos >= from) throw new Error('Excess padding');
  if (!padding && carry) throw new Error(`Non-zero padding: ${carry}`);
  if (padding && pos > 0) res.push(carry >>> 0);
  return res;
}

function radix(num) {
  assertNumber(num);
  return {
    encode: bytes => {
      if (!(bytes instanceof Uint8Array)) throw new Error('radix.encode input should be Uint8Array');
      return convertRadix(Array.from(bytes), 2 ** 8, num);
    },
    decode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('radix.decode input should be array of strings');
      return Uint8Array.from(convertRadix(digits, num, 2 ** 8));
    }
  };
}

function radix2(bits, revPadding = false) {
  assertNumber(bits);
  if (bits <= 0 || bits > 32) throw new Error('radix2: bits should be in (0..32]');
  if (radix2carry(8, bits) > 32 || radix2carry(bits, 8) > 32) throw new Error('radix2: carry overflow');
  return {
    encode: bytes => {
      if (!(bytes instanceof Uint8Array)) throw new Error('radix2.encode input should be Uint8Array');
      return convertRadix2(Array.from(bytes), 8, bits, !revPadding);
    },
    decode: digits => {
      if (!Array.isArray(digits) || digits.length && typeof digits[0] !== 'number') throw new Error('radix2.decode input should be array of strings');
      return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
    }
  };
}

function unsafeWrapper(fn) {
  if (typeof fn !== 'function') throw new Error('unsafeWrapper fn should be function');
  return function (...args) {
    try {
      return fn.apply(null, args);
    } catch (e) {}
  };
}
const base16 = chain(radix2(4), alphabet('0123456789ABCDEF'), join(''));
const base32 = chain(radix2(5), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'), padding(5), join(''));
chain(radix2(5), alphabet('0123456789ABCDEFGHIJKLMNOPQRSTUV'), padding(5), join(''));
chain(radix2(5), alphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZ'), join(''), normalize(s => s.toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1')));
const base64 = chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'), padding(6), join(''));
const base64url = chain(radix2(6), alphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'), padding(6), join(''));

const genBase58 = abc => chain(radix(58), alphabet(abc), join(''));

const base58 = genBase58('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz');
genBase58('123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ');
genBase58('rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz');
const XMR_BLOCK_LEN = [0, 2, 3, 5, 6, 7, 9, 10, 11];
const base58xmr = {
  encode(data) {
    let res = '';

    for (let i = 0; i < data.length; i += 8) {
      const block = data.subarray(i, i + 8);
      res += base58.encode(block).padStart(XMR_BLOCK_LEN[block.length], '1');
    }

    return res;
  },

  decode(str) {
    let res = [];

    for (let i = 0; i < str.length; i += 11) {
      const slice = str.slice(i, i + 11);
      const blockLen = XMR_BLOCK_LEN.indexOf(slice.length);
      const block = base58.decode(slice);

      for (let j = 0; j < block.length - blockLen; j++) {
        if (block[j] !== 0) throw new Error('base58xmr: wrong padding');
      }

      res = res.concat(Array.from(block.slice(block.length - blockLen)));
    }

    return Uint8Array.from(res);
  }

};
const BECH_ALPHABET = chain(alphabet('qpzry9x8gf2tvdw0s3jn54khce6mua7l'), join(''));
const POLYMOD_GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function bech32Polymod(pre) {
  const b = pre >> 25;
  let chk = (pre & 0x1ffffff) << 5;

  for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
    if ((b >> i & 1) === 1) chk ^= POLYMOD_GENERATORS[i];
  }

  return chk;
}

function bechChecksum(prefix, words, encodingConst = 1) {
  const len = prefix.length;
  let chk = 1;

  for (let i = 0; i < len; i++) {
    const c = prefix.charCodeAt(i);
    if (c < 33 || c > 126) throw new Error(`Invalid prefix (${prefix})`);
    chk = bech32Polymod(chk) ^ c >> 5;
  }

  chk = bech32Polymod(chk);

  for (let i = 0; i < len; i++) chk = bech32Polymod(chk) ^ prefix.charCodeAt(i) & 0x1f;

  for (let v of words) chk = bech32Polymod(chk) ^ v;

  for (let i = 0; i < 6; i++) chk = bech32Polymod(chk);

  chk ^= encodingConst;
  return BECH_ALPHABET.encode(convertRadix2([chk % 2 ** 30], 30, 5, false));
}

function genBech32(encoding) {
  const ENCODING_CONST = encoding === 'bech32' ? 1 : 0x2bc830a3;

  const _words = radix2(5);

  const fromWords = _words.decode;
  const toWords = _words.encode;
  const fromWordsUnsafe = unsafeWrapper(fromWords);

  function encode(prefix, words, limit = 90) {
    if (typeof prefix !== 'string') throw new Error(`bech32.encode prefix should be string, not ${typeof prefix}`);
    if (!Array.isArray(words) || words.length && typeof words[0] !== 'number') throw new Error(`bech32.encode words should be array of numbers, not ${typeof words}`);
    const actualLength = prefix.length + 7 + words.length;
    if (limit !== false && actualLength > limit) throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
    prefix = prefix.toLowerCase();
    return `${prefix}1${BECH_ALPHABET.encode(words)}${bechChecksum(prefix, words, ENCODING_CONST)}`;
  }

  function decode(str, limit = 90) {
    if (typeof str !== 'string') throw new Error(`bech32.decode input should be string, not ${typeof str}`);
    if (str.length < 8 || limit !== false && str.length > limit) throw new TypeError(`Wrong string length: ${str.length} (${str}). Expected (8..${limit})`);
    const lowered = str.toLowerCase();
    if (str !== lowered && str !== str.toUpperCase()) throw new Error(`String must be lowercase or uppercase`);
    str = lowered;
    const sepIndex = str.lastIndexOf('1');
    if (sepIndex === 0 || sepIndex === -1) throw new Error(`Letter "1" must be present between prefix and data only`);
    const prefix = str.slice(0, sepIndex);

    const _words = str.slice(sepIndex + 1);

    if (_words.length < 6) throw new Error('Data must be at least 6 characters long');
    const words = BECH_ALPHABET.decode(_words).slice(0, -6);
    const sum = bechChecksum(prefix, words, ENCODING_CONST);
    if (!_words.endsWith(sum)) throw new Error(`Invalid checksum in ${str}: expected "${sum}"`);
    return {
      prefix,
      words
    };
  }

  const decodeUnsafe = unsafeWrapper(decode);

  function decodeToBytes(str) {
    const {
      prefix,
      words
    } = decode(str, false);
    return {
      prefix,
      words,
      bytes: fromWords(words)
    };
  }

  return {
    encode,
    decode,
    decodeToBytes,
    decodeUnsafe,
    fromWords,
    fromWordsUnsafe,
    toWords
  };
}

genBech32('bech32');
genBech32('bech32m');
const utf8 = {
  encode: data => new TextDecoder().decode(data),
  decode: str => new TextEncoder().encode(str)
};
const hex = chain(radix2(4), alphabet('0123456789abcdef'), join(''), normalize(s => {
  if (typeof s !== 'string' || s.length % 2) throw new TypeError(`hex.decode: expected string, got ${typeof s} with length ${s.length}`);
  return s.toLowerCase();
}));
const CODERS = {
  utf8,
  hex,
  base16,
  base32,
  base64,
  base64url,
  base58,
  base58xmr
};
`Invalid encoding type. Available types: ${Object.keys(CODERS).join(', ')}`;

var CurveType;

(function (CurveType) {
  CurveType[CurveType["ED25519"] = 0] = "ED25519";
  CurveType[CurveType["SECP256K1"] = 1] = "SECP256K1";
})(CurveType || (CurveType = {}));

const U64_MAX = 2n ** 64n - 1n;
const EVICTED_REGISTER = U64_MAX - 1n;
function predecessorAccountId() {
  env.predecessor_account_id(0);
  return env.read_register(0);
}
function attachedDeposit() {
  return env.attached_deposit();
}
function storageRead(key) {
  let ret = env.storage_read(key, 0);

  if (ret === 1n) {
    return env.read_register(0);
  } else {
    return null;
  }
}
function currentAccountId() {
  env.current_account_id(0);
  return env.read_register(0);
}
function input() {
  env.input(0);
  return env.read_register(0);
}
function promiseAnd(...promiseIndex) {
  return env.promise_and(...promiseIndex);
}
function promiseBatchCreate(accountId) {
  return env.promise_batch_create(accountId);
}
function promiseBatchThen(promiseIndex, accountId) {
  return env.promise_batch_then(promiseIndex, accountId);
}
function promiseBatchActionCreateAccount(promiseIndex) {
  env.promise_batch_action_create_account(promiseIndex);
}
function promiseBatchActionDeployContract(promiseIndex, code) {
  env.promise_batch_action_deploy_contract(promiseIndex, code);
}
function promiseBatchActionFunctionCall(promiseIndex, methodName, args, amount, gas) {
  env.promise_batch_action_function_call(promiseIndex, methodName, args, amount, gas);
}
function promiseBatchActionTransfer(promiseIndex, amount) {
  env.promise_batch_action_transfer(promiseIndex, amount);
}
function promiseBatchActionStake(promiseIndex, amount, publicKey) {
  env.promise_batch_action_stake(promiseIndex, amount, publicKey);
}
function promiseBatchActionAddKeyWithFullAccess(promiseIndex, publicKey, nonce) {
  env.promise_batch_action_add_key_with_full_access(promiseIndex, publicKey, nonce);
}
function promiseBatchActionAddKeyWithFunctionCall(promiseIndex, publicKey, nonce, allowance, receiverId, methodNames) {
  env.promise_batch_action_add_key_with_function_call(promiseIndex, publicKey, nonce, allowance, receiverId, methodNames);
}
function promiseBatchActionDeleteKey(promiseIndex, publicKey) {
  env.promise_batch_action_delete_key(promiseIndex, publicKey);
}
function promiseBatchActionDeleteAccount(promiseIndex, beneficiaryId) {
  env.promise_batch_action_delete_account(promiseIndex, beneficiaryId);
}
function promiseBatchActionFunctionCallWeight(promiseIndex, methodName, args, amount, gas, weight) {
  env.promise_batch_action_function_call_weight(promiseIndex, methodName, args, amount, gas, weight);
}
function promiseReturn(promiseIdx) {
  env.promise_return(promiseIdx);
}
function storageWrite(key, value) {
  let exist = env.storage_write(key, value, EVICTED_REGISTER);

  if (exist === 1n) {
    return true;
  }

  return false;
}

function call({
  privateFunction = false,
  payableFunction = false
}) {
  return function (target, key, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args) {
      if (privateFunction && predecessorAccountId() !== currentAccountId()) {
        throw Error("Function is private");
      }

      if (!payableFunction && attachedDeposit() > BigInt(0)) {
        throw Error("Function is not payable");
      }

      return originalMethod.apply(this, args);
    };
  };
}
function view({}) {
  return function (target, key, descriptor) {};
}
function NearBindgen({
  requireInit = false
}) {
  return target => {
    return class extends target {
      static _create() {
        return new target();
      }

      static _getState() {
        const rawState = storageRead("STATE");
        return rawState ? this._deserialize(rawState) : null;
      }

      static _saveToStorage(obj) {
        storageWrite("STATE", this._serialize(obj));
      }

      static _getArgs() {
        return JSON.parse(input() || "{}");
      }

      static _serialize(value) {
        return JSON.stringify(value);
      }

      static _deserialize(value) {
        return JSON.parse(value);
      }

      static _reconstruct(classObject, plainObject) {
        for (const item in classObject) {
          if (classObject[item].constructor?.deserialize !== undefined) {
            classObject[item] = classObject[item].constructor.deserialize(plainObject[item]);
          } else {
            classObject[item] = plainObject[item];
          }
        }

        return classObject;
      }

      static _requireInit() {
        return requireInit;
      }

    };
  };
}

class PromiseAction {}
class CreateAccount extends PromiseAction {
  add(promise_index) {
    promiseBatchActionCreateAccount(promise_index);
  }

}
class DeployContract extends PromiseAction {
  constructor(code) {
    super();
    this.code = code;
  }

  add(promise_index) {
    promiseBatchActionDeployContract(promise_index, this.code);
  }

}
class FunctionCall extends PromiseAction {
  constructor(function_name, args, amount, gas) {
    super();
    this.function_name = function_name;
    this.args = args;
    this.amount = amount;
    this.gas = gas;
  }

  add(promise_index) {
    promiseBatchActionFunctionCall(promise_index, this.function_name, this.args, this.amount, this.gas);
  }

}
class FunctionCallWeight extends PromiseAction {
  constructor(function_name, args, amount, gas, weight) {
    super();
    this.function_name = function_name;
    this.args = args;
    this.amount = amount;
    this.gas = gas;
    this.weight = weight;
  }

  add(promise_index) {
    promiseBatchActionFunctionCallWeight(promise_index, this.function_name, this.args, this.amount, this.gas, this.weight);
  }

}
class Transfer extends PromiseAction {
  constructor(amount) {
    super();
    this.amount = amount;
  }

  add(promise_index) {
    promiseBatchActionTransfer(promise_index, this.amount);
  }

}
class Stake extends PromiseAction {
  constructor(amount, public_key) {
    super();
    this.amount = amount;
    this.public_key = public_key;
  }

  add(promise_index) {
    promiseBatchActionStake(promise_index, this.amount, this.public_key.data);
  }

}
class AddFullAccessKey extends PromiseAction {
  constructor(public_key, nonce) {
    super();
    this.public_key = public_key;
    this.nonce = nonce;
  }

  add(promise_index) {
    promiseBatchActionAddKeyWithFullAccess(promise_index, this.public_key.data, this.nonce);
  }

}
class AddAccessKey extends PromiseAction {
  constructor(public_key, allowance, receiver_id, function_names, nonce) {
    super();
    this.public_key = public_key;
    this.allowance = allowance;
    this.receiver_id = receiver_id;
    this.function_names = function_names;
    this.nonce = nonce;
  }

  add(promise_index) {
    promiseBatchActionAddKeyWithFunctionCall(promise_index, this.public_key.data, this.nonce, this.allowance, this.receiver_id, this.function_names);
  }

}
class DeleteKey extends PromiseAction {
  constructor(public_key) {
    super();
    this.public_key = public_key;
  }

  add(promise_index) {
    promiseBatchActionDeleteKey(promise_index, this.public_key.data);
  }

}
class DeleteAccount extends PromiseAction {
  constructor(beneficiary_id) {
    super();
    this.beneficiary_id = beneficiary_id;
  }

  add(promise_index) {
    promiseBatchActionDeleteAccount(promise_index, this.beneficiary_id);
  }

}

class PromiseSingle {
  constructor(account_id, actions, after, promise_index) {
    this.account_id = account_id;
    this.actions = actions;
    this.after = after;
    this.promise_index = promise_index;
  }

  constructRecursively() {
    if (this.promise_index !== null) {
      return this.promise_index;
    }

    let promise_index;

    if (this.after) {
      promise_index = promiseBatchThen(this.after.constructRecursively(), this.account_id);
    } else {
      promise_index = promiseBatchCreate(this.account_id);
    }

    for (let action of this.actions) {
      action.add(promise_index);
    }

    this.promise_index = promise_index;
    return promise_index;
  }

}

class PromiseJoint {
  constructor(promise_a, promise_b, promise_index) {
    this.promise_a = promise_a;
    this.promise_b = promise_b;
    this.promise_index = promise_index;
  }

  constructRecursively() {
    if (this.promise_index !== null) {
      return this.promise_index;
    }

    let res = promiseAnd(BigInt(this.promise_a.constructRecursively()), BigInt(this.promise_b.constructRecursively()));
    this.promise_index = res;
    return res;
  }

}
class NearPromise {
  constructor(subtype, should_return) {
    this.subtype = subtype;
    this.should_return = should_return;
  }

  static new(account_id) {
    let subtype = new PromiseSingle(account_id, [], null, null);
    let ret = new NearPromise(subtype, false);
    return ret;
  }

  add_action(action) {
    if (this.subtype instanceof PromiseJoint) {
      throw new Error("Cannot add action to a joint promise.");
    } else {
      this.subtype.actions.push(action);
    }

    return this;
  }

  createAccount() {
    return this.add_action(new CreateAccount());
  }

  deployContract(code) {
    return this.add_action(new DeployContract(code));
  }

  functionCall(function_name, args, amount, gas) {
    return this.add_action(new FunctionCall(function_name, args, amount, gas));
  }

  functionCallWeight(function_name, args, amount, gas, weight) {
    return this.add_action(new FunctionCallWeight(function_name, args, amount, gas, weight));
  }

  transfer(amount) {
    return this.add_action(new Transfer(amount));
  }

  stake(amount, public_key) {
    return this.add_action(new Stake(amount, public_key));
  }

  addFullAccessKey(public_key) {
    return this.addFullAccessKeyWithNonce(public_key, 0n);
  }

  addFullAccessKeyWithNonce(public_key, nonce) {
    return this.add_action(new AddFullAccessKey(public_key, nonce));
  }

  addAccessKey(public_key, allowance, receiver_id, method_names) {
    return this.addAccessKeyWithNonce(public_key, allowance, receiver_id, method_names, 0n);
  }

  addAccessKeyWithNonce(public_key, allowance, receiver_id, method_names, nonce) {
    return this.add_action(new AddAccessKey(public_key, allowance, receiver_id, method_names, nonce));
  }

  deleteKey(public_key) {
    return this.add_action(new DeleteKey(public_key));
  }

  deleteAccount(beneficiary_id) {
    return this.add_action(new DeleteAccount(beneficiary_id));
  }

  and(other) {
    let subtype = new PromiseJoint(this, other, null);
    let ret = new NearPromise(subtype, false);
    return ret;
  }

  then(other) {
    if (other.subtype instanceof PromiseSingle) {
      if (other.subtype.after !== null) {
        throw new Error("Cannot callback promise which is already scheduled after another");
      }

      other.subtype.after = this;
    } else {
      throw new Error("Cannot callback joint promise.");
    }

    return other;
  }

  asReturn() {
    this.should_return = true;
    return this;
  }

  constructRecursively() {
    let res = this.subtype.constructRecursively();

    if (this.should_return) {
      promiseReturn(res);
    }

    return res;
  } // Called by NearBindgen, when return object is a NearPromise instance.


  onReturn() {
    this.asReturn().constructRecursively();
  }

}

var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _class, _class2;

const _100_mNEAR = BigInt("100000000000000000000000");

BigInt("1000000000000000000000");

const FIVE_TGAS = BigInt("50000000000000");

BigInt("500000000000000");

const _100_TGAS = BigInt("1000000000000000");

BigInt("2000000000000000");

const NO_DEPOSIT = BigInt(0);
const NO_ARGS = bytes(JSON.stringify({}));
const MOCK_SKILL = {
  title: "Business coach",
  description: "The one & only!",
  rate: 10,
  tags: [],
  owner_addr: "new_member6578.testnet"
};
const MOCK_BOOKING = {
  mentor_addr: "new_member6578.testnet",
  mentee_addr: "a2.testnet",
  skill_id: "0",
  token_id: "1",
  timestamp: 12345,
  notes: "Notes",
  receipt: {
    rating: 5,
    // 1..5
    review: "You were great!"
  }
};
let HelloNear = (_dec = NearBindgen({}), _dec2 = view({}), _dec3 = call({
  payableFunction: true
}), _dec4 = call({
  privateFunction: true
}), _dec5 = view({}), _dec6 = call({}), _dec7 = call({}), _dec8 = view({}), _dec9 = view({}), _dec10 = call({}), _dec11 = call({}), _dec12 = call({}), _dec(_class = (_class2 = class HelloNear {
  nft_addr = "skillsharedao.mintspace2.testnet";
  bookings = [MOCK_BOOKING];
  skills = [MOCK_SKILL]; // @initialize({})
  // init({
  //   nft_addr = "skillsharedao.mintspace2.testnet2",
  // }: {
  //   nft_addr: string;
  // }) {
  //   this.nft_addr = nft_addr;
  //   this.bookings = [MOCK_BOOKING];
  //   this.skills = [MOCK_SKILL];
  // }

  // This method is read-only and can be called for free
  get_nft_addr() {
    return this.nft_addr;
  }

  mint({
    metadata_id
  }) {
    const promise = NearPromise.new(this.nft_addr).functionCall("nft_batch_mint", bytes(JSON.stringify({
      owner_id: "new_member6578.testnet",
      metadata: {
        reference: `https://arweave.net/${metadata_id}`,
        extra: "ticket"
      },
      num_to_mint: 1,
      royalty_args: {
        split_between: {
          "skillsharedao.testnet": 10000
        },
        percentage: 200
      },
      split_owners: null
    })), _100_mNEAR, _100_TGAS).then(NearPromise.new(currentAccountId()).functionCall("mint_callback", NO_ARGS, NO_DEPOSIT, FIVE_TGAS)); // .functionCall(
    //   "nft_approve",
    //   bytes(
    //     JSON.stringify({
    //       token_id,
    //       account_id: "market.mintbase1.near",
    //       msg: JSON.stringify({
    //         price: "5000000000000000000000000",
    //         autotransfer: true,
    //       }),
    //     })
    //   ),
    //   _1_mNEAR,
    //   _200_TGAS
    // );

    return promise.asReturn();
  }

  mint_callback() {// empty
  }

  // This method is read-only and can be called for free
  get_skills({
    addr
  }) {
    return this.skills.filter(b => b.owner_addr === addr && !b.disabled);
  }

  // This method changes the state, for which it cost gas
  add_skill(skill) {
    this.skills.push({ ...skill,
      owner_addr: predecessorAccountId()
    });
  }

  // This method changes the state, for which it cost gas
  disable_skill({
    skill_id
  }) {
    const skill = this.skills[skill_id];
    assert(skill.owner_addr === predecessorAccountId() && !skill.disabled, "Invalid skill_id");
    skill.disabled = true;
    return skill;
  }

  // This method is read-only and can be called for free
  get_mentor_bookings({
    addr
  }) {
    return this.bookings.filter(b => b.mentor_addr === addr);
  }

  // This method is read-only and can be called for free
  get_mentee_bookings({
    addr
  }) {
    return this.bookings.filter(b => b.mentee_addr === addr);
  }

  // This method changes the state, for which it cost gas
  book_mentoring_session({
    token_id,
    notes = "",
    timestamp = 0
  }) {
    const booking = this.bookings.find(b => b.token_id === token_id);
    assert(!booking.mentee_addr || booking.mentee_addr === predecessorAccountId(), "Invalid booking"); // TODO: Check token_id was burnt

    booking.timestamp = timestamp;
    booking.notes = notes;
    return booking;
  } // Must send the remainder (rate - booking_fee)


  // This method changes the state, for which it cost gas
  start_mentoring_session({
    token_id
  }) {
    const booking = this.bookings.find(b => b.token_id === token_id);
    assert(booking.mentee_addr === predecessorAccountId(), "Invalid booking");
    return booking;
  }

  // This method changes the state, for which it cost gas
  end_mentoring_session({
    token_id,
    rating,
    review = ""
  }) {
    const booking = this.bookings.find(b => b.token_id === token_id);
    assert(booking.mentee_addr === predecessorAccountId(), "Invalid booking");
    booking.receipt = {
      rating,
      review
    }; // near.log(`Saving greeting ${message}`);

    return booking;
  }

}, (_applyDecoratedDescriptor(_class2.prototype, "get_nft_addr", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "get_nft_addr"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "mint", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "mint"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "mint_callback", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "mint_callback"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_skills", [_dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "get_skills"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "add_skill", [_dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "add_skill"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "disable_skill", [_dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "disable_skill"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_mentor_bookings", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "get_mentor_bookings"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "get_mentee_bookings", [_dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "get_mentee_bookings"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "book_mentoring_session", [_dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "book_mentoring_session"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "start_mentoring_session", [_dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "start_mentoring_session"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "end_mentoring_session", [_dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "end_mentoring_session"), _class2.prototype)), _class2)) || _class);
function end_mentoring_session() {
  let _state = HelloNear._getState();

  if (!_state && HelloNear._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = HelloNear._create();

  if (_state) {
    HelloNear._reconstruct(_contract, _state);
  }

  let _args = HelloNear._getArgs();

  let _result = _contract.end_mentoring_session(_args);

  HelloNear._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(HelloNear._serialize(_result));
}
function start_mentoring_session() {
  let _state = HelloNear._getState();

  if (!_state && HelloNear._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = HelloNear._create();

  if (_state) {
    HelloNear._reconstruct(_contract, _state);
  }

  let _args = HelloNear._getArgs();

  let _result = _contract.start_mentoring_session(_args);

  HelloNear._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(HelloNear._serialize(_result));
}
function book_mentoring_session() {
  let _state = HelloNear._getState();

  if (!_state && HelloNear._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = HelloNear._create();

  if (_state) {
    HelloNear._reconstruct(_contract, _state);
  }

  let _args = HelloNear._getArgs();

  let _result = _contract.book_mentoring_session(_args);

  HelloNear._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(HelloNear._serialize(_result));
}
function get_mentee_bookings() {
  let _state = HelloNear._getState();

  if (!_state && HelloNear._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = HelloNear._create();

  if (_state) {
    HelloNear._reconstruct(_contract, _state);
  }

  let _args = HelloNear._getArgs();

  let _result = _contract.get_mentee_bookings(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(HelloNear._serialize(_result));
}
function get_mentor_bookings() {
  let _state = HelloNear._getState();

  if (!_state && HelloNear._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = HelloNear._create();

  if (_state) {
    HelloNear._reconstruct(_contract, _state);
  }

  let _args = HelloNear._getArgs();

  let _result = _contract.get_mentor_bookings(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(HelloNear._serialize(_result));
}
function disable_skill() {
  let _state = HelloNear._getState();

  if (!_state && HelloNear._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = HelloNear._create();

  if (_state) {
    HelloNear._reconstruct(_contract, _state);
  }

  let _args = HelloNear._getArgs();

  let _result = _contract.disable_skill(_args);

  HelloNear._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(HelloNear._serialize(_result));
}
function add_skill() {
  let _state = HelloNear._getState();

  if (!_state && HelloNear._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = HelloNear._create();

  if (_state) {
    HelloNear._reconstruct(_contract, _state);
  }

  let _args = HelloNear._getArgs();

  let _result = _contract.add_skill(_args);

  HelloNear._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(HelloNear._serialize(_result));
}
function get_skills() {
  let _state = HelloNear._getState();

  if (!_state && HelloNear._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = HelloNear._create();

  if (_state) {
    HelloNear._reconstruct(_contract, _state);
  }

  let _args = HelloNear._getArgs();

  let _result = _contract.get_skills(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(HelloNear._serialize(_result));
}
function mint_callback() {
  let _state = HelloNear._getState();

  if (!_state && HelloNear._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = HelloNear._create();

  if (_state) {
    HelloNear._reconstruct(_contract, _state);
  }

  let _args = HelloNear._getArgs();

  let _result = _contract.mint_callback(_args);

  HelloNear._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(HelloNear._serialize(_result));
}
function mint() {
  let _state = HelloNear._getState();

  if (!_state && HelloNear._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = HelloNear._create();

  if (_state) {
    HelloNear._reconstruct(_contract, _state);
  }

  let _args = HelloNear._getArgs();

  let _result = _contract.mint(_args);

  HelloNear._saveToStorage(_contract);

  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(HelloNear._serialize(_result));
}
function get_nft_addr() {
  let _state = HelloNear._getState();

  if (!_state && HelloNear._requireInit()) {
    throw new Error("Contract must be initialized");
  }

  let _contract = HelloNear._create();

  if (_state) {
    HelloNear._reconstruct(_contract, _state);
  }

  let _args = HelloNear._getArgs();

  let _result = _contract.get_nft_addr(_args);
  if (_result !== undefined) if (_result && _result.constructor && _result.constructor.name === "NearPromise") _result.onReturn();else env.value_return(HelloNear._serialize(_result));
}

export { add_skill, book_mentoring_session, disable_skill, end_mentoring_session, get_mentee_bookings, get_mentor_bookings, get_nft_addr, get_skills, mint, mint_callback, start_mentoring_session };
//# sourceMappingURL=hello_near.js.map
