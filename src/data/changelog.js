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
];

export const changelog = [
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
		tags: [],
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
		version: "2.1.0 (87)",
		tags: [],
		desc: "复原了build.bat",
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
		tags: [],
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
		version: "1.4.8 (23)",
		tags: ["旧版"],
		desc: "把原来的文件链接过来了awa",
	},
	{
		version: "1.4.8 (22)",
		tags: ["旧版"],
		desc: "把模板套了上去awa",
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
		tags: ["旧版"],
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
		version: "1.3.3 (8)",
		tags: ["hotfix", "旧版"],
		desc: "修复了bug",
	},
	{
		version: "Early build 1~7",
		tags: ["旧版"],
		desc: "加入了初步发送/存储消息的功能",
	},
];
