# 团团数独 · 11×11 拼图版

给「团团」准备的 **11×11** 数独，手机和电脑都能玩。

11 是质数，切不出像 9×9 那样整齐的小方格，所以这里的"宫"是 **11 块形状各异的彩色拼图**，每块 11 格。规则一句话：同一行、同一列、同一块拼图里，图案都不能重复。

## 在手机上玩

- 固定地址（需要先开 GitHub Pages，见 `../tuantuan-sudoku/README.md`）：<https://crazyhb.github.io/UZI-Skill/tuantuan-sudoku-11/>
- 三款游戏的入口页：<https://crazyhb.github.io/UZI-Skill/>

加到手机桌面后可以全屏、离线玩：iPhone 在 Safari 点「分享 → 添加到主屏幕」；安卓在 Chrome 点「⋮ → 添加到主屏幕」。

## 在电脑上玩

```bash
python3 -m http.server 8765 -d apps
# 访问 http://localhost:8765/tuantuan-sudoku-11/
```

## 难度

| 模式 | 大约空格 | 适合谁 |
|---|---|---|
| 启蒙 11×11 | 11 格 | 每块拼图正好缺一个，先找"这块还缺谁" |
| 轻松 11×11 | 22 格 | 会看行、列和拼图块了 |
| 聪明 11×11 | 33 格 | 爸妈陪着玩 |

格子可以换成水果、小动物或数字（1–11）。点空格再点下方图案；不能放的图案会变淡。提供擦掉、提示、检查。

## 题目怎么来的

- `tools/gen11.py` 离线随机生成拼图布局，并用回溯法求出一个完整解，跑出 10 组存进 `sudoku11.js`
- 页面每次出题时随机做旋转 / 翻转，再把 11 个图案重新编号，然后逐格挖空并校验唯一解

```bash
node apps/tuantuan-sudoku-11/tests/sudoku11.test.cjs
# 重新生成布局（可选，约 5 分钟）
python3 apps/tuantuan-sudoku-11/tools/gen11.py 10 2026 > /tmp/layouts11.json
```
