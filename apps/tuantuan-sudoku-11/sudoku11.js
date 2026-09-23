/**
 * 团团 11×11 拼图数独 · 核心逻辑
 * 11 是质数，切不出整齐的小方格，所以"宫"改成 11 块形状各异的拼图块（每块 11 格）。
 * 规则：同一行、同一列、同一块拼图里，图案都不能重复。
 * 可在浏览器（script）和 Node（vm / 测试）里共用。
 */
(function (root) {
  "use strict";

  var N = 11;
  var CELLS = N * N;
  var ALPH = "0123456789a";

  // 离线预生成的拼图布局 + 一个完整解（见 tools/gen11.py）。
  // 运行时再做对称变换 + 图案重新编号，题目变化足够多。
  var LAYOUTS = [
    { layout: "0000000001122020333331222244313112642443111926424333119864445555998646677759986666a755598aa6aa775598aaaaaa759988888877779", solution: "1768052a43964973a182053851906472aa24958306712a30645981740a21987356817342a659059867102a439325a741068750486931a2061a2375984" },
    { layout: "111100000001311100222213333002622155334226661533342266655535444468575554886687777744886897777944888979999aaa8a9999aaaaaaa", solution: "0439682a1577056a4912831a628037945250173694a8819435a072632859a7601469a74283501a748291563093105648a724673015289a582a1704369" },
    { layout: "50000000114530202011145302221111453323221144533332244445556332949466569999997655699877976666688877788888887777aaaaaaaaaaa", solution: "51947a068234a873025619985a62403717418253a96015360492a87860297135a430a91867245a3215984706674581a90320273465819a2960a371458" },
    { layout: "000000111110003332211100337221121533372222245333777244455555744464857777644668555876646a8888886666a898999999aa9999aaaaaaa", solution: "a512403769876835a1942093786425a010421a5687391069785a3424895327601a270493a185682a60194573694a1703285513086429a73a572980164" },
    { layout: "000000111113002005114130222254441333325546413222254464132555557646335777776463777788766688888888aa699999998aa69999aaaaaaa", solution: "a58320697415146970832a260a7134895981452736a074983a1056202514986a733a69084215763a714952088072635a914472586a10391930a527486" },
    { layout: "000041111112060441113122600433331226004333352660444335526664744555226777755958267777559982687a7999988888aaaaa9888aaaaa999", solution: "63072984a5184615a2709359a281034767095a3182643249086a5172510764938a413890756a2167a42509389a841536720a7236491805085637a2149" },
    { layout: "300000222223330100000231111111222333444411253744644412537746455555376666666597777766555977aaaaa9999aaaa8889899aa888888899", solution: "0182936754a132a850476986a9547023179516a423084a3709251866710283a954a0451693872389647a10255263a01849794783256a10250471896a3" },
    { layout: "11122220000331221220403311112244033155125400333355554007355554444876666666648766776998487777999988877999998888aaaaaaaaaaa", solution: "a45327981609608524a3175389710642a203a961785481473065a927a128459603672418a05394965a382071389045712a612a6093478505716a23948" },
    { layout: "00000111113002000133332222201111322444441333255554666632588544446325887747666555887777765999888877699999998a769aaaaaaaaaa", solution: "7869123450a4592a361870324650187a9173085a94620984672a1358a570142693a3217496058217a490538654139680a2760a5287391496083a57241" },
    { layout: "4440000333344000223133400022111134022211111344225555513488255755534882577777788886799977886666669798a6a6669999aaaaaaaaa99", solution: "392178a50647852304a691160953284a7641a27593085a97460381240861a975230548923617a9763a481250a134056278923758910a4682a06174935" }
  ];

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

  function decode(str) {
    var out = new Array(CELLS);
    for (var i = 0; i < CELLS; i++) out[i] = ALPH.indexOf(str[i]);
    return out;
  }

  // 8 种对称：旋转 0/90/180/270 × 是否转置
  function transformIndex(i, rot, flip) {
    var p = rc(i);
    var r = p[0];
    var c = p[1];
    if (flip) {
      var t = r;
      r = c;
      c = t;
    }
    for (var k = 0; k < rot; k++) {
      var nr = c;
      var nc = N - 1 - r;
      r = nr;
      c = nc;
    }
    return idx(r, c);
  }

  function applySymmetry(arr, rot, flip) {
    var out = new Array(CELLS);
    for (var i = 0; i < CELLS; i++) out[transformIndex(i, rot, flip)] = arr[i];
    return out;
  }

  function pickBase() {
    var base = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)];
    var rot = Math.floor(Math.random() * 4);
    var flip = Math.random() < 0.5;
    var regions = applySymmetry(decode(base.layout), rot, flip);
    var sol0 = applySymmetry(decode(base.solution), rot, flip);
    var relabel = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    var solution = new Array(CELLS);
    for (var i = 0; i < CELLS; i++) solution[i] = relabel[sol0[i]];
    return { regions: regions, solution: solution };
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

  function countSolutions(board, regions, limit) {
    limit = limit || 2;
    var count = 0;
    var b = board.slice();

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
        return;
      }
      for (var j = 0; j < bestOpts.length; j++) {
        b[best] = bestOpts[j];
        dfs();
        b[best] = 0;
        if (count >= limit) return;
      }
    }
    dfs();
    return count;
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
    starter: { empty: 11, label: "启蒙", hint: "只空 11 格，每块拼图大约一个" },
    easy: { empty: 22, label: "轻松", hint: "空 22 格，看行、看列、看拼图块" },
    smart: { empty: 33, label: "聪明", hint: "空 33 格，爸妈可以陪着玩" },
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

  // 每格四边是否与别的拼图块相邻（用来画粗边）
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
    LAYOUT_COUNT: LAYOUTS.length,
    DIFFICULTIES: DIFFICULTIES,
    idx: idx,
    rc: rc,
    shuffle: shuffle,
    decode: decode,
    applySymmetry: applySymmetry,
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
    _layouts: LAYOUTS,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.TuantuanSudoku11 = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
