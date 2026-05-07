# 0015 Todo一覧ソート機能

## Status

Accepted

## Context

Todo 一覧は登録順 (id 昇順) で固定表示されていた。ユーザーから「期限順でも見たい」という要望があり、ソート機能の追加が求められた。

要件:
1. 登録日順 (RegistDate & # 昇順) と期限順 (Deadline & # 降順) の 2 択
2. 列ヘッダクリックではなくセクションバー内のリストボックスで切り替え
3. ソートの初期値を目的編集ダイアログ (D01) のオプションで設定し localStorage で保持

## Decision

### ソート種別

`SortKey = "registDate" | "deadline"` 型を `types.ts` に定義。

| ソートキー | 第1条件 | 第2条件 | null deadline |
|-----------|---------|---------|---------------|
| `registDate` | createdAt ASC | id ASC | — |
| `deadline` | deadline DESC | id DESC | 末尾 |

### UI 配置

- セクションバー (section-bar): リフレッシュボタンの左に `<select className="sort-select">` を配置
- D01 オプションセクション: 「全件表示を許可する」チェックボックスの下に「並び順の初期値」`<select>` を追加

### state 管理

- `useSortPreference` フック: `useShowAllPreference` と同パターンで `localStorage` (キー: `surulist:defaultSort`) を管理
- `App.tsx`: `defaultSort` (localStorage 値) と `currentSort` (現在の表示ソート) を分離
- `TodoTable`: `sortKey` / `onSortChange` props を受け取り、render 時に `sortTodos()` を適用
- `CategoryDialog`: `defaultSort` / `onDefaultSortChange` props を受け取り、オプション UI を表示

### ソート適用

- 通常モード: `sortTodos(todos, sortKey)` → `groupTodos(sortedTodos, false)`
- 全件表示モード: `groupTodos(todos, true)` → 各 group.todos に `sortTodos` を適用

## Consequences

- 2 種類のソートで一覧の使い勝手が向上する
- localStorage ベースの初期値設定で、ユーザーが好みのソートをデフォルトにできる
- ソートはフロントエンドのみで完結し、API 変更は不要
