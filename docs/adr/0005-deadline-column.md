# 0005 Deadline 列の追加

## Status

Accepted — 入力方式 (即時 PUT / datetime-local) は [0010-deadline-deferred-commit.md](0010-deadline-deferred-commit.md) により Superseded

## Context

US-008 で Todo テーブルに期限 (Deadline) 列を追加する要件が発生した。
以下の設計判断が必要:

1. データ型: DateTime vs String, nullable vs required
2. 日付のみ vs 日時
3. UI: date picker library vs native input
4. インライン編集の方式

## Decision

1. **Prisma `DateTime?` (nullable)** -- 期限は任意。未設定の Todo も許容する。
2. **日時 (`<input type="datetime-local">`)** -- 社会人にとって時刻は重要。日付と時刻の両方を指定可能にする。
3. **ネイティブ HTML input** -- ライブラリ不使用。ブラウザ標準のカレンダー+時刻ピッカーを利用する。
4. **常時 input 表示方式** -- `<input type="datetime-local">` を常時レンダリングし、未設定時は空欄表示。クリックでカレンダーが開く。onChange で即 PUT。Todo テキスト編集のような「表示/編集モード切替」は不要。

## Consequences

- 利点: 実装がシンプル。追加ライブラリなし。ブラウザ標準のカレンダー+時刻 UI。
- 代償: ブラウザごとに datetime-local input の見た目が異なる。localhost 個人利用なので許容範囲。
- DB: nullable カラム追加のため既存データへの影響なし (デフォルト null)。
