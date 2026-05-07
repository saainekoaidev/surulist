# 0007 レイアウト幅拡大

## Status

Accepted

## Context

Todo テーブルの列幅配分は固定幅列 (#: 44px, Status: 160px, Deadline: 170px, RegistDate: 110px, UpdateDate: 110px, Actions: 130px = 計 724px) と残り幅の Todo 列で構成される。アプリ全体の max-width が 960px の場合、Todo 列は約 236px しかなく、全角 40 文字の入力欄としては狭い。

## Decision

`.app` の `max-width` を 960px から 1100px に拡大する。

- Todo 列は幅指定なし (残り幅) のため、自動的に ~376px に拡大される
- 他列の幅は変更しない（現状の固定幅は情報量に対して適切）
- 1100px は一般的な 1280px 以上のモニタで余白を残しつつ十分な幅を確保できるサイズ

## Consequences

- Todo 列の入力・表示領域が約 60% 拡大し、全角 40 文字が一行に収まりやすくなる
- 1024px 未満の画面幅では水平スクロールが発生する可能性がある（localhost 利用のため許容）
