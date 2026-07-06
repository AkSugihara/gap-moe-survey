# ギャップ萌えアンケート公開セット

このフォルダは、既存のアンケートHTMLを「静的公開 + Googleスプレッドシート収集」に対応させたものです。
自前サーバは不要です。

## ファイル構成

```text
index.html      # 公開用HTML。GitHub Pagesなどに置く
survey.js       # 画面遷移、回答収集、送信処理
Code.gs         # Google Apps Script側の受信コード
images/         # input1.png, soft.png, medium.png, strong.png などを置く想定
```

## 1. 画像を置く

`images/` フォルダを作って、HTMLで参照する画像を入れてください。

```text
images/input1.png
images/soft.png
images/medium.png
images/strong.png
```

現時点では、元画像は `images/input1.png` を参照しています。
soft / medium / strong は、元HTMLのプレースホルダ部分を `<img src="images/soft.png" ...>` のように差し替えてください。

## 2. Googleスプレッドシートを作る

1. Googleスプレッドシートを新規作成
2. `拡張機能` → `Apps Script`
3. `Code.gs` の中身を貼り付け
4. 保存

## 3. Apps ScriptをWebアプリとして公開

Apps Script画面で以下を設定します。

- `デプロイ` → `新しいデプロイ`
- 種類: `ウェブアプリ`
- 次のユーザーとして実行: `自分`
- アクセスできるユーザー: `リンクを知っている全員` または `全員`

公開後に発行されるWebアプリURLをコピーします。

## 4. index.htmlに送信先URLを入れる

`index.html` の末尾付近にある以下を探してください。

```html
window.SURVEY_CONFIG = {
  endpointUrl: "",
  studyId: "gap_moe_v1",
  characterId: "takamiyarin_001",
  conditionSet: "soft_medium_strong_001"
};
```

`endpointUrl` にApps ScriptのWebアプリURLを入れます。

```html
endpointUrl: "https://script.google.com/macros/s/XXXX/exec",
```

## 5. GitHub Pagesで公開する

1. GitHubで新規リポジトリ作成
2. `index.html`, `survey.js`, `images/` をアップロード
3. Settings → Pages
4. Sourceを `Deploy from a branch` にする
5. Branchを `main` / root にする
6. 公開URLにアクセス

## 6. テスト方法

1. 公開URLを開く
2. すべての設問に回答
3. `回答を送信する` を押す
4. Googleスプレッドシートの `responses` シートに1行追加されるか確認

## 注意

- `endpointUrl` が空欄のままだと、回答は送信されず、JSONファイルとしてローカル保存されます。
- 送信時にはブラウザの `localStorage` にバックアップも保存します。
- 本番配布前に、必ず自分で1〜2回テスト回答してください。
- 研究倫理・同意文・データ利用目的・匿名性の説明は、必要に応じてイントロに追記してください。
