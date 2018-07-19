/**
 * LS-8 v2.0 emulator skeleton code
 */

const fs = require('fs');

// Instructions

const HLT  = 0b00000001; // Halt CPU
const ADD  = 0b10110011; // ADD R R
const AND  = 0b10110011; // AND R R
const CALL = 0b01001000; // CALL R
const CMP  = 0b10100000; // CMP R R
const DEC  = 0b01111001; // DEC R 
const DIV  = 0b10101011; // DIV R R
const INC  = 0b01111000; // INC R 
const MOD  = 0b10101100; // MOD R R
const MUL  = 0b10101010; // MUL R R
const NOT  = 0b01110000; // NOT R
const NOP  = 0b00000000; // NOP
const LDI  = 0b10011001; // LDI R I
const OR   = 0b10110001; // OR R 
const PRN  = 0b01000011; // PRN R
const PUSH = 0b01001101; // PUSH R
const POP = 0b01001100; // POP R
const RET = 0b00001001; // RET
const SUB  = 0b10101001;  //SUB R R
const XOR  = 0b10110010;  //XOR R R

const SP = 0x07; // Stack pointer R7
const FL_EQ = 0b00000001;
const FL_GT = 0b00000010;
const FL_LT = 0b00000100;
/**
 * Class for simulating a simple Computer (CPU & memory)
 */
class CPU {

    /**
     * Initialize the CPU
     */
    constructor(ram) {
        this.ram = ram;

        this.reg = new Array(8).fill(0); // General-purpose registers
        
        // Special-purpose registers
        this.reg.PC = 0; // Program Counter
        this.reg.IR = 0; // Instruction Register
        this.reg.FL = 0; // Flags

        // Init the stack pointer
        this.reg[SP] = 0xf4; // Stack empty

		this.setupBranchTable();
    }
	
	/**
	 * Sets up the branch table
	 */
	setupBranchTable() {
		let bt = {};

        bt[HLT]  = this.HLT;
        bt[ADD]  = this.ADD;
        bt[AND]  = this.AND;
        bt[CALL] = this.CALL;
        bt[CMP]  = this.CMP;
        bt[DEC]  = this.DEC;
        bt[DIV]  = this.DIV;
        bt[INC]  = this.INC;
        bt[MOD]  = this.MOD;
        bt[MUL]  = this.MUL;
        bt[NOT]  = this.NOT;
        bt[NOP]  = this.NOP;
        bt[LDI]  = this.LDI;
        bt[OR]   = this.OR;
        bt[PRN]  = this.PRN;
        bt[PUSH] = this.PUSH;
        bt[POP] = this.POP;
        bt[RET] = this.RET;
        bt[SUB]  = this.SUB;
        bt[XOR]  = this.XOR;
        

		this.branchTable = bt;
	}

    /**
     * Store value in memory address, useful for program loading
     */
    poke(address, value) {
        this.ram.write(address, value);
    }

    /**
     * Starts the clock ticking on the CPU
     */
    startClock() {
        const _this = this;

        this.clock = setInterval(() => {
            _this.tick();
        }, 1);
    }

    /**
     * Stops the clock
     */
    stopClock() {
        clearInterval(this.clock);
    }

    /**
     * Set flag
     * @param {Number} flag Flag mask, FL_EQ, etc.
     * @param {boolean} value True to set to 1, false to set to 0
     */
    setFlag(flag, value) {
        if (value === true) {
            // Set the flag to 1
            this.reg.FL = this.reg.FL | flag;
        } else {
            // Clear the flag (set it to 0)
            this.reg.FL = this.reg.FL & (~flag);
        }    
    }

    /**  
     * ALU functionality
     * 
     * op can be: ADD SUB MUL DIV INC DEC CMP
     */
    alu(op, regA, regB) {
        switch (op) {
            case 'ADD':
                this.reg[regA] = this.reg[regA] + this.reg[regB];
                break;
            case 'AND':
                this.reg[regA] = this.reg[regA] & this.reg[regB];
                break;
            case 'OR':
                this.reg[regA] = this.reg[regA] | this.reg[regB];
                break;
            case 'NOT':
                this.reg[regA] = ~this.reg[regA];
                break;
             case 'XOR':
                this.reg[regA] = this.reg[regA] ^ this.reg[regB];
                break;
            case 'DEC':
                this.reg[regA] -= 1;
                break;
            case 'DIV':
                if (this.reg[regB] === 0) {
                    console.error('2nd param could not be 0');
                    this.stopClock();
                    break;
                }
                this.reg[regA] = this.reg[regA] / this.reg[regB];
                break;
            case 'INC':
                this.reg[regA] += 1;
                break;
            case 'MOD':
                if (this.reg[regB] === 0) {
                    console.error('2nd param could not be 0');
                    this.stopClock();
                    break;
                }
                this.reg[regA] = this.reg[regA] % this.reg[regB];
                break;
            case 'MUL':
                this.reg[regA] = this.reg[regA] * this.reg[regB];
                break;
            case 'SUB':
                this.reg[regA] = this.reg[regA] - this.reg[regB];
                break;
            case 'CMP':
                this.setFlag(FL_EQ,this.reg[regA] === this.reg[regB]);
                break;
        }
    }

    /**
     * Advances the CPU one cycle
     */
    tick() {
        // Load the instruction register (IR) from the current PC
        this.reg.IR = this.ram.read(this.reg.PC);

        // Debugging output
        //console.log(`${this.reg.PC}: ${this.reg.IR.toString(2)}`);

        // Based on the value in the Instruction Register, locate the
        // appropriate handler in the branchTable
        let handler = this.branchTable[this.reg.IR];

        // Check that the handler is defined, halt if not (invalid
        // instruction)
        if (handler === undefined) {
            console.error('Unknown opcode' + this.reg.IR);
            this.stopClock(); //exit emulator
            return;
        }

        // Read OperandA and OperandB
        let operandA = this.ram.read(this.reg.PC + 1);
        let operandB = this.ram.read(this.reg.PC + 2);

        // We need to use call() so we can set the "this" value inside
        // the handler (otherwise it will be undefined in the handler)
        let nextPC = handler.call(this, operandA, operandB);

        if (nextPC === undefined) {
            // Increment the PC register to go to the next instruction
        this.reg.PC += ((this.reg.IR >> 6) & 0b00000011) + 1;
        } else {
            this.reg.PC = nextPC;
        }   
    }

    // INSTRUCTION HANDLER CODE:

    /** b
     * ADD R R
     */
    ADD(regA, regB) {
        this.alu('ADD', regA, regB);
    }

    /**
     * AND R R
     */
    AND(regA, regB) {
        this.alu('AND', regA, regB);
    }

     /**
     * OR R R
     */
    OR(regA, regB) {
        this.alu('OR', regA, regB);
    }

     /**
     * NOT R
     */
    NOT(regA) {
        this.alu('NOT', regA);
    }

    /**
     * XOR R R
     */
    XOR(regA, regB) {
        this.alu('XOR', regA, regB);
    }

    /**
     * DEC  R
     */
   DEC(regA) {
        this.alu('DEC', regA);
    }

    /**
     * DIV R R
     */
    DIV(regA, regB) {
        this.alu('DIV', regA, regB);
    }

    /**
     * INC  R
     */
    INC(regA) {
        this.alu('INC', regA);
    }

     /**
     * MOD R R
     */
    MOD(regA, regB) {
        this.alu('MOD', regA, regB);
    }

    /**
     * MUL R R
     */
    MUL(regA, regB) {
        this.alu('MUL', regA, regB);
    }

    /**
     * NOP
     */
   NOP() {
        return;
    }

    /**
     * HLT
     */
    HLT() {
        this.stopClock();
    }

    /**
     * LDI R,I
     */
    LDI(regNum, value) {
        this.reg[regNum] = value;
    }

    /**
     * PRN R
     */
    PRN(regA) {
        console.log(this.reg[regA]);
    }

    /**
     * SUB R R
     */
    SUB(regA, regB) {
        this.alu('SUB', regA, regB);
    }

    pushHelper(value) {
        this.reg[SP] = this.reg[SP] - 1;
        this.ram.write(this.reg[SP], value);
    }

    /**
     * CALL
     */
    CALL(regNum) {
        // push next address on stack
        this.pushHelper(this.reg.PC + 2);
        // set PC to value in regNum
        return this.reg[regNum];
    }

    /**
     * RET
     */
    RET() {
        // Pop the address from the top of the stack and store it in the PC
        const nextPC = this.popHelper();
        return nextPC;
    }

    popHelper() {
        const value = this.ram.read(this.reg[SP]);
        this.reg[SP] = this.reg[SP] - 1;
        return value;
    }

    /**
     * POP
     */
    POP(regNum) {
        this.reg[regNum] = this.popHelper();
    }

    /**
     * PUSH
     */
    PUSH(regNum) {
        let value = this.reg[regNum];
        this.pushHelper(value);
    }

     /**
     * CMP
     */
    CMP(regA, regB) {
        this.alu('CMP', regA, regB);
    }
}

module.exports = CPU;
