/**
 * 团团简易 9×9 数独 · 核心逻辑
 * 可在浏览器（script）和 Node（require / 测试）里共用。
 */
(function (root) {
  "use strict";

  var SIZE = 9;
  var BOX = 3;

  function idx(r, c) {
    return r * SIZE + c;
  }

  function rc(i) {
    return [Math.floor(i / SIZE), i % SIZE];
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function bandPattern(r, c) {
    // 标准拉丁带：保证行、列、宫都不重复
    return (BOX * (r % BOX) + Math.floor(r / BOX) + c) % SIZE;
  }

  function generateSolved() {
    var bands = shuffle([
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
    ]);
    var rows = [];
    for (var b = 0; b < bands.length; b++) {
      var band = shuffle(bands[b]);
      for (var i = 0; i < band.length; i++) rows.push(band[i]);
    }

    var stacks = shuffle([
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
    ]);
    var cols = [];
    for (var s = 0; s < stacks.length; s++) {
      var stack = shuffle(stacks[s]);
      for (var k = 0; k < stack.length; k++) cols.push(stack[k]);
    }

    var digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    var board = new Array(SIZE * SIZE);
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        board[idx(r, c)] = digits[bandPattern(rows[r], cols[c])];
      }
    }
    return board;
  }

  function usedInRow(board, r, val) {
    for (var c = 0; c < SIZE; c++) {
      if (board[idx(r, c)] === val) return true;
    }
    return false;
  }

  function usedInCol(board, c, val) {
    for (var r = 0; r < SIZE; r++) {
      if (board[idx(r, c)] === val) return true;
    }
    return false;
  }

  function usedInBox(board, r, c, val) {
    var r0 = Math.floor(r / BOX) * BOX;
    var c0 = Math.floor(c / BOX) * BOX;
    for (var i = 0; i < BOX; i++) {
      for (var j = 0; j < BOX; j++) {
        if (board[idx(r0 + i, c0 + j)] === val) return true;
      }
    }
    return false;
  }

  function isValidPlace(board, pos, val) {
    if (!val) return true;
    var pair = rc(pos);
    var r = pair[0];
    var c = pair[1];
    var saved = board[pos];
    board[pos] = 0;
    var ok =
      !usedInRow(board, r, val) &&
      !usedInCol(board, c, val) &&
      !usedInBox(board, r, c, val);
    board[pos] = saved;
    return ok;
  }

  function isLegalBoard(board) {
    for (var i = 0; i < board.length; i++) {
      var v = board[i];
      if (!v) continue;
      if (!isValidPlace(board, i, v)) return false;
    }
    return true;
  }

  function candidates(board, pos) {
    if (board[pos]) return [];
    var out = [];
    for (var v = 1; v <= SIZE; v++) {
      if (isValidPlace(board, pos, v)) out.push(v);
    }
    return out;
  }

  function countSolutions(board, limit) {
    limit = limit || 2;
    var count = 0;
    function dfs(b) {
      if (count >= limit) return;
      var empty = -1;
      var bestLen = 10;
      for (var i = 0; i < b.length; i++) {
        if (b[i] === 0) {
          var opts = candidates(b, i);
          if (opts.length < bestLen) {
            bestLen = opts.length;
            empty = i;
            if (bestLen === 0) return;
            if (bestLen === 1) break;
          }
        }
      }
      if (empty === -1) {
        count += 1;
        return;
      }
      var choices = candidates(b, empty);
      for (var j = 0; j < choices.length; j++) {
        b[empty] = choices[j];
        dfs(b);
        b[empty] = 0;
        if (count >= limit) return;
      }
    }
    dfs(board.slice());
    return count;
  }

  function digHoles(solution, emptyTarget) {
    var puzzle = solution.slice();
    var order = shuffle(
      Array.from({ length: SIZE * SIZE }, function (_, i) {
        return i;
      })
    );
    var removed = 0;
    for (var n = 0; n < order.length; n++) {
      if (removed >= emptyTarget) break;
      var i = order[n];
      var backup = puzzle[i];
      puzzle[i] = 0;
      if (countSolutions(puzzle, 2) !== 1) {
        puzzle[i] = backup;
        continue;
      }
      removed += 1;
    }
    return { puzzle: puzzle, emptied: removed };
  }

  var DIFFICULTIES = {
    starter: { empty: 9, label: "启蒙", hint: "只空 9 格，每宫大约一个" },
    easy: { empty: 18, label: "轻松", hint: "空 18 格，慢慢看行列" },
    smart: { empty: 27, label: "聪明", hint: "空 27 格，爸妈可以陪着玩" },
  };

  function newPuzzle(level) {
    var spec = DIFFICULTIES[level] || DIFFICULTIES.starter;
    var solution = generateSolved();
    var dug = digHoles(solution, spec.empty);
    return {
      level: DIFFICULTIES[level] ? level : "starter",
      solution: solution,
      puzzle: dug.puzzle,
      emptied: dug.emptied,
    };
  }

  function remainingCounts(grid) {
    var counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (var i = 0; i < grid.length; i++) {
      if (grid[i]) counts[grid[i]] += 1;
    }
    var left = [0];
    for (var v = 1; v <= SIZE; v++) left.push(SIZE - counts[v]);
    return left;
  }

  function emptyCount(grid) {
    var n = 0;
    for (var i = 0; i < grid.length; i++) if (!grid[i]) n += 1;
    return n;
  }

  function isSolved(grid, solution) {
    for (var i = 0; i < grid.length; i++) {
      if (grid[i] !== solution[i]) return false;
    }
    return true;
  }

  var api = {
    SIZE: SIZE,
    BOX: BOX,
    DIFFICULTIES: DIFFICULTIES,
    idx: idx,
    rc: rc,
    shuffle: shuffle,
    generateSolved: generateSolved,
    isValidPlace: isValidPlace,
    isLegalBoard: isLegalBoard,
    candidates: candidates,
    countSolutions: countSolutions,
    digHoles: digHoles,
    newPuzzle: newPuzzle,
    remainingCounts: remainingCounts,
    emptyCount: emptyCount,
    isSolved: isSolved,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.TuantuanSudoku = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
