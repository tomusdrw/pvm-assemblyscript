export enum Arguments {
  Zero = 0,
  OneImm = 1,
  TwoImm = 2,
  OneOff = 3,
  OneRegOneImm = 4,
  OneRegTwoImm = 5,
  OneRegOneImmOneOff = 6,
  TwoReg = 7,
  TwoRegOneImm = 8,
  TwoRegOneOff = 9,
  TwoRegTwoImm = 10,
  ThreeReg = 11,
}

/** How many numbers in `Args` is relevant for given `Arguments`. */
export const RELEVANT_ARGS = [<u8>0, 1, 2, 1, 2, 3, 3, 2, 3, 3, 4, 3];

// @unmanaged
export class Args {
  a: u32 = 0;
  b: u32 = 0;
  c: u32 = 0;
  d: u32 = 0;
}

function asArgs(a: u32, b: u32, c: u32, d: u32): Args {
  const x = new Args();
  x.a = a;
  x.b = b;
  x.c = c;
  x.d = d;
  return x;
}

type ArgsDecoder = (data: Uint8Array) => Args;

function twoImm(data: Uint8Array): Args {
  if (data.length === 0) {
    return asArgs(0, 0, 0, 0);
  }
  const n = nibbles(data[0]);
  const split = n.low + 1;
  const first = decodeI32(data.subarray(1, split));
  const second = decodeI32(data.subarray(split));
  return asArgs(first, second, 0, 0);
}

export const DECODERS: ArgsDecoder[] = [
  // DECODERS[Arguments.Zero] =
  (_) => {
    return asArgs(0, 0, 0, 0);
  },
  // DECODERS[Arguments.OneImm] =
  (data: Uint8Array) => {
    return asArgs(decodeI32(data), 0, 0, 0);
  },
  // DECODERS[Arguments.TwoImm] =
  (data: Uint8Array) => twoImm(data),
  // DECODERS[Arguments.OneOff] =
  (data: Uint8Array) => {
    return asArgs(decodeI32(data), 0, 0, 0);
  },
  // DECODERS[Arguments.OneRegOneImm] =
  (data: Uint8Array) => {
    return asArgs(nibbles(data[0]).low, decodeI32(data.subarray(1)), 0, 0);
  },
  //DECODERS[Arguments.OneRegTwoImm] =
  (data: Uint8Array) => {
    const first = nibbles(data[0]);
    const split = first.hig + 1;
    const immA = decodeI32(data.subarray(1, split));
    const immB = decodeI32(data.subarray(split));
    return asArgs(first.low, immA, immB, 0);
  },
  // DECODERS[Arguments.OneRegOneImmOneOff] =
  (data: Uint8Array) => {
    const n = nibbles(data[0]);
    return asArgs(n.low, decodeI32(data.subarray(1, 1 + n.hig)), decodeI32(data.subarray(1 + n.hig)), 0);
  },
  // DECODERS[Arguments.TwoReg] =
  (data: Uint8Array) => {
    const n = nibbles(data[0]);
    return asArgs(n.hig, n.low, 0, 0);
  },
  // DECODERS[Arguments.TwoRegOneImm] =
  (data: Uint8Array) => {
    const n = nibbles(data[0]);
    return asArgs(n.hig, n.low, decodeI32(data.subarray(1)), 0);
  },
  // DECODERS[Arguments.TwoRegOneOff] =
  (data: Uint8Array) => {
    const n = nibbles(data[0]);
    return asArgs(n.hig, n.low, decodeI32(data.subarray(1)), 0);
  },
  // DECODERS[Arguments.TwoRegTwoImm] =
  (data: Uint8Array) => {
    const n = nibbles(data[0]);
    const result = twoImm(data.subarray(1));
    return asArgs(n.hig, n.low, result.a, result.b);
  },
  // DECODERS[Arguments.ThreeReg] =
  (data: Uint8Array) => {
    const a = nibbles(data[0]);
    const b = nibbles(data[1]);
    return asArgs(a.hig, a.low, b.low, 0);
  },
];

// @unmanaged
class Nibbles {
  low: u8 = 0;
  hig: u8 = 0;
}

// @inline
function nibbles(byte: u8): Nibbles {
  const low = byte & 0xf;
  const hig = byte >> 4;
  const n = new Nibbles();
  n.low = low;
  n.hig = hig;
  return n;
}

//@inline
function decodeI32(data: Uint8Array): u32 {
  const len = <u32>data.length;
  let num = 0;
  for (let i: u32 = 0; i < len; i++) {
    num |= u32(data[i]) << (i * 8);
  }

  const msb = len > 0 ? data[len - 1] & 0x80 : 0;
  const prefix = msb > 0 ? 0xff : 0x00;
  for (let i: u32 = len; i < 4; i++) {
    num |= prefix << (i * 8);
  }
  return num;
}
