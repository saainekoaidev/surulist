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

### 4. 日付/時刻入力をテキスト入力に変更

当初 Chromium の webkit 疑似要素 (`::-webkit-datetime-edit-text` 等) で `<input type="date/time">` の区切りスペースを除去する方針だったが、日本語 Windows 環境では疑似要素がスペースを制御できないことが判明した (スペースは shadow DOM のテキストコンテンツであり CSS では変更不可)。

そのため `<input type="text">` に変更し、表示・入力を手動制御する:

- **Date 列**: 内部状態は `yyyy-mm-dd` 形式。表示時に `-` → `/` 変換し `yyyy/mm/dd` で表示。入力時に `/` → `-` 逆変換
- **Time 列**: `hh:mm` 形式のまま。変換なし
- `placeholder` で書式ヒント表示 (`yyyy/mm/dd`, `hh:mm`)、`maxLength` で入力上限を設定
- 確定タイミングは従来どおり blur / Enter

## Consequences

- Todo 入力欄が ~266px → ~364px に拡大し、全角 40 文字の入力が快適になる
- 日付入力が `yyyy/mm/dd` 形式で統一され、ブラウザやロケールに依存しない表示になる
- フォントが一段小さくなることでテーブル全体がコンパクトになるが、可読性は維持できるサイズ
- テキスト入力のためブラウザのカレンダーピッカーは使えなくなるが、本アプリの用途 (個人用 localhost) では直接入力で十分
