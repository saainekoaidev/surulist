# 0010 Deadline 入力の遅延コミット + 日付・時刻分割

## Status

Accepted

Supersedes: [0005-deadline-column.md](0005-deadline-column.md) の入力方式に関する部分

## Context

US-008 で `<input type="datetime-local">` を採用し、`onChange` で即時 PUT 発行する方式としたが、以下の UX 問題が報告された:

1. フィールド (年→月→日→時→分) を連続入力するたびに PUT が発火し、中間状態がサーバーに送信される
2. PUT 後のレスポンスで画面が再描画され、入力中の値が一瞬前の値に戻る (ちらつき)
3. `datetime-local` はブラウザ実装差が大きく、日時の一括入力がしづらい

## Decision

1. **日付と時刻を別列に分割**: `<input type="date">` + `<input type="time">` の 2 列構成にする
2. **遅延コミット方式**: 入力中は React ローカル state (`editDeadline`) で値を保持し、以下のタイミングでのみサーバーに PUT 発行する:
   - Enter キー押下
   - 入力欄からの blur (フォーカス外れ)
   - 値が実際に変わった場合のみ PUT (不要な通信を防止)
3. **deadline の組み立て**: date が空なら `null`、date のみなら `YYYY-MM-DDT00:00` として送信、date + time なら `YYYY-MM-DDTHH:mm` として送信

### 代替案

- `datetime-local` のまま `onBlur` のみに変更 → ブラウザのスピナー操作が blur を発火しない環境があり不安定
- カレンダーライブラリ導入 → 依存追加のコスト。ネイティブ入力で十分

## Consequences

- 中間状態でのサーバー通信がなくなり、入力体験が改善される
- 値のちらつきが解消される
- 列数が Deadline 1 列 → Date + Time 2 列に増えるが、各列は狭いため全体幅への影響は軽微
- date のみ設定 (時刻なし) のケースを自然に表現できる
