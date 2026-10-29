import { performance } from "node:perf_hooks";
import Transaction from "./transaction.js";
import Block from "./block.js";
import Blockchain from "./blockchain.js";
import Node from "./node.js";

// ===== Створення транзакцій =====

// const tx1 = new Transaction("Alice", "Bob", 100);
// const tx2 = new Transaction("Bob", "Charlie", 50);
// const tx3 = new Transaction("Charlie", "David", 25);
// const tx4 = new Transaction("David", "Alice", 10);


// // ===== Перевірка транзакцій =====
// console.log("===== TRANSACTIONS =====");
// console.log(tx1.toString());
// console.log("Transaction 1 hash:");
// console.log(tx1.verifyHash());
// console.log("Transaction 1 signature:");
// console.log(tx1.verifySignature());


// // ===== Створення блоків =====
// const block1 = new Block(
//   1,
//   "0000000000000000",
//   [tx1, tx2],
//   "0000"
// );

// const block2 = new Block(
//   1,
//   block1.blockHash,
//   [tx3, tx4],
//   "0000"
// );

// // ===== Перевірка блоків =====

// console.log("\n===== BLOCKS =====");

// console.log(block1.toString());
// console.log("Block 1 verification:");
// console.log(block1.verifyBlock());

// console.log(block2.toString());
// console.log("Block 2 verification:");
// console.log(block2.verifyBlock());


// // ===== Створення Blockchain =====

// const blockchain = new Blockchain();

// blockchain.addBlock(block1);
// blockchain.addBlock(block2);

// // ===== Перевірка Blockchain =====
// console.log("\n===== BLOCKCHAIN =====");

// console.log(blockchain.blocks.map((block) => block.toString()));

// console.log("Latest block:");
// console.log(blockchain.getLatestBlock().toString());

// console.log("Blockchain valid:");
// console.log(blockchain.isValid());
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatMs = (ms) => `${ms.toFixed(2)} мс`;

async function runNetworkSimulation() {
  console.log("==================================================");
  console.log("   ЗАПУСК ТЕСТОВОЇ P2P-МЕРЕЖІ ТА МАЙНІНГУ (PoW)   ");
  console.log("==================================================\n");

  const DIFFICULTY = 4;

  const initStart = performance.now();
  const nodeA = new Node(5001, DIFFICULTY);
  const nodeB = new Node(5002, DIFFICULTY);
  nodeA.startServer();
  nodeB.startServer();
  const initDuration = performance.now() - initStart;
  console.log(`[ЧАС] Створення нод та підйом серверів: ${formatMs(initDuration)}`);

  await sleep(300);

  console.log("\n--- ВСТАНОВЛЕННЯ P2P-ЗВ'ЯЗКУ ---");
  const connectStart = performance.now();
  nodeB.connectToPeer(5001);
  await sleep(300);
  const connectDuration = performance.now() - connectStart - 300;
  console.log(`[ЧАС] Встановлення TCP-з'єднання: ~${formatMs(Math.max(connectDuration, 0))}`);

  console.log("\n--- ГЕНЕРАЦІЯ ТРАНЗАКЦІЙ НА NODE 5001 ---");
  const txStart = performance.now();
  nodeA.createTransaction("Alice", "Bob", 50);
  nodeA.createTransaction("Bob", "Charlie", 25);

  while (nodeB.blockchain.mempool.length < 2) {
    await sleep(10);
  }
  const txDuration = performance.now() - txStart;
  console.log(`[ЧАС] Підпис і передача 2 транзакцій у Mempool сусідньої ноди: ${formatMs(txDuration)}`);

  console.log("\n--- ЗАПУСК МАЙНІНГУ НА NODE 5002 ---");
  const heightBefore = nodeA.blockchain.blocks.length;

  const mineStart = performance.now();
  nodeB.mineBlock();
  const mineDuration = performance.now() - mineStart;
  console.log(`[ЧАС] Чистий час майнінгу (обчислення PoW): ${formatMs(mineDuration)}`);

  const propagationStart = performance.now();
  while (nodeA.blockchain.blocks.length === heightBefore) {
    await sleep(5);
  }
  const propagationDuration = performance.now() - propagationStart;
  console.log(`[ЧАС] Доставка блоку по P2P, верифікація PoW та запис у Node 5001: ${formatMs(propagationDuration)}`);

  console.log("\n==================================================");
  console.log("             ПІДСУМКОВА СИНХРОНІЗАЦІЯ             ");
  console.log("==================================================");

  const blockA = nodeA.blockchain.getLatestBlock();
  const blockB = nodeB.blockchain.getLatestBlock();

  console.log(`Складність мережі:             ${DIFFICULTY} нулі`);
  console.log(`Підібраний Nonce:              ${blockB.nonce}`);
  console.log(`Хеш блоку:                     ${blockB.blockHash}`);
  console.log(`Ланцюги синхронізовані:        ${blockA.blockHash === blockB.blockHash}`);
  console.log(`Транзакцій у Mempool після:    Node 5001 (${nodeA.blockchain.mempool.length}), Node 5002 (${nodeB.blockchain.mempool.length})`);

  process.exit(0);
}

runNetworkSimulation().catch((err) => {
  console.error("Помилка:", err);
  process.exit(1);
});