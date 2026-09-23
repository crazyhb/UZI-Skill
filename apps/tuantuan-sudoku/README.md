# 团团数独 · 简易九乘九

给四岁宝宝「团团」准备的简易 **9×9** 数独，手机和电脑都能玩。

## 在手机上玩

用手机浏览器（Safari / Chrome）打开：

**固定地址（推荐）**：<https://crazyhb.github.io/UZI-Skill/>

首次使用需要仓库管理员开一次 GitHub Pages：仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**。之后每次 `main` 上的 `apps/tuantuan-sudoku/` 有改动，`.github/workflows/tuantuan-sudoku-pages.yml` 会自动测试并发布。

**临时地址**（Pages 开启前可以先用）：

<https://raw.githack.com/crazyhb/UZI-Skill/main/apps/tuantuan-sudoku/index.html>

第一次打开会出现 githack 的英文提示页，点红色的 **Open the page** 即可，之后再打开会直接进游戏。PR 合并前，把链接里的 `main` 换成 `cursor/tuantuan-jiujiu-speedread-e1c7`。

**加到手机桌面**，之后像 App 一样全屏打开，断网也能玩：

- iPhone（Safari）：点底部「分享」按钮 → 「添加到主屏幕」
- 安卓（Chrome）：点右上角「⋮」→ 「添加到主屏幕」或「安装应用」

手机竖着拿时，棋盘、图案和按钮一屏就能放下；横过来会变成左边棋盘、右边按钮。

## 在电脑上玩

```bash
python3 -m http.server 8765 -d apps/tuantuan-sudoku
# 访问 http://localhost:8765
```

同一个 Wi-Fi 下的手机也可以访问 `http://<电脑的局域网 IP>:8765`。

## 怎么玩

盘面始终是完整的九乘九。难度只改空格数量，不改棋盘大小：

| 模式 | 大约空格 | 适合谁 |
|---|---|---|
| 启蒙九乘九 | 9 格 | 第一次玩，推荐团团先从这里开始 |
| 轻松九乘九 | 18 格 | 已经会看行列了 |
| 聪明九乘九 | 27 格 | 爸妈陪着玩 |

格子可以换成水果、小动物或数字。玩法：先点空格，再点下方图案。

还提供：擦掉、提示、检查。点选空格后，不能放的图案会变淡。放错时安卓手机会轻轻震动。

## 规则一句话

同一行、同一列、同一个 3×3 小九宫里，图案都不能重复。每道题保证唯一解。

## 测试

```bash
node apps/tuantuan-sudoku/tests/sudoku.test.cjs
```
