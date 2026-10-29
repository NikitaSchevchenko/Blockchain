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

  constructor(input, output, amount, restoredData = null) {
    this.#input = input;
    this.#output = output;
    this.#amount = amount;

    if (restoredData) {
      // Відновлення транзакції, отриманої через сокет
      this.#txTimestamp = restoredData.txTimestamp;
      this.#txHash = restoredData.txHash;
      this.#publicKey = restoredData.publicKey;
      this.#signature = restoredData.signature;
      this.#privateKey = null;
    } else {
      // Створення абсолютно нової транзакції
      this.#txTimestamp = Date.now();
      this.#txHash = this.calculateHash();

      const keys = crypto.generateKeyPairSync("ec", {
        namedCurve: "secp256k1",
      });
      this.#privateKey = keys.privateKey;
      this.#publicKey = keys.publicKey;
      this.signTransaction();
    }
  }

  calculateHash() {
    const data = JSON.stringify({
      input: this.#input,
      output: this.#output,
      amount: this.#amount,
      txTimestamp: this.#txTimestamp,
    });

    return crypto.createHash("sha256").update(data).digest("hex");
  }

  verifyHash() {
    return this.calculateHash() === this.#txHash;
  }

  signTransaction() {
    if (!this.#privateKey) return;
    this.#signature = crypto.sign(
      "sha256",
      Buffer.from(this.#txHash),
      this.#privateKey,
    );
  }

  verifySignature() {
    if (!this.#signature || !this.#publicKey) return false;

    try {
      const key =
        typeof this.#publicKey === "string"
          ? crypto.createPublicKey(this.#publicKey)
          : this.#publicKey;

      const sigBuffer = Buffer.isBuffer(this.#signature)
        ? this.#signature
        : Buffer.from(this.#signature, "hex");

      return crypto.verify("sha256", Buffer.from(this.#txHash), key, sigBuffer);
    } catch {
      return false;
    }
  }

  getPublicKeyPem() {
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
    return new Transaction(data.input, data.output, data.amount, {
      txTimestamp: data.txTimestamp,
      txHash: data.txHash,
      publicKey: data.publicKey,
      signature: data.signature,
    });
  }

  toString() {
    return JSON.stringify({
      input: this.#input,
      output: this.#output,
      amount: this.#amount,
      txTimestamp: this.#txTimestamp,
      txHash: this.#txHash,
      publicKey: this.getPublicKeyPem(),
      signature: this.getSignatureHex(),
    });
  }

  get input() { return this.#input; }
  get output() { return this.#output; }
  get amount() { return this.#amount; }
  get txTimestamp() { return this.#txTimestamp; }
  get txHash() { return this.#txHash; }
  get signature() { return this.#signature; }
  get publicKey() { return this.#publicKey; }
}

export default Transaction;