# Kerning Drill 問題データ公開サイト

`kerning-drill-question-bank.json` の中身を一覧表示するだけの、静的な1ページサイトです。

## フォルダの中身

- `index.html` — 表示用ページ（JSONを`fetch`で読み込みます）
- `kerning-drill-question-bank.json` — 問題データ本体

## GitHub Pagesでの公開手順

1. GitHubで新しいリポジトリを作成する（例：`kerning-drill-question-bank`）
2. このフォルダの中身（`index.html`と`kerning-drill-question-bank.json`）をそのリポジトリのルートにpushする
3. リポジトリの **Settings → Pages** を開く
4. 「Build and deployment」の **Source** を `Deploy from a branch` にする
5. **Branch** を `main` / フォルダを `/ (root)` にして **Save**
6. 数分待つと、`https://ユーザー名.github.io/リポジトリ名/` でページが公開されます

## 問題データを更新するとき

`kerning-drill-question-bank.json` を編集してリポジトリにpushするだけで、ページの表示に自動で反映されます（`index.html`側の修正は不要です）。
