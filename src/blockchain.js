import Block from "./block.js";

class Blockchain {
  #blocks;

  constructor() {
    this.#blocks = [];
  }

  addBlock(block) {
    this.#blocks.push(block);
  }

  isValid() {
    for (let i = 1; i < this.#blocks.length; i++) {
      const currentBlock = this.#blocks[i];
      const previousBlock = this.#blocks[i - 1];

      if (currentBlock.prevHash !== previousBlock.blockHash) {
        return false;
      }

      if (!currentBlock.verifyBlock()) {
        return false;
      }
    }

    return true;
  }

  getLatestBlock() {
    return this.#blocks[this.#blocks.length - 1];
  }

  getBlock(index) {
    return this.#blocks[index];
  }

  get blocks() {
    return this.#blocks;
  }
}

export default Blockchain;