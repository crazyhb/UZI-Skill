const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const sandbox = { module: { exports: {} }, exports: {}, console };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../sudoku11.js"), "utf8"), sandbox);
const S = sandbox.module.exports;
const N = S.SIZE;

function assertFullValid(board, regions, label) {
  assert.strictEqual(board.length, N * N, label + " 必须是 11×11");
  assert.ok(board.every((v) => v >= 1 && v <= N), label + " 格子必须是 1-11");
  assert.ok(S.isLegalBoard(board, regions), label + " 不能有重复");
}

function testLayouts() {
  assert.ok(S.LAYOUT_COUNT >= 6, "至少要有 6 个预生成布局");
  for (const base of S._layouts) {
    const regions = S.decode(base.layout);
    const sol = S.decode(base.solution).map((v) => v + 1);
    const sizes = new Array(N).fill(0);
    regions.forEach((k) => (sizes[k] += 1));
    assert.deepStrictEqual(Array.from(sizes), new Array(N).fill(N), "每块拼图 11 格");
    // 每块连通
    for (let k = 0; k < N; k++) {
      const cells = new Set(regions.map((r, i) => (r === k ? i : -1)).filter((i) => i >= 0));
      const start = cells.values().next().value;
      const seen = new Set([start]);
      const stack = [start];
      while (stack.length) {
        const x = stack.pop();
        const [r, c] = S.rc(x);
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nc < 0 || nr >= N || nc >= N) continue;
          const y = S.idx(nr, nc);
          if (cells.has(y) && !seen.has(y)) { seen.add(y); stack.push(y); }
        }
      }
      assert.strictEqual(seen.size, N, "拼图块 " + k + " 必须连通");
    }
    assertFullValid(sol, regions, "预生成解");
  }
}

function testSymmetryKeepsValidity() {
  for (let t = 0; t < 8; t++) {
    const base = S.pickBase();
    assertFullValid(base.solution, base.regions, "对称变换后的解");
    const sizes = new Array(N).fill(0);
    base.regions.forEach((k) => (sizes[k] += 1));
    assert.deepStrictEqual(Array.from(sizes), new Array(N).fill(N));
  }
}

function testNewPuzzleUniqueness() {
  for (const level of ["starter", "easy", "smart"]) {
    const t0 = Date.now();
    const p = S.newPuzzle(level);
    const dt = Date.now() - t0;
    assert.ok(S.isLegalBoard(p.puzzle, p.regions), level + " 题目合法");
    const empties = S.emptyCount(p.puzzle);
    assert.ok(empties > 0 && empties <= S.DIFFICULTIES[level].empty, level + " 空格数量");
    assert.strictEqual(S.countSolutions(p.puzzle, p.regions, 2), 1, level + " 必须唯一解");
    const filled = p.puzzle.map((v, i) => (v === 0 ? p.solution[i] : v));
    assert.ok(S.isSolved(filled, p.solution));
    assert.ok(dt < 4000, level + " 出题应在 4 秒内，实际 " + dt + "ms");
    console.log(`  ${level}: ${empties} 空格 · ${dt}ms`);
  }
}

function testCandidatesAndEdges() {
  const base = S.pickBase();
  const board = base.solution.slice();
  const keep = board[0];
  board[0] = 0;
  const opts = S.candidates(board, base.regions, 0);
  assert.deepStrictEqual(Array.from(opts), [keep], "只挖一格时候选就是原值");
  const e = S.regionEdges(base.regions, 0);
  assert.ok(e.top && e.left, "左上角外侧一定是边");
  assert.deepStrictEqual(Array.from(S.remainingCounts(new Array(N * N).fill(0)).slice(1)), new Array(N).fill(N));
}

testLayouts();
testSymmetryKeepsValidity();
testCandidatesAndEdges();
testNewPuzzleUniqueness();
console.log("ok · 团团 11×11 数独核心测试通过");
