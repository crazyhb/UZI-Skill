"""离线生成 11×11 拼图数独：11 个连通区域（每块 11 格）+ 一个完整解。"""
import random, sys, time, json

N = 11
ALPH = "0123456789a"  # 区域 id / 符号 id 编码


def neighbors(i):
    r, c = divmod(i, N)
    if r > 0: yield i - N
    if r < N - 1: yield i + N
    if c > 0: yield i - 1
    if c < N - 1: yield i + 1


def connected(cells):
    cells = set(cells)
    if not cells: return True
    start = next(iter(cells))
    seen = {start}; stack = [start]
    while stack:
        x = stack.pop()
        for y in neighbors(x):
            if y in cells and y not in seen:
                seen.add(y); stack.append(y)
    return len(seen) == len(cells)


def gen_layout(rng, iters=6000):
    # 起点：每行一个区域，再随机交换边界格子，保持每块 11 格且连通
    reg = [i // N for i in range(N * N)]
    for _ in range(iters):
        x = rng.randrange(N * N)
        a = reg[x]
        nb = [y for y in neighbors(x) if reg[y] != a]
        if not nb: continue
        y = rng.choice(nb); b = reg[y]
        # x 移到 b，再从 b 里找一个与 a 相邻的格子 z 移到 a
        cand = [z for z in range(N * N) if reg[z] == b and z != y and any(reg[w] == a for w in neighbors(z))]
        if not cand: continue
        z = rng.choice(cand)
        reg[x] = b; reg[z] = a
        A = [i for i in range(N * N) if reg[i] == a]
        B = [i for i in range(N * N) if reg[i] == b]
        if not (connected(A) and connected(B)):
            reg[x] = a; reg[z] = b
    return reg


def solve(reg, rng, deadline):
    """MRV 回溯填 Latin square + 区域约束。返回 list 或 None（超时/无解）。"""
    full = (1 << N) - 1
    rows = [0] * N; cols = [0] * N; boxes = [0] * N
    grid = [-1] * (N * N)
    order_cache = {}

    def rec():
        if time.time() > deadline: raise TimeoutError
        best = -1; best_mask = 0; best_cnt = N + 1
        for i in range(N * N):
            if grid[i] != -1: continue
            r, c = divmod(i, N)
            m = full & ~(rows[r] | cols[c] | boxes[reg[i]])
            cnt = bin(m).count("1")
            if cnt == 0: return False
            if cnt < best_cnt:
                best, best_mask, best_cnt = i, m, cnt
                if cnt == 1: break
        if best == -1: return True
        r, c = divmod(best, N)
        vals = [v for v in range(N) if best_mask >> v & 1]
        rng.shuffle(vals)
        for v in vals:
            bit = 1 << v
            grid[best] = v; rows[r] |= bit; cols[c] |= bit; boxes[reg[best]] |= bit
            if rec(): return True
            grid[best] = -1; rows[r] ^= bit; cols[c] ^= bit; boxes[reg[best]] ^= bit
        return False

    try:
        return grid if rec() else None
    except TimeoutError:
        return None


def main(count, seed):
    rng = random.Random(seed)
    out = []
    tries = 0
    while len(out) < count:
        tries += 1
        reg = gen_layout(rng)
        sizes = [reg.count(k) for k in range(N)]
        assert sizes == [N] * N, sizes
        t0 = time.time()
        sol = solve(reg, rng, t0 + 4.0)
        dt = time.time() - t0
        if sol is None:
            print(f"try {tries}: unsolved in {dt:.1f}s", file=sys.stderr); continue
        # 校验
        for r in range(N):
            assert len({sol[r * N + c] for c in range(N)}) == N
        for c in range(N):
            assert len({sol[r * N + c] for r in range(N)}) == N
        for k in range(N):
            assert len({sol[i] for i in range(N * N) if reg[i] == k}) == N
        out.append({"layout": "".join(ALPH[k] for k in reg), "solution": "".join(ALPH[v] for v in sol)})
        print(f"try {tries}: ok in {dt:.2f}s ({len(out)}/{count})", file=sys.stderr)
    json.dump(out, sys.stdout, indent=0)


if __name__ == "__main__":
    main(int(sys.argv[1]), int(sys.argv[2]))
