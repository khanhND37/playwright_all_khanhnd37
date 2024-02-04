# OCG Autopilot

OCG end-to-end test project

![img](assets/readme_resource/logo.png)

## 🧐 About

Project này chứa code automation end-to-end test của OCG.

Công nghệ sử dụng:

- [Typescript](https://www.typescriptlang.org/)
- [Playwright framework](https://playwright.dev/)

## ⚙️ Cài đặt

Yêu cầu máy cài đặt sẵn (Chưa biết thì xem hướng dẫn [ở đây](https://docs.ocg.to/books/qa-training/page/1-ide-playwright-cach-chay-mot-test-case-example-don-gian/11038))

```bash
Nodejs > 16
Yarn
Git
```

Để pull code được, bạn cần thêm dòng sau vào file  `~/.ssh/config` (đối với Window thì là thư mục:  `/c/Users/${username}/.ssh/config`)

Lưu ý: Nếu máy bạn chưa có file này thì tạo ra rồi paste content phía dưới vào

```bash
Host gitlab.shopbase.dev
    Port 16889
```

Sau khi pull code xong, bạn cd vào thư mục ocg-autopilot-3 và cài đặt

```bash
git clone git@gitlab.shopbase.dev:brodev/qa/ocg-autopilot-3.git
cd ocg-autopilot-3
yarn install
```

Tạo file env từ file env example

```bash
cp .env.template .env
```

Install playwright dependency

```bash
yarn playwright install
```

## Chạy test

Để chạy 1 test example bạn dùng lệnh sau:

```bash
yarn test <path_to_file> -g <test_case>
```

VD:

```bash
yarn test examples/basic/login_and_verify.spec.ts -g TC_SB_DB_LGIN_001
```

### Chạy test (với docker)

Để chạy 1 test example bạn dùng lệnh sau:

```bash
yarn server <path_to_file> -g <test_case> <env {dev | prodtest | production}>
```

VD:

```bash
default env = production
yarn server examples/basic/login_and_verify.spec.ts -g TC_SB_DB_LGIN_001
or
yarn server examples/basic/login_and_verify.spec.ts -g TC_SB_DB_LGIN_001 dev
```

## Use case

### Sử dụng proxy với mailinator

Vì mailinator block IP nếu request quá nhiều ~> cần sử dụng proxy.
Cách sử dụng proxy: sử dụng hàm util `getMailinatorInstanceWithProxy`

```bash
const mailinator = await getMailinatorInstanceWithProxy(page);
```

Xem thêm tại [PR](https://gitlab.shopbase.dev/brodev/qa/ocg-autopilot-3/-/merge_requests/864/diffs)

## Tài liệu học tập

- [Automation quickly for full-stack dev](https://docs.ocg.to/books/qa-training/page/automation-quickly-for-full-stack-dev/13576)
- [Autopilot training book](https://docs.ocg.to/books/qa-training/chapter/ocg-autopilot/846)

## Một số tool

- Gen type từ JSON: [Link](https://transform.tools/json-to-typescript)
