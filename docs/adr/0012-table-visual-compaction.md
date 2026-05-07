# 0012 テーブル視覚コンパクト化

## Status

Accepted

Supersedes: [0007-wider-layout.md](0007-wider-layout.md) の列幅・padding に関する部分

## Context

US-010 でアプリ最大幅を 960px → 1100px に拡大したが、固定列の幅と左右 padding が大きいままのため Todo 入力列 (~266px) がまだ狭い。また Date/Time 入力欄がブラウザのデフォルトレンダリングにより `yyyy / mm / dd` のようにスペースが入り、間延びして見える。

## Decision

以下 3 点をまとめて適用する。

### 1. セル padding の削減

`thead th` / `tbody td` の左右 padding を 12px → 6px に縮小。上下 (10px) は変更なし。

### 2. 固定列幅の縮小

| 列 | 変更前 | 変更後 |
|----|--------|--------|
| .col-num | 44px | 36px |
| .col-status | 160px | 140px |
| .col-date-input | 130px | 120px |
| .col-time-input | 90px | 80px |
| .col-date | 110px | 95px |
| .col-actions | 130px | 110px |

合計 ~98px の削減により Todo 列は ~364px に拡大。

### 3. フォントサイズ縮小

| 要素 | 変更前 | 変更後 |
|------|--------|--------|
| table (Todo テキスト) | 14px | 13px |
| .deadline-input | 13px | 12px |
| .col-date-input / .col-time-input | 13px | 12px |
| thead th.col-date-input / .col-time-input | 11px | 10px |

### 4. 日付/時刻入力のスペース除去

Chromium の webkit 疑似要素を使って区切りスペースを除去:
```css
.deadline-input::-webkit-datetime-edit-fields-wrapper { padding: 0; }
.deadline-input::-webkit-datetime-edit-text { padding: 0 1px; }
```

Firefox では効果がないが、本アプリのターゲット環境 (Windows 11 + Chromium 系ブラウザ) では十分。

## Consequences

- Todo 入力欄が ~266px → ~364px に拡大し、全角 40 文字の入力が快適になる
- 日付入力が `yyyy/mm/dd` 形式になり間延び感が解消される
- フォントが一段小さくなることでテーブル全体がコンパクトになるが、可読性は維持できるサイズ
- webkit 疑似要素は Chromium 系ブラウザ専用のため、Firefox/Safari では効果がない
