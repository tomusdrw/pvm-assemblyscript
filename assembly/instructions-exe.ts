import { Args } from "./arguments";
import { OutcomeData, Result, dJump, hostCall, ok, okOrFault, panic, staticJump, status } from "./instructions-outcome";
import { mulUpperSigned, mulUpperUnsigned } from "./math";
import { Memory } from "./memory";
import { Registers } from "./registers";

const MAX_SHIFT_64 = 64;
const MAX_SHIFT_32 = 32;

// TODO [ToDr] Clamp register access

type InstructionRun = (args: Args, registers: Registers, memory: Memory) => OutcomeData;

const INVALID: InstructionRun = () => panic();

export const RUN: InstructionRun[] = [
  // TRAP
  () => panic(),
  // FALLTHROUGH
  () => ok(),
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 10
  // ECALLI
  (args) => hostCall(args.a),
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 20
  // LOAD_IMM_64
  () => panic(), 
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 30
  // STORE_IMM_U8
  (args, _registers, memory) => {
    const address = args.a;
    const pageFault = memory.setU8(address, <u8>(args.b & 0xff));
    return okOrFault(pageFault);
  },
  // STORE_IMM_U16
  (args, _registers, memory) => {
    const address = args.a;
    const pageFault = memory.setU16(address, <u16>(args.b & 0xff_ff));
    return okOrFault(pageFault);
  },
  // STORE_IMM_U32
  (args, _registers, memory) => {
    const address = u32(args.a);
    const pageFault = memory.setU32(address, args.b);
    return okOrFault(pageFault);
  },
  // STORE_IMM_U64
  () => panic(), 
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 40
  // JUMP
  (args) => staticJump(args.a),
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 50
  // JUMP_IND
  (args, registers) => {
    const address = u32(registers[args.a] + args.b);
    return dJump(address);
  },
  // LOAD_IMM
  (args, registers) => {
    registers[args.a] = args.b;
    return ok();
  },
  // LOAD_U8
  (args, registers, memory) => {
    const result = memory.getU8(args.b);
    if (!result.fault.isFault) {
      registers[args.a] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_I8
  (args, registers, memory) => {
    const result = memory.getI8(args.b);
    if (!result.fault.isFault) {
      registers[args.a] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_U16
  (args, registers, memory) => {
    const result = memory.getU16(args.b);
    if (!result.fault.isFault) {
      registers[args.a] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_I16
  (args, registers, memory) => {
    const result = memory.getI16(args.b);
    if (!result.fault.isFault) {
      registers[args.a] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_U32
  (args, registers, memory) => {
    const result = memory.getU32(args.b);
    if (!result.fault.isFault) {
      registers[args.a] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_I32
  (args, registers, memory) => {
    return panic();
  },
  // LOAD_U64
  (args, registers, memory) => {
    return panic();
  },
  // STORE_U8
  (args, registers, memory) => {
    const fault = memory.setU8(args.b, <u8>(registers[args.a] & 0xff));
    return okOrFault(fault);
  },

  // 60
  // STORE_U16
  (args, registers, memory) => {
    const fault = memory.setU16(args.b, <u16>(registers[args.a] & 0xff_ff));
    return okOrFault(fault);
  },
  // STORE_U32
  (args, registers, memory) => {
    const fault = memory.setU32(args.b, u32(registers[args.a]));
    return okOrFault(fault);
  },
  // STORE_U64
  (args, registers, memory) => {
    return panic();
  },
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 70
  // STORE_IMM_IND_U8
  (args, registers, memory) => {
    const address = u32(registers[args.a] + args.b);
    const pageFault = memory.setU8(address, <u8>(args.c & 0xff));
    return okOrFault(pageFault);
  },
  // STORE_IMM_IND_U16
  (args, registers, memory) => {
    const address = u32(registers[args.a] + args.b);
    const pageFault = memory.setU16(address, <u16>(args.c & 0xff_ff));
    return okOrFault(pageFault);
  },
  // STORE_IMM_IND_U32
  (args, registers, memory) => {
    const address = u32(registers[args.a] + args.b);
    const pageFault = memory.setU32(address, args.c);
    return okOrFault(pageFault);
  },
  // STORE_IMM_IND_U64
  (args, registers, memory) => {
    return panic();
  },
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 80
  // LOAD_IMM_JUMP
  (args, registers) => {
    registers[args.a] = args.b;
    return staticJump(args.c);
  },
  // BRANCH_EQ_IMM
  (args, registers) => {
    if (registers[args.a] === args.b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_NE_IMM
  (args, registers) => {
    if (registers[args.a] !== args.b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_LT_U_IMM
  (args, registers) => {
    if (registers[args.a] < args.b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_LE_U_IMM
  (args, registers) => {
    if (registers[args.a] <= args.b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_GE_U_IMM
  (args, registers) => {
    if (registers[args.a] >= args.b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_GT_U_IMM
  (args, registers) => {
    if (registers[args.a] > args.b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_LT_S_IMM
  (args, registers) => {
    if (<i64>registers[args.a] < <i64>args.b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_LE_S_IMM
  (args, registers) => {
    if (<i64>registers[args.a] <= <i64>args.b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_GE_S_IMM
  (args, registers) => {
    if (<i64>registers[args.a] >= <i64>args.b) {
      return staticJump(args.c);
    }
    return ok();
  },

  // 90
  // BRANCH_GT_S_IMM
  (args, registers) => {
    if (<i64>registers[args.a] > <i64>args.b) {
      return staticJump(args.c);
    }
    return ok();
  },
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 100
  // MOVE_REG
  (args, registers) => {
    registers[args.b] = registers[args.a];
    return ok();
  },
  // SBRK
  (args, registers, memory) => {
    registers[args.b] = memory.sbrk(u32(registers[args.a]));
    return ok();
  },
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 110
  // STORE_IND_U8
  (args, registers, memory) => {
    const address = u32(registers[args.a] + args.c);
    const fault = memory.setU8(address, <u8>(registers[args.b] & 0xff));
    return okOrFault(fault);
  },
  // STORE_IND_U16
  (args, registers, memory) => {
    const address = u32(registers[args.a] + args.c);
    const fault = memory.setU16(address, <u16>(registers[args.b] & 0xff_ff));
    return okOrFault(fault);
  },
  // STORE_IND_U32
  (args, registers, memory) => {
    const address = u32(registers[args.a] + args.c);
    const fault = memory.setU32(address, u32(registers[args.b]));
    return okOrFault(fault);
  },
  // STORE_IND_U64
  (args, registers, memory) => {
    return panic();
  },
  // LOAD_IND_U8
  (args, registers, memory) => {
    const address = u32(registers[args.a] + args.c);
    const result = memory.getU8(address);
    if (!result.fault.isFault) {
      registers[args.b] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_IND_I8
  (args, registers, memory) => {
    const address = u32(registers[args.a] + args.c);
    const result = memory.getI8(address);
    if (!result.fault.isFault) {
      registers[args.b] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_IND_U16
  (args, registers, memory) => {
    const address = u32(registers[args.a] + args.c);
    const result = memory.getU16(address);
    if (!result.fault.isFault) {
      registers[args.b] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_IND_I16
  (args, registers, memory) => {
    const address = u32(registers[args.a] + args.c);
    const result = memory.getI16(address);
    if (!result.fault.isFault) {
      registers[args.b] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_IND_U32
  (args, registers, memory) => {
    const address = u32(registers[args.a] + args.c);
    const result = memory.getU32(u32(address));
    if (!result.fault.isFault) {
      registers[args.b] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_IND_I32
  (args, registers, memory) => {
    return panic();
  },

  // 120
  // LOAD_IND_U64
  (args, registers, memory) => {
    return panic();
  },
  // ADD_IMM_32
  (args, registers) => {
    const sum: u64 = registers[args.a] + args.c;
    registers[args.b] = sum;
    return ok();
  },
  // AND_IMM
  (args, registers) => {
    registers[args.b] = registers[args.a] & args.c;
    return ok();
  },
  // XOR_IMM
  (args, registers) => {
    registers[args.b] = registers[args.a] ^ args.c;
    return ok();
  },
  // OR_IMM
  (args, registers) => {
    registers[args.b] = registers[args.a] | args.c;
    return ok();
  },
  // MUL_IMM_32
  (args, registers) => {
    return panic();
  },
  // SET_LT_U_IMM
  (args, registers) => {
    registers[args.b] = registers[args.a] < args.c ? 1 : 0;
    return ok();
  },
  // SET_LT_S_IMM
  (args, registers) => {
    registers[args.b] = i64(registers[args.a]) < i64(args.c) ? 1 : 0;
    return ok();
  },
  // SHLO_L_IMM_32
  (args, registers) => {
    const shift = u32(args.c % MAX_SHIFT_64);
    registers[args.b] = registers[args.a] << shift;
    return panic(); // NEW
  },
  // SHLO_R_IMM_32
  (args, registers) => {
    const shift = u32(args.c % MAX_SHIFT_64);
    registers[args.b] = registers[args.a] >>> shift;
    return panic(); // NEW
  },

  // 130
  // SHAR_R_IMM_32
  (args, registers) => {
    const shift = u32(args.c % MAX_SHIFT_64);
    registers[args.b] = i64(registers[args.a]) >> shift;
    return panic(); // NEW
  },
  // NEG_ADD_IMM_32
  (args, registers) => {
    const sum = args.c - registers[args.a];
    registers[args.b] = sum;
    return panic(); // NEW
  },
  // SET_GT_U_IMM
  (args, registers) => {
    registers[args.b] = registers[args.a] > args.c ? 1 : 0;
    return ok();
  },
  // SET_GT_S_IMM
  (args, registers) => {
    registers[args.b] = <i64>registers[args.a] > <i64>args.c ? 1 : 0;
    return ok();
  },
  // SHLO_L_IMM_ALT_32
  (args, registers) => {
    const shift = u32(registers[args.a] % MAX_SHIFT_64);
    registers[args.b] = args.c << shift;
    return panic(); // NEW
  },
  // SHLO_R_IMM_ALT_32
  (args, registers) => {
    const shift = u32(registers[args.a] % MAX_SHIFT_64);
    registers[args.b] = args.c >>> shift;
    return panic(); // NEW
  },
  // SHAR_R_IMM_ALT_32
  (args, registers) => {
    const shift = u32(registers[args.a] % MAX_SHIFT_64);
    registers[args.b] = i64(args.c) >> shift;
    return panic(); // NEW
  },
  // CMOV_IZ_IMM
  (args, registers) => {
    if (registers[args.a] === 0) {
      registers[args.b] = args.c;
    }
    return ok();
  },
  // CMOV_NZ_IMM
  (args, registers) => {
    if (registers[args.a] !== 0) {
      registers[args.b] = args.c;
    }
    return ok();
  },
  // ADD_IMM
  (args, registers) => {
    const sum: u64 = registers[args.a] + args.c;
    registers[args.b] = sum;
    return ok();
  },

  // 140
  // MUL_IMM
  (args, registers) => {
    registers[args.b] = registers[args.a] * args.c;
    return ok();
  },     
  // SHLO_L_IMM
  (args, registers) => {
    const shift = u32(args.c % MAX_SHIFT_64);
    registers[args.b] = registers[args.a] << shift;
    return ok();
  },
  // SHLO_R_IMM
  (args, registers) => {
    const shift = u32(args.c % MAX_SHIFT_64);
    registers[args.b] = registers[args.a] >>> shift;
    return ok();
  },
  // SHAR_R_IMM
  (args, registers) => {
    const shift = u32(args.c % MAX_SHIFT_64);
    registers[args.b] = i64(registers[args.a]) >> shift;
    return ok();
  },
  // NEG_ADD_IMM
  (args, registers) => {
    const sum = args.c - registers[args.a];
    registers[args.b] = sum;
    return ok();
  },
  // SHLO_L_IMM_ALT
  (args, registers) => {
    const shift = u32(registers[args.a] % MAX_SHIFT_64);
    registers[args.b] = args.c << shift;
    return ok();
  },
  // SHLO_R_IMM_ALT
  (args, registers) => {
    const shift = u32(registers[args.a] % MAX_SHIFT_64);
    registers[args.b] = args.c >>> shift;
    return ok();
  },
  // SHAR_R_IMM_ALT
  (args, registers) => {
    const shift = u32(registers[args.a] % MAX_SHIFT_64);
    registers[args.b] = i64(args.c) >> shift;
    return ok();
  },
  INVALID,
  INVALID,

  // 150
  // BRANCH_EQ
  (args, registers) => {
    if (registers[args.a] === registers[args.b]) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_NE
  (args, registers) => {
    if (registers[args.a] !== registers[args.b]) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_LT_U
  (args, registers) => {
    if (registers[args.b] < registers[args.a]) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_LT_S
  (args, registers) => {
    if (<i64>registers[args.b] < <i64>registers[args.a]) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_GE_U
  (args, registers) => {
    if (registers[args.b] >= registers[args.a]) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_GE_S
  (args, registers) => {
    if (<i64>registers[args.b] >= <i64>registers[args.a]) {
      return staticJump(args.c);
    }
    return ok();
  },
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 160
  // LOAD_IMM_JUMP_IND
  (args, registers) => {
    registers[args.a] = args.c;
    const address = u32(registers[args.b] + args.d);
    return dJump(address);
  },
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 170


  // 180
  // ADD
  (args, registers) => {
    registers[args.c] = registers[args.a] + registers[args.b];
    return ok();
  },
  // SUB
  (args, registers) => {
    registers[args.c] = registers[args.b] - registers[args.a];
    return ok();
  },
  // MUL
  (args, registers) => {
    registers[args.c] = registers[args.a] * registers[args.b];
    return ok();
  },
  // DIV_U
  (args, registers) => {
    if (registers[args.a] === 0) {
      registers[args.c] = 2 ** 64 - 1;
    } else {
      registers[args.c] = registers[args.b] / registers[args.a];
    }
    return ok();
  },
  // DIV_S
  (args, registers) => {
    const b = i64(registers[args.b]);
    const a = i64(registers[args.a]);
    if (a === 0) {
      registers[args.c] = 2 ** 64 - 1;
    } else if (a === -1 && b === i64.MIN_VALUE) {
      registers[args.c] = b;
    } else {
      registers[args.c] = b / a;
    }
    return ok();
  },
  // REM_U
  (args, registers) => {
    if (registers[args.a] === 0) {
      registers[args.c] = registers[args.b];
    } else {
      registers[args.c] = registers[args.b] % registers[args.a];
    }
    return ok();
  },
  // REM_S
  (args, registers) => {
    if (registers[args.a] === 0) {
      registers[args.c] = registers[args.b];
    } else {
      registers[args.c] = <i64>registers[args.b] % <i64>registers[args.a];
    }
    return ok();
  },
  // SHLO_L
  (args, registers) => {
    const shift = u32(registers[args.a] % MAX_SHIFT_64);
    registers[args.c] = registers[args.b] << shift;
    return ok();
  },
  // SHLO_R
  (args, registers) => {
    const shift = u32(registers[args.a] % MAX_SHIFT_64);
    registers[args.c] = registers[args.b] >>> shift;
    return ok();
  },
  // SHAR_R
  (args, registers) => {
    const shift = u32(registers[args.a] % MAX_SHIFT_64);
    registers[args.c] = i64(registers[args.b]) >> shift;
    return ok();
  },

  // 190
  // AND
  (args, registers) => {
    registers[args.c] = registers[args.a] & registers[args.b];
    return ok();
  },
  // XOR
  (args, registers) => {
    registers[args.c] = registers[args.a] ^ registers[args.b];
    return ok();
  },
  // OR
  (args, registers) => {
    registers[args.c] = registers[args.a] | registers[args.b];
    return ok();
  },
  // MUL_UPPER_S_S
  (args, registers) => {
    registers[args.c] = mulUpperSigned(<i64>registers[args.a], <i64>registers[args.b]);
    return ok();
  },
  // MUL_UPPER_U_U
  (args, registers) => {
    registers[args.c] = mulUpperUnsigned(registers[args.a], registers[args.b]);
    return ok();
  },
  // MUL_UPPER_S_U
  (args, registers) => {
    registers[args.c] = mulUpperSigned(<i64>registers[args.a], registers[args.b]);
    return ok();
  },
  // SET_LT_U
  (args, registers) => {
    registers[args.c] = registers[args.b] < registers[args.a] ? 1 : 0;
    return ok();
  },
  // SET_LT_S
  (args, registers) => {
    registers[args.c] = i64(registers[args.b]) < i64(registers[args.a]) ? 1 : 0;
    return ok();
  },
  // CMOV_IZ
  (args, registers) => {
    if (registers[args.a] === 0) {
      registers[args.c] = registers[args.b];
    }
    return ok();
  },
  // CMOV_NZ
  (args, registers) => {
    if (registers[args.a] !== 0) {
      registers[args.c] = registers[args.b];
    }
    return ok();
  }
];
