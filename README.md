# zyc2024 聊天网页 · Vue 重写版

原项目：[zyc-2024/chat](https://github.com/zyc-2024/chat)。  
本项目是使用 **Vue 3 + Vite** 对整个项目进行的重写，同时把原先被删除的登录页面加了回来。

## 本次改动

1. **重新加入登录页面**
   - 新增 `/login` 页面，包含登录与注册。
   - 登录完全可选：不登录也能进入公开频道、创建/进入私密频道、发消息、上传文件。
   - 未登录时会自动分配与设备信息绑定的 `Guest_<HASH>` 游客用户名。
   - 登录后使用账号昵称发消息，会话保存在本机 `localStorage`，有效期 7 天。
   - 登录页提供“不登录，以游客身份继续”入口。
   - 首页、聊天页都有可选的“登录”入口，没有任何强制跳转或登录墙。

2. **使用 Vue 重写整个项目**
   - Vue 3（Composition API / `<script setup>`）+ Vue Router。
   - 原 `index.html`、`home.html`、`core.html`、`showmsg.html`、`create.html`、`uf.html`、`ufb64.html`、`404.html`、`changelog.html` 的功能都迁移到了 Vue 路由页面。
   - 去掉了聊天页的 `iframe`，消息改为 Vue 组件直接渲染，仍然保留 Markdown、KaTeX 公式、任务列表、表格与代码高亮。
   - 保留原来的 Gitee API 存储方式、公开频道索引格式、私密频道 id/口令加密格式，因此能和旧数据互通。
   - 使用 hash 路由，静态托管（GitHub Pages / Gitee Pages）不需要额外的回退配置。

3. **用 Vue 恢复个人主页**
   - `/#/user?u=用户名` 展示头像、背景、Markdown 自我介绍和侧边文字。
   - `/#/edit` 编辑个人资料，带实时预览；只有登录自己的账号后才能保存。
   - 兼容原项目的 `ronly/users/<用户名>.json` 公开资料，并在保存时同步写回。
   - 聊天消息中的作者名可以点击进入对应个人主页。

4. **设备绑定的自动游客身份**
   - 未登录用户会自动获得 `Guest_<HASH>` 用户名并自动登录。
   - HASH 由设备信息（浏览器、平台、语言、屏幕、时区等）哈希得到，保存在本机并保持稳定。
   - 游客没有个人主页；访问 `/#/user?u=Guest_...` 会提示游客身份不存在主页。
   - 游客不能改名；登录真实账号后才可以修改昵称。
   - `Guest_` 开头的用户名保留给自动游客身份，不能注册。

5. **频道创建者标记与删除**
   - 创建频道时写入创建者标记：
     - 公开频道：`status/public/<频道名>.json`
     - 私有频道：`status/private/<频道 id>.json`
   - 标记内容包含 `owner`、`ownerType`、`createdAt`、`deleted`、`deletedAt`，以及消息统计字段。
   - 创建者可以在聊天页删除自己的频道；删除只写入 `deleted: true` 标记。
   - 首页会隐藏已删除频道，聊天页会拒绝继续进入和发送消息。
   - 私有频道的状态文件使用频道口令加密，和私密消息一样不会明文保存创建者和删除状态。
   - 旧频道如果没有状态文件，不会显示删除按钮。

6. **频道统计、消息撤回与输入框字体**
   - `status` 文件额外保存 `messageCount`、`lastMessageAt`、`lastMessageTime`、`lastMessageName`。
   - 每次发言后自动更新统计；首页频道列表和聊天页顶部会显示消息条数与最后发言时间。
   - 每条消息带 `recalled` 标记；只有发送者可以撤回自己的消息。
   - 其他用户看到“该消息已被撤回”；撤回者可以在自己最后一条撤回消息旁点击“重新编辑”，把原内容放回输入框。
   - 撤回只写标记，不删除原消息内容；私有频道的消息和状态仍然加密保存。
   - 聊天输入框字体改为宋体（SimSun），并支持拖动输入区下方的手柄调整高度；双击手柄恢复默认，高度保存在本机。

7. **消息引用与一键到底**
   - 每条消息保存唯一 `hash`；旧消息没有 hash 时按内容生成稳定 hash，并在下次写入时补齐。
   - 消息新增 `quote` 字段，默认 `null`；引用时只保存被引用消息的 `hash` 和作者名，不复制原文。
   - 引用块自动渲染，点击后滚动到原消息并高亮；原消息被折叠时会自动展开。
   - 聊天页常驻“一键到底”按钮，随时可以回到最新消息。
   - 撤回消息重新编辑时会同时恢复原内容和引用；私有频道的引用信息随消息一起加密。

8. **手机端适配**
   - 首页导航栏在手机上吸顶，频道列表改为随整页滚动，不再嵌套小滚动区。
   - 聊天页使用动态视口高度，隐藏手机端 Markdown 预览，并把次要操作收进“更多”，把空间留给消息列表。
   - 引用块、消息操作、输入框和“一键到底”等悬浮按钮适配窄屏与安全区域。
   - 登录、个人资料、编辑资料、上传和更新日志页面调整间距；手机端更新日志改为卡片布局。

9. **消息右键菜单**
   - 在消息上右键会弹出“复制、引用、撤回”菜单；手机端可点击消息右上角的 `⋯` 打开同一菜单。
   - 复制会写入消息的原始 Markdown 内容。
   - 引用会把这条消息放入输入框上方的引用栏。
   - 撤回只对非撤回状态的消息显示，普通用户只对自己的消息显示。
   - 菜单会自动避开屏幕边缘，点击空白、滚动或按 Esc 时关闭。

10. **管理员账号（隐藏规则）**
   - 管理员由隐藏规则按用户名自动判定，不依赖账号文件里的字段，界面不显示管理员徽章。
   - 登录和刷新会话时会自动重新计算管理员状态。
   - 管理员可以撤回任意消息、删除任意频道，包括没有创建者状态文件的旧频道。
   - 普通用户仍然只能撤回自己发送的消息、删除自己创建的频道。

11. **侧边栏快捷新建**
   - 点击左侧栏的 `+` 会弹出“新建公开频道”弹窗，直接询问频道名称。
   - 输入名称并确认后进入原有创建流程；空名称会留在弹窗内提示。
   - 首页原有的创建公开频道卡片仍然保留。

12. **上传文件分片到 256 个仓库**
   - 选择文件和 Base64 上传都会计算内容 MD5，并按前两位保存到 `zyc-2024/chat-files-00` ~ `chat-files-ff` 中的对应仓库。
   - 上传路径继续使用 `f/<md5>/<文件名>`，生成的 raw 链接会直接指向分片仓库。
   - 消息、个人资料 Markdown、头像和背景中的旧主仓库上传链接会自动改写到分片仓库；右键复制消息时也会复制改写后的链接。
   - 旧文件迁移脚本：`node scripts/gitee-file-repos.mjs migrate`。
   - 仓库初始化脚本可重复执行：`node scripts/gitee-file-repos.mjs setup`。

13. **中英文 i18n 与 AI 翻译标注**
   - 全站页面、操作提示、弹窗、右键菜单和服务错误支持简体中文与英文。
   - 语言选择保存在本机，切换时会同步页面标题和 `<html lang>`。
   - 英文界面为 AI 翻译；语言切换器会显示 `AI translation` 标记，更新日志页也会说明历史描述保留原始中文。
   - 用户消息、频道名、个人资料等用户内容不会被自动翻译。

14. **LaTeX 辅助编辑**
   - 输入框旁新增 `∑ LaTeX` 按钮，打开公式模板面板。
   - 提供行内/独立公式、分数、根号、上下标、求和、积分、极限、向量、矩阵、分段函数和对齐环境模板。
   - 提供常用希腊字母和运算符快捷插入。
   - 先选中文字再点击模板，可以将选中内容放进公式；插入后光标自动定位到待填写位置。
   - 面板文案同样支持中英文和 AI 翻译标注。

15. **个性设置与主题商店**
   - `/#/settings` 可以调整强调色、页面背景、卡片背景、文字、边框、聊天背景、消息背景和背景图片。
   - 内置默认绿、森林绿、海洋蓝、樱花粉、暖阳橙、薰衣草等预设。
   - 主题默认保存在本机；登录后可以同步到账号，也可以从账号读取。
   - 当前主题可以命名后上传到公开主题商店，所有主题免费。
   - 主题商店支持浏览和应用其他用户上传的主题。
   - 主题设置会同步应用到首页、聊天、登录、资料、上传和更新日志等页面。

## 路由

| 地址 | 功能 |
| --- | --- |
| `/#/` | 首页：频道列表、创建公开/私密频道、进入私密频道 |
| `/#/login` | 登录 / 注册 / 已登录账号页（可选） |
| `/#/chat?type=u&ch=频道名` | 公开频道聊天 |
| `/#/chat?type=r&id=频道id&key=凭证` | 私密频道聊天 |
| `/#/create?type=u&ch=频道名` | 创建公开频道 |
| `/#/create?type=r&key=凭证` | 创建私密频道 |
| `/#/user?u=用户名` | 个人主页 |
| `/#/edit` | 编辑个人资料（需要登录） |
| `/#/upload` | 选择文件上传 |
| `/#/upload/base64` | 粘贴 Base64 上传 |
| `/#/changelog` | 更新日志 |

自动游客身份 `Guest_<HASH>` 没有个人主页，也不能编辑个人资料。

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

## Changelog 标签

更新日志支持标签和按标签筛选，标签数据在 `src/data/changelog.js`：

- `changelogTags` 定义内置标签的 `id`、`label`、`color`、`background`。
- 条目里的 `tags` 可以写标签 id，例如 `["ai", "beta"]`。
- 第一条记录的 `latest` 标签由页面自动添加，颜色和文字取自 `changelogTags` 中匹配 `latest` / `最新` 的定义。
- 也可以直接写自定义标签对象，例如：

```js
{
  label: "自定义标签",
  color: "#c2410c",
  background: "#fff1e7",
}
```

更新日志页面的标签图例、颜色和筛选会自动读取这些配置。后续新增记录会沿用当前 `changelogTags` 和条目 `tags` 的写法。

## 版本号

应用版本的唯一来源是 `src/data/changelog.js` 第一条记录的 `version`：

- 首页版本号直接读取这条记录
- `pnpm build` 会自动运行 `scripts/sync-version.mjs`，把同一个版本写入 `public/version.txt`
- GitHub Release 的名称和 tag 也由它生成
- 本地运行版 exe / zip 的文件名同样使用它生成的版本号

格式示例：

```text
3.6.1 (218)          -> Release tag: v3.6.1-218
3.0.0 beta 2 (174)   -> Release tag: v3.0.0-beta.2
```

`package.json` 里的 `version` 只作为项目元数据，不参与应用版本计算。

## 部署

GitHub Pages 使用 GitHub Actions 自动构建和发布：

- 仓库：<https://github.com/zyc-2024/chat>
- 页面：<https://chat.zyc2024.com.cn/>
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
scripts/            版本读取、version.txt 同步、发布说明与完整 CHANGELOG 生成脚本
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
- 个人主页兼容原项目的 `ronly/users/<用户名>.json` 公开资料；旧用户可以直接在 Vue 个人主页中查看，登录同名账号后可以继续编辑。
- `public/` 下保留了 `core.html`、`showmsg.html`、`create.html`、`uf.html`、`ufb64.html`、`login.html`、`register.html`、`logout.html` 等旧入口的跳转页，旧的分享链接仍会打开对应的 Vue 路由。
