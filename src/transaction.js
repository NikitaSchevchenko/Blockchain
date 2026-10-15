import crypto from "node:crypto";

class Transaction {
  #input;
  #output;
  #amount;
  #txTimestamp;
  #txHash;
  #privateKey;
  #publicKey;
  #signature;

  constructor(input, output, amount) {
    this.input = input;
    this.output = output;
    this.amount = amount;
    this.txTimestamp = Date.now();
    this.txHash = this.calculateHash();

    const keys = crypto.generateKeyPairSync("ec", {
      namedCurve: "secp256k1",
    });
    this.#privateKey = keys.privateKey;
    this.#publicKey = keys.publicKey;
    this.signTransaction();
  }

  calculateHash() {
    const data = JSON.stringify({
      input: this.input,
      output: this.output,
      amount: this.amount,
      txTimestamp: this.txTimestamp,
    });

    const hash = crypto.createHash("sha256");
    hash.update(data);
    const res = hash.digest("hex");
    return res;
  }

  verifyHash() {
    const currentHash = this.calculateHash();
    return currentHash === this.txHash;
  }

  signTransaction() {
    this.#signature = crypto.sign(
      "sha256",
      Buffer.from(this.txHash),
      this.#privateKey,
    );
  }

  verifySignature() {
    return crypto.verify(
      "sha256",
      Buffer.from(this.txHash),
      this.#publicKey,
      this.#signature,
    );
  }

  toString() {
    return JSON.stringify({
      input: this.input,
      output: this.output,
      amount: this.amount,
      txTimestamp: this.txTimestamp,
      txHash: this.txHash,
    });
  }

  get input() {
    return this.#input;
  }

  set input(value) {
    this.#input = value;
  }

  get output() {
    return this.#output;
  }

  set output(value) {
    this.#output = value;
  }

  get amount() {
    return this.#amount;
  }

  set amount(value) {
    this.#amount = value;
  }

  get txTimestamp() {
    return this.#txTimestamp;
  }

  set txTimestamp(value) {
    this.#txTimestamp = value;
  }

  get txHash() {
    return this.#txHash;
  }

  set txHash(value) {
    this.#txHash = value;
  }

  get publicKey() {
    return this.#publicKey;
  }
}

export default Transaction;
