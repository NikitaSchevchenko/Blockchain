import net from "node:net";
import Blockchain from "./blockchain.js";
import Block from "./block.js";
import Transaction from "./transaction.js";

class Node {
  #port;
  #peers;
  #blockchain;
  #sockets;

  constructor(port, difficulty = 3) {
    this.#port = port;
    this.#peers = new Set();
    this.#sockets = [];
    this.#blockchain = new Blockchain(difficulty);
  }

  startServer() {
    const server = net.createServer((socket) => {
      this.#initConnection(socket);
    });

    server.listen(this.#port, () => {
      console.log(`[NODE ${this.#port}] Запущено сервер на порті ${this.#port}`);
    });
  }

  connectToPeer(remotePort) {
    if (remotePort === this.#port || this.#peers.has(remotePort)) {
      return;
    }

    const socket = net.connect({ port: remotePort }, () => {
      console.log(`[NODE ${this.#port}] Підключилися до сусіда на порті ${remotePort}`);
      this.#peers.add(remotePort);
      this.#initConnection(socket);
    });

    socket.on("error", (err) => {
      console.log(`[NODE ${this.#port}] Не вдалося підключитися до ${remotePort}: ${err.message}`);
    });
  }

  #initConnection(socket) {
    this.#sockets.push(socket);
    let buffer = "";

    socket.on("data", (data) => {
      buffer += data.toString();
      const messages = buffer.split("\n");
      buffer = messages.pop();

      for (const msg of messages) {
        if (msg.trim().length > 0) {
          try {
            const parsed = JSON.parse(msg);
            this.#handleMessage(parsed);
          } catch (e) {
            console.error(`[NODE ${this.#port}] Помилка парсингу повідомлення:`, e.message);
          }
        }
      }
    });

    socket.on("close", () => {
      this.#sockets = this.#sockets.filter((s) => s !== socket);
    });
  }

  broadcast(type, payload) {
    const data = JSON.stringify({ type, payload }) + "\n";
    for (const socket of this.#sockets) {
      socket.write(data);
    }
  }

  #handleMessage(message) {
    switch (message.type) {
      case "NEW_TRANSACTION": {
        console.log(`[NODE ${this.#port}] Отримано нову транзакцію через мережу`);
        const tx = Transaction.fromJSON(message.payload);
        this.#blockchain.addTransactionToMempool(tx);
        break;
      }

      case "NEW_BLOCK": {
        console.log(`[NODE ${this.#port}] Отримано новий блок від сусіднього майнера!`);
        const block = Block.fromJSON(message.payload);
        const added = this.#blockchain.addBlock(block);

        if (added) {
          console.log(`[NODE ${this.#port}] Блок успішно підтверджено та додано до локального ланцюга!`);
        } else {
          console.log(`[NODE ${this.#port}] Відхилено блок від сусіда (не валідний).`);
        }
        break;
      }

      default:
        console.log(`[NODE ${this.#port}] Невідомий тип повідомлення: ${message.type}`);
    }
  }

  mineBlock() {
    const transactions = this.#blockchain.getTransactionsForBlock(5);
    const prevBlock = this.#blockchain.getLatestBlock();

    console.log(`[NODE ${this.#port}] Починаємо майнінг блоку з ${transactions.length} транзакціями...`);

    const newBlock = new Block(
      1,
      prevBlock.blockHash,
      transactions,
      this.#blockchain.difficulty
    );

    newBlock.mine();
    this.#blockchain.addBlock(newBlock);

    this.broadcast("NEW_BLOCK", {
      version: newBlock.version,
      prevHash: newBlock.prevHash,
      timestamp: newBlock.timestamp,
      difficultyTarget: newBlock.difficultyTarget,
      nonce: newBlock.nonce,
      merkleRoot: newBlock.merkleRoot,
      blockHash: newBlock.blockHash,
      signature: newBlock.getSignatureHex(),
      publicKey: newBlock.getPublicKeyPem(),
      transactions: newBlock.transactions.map((tx) => tx.toString()),
    });
  }

  createTransaction(input, output, amount) {
    const tx = new Transaction(input, output, amount);
    this.#blockchain.addTransactionToMempool(tx);

    this.broadcast("NEW_TRANSACTION", {
      input: tx.input,
      output: tx.output,
      amount: tx.amount,
      txTimestamp: tx.txTimestamp,
      txHash: tx.txHash,
      publicKey: tx.getPublicKeyPem(),
      signature: tx.getSignatureHex(),
    });
  }

  get blockchain() {
    return this.#blockchain;
  }

  get port() {
    return this.#port;
  }
}

export default Node;