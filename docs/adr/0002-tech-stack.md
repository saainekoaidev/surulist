# 0002 技術スタック選定

## Status

Accepted

## Context

US-001〜006 で定義された Todo リストアプリを実装するにあたり, フロントエンド・バックエンド・データベース・テストの技術スタックを決定する必要がある。
要件は「localhost で動く」「自分が使えればよい」であり, 軽量かつ開発体験の良い構成が望ましい。
pnpm workspace によるモノレポ構成とし, frontend / backend を分離する。

## Decision

| レイヤ | 技術 | 理由 |
|---|---|---|
| フロントエンド | React 19 + Vite 6 + TypeScript | 実績豊富な UI ライブラリ + 高速な開発サーバ |
| バックエンド | Hono + Node.js | 軽量・高速な Web フレームワーク。localhost 用途に十分 |
| ORM | Prisma | 型安全なクエリ, マイグレーション管理, SQLite 対応 |
| データベース | SQLite | ファイルベースで別途 DB サーバ不要。個人用途に最適 |
| パッケージ管理 | pnpm (workspace) | 高速なインストール, ディスク効率, モノレポ対応 |
| 単体テスト | Vitest | Vite ネイティブ対応, Jest 互換 API, 高速 |
| E2E テスト | Playwright | マルチブラウザ対応, 安定した E2E テスト |
| CI | GitHub Actions | GitHub との統合, ワークフロー定義済み |
| Node.js | v22 LTS | 2024-10 LTS, 2027-04 まで Active LTS |

### ディレクトリ構成

```
surulist/
├── frontend/          # React + Vite
│   ├── src/
│   ├── e2e/           # Playwright E2E tests
│   ├── vite.config.ts
│   └── playwright.config.ts
├── backend/           # Hono + Prisma
│   ├── src/
│   ├── prisma/
│   └── vitest.config.ts
├── pnpm-workspace.yaml
└── package.json       # root workspace scripts
```

## Consequences

- **利益**: 型安全な開発体験, 高速なビルド・テスト, DB サーバ不要で手軽
- **代償**: Prisma は schema 変更のたびにマイグレーション生成が必要
- **リスク**: SQLite は同時書き込みに弱いが, 個人用途では問題にならない
