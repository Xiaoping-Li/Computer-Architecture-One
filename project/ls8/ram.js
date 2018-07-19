/**
 * RAM access
 */
class RAM {
    /** 
     *  constructor
     * 
     * @param {Number} size Size of RAM in bytes MUST be a power of 2
    */
    constructor(size) {
        this.mem = new Array(size);
        this.mem.fill(0);
    }

    /**
     * Write (store) MDR value at address MAR
     */
    write(MAR, MDR) {
        // write the value in the MDR to the address MAR
        this.mem[MAR] = MDR;
    }

    /**
     * Read (load) MDR value from address MAR
     * 
     * @returns MDR
     */
    read(MAR) {
        // Read the value in address MAR and return it
        return this.mem[MAR];
    }
}

module.exports = RAM;