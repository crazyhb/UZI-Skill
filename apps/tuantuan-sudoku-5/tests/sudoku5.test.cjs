const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const sandbox = { module: { exports: {} }, exports: {}, console };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../sudoku5.js"), "utf8"), sandbox);
const S = sandbox.module.exports;
const N = S.SIZE;

function assertRegions(regions) {
  const sizes = new Array(N).fill(0);
  regions.forEach((k) => (sizes[k] += 1));
  assert.deepStrictEqual(Array.from(sizes), new Array(N).fill(N), "每块拼图 5 格");
  for (let k = 0; k < N; k++) assert.ok(S.isConnected(S.cellsOf(regions, k)), "拼图块 " + k + " 必须连通");
}

function testRegions() {
  let irregular = 0;
  for (let t = 0; t < 30; t++) {
    const reg = S.generateRegions();
    assertRegions(reg);
    if (reg.some((k, i) => k !== Math.floor(i / N))) irregular += 1;
  }
  assert.ok(irregular >= 25, "大多数布局应该不是简单的一行一块，实际 " + irregular + "/30");
}

function testBaseValid() {
  for (let t = 0; t < 20; t++) {
    const base = S.pickBase();
    assertRegions(base.regions);
    assert.ok(base.solution.every((v) => v >= 1 && v <= N));
    assert.ok(S.isLegalBoard(base.solution, base.regions), "完整解不能有重复");
  }
}

function testNewPuzzleUniqueness() {
  for (const level of ["starter", "easy", "smart"]) {
    let total = 0;
    for (let t = 0; t < 10; t++) {
      const t0 = Date.now();
      const p = S.newPuzzle(level);
      total += Date.now() - t0;
      assert.ok(S.isLegalBoard(p.puzzle, p.regions), level + " 题目合法");
      const empties = S.emptyCount(p.puzzle);
      assert.ok(empties > 0 && empties <= S.DIFFICULTIES[level].empty, level + " 空格数量 " + empties);
      assert.strictEqual(S.countSolutions(p.puzzle, p.regions, 2), 1, level + " 必须唯一解");
      const filled = p.puzzle.map((v, i) => (v === 0 ? p.solution[i] : v));
      assert.ok(S.isSolved(filled, p.solution));
    }
    assert.ok(total / 10 < 300, level + " 平均出题应在 300ms 内，实际 " + total / 10 + "ms");
    console.log(`  ${level}: 平均 ${(total / 10).toFixed(1)}ms`);
  }
}

function testHelpers() {
  const base = S.pickBase();
  const board = base.solution.slice();
  const keep = board[0];
  board[0] = 0;
  assert.deepStrictEqual(Array.from(S.candidates(board, base.regions, 0)), [keep]);
  assert.ok(S.regionEdges(base.regions, 0).top && S.regionEdges(base.regions, 0).left);
  assert.deepStrictEqual(Array.from(S.remainingCounts(new Array(N * N).fill(0)).slice(1)), [5, 5, 5, 5, 5]);
}

testRegions();
testBaseValid();
testHelpers();
testNewPuzzleUniqueness();
console.log("ok · 团团 5×5 数独核心测试通过");
