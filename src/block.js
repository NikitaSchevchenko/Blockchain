import crypto from "node:crypto";
import Transaction from "./transaction.js";

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

  constructor(version, prevHash, transactions, difficultyTarget = 4, restoredData = null) {
    this.#version = version;
    this.#prevHash = prevHash;
    this.#transactions = transactions;
    this.#difficultyTarget = difficultyTarget;

    if (restoredData) {
      // Відновлення блоку, отриманого по мережі
      this.#timestamp = restoredData.timestamp;
      this.#nonce = restoredData.nonce;
      this.#merkleRoot = restoredData.merkleRoot;
      this.#blockHash = restoredData.blockHash;
      this.#signature = restoredData.signature;
      this.#publicKey = restoredData.publicKey;
      this.#privateKey = null;
    } else {
      // Створення нового блоку для майнінгу
      this.#timestamp = Date.now();
      this.#nonce = 0;
      this.#merkleRoot = this.calculateMerkleRoot();
      this.#blockHash = "";

      const keys = crypto.generateKeyPairSync("ec", {
        namedCurve: "secp256k1",
      });
      this.#privateKey = keys.privateKey;
      this.#publicKey = keys.publicKey;
    }
  }

  calculateHashPair(hash1, hash2) {
    return crypto
      .createHash("sha256")
      .update(hash1 + hash2)
      .digest("hex");
  }

  calculateMerkleRoot() {
    let hashes = this.#transactions.map((tx) => tx.txHash);

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
      version: this.#version,
      prevHash: this.#prevHash,
      timestamp: this.#timestamp,
      difficultyTarget: this.#difficultyTarget,
      nonce: this.#nonce,
      merkleRoot: this.#merkleRoot,
    });

    return crypto.createHash("sha256").update(data).digest("hex");
  }

  mine() {
    const targetPrefix = "0".repeat(this.#difficultyTarget);
    console.log(`[MINING] Пошук хешу зі складністю ${this.#difficultyTarget} нулів...`);
    const startTime = Date.now();

    while (true) {
      this.#blockHash = this.calculateHash();
      if (this.#blockHash.startsWith(targetPrefix)) {
        break;
      }
      this.#nonce++;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `[MINED] Блок знайдено!\n` +
      `  Хеш:   ${this.#blockHash}\n` +
      `  Nonce: ${this.#nonce}\n` +
      `  Час:   ${duration} сек.`
    );

    this.signBlock();
  }

  signBlock() {
    if (!this.#privateKey) return;
    this.#signature = crypto.sign(
      "sha256",
      Buffer.from(this.#blockHash),
      this.#privateKey,
    );
  }

  verifySignature() {
    if (!this.#signature || !this.#blockHash || !this.#publicKey) {
      return false;
    }

    try {
      const key =
        typeof this.#publicKey === "string"
          ? crypto.createPublicKey(this.#publicKey)
          : this.#publicKey;

      const sigBuffer = Buffer.isBuffer(this.#signature)
        ? this.#signature
        : Buffer.from(this.#signature, "hex");

      return crypto.verify(
        "sha256",
        Buffer.from(this.#blockHash),
        key,
        sigBuffer,
      );
    } catch {
      return false;
    }
  }

  verifyBlock() {
    const currentHash = this.calculateHash();
    const currentMerkleRoot = this.calculateMerkleRoot();
    const targetPrefix = "0".repeat(this.#difficultyTarget);

    const isHashValid = currentHash === this.#blockHash;
    const isDifficultySatisfied = this.#blockHash.startsWith(targetPrefix);
    const isMerkleRootValid = currentMerkleRoot === this.#merkleRoot;
    const isSignatureValid = this.verifySignature();

    return (
      isHashValid &&
      isDifficultySatisfied &&
      isMerkleRootValid &&
      isSignatureValid
    );
  }

  getPublicKeyPem() {
    if (!this.#publicKey) return "";
    if (typeof this.#publicKey === "string") return this.#publicKey;
    return this.#publicKey.export({ type: "spki", format: "pem" });
  }

  getSignatureHex() {
    if (!this.#signature) return "";
    return Buffer.isBuffer(this.#signature)
      ? this.#signature.toString("hex")
      : this.#signature;
  }

  static fromJSON(data) {
    const txs = data.transactions.map((t) =>
      typeof t === "string" ? Transaction.fromJSON(JSON.parse(t)) : Transaction.fromJSON(t)
    );

    return new Block(
      data.version,
      data.prevHash,
      txs,
      data.difficultyTarget,
      {
        timestamp: data.timestamp,
        nonce: data.nonce,
        merkleRoot: data.merkleRoot,
        blockHash: data.blockHash,
        signature: data.signature,
        publicKey: data.publicKey,
      }
    );
  }

  toString() {
    return JSON.stringify({
      version: this.#version,
      prevHash: this.#prevHash,
      timestamp: this.#timestamp,
      difficultyTarget: this.#difficultyTarget,
      nonce: this.#nonce,
      merkleRoot: this.#merkleRoot,
      transactions: this.#transactions.map((tx) => tx.toString()),
      blockHash: this.#blockHash,
      signature: this.getSignatureHex(),
      publicKey: this.getPublicKeyPem(),
    });
  }

  get version() { return this.#version; }
  get prevHash() { return this.#prevHash; }
  get timestamp() { return this.#timestamp; }
  get difficultyTarget() { return this.#difficultyTarget; }
  get nonce() { return this.#nonce; }
  get merkleRoot() { return this.#merkleRoot; }
  get transactions() { return this.#transactions; }
  get blockHash() { return this.#blockHash; }
  get signature() { return this.#signature; }
  get publicKey() { return this.#publicKey; }
}

export default Block;