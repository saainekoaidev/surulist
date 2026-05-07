# 0006 フォントサイズ階層

## Status

Accepted

## Context

US-009 で Todo テーブル内のフォントサイズに視覚的階層を設ける要件が発生した。
現状は Todo(14px), RegistDate/UpdateDate(13px) の 2 段階。
Deadline 列追加に伴い、3 段階の階層が必要になった。

## Decision

- Todo テキスト: 14px (変更なし。テーブルの base font-size)
- Deadline: 13px (`.col-deadline` で指定)
- RegistDate / UpdateDate: 11px (`.col-date` を 13px → 11px に変更)
- thead は全列 12px 維持 (既存)。ただし RegistDate/UpdateDate ヘッダは 10px に縮小。

## Consequences

- 情報の重要度が視覚的に伝わるようになる。
- RegistDate/UpdateDate を 11px に縮小するため、可読性がやや低下する。ただし日付はメタ情報であり、個人利用では十分な大きさ。
