/**
 * 团团 5×5 拼图数独 · 核心逻辑
 * 5 是质数，切不出整齐的小方格，所以"宫"是 5 块形状各异的拼图块（每块 5 格）。
 * 盘面很小，布局和解都在页面里现场随机生成。
 * 可在浏览器（script）和 Node（vm / 测试）里共用。
 */
(function (root) {
  "use strict";

  var N = 5;
  var CELLS = N * N;

  function idx(r, c) {
    return r * N + c;
  }

  function rc(i) {
    return [Math.floor(i / N), i % N];
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function neighbors(i) {
    var p = rc(i);
    var r = p[0];
    var c = p[1];
    var out = [];
    if (r > 0) out.push(i - N);
    if (r < N - 1) out.push(i + N);
    if (c > 0) out.push(i - 1);
    if (c < N - 1) out.push(i + 1);
    return out;
  }

  function isConnected(cells) {
    if (!cells.length) return true;
    var set = {};
    for (var i = 0; i < cells.length; i++) set[cells[i]] = true;
    var seen = {};
    seen[cells[0]] = true;
    var stack = [cells[0]];
    var count = 1;
    while (stack.length) {
      var x = stack.pop();
      var nb = neighbors(x);
      for (var k = 0; k < nb.length; k++) {
        var y = nb[k];
        if (set[y] && !seen[y]) {
          seen[y] = true;
          count += 1;
          stack.push(y);
        }
      }
    }
    return count === cells.length;
  }

  function cellsOf(regions, k) {
    var out = [];
    for (var i = 0; i < CELLS; i++) if (regions[i] === k) out.push(i);
    return out;
  }

  // 从"每行一块"出发，随机交换边界格子，保持每块 5 格且连通
  function generateRegions(iters) {
    iters = iters || 120;
    var reg = new Array(CELLS);
    for (var i = 0; i < CELLS; i++) reg[i] = Math.floor(i / N);
    for (var n = 0; n < iters; n++) {
      var x = Math.floor(Math.random() * CELLS);
      var a = reg[x];
      var nb = neighbors(x).filter(function (y) {
        return reg[y] !== a;
      });
      if (!nb.length) continue;
      var b = reg[nb[Math.floor(Math.random() * nb.length)]];
      var cand = [];
      for (var z = 0; z < CELLS; z++) {
        if (reg[z] !== b) continue;
        var touchesA = neighbors(z).some(function (w) {
          return reg[w] === a;
        });
        if (touchesA) cand.push(z);
      }
      if (!cand.length) continue;
      var zz = cand[Math.floor(Math.random() * cand.length)];
      reg[x] = b;
      reg[zz] = a;
      if (!isConnected(cellsOf(reg, a)) || !isConnected(cellsOf(reg, b))) {
        reg[x] = a;
        reg[zz] = b;
      }
    }
    return reg;
  }

  function usedMask(board, regions, pos) {
    var p = rc(pos);
    var r = p[0];
    var c = p[1];
    var mask = 0;
    for (var k = 0; k < N; k++) {
      var a = board[idx(r, k)];
      var b = board[idx(k, c)];
      if (a) mask |= 1 << a;
      if (b) mask |= 1 << b;
    }
    var reg = regions[pos];
    for (var i = 0; i < CELLS; i++) {
      if (regions[i] === reg && board[i]) mask |= 1 << board[i];
    }
    return mask;
  }

  function isValidPlace(board, regions, pos, val) {
    if (!val) return true;
    var saved = board[pos];
    board[pos] = 0;
    var ok = !(usedMask(board, regions, pos) & (1 << val));
    board[pos] = saved;
    return ok;
  }

  function isLegalBoard(board, regions) {
    for (var i = 0; i < CELLS; i++) {
      if (board[i] && !isValidPlace(board, regions, i, board[i])) return false;
    }
    return true;
  }

  function candidates(board, regions, pos) {
    if (board[pos]) return [];
    var mask = usedMask(board, regions, pos);
    var out = [];
    for (var v = 1; v <= N; v++) if (!(mask & (1 << v))) out.push(v);
    return out;
  }

  // MRV 回溯；randomize=true 时随机试值（用来出随机解），否则用来数解个数
  function search(board, regions, limit, randomize) {
    var count = 0;
    var b = board.slice();
    var found = null;

    function dfs() {
      if (count >= limit) return;
      var best = -1;
      var bestOpts = null;
      for (var i = 0; i < CELLS; i++) {
        if (b[i]) continue;
        var opts = candidates(b, regions, i);
        if (opts.length === 0) return;
        if (best === -1 || opts.length < bestOpts.length) {
          best = i;
          bestOpts = opts;
          if (opts.length === 1) break;
        }
      }
      if (best === -1) {
        count += 1;
        if (!found) found = b.slice();
        return;
      }
      var order = randomize ? shuffle(bestOpts) : bestOpts;
      for (var j = 0; j < order.length; j++) {
        b[best] = order[j];
        dfs();
        b[best] = 0;
        if (count >= limit) return;
      }
    }
    dfs();
    return { count: count, solution: found };
  }

  function countSolutions(board, regions, limit) {
    return search(board, regions, limit || 2, false).count;
  }

  function generateSolved(regions) {
    var empty = new Array(CELLS).fill(0);
    return search(empty, regions, 1, true).solution;
  }

  // 有些随机拼图布局填不出 Latin square，多试几次
  function pickBase() {
    for (var t = 0; t < 40; t++) {
      var regions = generateRegions();
      var solution = generateSolved(regions);
      if (solution) return { regions: regions, solution: solution };
    }
    // 兜底：每行一块一定可解
    var rows = new Array(CELLS);
    for (var i = 0; i < CELLS; i++) rows[i] = Math.floor(i / N);
    return { regions: rows, solution: generateSolved(rows) };
  }

  function digHoles(solution, regions, emptyTarget) {
    var puzzle = solution.slice();
    var order = shuffle(
      Array.from({ length: CELLS }, function (_, i) {
        return i;
      })
    );
    var removed = 0;
    for (var n = 0; n < order.length && removed < emptyTarget; n++) {
      var i = order[n];
      var backup = puzzle[i];
      puzzle[i] = 0;
      if (countSolutions(puzzle, regions, 2) !== 1) {
        puzzle[i] = backup;
        continue;
      }
      removed += 1;
    }
    return { puzzle: puzzle, emptied: removed };
  }

  var DIFFICULTIES = {
    starter: { empty: 5, label: "启蒙", hint: "只空 5 格，每块拼图缺一个" },
    easy: { empty: 9, label: "轻松", hint: "空 9 格，看行、看列、看拼图块" },
    smart: { empty: 13, label: "聪明", hint: "空 13 格，团团自己想一想" },
  };

  function newPuzzle(level) {
    var spec = DIFFICULTIES[level] || DIFFICULTIES.starter;
    var base = pickBase();
    var dug = digHoles(base.solution, base.regions, spec.empty);
    return {
      level: DIFFICULTIES[level] ? level : "starter",
      regions: base.regions,
      solution: base.solution,
      puzzle: dug.puzzle,
      emptied: dug.emptied,
    };
  }

  function regionEdges(regions, i) {
    var p = rc(i);
    var r = p[0];
    var c = p[1];
    var me = regions[i];
    return {
      top: r === 0 || regions[idx(r - 1, c)] !== me,
      bottom: r === N - 1 || regions[idx(r + 1, c)] !== me,
      left: c === 0 || regions[idx(r, c - 1)] !== me,
      right: c === N - 1 || regions[idx(r, c + 1)] !== me,
    };
  }

  function remainingCounts(grid) {
    var counts = new Array(N + 1).fill(0);
    for (var i = 0; i < grid.length; i++) if (grid[i]) counts[grid[i]] += 1;
    var left = [0];
    for (var v = 1; v <= N; v++) left.push(N - counts[v]);
    return left;
  }

  function emptyCount(grid) {
    var n = 0;
    for (var i = 0; i < grid.length; i++) if (!grid[i]) n += 1;
    return n;
  }

  function isSolved(grid, solution) {
    for (var i = 0; i < grid.length; i++) if (grid[i] !== solution[i]) return false;
    return true;
  }

  var api = {
    SIZE: N,
    CELLS: CELLS,
    DIFFICULTIES: DIFFICULTIES,
    idx: idx,
    rc: rc,
    shuffle: shuffle,
    isConnected: isConnected,
    cellsOf: cellsOf,
    generateRegions: generateRegions,
    generateSolved: generateSolved,
    pickBase: pickBase,
    isValidPlace: isValidPlace,
    isLegalBoard: isLegalBoard,
    candidates: candidates,
    countSolutions: countSolutions,
    digHoles: digHoles,
    newPuzzle: newPuzzle,
    regionEdges: regionEdges,
    remainingCounts: remainingCounts,
    emptyCount: emptyCount,
    isSolved: isSolved,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.TuantuanSudoku5 = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
