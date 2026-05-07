# 0014 編集フロー統一 + DATE/TIME連動制御

## Status

Accepted

## Context

US-016 までの実装で、Date/Time 入力は blur/Enter で確定・Escape でキャンセルという操作体系になっていたが、Todo テキストの編集は [更新] ボタン押下が必要で操作が不統一だった。また、TIME だけの入力は意味がない (DATE が必須) にもかかわらず、DATE が空でも TIME に入力できてしまう状態だった。

ユーザーからの要望:
1. DATE 空欄時は TIME を disabled にする
2. TIME を空にして Tab で抜けた時に表示が空のままになる (blur で commit されているが useState が同期されていない)
3. Todo テキスト編集でも更新ボタンを廃止し、Enter/blur/Tab 確定 + Escape キャンセルに統一する
4. 削除ボタンは × アイコンにして常時表示する

## Decision

### US-017: DATE/TIME 連動制御

- TIME input に `disabled` 属性を追加: `disabled={!dateText.trim()}`
- commit 関数で TIME 表示を修正: `setTimeText(parsedTime ?? (parsedDate ? "00:00" : ""))`
- `useEffect([deadline])` で props 変更時にローカル state を同期 (PUT 応答・リフレッシュ後の反映)
- Escape キーで入力をキャンセル (サーバー値に戻す)

### US-018: 編集フロー統一

- Todo テキストの [更新] ボタンを廃止
- 確定: Enter / blur / Tab (blur で自然に発火)
- キャンセル: Escape (editingId を null に戻し、editText をリセット)
- `useRef` で `cancelledRef` を管理し、Escape → blur の連鎖で二重 commit を防止
- 削除ボタン: テキスト「削除」→ × アイコン (`btn-icon` クラス)
- 削除ボタンは編集モードに依存せず常時表示
- `.col-actions` 幅: 110px → 36px (× ボタンのみ)

## Consequences

- 全フィールド (Todo/Date/Time) の操作体系が統一され、学習コストが下がる
- 更新ボタン廃止により操作列が × ボタンのみになり、テーブルがコンパクトになる
- DATE 空欄時の TIME disabled により不正操作を防止
- useEffect による state 同期で Tab 移動時の表示ずれが解消される
