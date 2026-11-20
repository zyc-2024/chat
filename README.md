# zyc2024 聊天网页 · Vue 重写版

原项目：[zyc-2024/chat](https://github.com/zyc-2024/chat)。  
本项目是使用 **Vue 3 + Vite** 对整个项目进行的重写，同时把原先被删除的登录页面加了回来。

## 本次改动

1. **重新加入登录页面**
   - 新增 `/login` 页面，包含登录与注册。
   - 登录完全可选：不登录也能进入公开频道、创建/进入私密频道、发消息、上传文件。
   - 登录后使用账号昵称发消息，会话保存在本机 `localStorage`，有效期 7 天。
   - 登录页提供“不登录，以游客身份继续”入口。
   - 首页、聊天页都有可选的“登录”入口，没有任何强制跳转或登录墙。

2. **使用 Vue 重写整个项目**
   - Vue 3（Composition API / `<script setup>`）+ Vue Router。
   - 原 `index.html`、`home.html`、`core.html`、`showmsg.html`、`create.html`、`uf.html`、`ufb64.html`、`404.html`、`changelog.html` 的功能都迁移到了 Vue 路由页面。
   - 去掉了聊天页的 `iframe`，消息改为 Vue 组件直接渲染，仍然保留 Markdown、KaTeX 公式、任务列表、表格与代码高亮。
   - 保留原来的 Gitee API 存储方式、公开频道索引格式、私密频道 id/口令加密格式，因此能和旧数据互通。
   - 使用 hash 路由，静态托管（GitHub Pages / Gitee Pages）不需要额外的回退配置。

## 路由

| 地址 | 功能 |
| --- | --- |
| `/#/` | 首页：频道列表、创建公开/私密频道、进入私密频道 |
| `/#/login` | 登录 / 注册 / 已登录账号页（可选） |
| `/#/chat?type=u&ch=频道名` | 公开频道聊天 |
| `/#/chat?type=r&id=频道id&key=凭证` | 私密频道聊天 |
| `/#/create?type=u&ch=频道名` | 创建公开频道 |
| `/#/create?type=r&key=凭证` | 创建私密频道 |
| `/#/upload` | 选择文件上传 |
| `/#/upload/base64` | 粘贴 Base64 上传 |
| `/#/changelog` | 更新日志 |

## 开发

```bash
pnpm install
pnpm dev
```

生产构建：

```bash
pnpm build
pnpm preview
```

核心数据层（公开频道、私密频道加密、追加消息）的离线测试：

```bash
pnpm test
```

构建产物在 `dist/`，可以直接部署到任意静态托管。

## 部署

GitHub Pages 使用 GitHub Actions 自动构建和发布：

- 仓库：<https://github.com/zyc-2024/chat>
- 页面：<https://www.zyc2024.com.cn/chat/>
- 工作流：`.github/workflows/deploy.yml`

每次向 `main` 分支推送 commit 后，工作流会自动：

1. 安装依赖
2. 运行 `pnpm test`
3. 运行 `pnpm build`
4. 把 `dist/` 作为 Pages artifact 上传并部署到 GitHub Pages
5. 在 Windows runner 上用 PyInstaller 打包本地运行版 `zyc-chat.exe`
6. 生成距上次发布的所有修改记录和完整 `CHANGELOG.md`
7. 发布 GitHub Release，附带 `.exe`、便携 zip 和更新记录

也可以在 Actions 页面手动触发 `Build, deploy and release`。

`vite.config.js` 使用 `base: "./"` 和 hash 路由，因此部署在 `/chat/` 子路径下也能正常加载资源。

## 本地运行版

先构建前端，再启动本地服务：

```bash
pnpm build
python app.py
```

程序会在 `127.0.0.1` 上启动一个本地静态服务器并自动打开浏览器。也可以用 `app.py` 打包 Windows exe：

```bash
build-app.bat
```

或直接下载 GitHub Releases 里的 `zyc-chat-<版本>.exe` / `zyc-chat-<版本>-local-win64.zip`。发行包内包含：

- `zyc-chat-<版本>.exe`：双击运行的本地应用
- `CHANGELOG.md`：完整更新日志
- `CHANGELOG-SINCE-LAST-RELEASE.md`：距上次发布的所有修改记录
- `README.txt`：使用说明

本地运行版仍然通过浏览器访问 Gitee 上的聊天数据，所以需要联网。

## 目录结构

```text
src/
  components/       通用组件（消息卡片、弹窗、Toast、登录状态）
  data/changelog.js 更新日志数据
  lib/              Markdown/KaTeX、加密、身份、格式化、剪贴板
  router/           Vue Router（hash 模式，按页面懒加载）
  services/         Gitee API、聊天频道、账号登录
  styles/           全局与页面样式
  views/            页面级组件
public/             图标、版本号、旧入口跳转页、robots.txt、第三方许可证
app.py              本地运行版静态服务器 / PyInstaller 入口
build-app.bat       本地构建 Windows exe
scripts/            发布说明与完整 CHANGELOG 生成脚本
test-core.mjs       数据层离线测试
```

## 数据与安全说明

- 这个项目沿用原项目的设计：**没有自建后端**，聊天记录、频道索引、账号文件都保存在 `zyc-2024/chat` 的 Gitee 仓库里。
- Gitee access token 仍然写在 `src/services/gitee.js` 中（原项目同样如此）。这意味着任何访问者都能拿到写入令牌；请不要把它当作生产级安全后端。
- 登录账号数据保存在 `private/user_<sha256>.json`，密码使用与原项目一致的 SHA-256 摘要；仓库是公开可读的，因此账号系统只适合“记住昵称/可选登录”这种轻量用途。
- 私密频道的消息在浏览器内用 PBKDF2 + AES 加密后再上传，口令不会发送到服务器；但频道 id 和口令会出现在 URL 中，请自行注意分享方式。
- 原项目登录页的 Friendly Captcha 没有保留。它本身只在客户端检查 token，无法真正防止机器人；如果以后接入服务端，建议在服务端完成验证码校验。

## 兼容性

- 保留了旧账号会话键 `chat_auth_v1`，旧登录状态可以直接继续使用。
- 保留了旧频道时间格式、公开频道索引中的 URL 编码频道名、私密频道加密格式和文件路径。
- `public/` 下保留了 `core.html`、`showmsg.html`、`create.html`、`uf.html`、`ufb64.html`、`login.html`、`register.html`、`logout.html` 等旧入口的跳转页，旧的分享链接仍会打开对应的 Vue 路由。
