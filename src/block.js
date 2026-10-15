import crypto from "node:crypto";

class Block {
  #version;
  #prevHash;
  #timestamp;
  #difficultyTarget;
  #nonce;
  #merkleRoot;
  #transactions;
  #blockHash;
  #privateKey;
  #publicKey;
  #signature;

  constructor(version, prevHash, transactions, difficultyTarget) {
    this.version = version;
    this.prevHash = prevHash;
    this.transactions = transactions;
    this.difficultyTarget = difficultyTarget;
    this.timestamp = Date.now();
    this.nonce = 0;
    this.merkleRoot = this.calculateMerkleRoot();
    this.blockHash = this.calculateHash();

    const keys = crypto.generateKeyPairSync("ec", {
      namedCurve: "secp256k1",
    });

    this.#privateKey = keys.privateKey;
    this.#publicKey = keys.publicKey;

    this.signBlock();
  }

  calculateHashPair(hash1, hash2) {
    return crypto
      .createHash("sha256")
      .update(hash1 + hash2)
      .digest("hex");
  }

  calculateMerkleRoot() {
    let hashes = this.transactions.map((tx) => tx.txHash);

    if (hashes.length === 0) {
      return crypto.createHash("sha256").update("").digest("hex");
    }

    while (hashes.length > 1) {
      const newLevel = [];

      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] ?? left;

        newLevel.push(this.calculateHashPair(left, right));
      }

      hashes = newLevel;
    }

    return hashes[0];
  }

  calculateHash() {
    const data = JSON.stringify({
      version: this.version,
      prevHash: this.prevHash,
      timestamp: this.timestamp,
      difficultyTarget: this.difficultyTarget,
      nonce: this.nonce,
      merkleRoot: this.merkleRoot,
    });

    return crypto.createHash("sha256").update(data).digest("hex");
  }

  signBlock() {
    this.#signature = crypto.sign(
      "sha256",
      Buffer.from(this.blockHash),
      this.#privateKey,
    );
  }

  verifySignature() {
    return crypto.verify(
      "sha256",
      Buffer.from(this.blockHash),
      this.#publicKey,
      this.#signature,
    );
  }

  verifyBlock() {
    const currentHash = this.calculateHash();

    const currentMerkleRoot = this.calculateMerkleRoot();

    return (
      currentHash === this.blockHash &&
      currentMerkleRoot === this.merkleRoot &&
      this.verifySignature()
    );
  }

  toString() {
    return JSON.stringify({
      version: this.version,
      prevHash: this.prevHash,
      timestamp: this.timestamp,
      difficultyTarget: this.difficultyTarget,
      nonce: this.nonce,
      merkleRoot: this.merkleRoot,
      transactions: this.transactions.map((tx) => tx.toString()),
      blockHash: this.blockHash,
    });
  }

  get version() {
    return this.#version;
  }

  set version(value) {
    this.#version = value;
  }

  get prevHash() {
    return this.#prevHash;
  }

  set prevHash(value) {
    this.#prevHash = value;
  }

  get timestamp() {
    return this.#timestamp;
  }

  set timestamp(value) {
    this.#timestamp = value;
  }

  get difficultyTarget() {
    return this.#difficultyTarget;
  }

  set difficultyTarget(value) {
    this.#difficultyTarget = value;
  }

  get nonce() {
    return this.#nonce;
  }

  set nonce(value) {
    this.#nonce = value;
  }

  get merkleRoot() {
    return this.#merkleRoot;
  }

  set merkleRoot(value) {
    this.#merkleRoot = value;
  }

  get transactions() {
    return this.#transactions;
  }

  set transactions(value) {
    this.#transactions = value;
  }

  get blockHash() {
    return this.#blockHash;
  }

  set blockHash(value) {
    this.#blockHash = value;
  }

  get signature() {
    return this.#signature;
  }

  set signature(value) {
    this.#signature = value;
  }
}

export default Block;
