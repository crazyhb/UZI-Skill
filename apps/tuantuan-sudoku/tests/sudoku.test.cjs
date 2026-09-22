const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const sandbox = {
  module: { exports: {} },
  exports: {},
  console,
};
vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "../sudoku.js"), "utf8"),
  sandbox
);
const S = sandbox.module.exports;

function assertSolvedUnique(board) {
  assert.strictEqual(board.length, 81, "棋盘必须是 9×9");
  assert.ok(board.every((v) => v >= 1 && v <= 9), "格子必须是 1-9");
  assert.ok(S.isLegalBoard(board), "终盘不能有重复");
  assert.strictEqual(S.countSolutions(board, 2), 1, "终盘应只有一个解");
}

function testGenerateSolved() {
  for (let i = 0; i < 8; i++) {
    assertSolvedUnique(S.generateSolved());
  }
}

function testNewPuzzleUniqueness() {
  for (const level of ["starter", "easy", "smart"]) {
    const p = S.newPuzzle(level);
    assert.ok(S.isLegalBoard(p.puzzle), level + " 题目本身合法");
    assert.ok(S.isLegalBoard(p.solution), level + " 答案合法");
    assert.ok(S.isSolved(p.solution, p.solution));
    const empties = S.emptyCount(p.puzzle);
    assert.ok(empties > 0, level + " 应有空格");
    assert.ok(
      empties <= S.DIFFICULTIES[level].empty,
      level + " 空格不应超过设定"
    );
    assert.strictEqual(S.countSolutions(p.puzzle, 2), 1, level + " 必须唯一解");
    // 把空格填回答案后应完全一致
    const filled = p.puzzle.map((v, i) => (v === 0 ? p.solution[i] : v));
    assert.ok(S.isSolved(filled, p.solution));
  }
}

function testCandidatesAndPlace() {
  const solved = S.generateSolved();
  const pos = 0;
  const keep = solved[pos];
  solved[pos] = 0;
  const opts = S.candidates(solved, pos);
  assert.ok(opts.includes(keep), "挖掉的格子至少应能填回原值");
  assert.ok(S.isValidPlace(solved, pos, keep));
  const bad = opts[0] === keep ? (keep % 9) + 1 : opts[0];
  // 随便找一个不在候选里的值
  let illegal = 0;
  for (let v = 1; v <= 9; v++) {
    if (!opts.includes(v)) {
      illegal = v;
      break;
    }
  }
  if (illegal) {
    assert.strictEqual(S.isValidPlace(solved, pos, illegal), false);
  }
  void bad;
}

function testRemainingCounts() {
  const empty = new Array(81).fill(0);
  const left = S.remainingCounts(empty);
  assert.deepStrictEqual(Array.from(left.slice(1)), [9, 9, 9, 9, 9, 9, 9, 9, 9]);
  const solved = S.generateSolved();
  assert.deepStrictEqual(Array.from(S.remainingCounts(solved).slice(1)), [
    0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);
}

function run() {
  testGenerateSolved();
  testCandidatesAndPlace();
  testRemainingCounts();
  testNewPuzzleUniqueness();
  console.log("ok · 团团数独核心测试通过");
}

run();
