import Block from "./block.js";

class Blockchain {
  #blocks;
  #mempool;
  #difficulty;

  constructor(difficulty = 3) {
    this.#blocks = [];
    this.#mempool = [];
    this.#difficulty = difficulty;

    this.#createGenesisBlock();
  }

  #createGenesisBlock() {
    const genesisBlock = new Block(1, "0".repeat(64), [], this.#difficulty, {
      timestamp: 1700000000000, // однаковий фіксований час
      nonce: 0,
      merkleRoot: "0".repeat(64),
      blockHash: "0".repeat(64), // єдиний стартовий хеш нульового блоку
      signature: "genesis_signature",
      publicKey: "genesis_key",
    });

    this.#blocks.push(genesisBlock);
  }

  addTransactionToMempool(transaction) {
    if (!transaction.verifyHash() || !transaction.verifySignature()) {
      console.log(
        `[MEMPOOL] Відхилено: недійсна транзакція ${transaction.txHash}`,
      );
      return false;
    }

    this.#mempool.push(transaction);
    console.log(
      `[MEMPOOL] Транзакцію ${transaction.txHash.slice(0, 8)}... додано до пулу`,
    );
    return true;
  }

  getTransactionsForBlock(limit = 5) {
    return this.#mempool.slice(0, limit);
  }

  addBlock(block) {
    const latestBlock = this.getLatestBlock();

    if (block.prevHash !== latestBlock.blockHash) {
      console.log("[BLOCKCHAIN] Відхилено: не збігається prevHash");
      return false;
    }

    if (!block.verifyBlock()) {
      console.log("[BLOCKCHAIN] Відхилено: блок не пройшов валідацію");
      return false;
    }

    this.#blocks.push(block);
    const minedTxHashes = new Set(block.transactions.map((tx) => tx.txHash));
    this.#mempool = this.#mempool.filter((tx) => !minedTxHashes.has(tx.txHash));

    console.log(
      `[BLOCKCHAIN] Блок успішно додано до ланцюга! Висота: ${this.#blocks.length}`,
    );
    return true;
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

  get mempool() {
    return this.#mempool;
  }

  get difficulty() {
    return this.#difficulty;
  }
}

export default Blockchain;
