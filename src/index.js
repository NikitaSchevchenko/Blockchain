import Transaction from "./transaction.js";
import Block from "./block.js";
import Blockchain from "./blockchain.js";


// ===== Створення транзакцій =====

const tx1 = new Transaction("Alice", "Bob", 100);
const tx2 = new Transaction("Bob", "Charlie", 50);
const tx3 = new Transaction("Charlie", "David", 25);
const tx4 = new Transaction("David", "Alice", 10);


// ===== Перевірка транзакцій =====
console.log("===== TRANSACTIONS =====");
console.log(tx1.toString());
console.log("Transaction 1 hash:");
console.log(tx1.verifyHash());
console.log("Transaction 1 signature:");
console.log(tx1.verifySignature());


// ===== Створення блоків =====
const block1 = new Block(
  1,
  "0000000000000000",
  [tx1, tx2],
  "0000"
);

const block2 = new Block(
  1,
  block1.blockHash,
  [tx3, tx4],
  "0000"
);

// ===== Перевірка блоків =====

console.log("\n===== BLOCKS =====");

console.log(block1.toString());
console.log("Block 1 verification:");
console.log(block1.verifyBlock());

console.log(block2.toString());
console.log("Block 2 verification:");
console.log(block2.verifyBlock());


// ===== Створення Blockchain =====

const blockchain = new Blockchain();

blockchain.addBlock(block1);
blockchain.addBlock(block2);

// ===== Перевірка Blockchain =====
console.log("\n===== BLOCKCHAIN =====");

console.log(blockchain.blocks.map((block) => block.toString()));

console.log("Latest block:");
console.log(blockchain.getLatestBlock().toString());

console.log("Blockchain valid:");
console.log(blockchain.isValid());