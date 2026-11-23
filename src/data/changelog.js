// 更新日志数据：最新版本在最前面。
// 标签配置：changelogTags 中的 id、label、color、background 都可以自由修改。
// 条目 tags 里可以写标签 id（如 "beta"），也可以直接写自定义对象：
// { label: "自定义标签", color: "#c2410c", background: "#fff1e7" }

export const changelogTags = [
	{
		id: "ai",
		label: "使用AI",
		color: "#6f42c1",
		background: "#f3edff",
	},
	{
		id: "beta",
		label: "beta",
		color: "#d07d2a",
		background: "#e8f7f5",
	},
	{
		id: "hotfix",
		label: "hotfix",
		color: "#c21f1f",
		background: "#fff0f0",
	},
	{
		id: "旧版",
		label: "legacy",
		color: "#5f6a63",
		background: "#f0f3f1",
	},
	{
		id: "最新版",
		label: "latest",
		color: "#23db66",
		background: "#f0f3f1",
	},
	{
		id: "now",
		label: "now",
		color: "#0b8ec2",
		background: "#eaf7fd",
	},
];

export const changelog = [
	{
		version: "3.9.0 beta 1 (224)",
		tags: ["ai", "beta"],
		desc: "为本地 app 加入更新检测：启动后读取 GitHub Releases，若存在更高构建号则显示更新卡片，提供 exe 下载和 Release 说明；选择稍后会记住该版本，网页版不显示提示。",
	},
	{
		version: "3.8.1 (223)",
		tags: ["ai", "hotfix"],
		desc: "调整更新日志标签：latest 固定指向最新一个非 beta 版本；新增 now 标签，网页版标记当前最新版，本地 app 标记当前正在使用的内置版本，并补充对应提示。",
	},
	{
		version: "3.8.0 (222)",
		tags: ["ai"],
		desc: "拍一拍功能完成：登录用户可在频道消息和好友私信中使用拍一拍，被拍用户可自定义后缀，特殊消息会保存在对应频道或好友会话中，并已补充中英文文案和文档。",
	},
	{
		version: "3.8.0 beta 1 (221)",
		tags: ["ai", "beta"],
		desc: "加入“拍一拍”：登录用户可在频道消息右键菜单或好友私信页拍一拍其他真实用户；被拍用户可在个性设置中自定义后缀，拍一拍作为特殊消息保存在频道或好友会话中。",
	},
	{
		version: "3.7.0 (220)",
		tags: ["ai"],
		desc: "好友与私信功能完成：好友列表、右键加好友、主页加好友、登录用户一对一私信、独立 friends/msg 存储和自动刷新均已接入，并补充中英文文案与文档。",
	},
	{
		version: "3.7.0 beta 1 (219)",
		tags: ["ai", "beta"],
		desc: "加入好友列表和私信：仅限登录用户，支持聊天消息右键加好友、主页加好友、好友页按用户名添加；好友关系写入双方列表，私信保存在独立的 friends/msg 文件夹，支持 Markdown/LaTeX 和自动刷新。",
	},
	{
		version: "3.6.1 (218)",
		tags: ["ai", "hotfix"],
		desc: "修复主页私有频道的自动填充问题：频道凭证和频道 id 使用独立字段名、关闭自动填充并添加密码管理器忽略标记，不再与登录用户名和密码混用。",
	},
	{
		version: "3.6.0 (217)",
		tags: ["ai"],
		desc: "个性设置与主题商店完成：支持颜色、背景图片、内置预设、本机保存、账号同步和公开主题商店上传/应用；主题会应用到全站主要页面，并继续支持中英文与 AI 翻译标注。",
	},
	{
		version: "3.6.0 beta 2 (216)",
		tags: ["ai", "beta"],
		desc: "加入公开主题商店：可以浏览、应用其他用户上传的免费主题，也可以从个性设置把当前主题命名后上传；主题数据保存在 Gitee 的 themes/index.json。",
	},
	{
		version: "3.6.0 beta 1 (215)",
		tags: ["ai", "beta"],
		desc: "加入个性设置与主题引擎：支持 8 种颜色、背景图片和遮罩、6 个内置预设；主题可保存到本机，登录后可同步到账号或从账号读取，并支持实时预览和全站颜色应用。",
	},
	{
		version: "3.5.1 (214)",
		tags: ["ai"],
		desc: "加入 LaTeX 辅助编辑：输入框旁的 LaTeX 面板提供行内/独立公式、分数、根号、上下标、求和、积分、矩阵、分段函数、常用符号和希腊字母模板；支持将选中文字包裹进公式，插入后自动定位光标。",
	},
	{
		version: "3.5.0 (213)",
		tags: ["ai"],
		desc: "完成全站中英文 i18n：所有页面、操作提示和服务错误支持切换，英文界面由 AI 翻译并在语言切换器上标注；优化登录、游客、错误和操作提示文案，语言选择保存在本机。",
	},
	{
		version: "3.5.0 beta 3 (212)",
		tags: ["ai", "beta"],
		desc: "创建频道、上传、个人主页、编辑资料、更新日志、404 和服务错误提示完成中英文切换；更新日志英文界面保留原始中文说明并标注 AI 翻译。",
	},
	{
		version: "3.5.0 beta 2 (211)",
		tags: ["ai", "beta"],
		desc: "首页、登录、账号徽章、聊天页和消息卡片完成中英文切换；状态、右键菜单、弹窗和操作提示统一走翻译表。",
	},
	{
		version: "3.5.0 beta 1 (210)",
		tags: ["ai", "beta"],
		desc: "加入轻量 i18n 基础设施：语言状态持久化、字符串插值、路由标题同步、语言切换组件，并在英文界面显示 AI translation 标记。",
	},
	{
		version: "3.4.4 (209)",
		tags: ["ai", "hotfix"],
		desc: "聊天输入框支持拖动下方手柄调整高度，桌面和手机端都可用；高度会保存在本机，双击手柄恢复默认大小，预览区域同步调整。",
	},
	{
		version: "3.4.3 (208)",
		tags: ["ai", "hotfix"],
		desc: "聊天页“一键到底”按钮改为常驻显示，不再只在远离底部时出现；消息列表底部增加了按钮占位空间，避免最后一条消息被悬浮按钮挡住。",
	},
	{
		version: "3.4.2 (207)",
		tags: ["ai", "hotfix"],
		desc: "内部逻辑调整，不涉及界面变化。",
	},
	{
		version: "3.4.1 (206)",
		tags: ["ai", "hotfix"],
		desc: "修复分片上传文件迁移脚本：Gitee 对不存在的文件可能返回空数组而不是 404，现在会正确识别为缺失并写入目标分片仓库，再删除旧文件。",
	},
	{
		version: "3.4.0 (205)",
		tags: ["ai"],
		desc: "上传文件分片存储完成：选择文件和 Base64 上传按内容 MD5 前两位写入 256 个 chat-files-xx 仓库；旧主仓库 f/ 文件迁移后删除，历史链接由前端自动改写，迁移和初始化脚本已加入仓库。",
	},
	{
		version: "3.4.0 beta 4 (204)",
		tags: ["ai", "beta"],
		desc: "兼容迁移后的旧上传链接：消息、个人资料 Markdown、头像和背景中的旧主仓库 raw 链接会自动改写为对应 chat-files-xx 分片仓库；右键复制消息时也会复制改写后的链接。",
	},
	{
		version: "3.4.0 beta 3 (203)",
		tags: ["ai", "beta"],
		desc: "Base64 上传改为按内容 MD5 前两位选择分片仓库；上传路径包含内容 hash 和时间戳，生成的 raw 链接指向 chat-files-xx。",
	},
	{
		version: "3.4.0 beta 2 (202)",
		tags: ["ai", "beta"],
		desc: "选择文件上传改为写入 256 个分片仓库：根据文件 MD5 前两位选择 chat-files-xx，上传接口和生成的 raw 链接同步切换到对应仓库。",
	},
	{
		version: "3.4.0 beta 1 (201)",
		tags: ["ai", "beta"],
		desc: "开始把上传文件迁移到 256 个 Gitee 分片仓库：新增按 32 位 MD5 前两位选择仓库的工具函数、仓库初始化与旧文件迁移脚本，并加入旧上传链接改写和映射测试。",
	},
	{
		version: "3.3.4 (200)",
		tags: ["ai", "hotfix"],
		desc: "侧边栏“+”按钮改为弹出“新建公开频道”弹窗：输入频道名称后点击创建并进入，空名称会在弹窗内提示；首页原有的创建频道卡片继续保留。",
	},
	{
		version: "3.3.3 (199)",
		tags: ["ai"],
		desc: "增加隐藏的管理员账号属性：账号 JSON 设置 admin: true 后，登录会自动读取；管理员可撤回任意消息、删除任意频道，包括没有创建者标记的旧频道，普通用户仍只能撤回自己的消息、删除自己创建的频道。",
	},
	{
		version: "3.3.2 (198)",
		tags: ["ai"],
		desc: "消息右键菜单改为复制、引用、撤回；手机端点消息右上角 ⋯ 打开同一菜单。复制写入原始 Markdown，引用放入输入框，撤回只对非撤回消息显示，普通用户只对自己的消息显示。",
	},
	{
		version: "3.3.1 (197)",
		tags: ["ai", "hotfix"],
		desc: "手机端适配：首页导航吸顶、频道列表随整页滚动；聊天页使用动态视口高度并收起预览和次要操作，引用块、悬浮按钮、登录、资料、上传和更新日志页面适配窄屏。",
	},
	{
		version: "3.3.0 (196)",
		tags: ["ai"],
		desc: "消息增加唯一 hash 和 quote 字段（默认 null），可以引用其他消息；引用块自动渲染，点击后滚动到原消息并高亮，离底部较远时显示“一键到底”；重新编辑撤回消息时会恢复引用，私有频道的引用随消息一起加密。",
	},
	{
		version: "3.2.8 (195)",
		tags: ["ai", "hotfix"],
		desc: "主页头像改为显示已登录用户的个人主页头像；没有头像或未登录时仍显示首字母。",
	},
	{
		version: "3.2.7 (194)",
		tags: ["ai", "hotfix"],
		desc: "已登录用户不再显示“登录可选”提示：首页的可选登录说明和登录页的“登录可选”徽章会自动隐藏。",
	},
	{
		version: "3.2.6 (193)",
		tags: ["ai", "hotfix"],
		desc: "修复频道创建完成后的跳转：显示“已经创建好了”后立即尝试进入聊天页，并每秒重试直到成功；删除频道弹窗不再显示聊天记录相关提示。",
	},
	{
		version: "3.2.5 (192)",
		tags: ["ai"],
		desc: "频道列表和聊天页显示消息条数与最后发言时间，统计数据写入 status 文件并在每次发言后更新；消息增加 recalled 标记，只有发送者可撤回，其他人看到撤回提示，本人可在最后一条撤回消息旁重新编辑并放回输入框；聊天输入框字体改为宋体。",
	},
	{
		version: "3.2.4 (191)",
		tags: ["ai"],
		desc: "频道创建时在 status/public/<name>.json 或 status/private/<id>.json 写入创建者标记；创建者可在聊天页删除自己的频道，删除只写入 deleted 标记并隐藏频道；私有频道状态文件同样使用频道口令加密。",
	},
	{
		version: "3.2.3 (190)",
		tags: ["ai"],
		desc: "未登录用户自动分配与设备信息绑定的 Guest_<HASH> 游客用户名并自动登录；游客没有个人主页，登录后才能修改昵称。",
	},
	{
		version: "3.2.2 (189)",
		tags: ["ai"],
		desc: "版本号改为读取 Changelog 首条记录，并自动为首条记录添加 latest 标签",
	},
	{
		version: "3.2.1 (187)",
		tags: ["ai"],
		desc: "Changelog 新增标签系统",
	},
	{
		version: "3.2.0 (186)",
		tags: ["ai"],
		desc: "用 Vue 恢复原个人主页与编辑资料功能",
	},
	{
		version: "3.1.1 (185)",
		tags: ["ai", "hotfix"],
		desc: "修复本地运行版打包",
	},
	{
		version: "3.1.0 (184)",
		tags: ["ai"],
		desc: "新增本地运行版",
	},
	{
		version: "3.0.0 (183)",
		tags: ["ai"],
		desc: "正式版",
	},
	{
		version: "3.0.0 beta 2 (174)",
		tags: ["ai", "beta"],
		desc: "配置 GitHub Pages 自动部署",
	},
	{
		version: "3.0.0 beta 3 (173)",
		tags: ["ai", "beta"],
		desc: "使用 Vue 3 + Vite + Vue Router 重写整个项目",
	},
	{
		version: "2.4.3 (164)",
		tags: ["hotfix"],
		desc: "删除了登录相关文件",
	},
	{
		version: "2.4.3 (163)",
		tags: [],
		desc: "哦不不不禁止我们登录这是不好的！",
	},
	{
		version: "2.4.2 (161)",
		tags: [],
		desc: "增加了个人主页对公式的支持，同时小小的修改了一下背景图",
	},
	{
		version: "2.4.1 (159)",
		tags: ["hotfix"],
		desc: "最后调整一下格式",
	},
	{
		version: "2.4.0 (154)",
		tags: ["hotfix"],
		desc: "大体整完了",
	},
	{
		version: "2.3.2 (153)",
		tags: [],
		desc: "加入了编辑个人资料界面",
	},
	{
		version: "2.3.1 (152)",
		tags: ["hotfix"],
		desc: "修bug~",
	},
	{
		version: "2.3.0 (150)",
		tags: [],
		desc: "小小的挪动了一些文件",
	},
	{
		version: "2.2.5 (149)",
		tags: [],
		desc: "用户个人信息",
	},
	{
		version: "2.2.4 (147)",
		tags: [],
		desc: "增加了登陆检测",
	},
	{
		version: "2.2.3 (145)",
		tags: [],
		desc: "把两个文件合并了",
	},
	{
		version: "2.2.1 (136)",
		tags: [],
		desc: "改了改登陆页面",
	},
	{
		version: "2.2.0 (134)",
		tags: [],
		desc: "稍微加了一个注册页面",
	},
	{
		version: "2.1.5 (131)",
		tags: [],
		desc: "加了一个登录弹窗",
	},
	{
		version: "2.1.5 (128)",
		tags: [],
		desc: "增加了一点点移动端适配",
	},
	{
		version: "2.1.5 (125)",
		tags: [],
		desc: "用一个iframe显示消息",
	},
	{
		version: "2.1.5 (124)",
		tags: [],
		desc: "加入了重复频道过滤+创建频道fallback",
	},
	{
		version: "2.1.4 (120)",
		tags: [],
		desc: "shift+enter发送",
	},
	{
		version: "2.1.3 (115)",
		tags: [],
		desc: "加入了代码块的高亮",
	},
	{
		version: "2.1.1 (112)",
		tags: ["hotfix"],
		desc: "可以正常创建独一无二的id了",
	},
	{
		version: "2.1.1 (107)",
		tags: [],
		desc: "和commit的数量同步一下awa",
	},
	{
		version: "2.1.1 (90)",
		tags: [],
		desc: "加入了Markdown渲染！！",
	},
	{
		version: "2.1.0 (89)",
		tags: [],
		desc: "删掉了预览Markdown（全屏）",
	},
	{
		version: "2.1.0 (86)",
		tags: [],
		desc: "删掉了上传文件的入口",
	},
	{
		version: "2.0.6 (85)",
		tags: ["hotfix"],
		desc: "预览修好了",
	},
	{
		version: "2.0.6 (81)",
		tags: ["hotfix"],
		desc: "解决了网速慢的问题",
	},
	{
		version: "2.0.6 (80)",
		tags: [],
		desc: "加入Markdown",
	},
	{
		version: "2.0.3 (70)",
		tags: [],
		desc: "把private的入口加上了",
	},
	{
		version: "2.0.2 (64)",
		tags: [],
		desc: "加了个资源下载进度条awa",
	},
	{
		version: "2.0.1 (62)",
		tags: [],
		desc: "对手机版用户更友好了",
	},
	{
		version: "2.0.1 (61)",
		tags: [],
		desc: "把两个格式合并了一下",
	},
	{
		version: "2.0.0 (53)",
		tags: [],
		desc: "404必须安排！",
	},
	{
		version: "2.0.0 (52)",
		tags: [],
		desc: "删掉了MarkdownPalettes，一路走好！",
	},
	{
		version: "2.0.0 (50)",
		tags: [],
		desc: "重构了上传文件代码",
	},
	{
		version: "1.8.4 (47)",
		tags: ["hotfix", "旧版"],
		desc: "试图修复数学公式显示问题",
	},
	{
		version: "1.8.4 (45)",
		tags: ["hotfix", "旧版"],
		desc: "加了个fallback",
	},
	{
		version: "1.8.3 (43)",
		tags: ["旧版"],
		desc: "加了个进度条之类的",
	},
	{
		version: "1.8.3 (41)",
		tags: ["旧版"],
		desc: "上传文件界面更友好了",
	},
	{
		version: "1.8.2 (40)",
		tags: ["旧版"],
		desc: "更改了文件来源（会快一点）",
	},
	{
		version: "1.8.1 (38)",
		tags: ["旧版"],
		desc: "把上传文件的UI加了进来",
	},
	{
		version: "1.8.0 (37)",
		tags: ["旧版"],
		desc: "添加了上传文件的功能！！！",
	},
	{
		version: "1.7.1 (36)",
		tags: ["旧版"],
		desc: "回退了1.6.2的改动",
	},
	{
		version: "1.7.1 (34)",
		tags: ["旧版"],
		desc: "让界面更简陋了（",
	},
	{
		version: "1.6.2 (32)",
		tags: ["旧版"],
		desc: "用“#”替换了“?”",
	},
	{
		version: "1.6.1 (30)",
		tags: ["旧版"],
		desc: "增加了自动更新",
	},
	{
		version: "1.5.3 (28)",
		tags: ["旧版"],
		desc: "离线版寿终正寝（喜",
	},
	{
		version: "1.5.1 (25)",
		tags: ["旧版"],
		desc: "用了洛谷的Markdown，真好用！",
	},
	{
		version: "1.4.9 (23)",
		tags: ["旧版"],
		desc: "把原来的文件链接过来了awa",
	},
	{
		version: "1.4.8 (22)",
		tags: ["旧版"],
		desc: "把模板套了上去",
	},
	{
		version: "1.4.5 (20)",
		tags: ["旧版"],
		desc: "把更改频道扔到控制栏了",
	},
	{
		version: "1.4.4 (19)",
		tags: ["旧版"],
		desc: "增加了聊天数据的安全性",
	},
	{
		version: "1.4.4 (18)",
		tags: ["hotfix", "旧版"],
		desc: "修复了数据怎么也存不上去的bug",
	},
	{
		version: "1.4.3 (17)",
		tags: ["旧版"],
		desc: "名字有效期延长至2147483647秒",
	},
	{
		version: "1.4.2 (15)",
		tags: ["旧版"],
		desc: "稳定版，支持HTML说话",
	},
	{
		version: "1.4.0 (12)",
		tags: ["旧版"],
		desc: "加入了频道，详见main",
	},
	{
		version: "1.3.3 (9)",
		tags: ["旧版"],
		desc: "优化UI，去掉了两个框",
	},
	{
		version: "1.3.2 (8)",
		tags: ["hotfix", "旧版"],
		desc: "修复了bug",
	},
	{
		version: "Early build 1~7",
		tags: ["旧版"],
		desc: "加入了初步发送/存储消息的功能",
	},
];
