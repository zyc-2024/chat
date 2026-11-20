// 更新日志数据：最新版本在最前面。
// 标签配置：changelogTags 中的 id、label、color、background 都可以自由修改。
// 条目 tags 里可以写标签 id（如 "beta"），也可以直接写自定义对象：
// { label: "自定义标签", color: "#c2410c", background: "#fff1e7" }

export const changelogTags = [
	{
		"id": "ai",
		"label": "使用AI",
		"color": "#6f42c1",
		"background": "#f3edff"
	},
	{
		"id": "beta",
		"label": "beta",
		"color": "#0b6f68",
		"background": "#e8f7f5"
	},
	{
		"id": "hotfix",
		"label": "hotfix",
		"color": "#a82323",
		"background": "#fff0f0"
	},
	{
		"id": "legacy",
		"label": "legacy",
		"color": "#5f6a63",
		"background": "#f0f3f1"
	},
	{
		"id": "feature",
		"label": "feature",
		"color": "#056633",
		"background": "#edf9f2"
	},
	{
		"id": "vue",
		"label": "Vue",
		"color": "#1f7a5c",
		"background": "#e9f7f1"
	},
	{
		"id": "pages",
		"label": "Pages",
		"color": "#075f86",
		"background": "#eaf5fb"
	},
	{
		"id": "local",
		"label": "本地版",
		"color": "#9a5b00",
		"background": "#fff4e5"
	},
	{
		"id": "profile",
		"label": "个人主页",
		"color": "#8a3f8f",
		"background": "#f9edfa"
	},
	{
		"id": "changelog",
		"label": "Changelog",
		"color": "#2d5f8a",
		"background": "#edf4fb"
	}
];

export const changelog = [
	{
		"version": "3.0.0 beta 187 (187)",
		"tags": [
			"ai",
			"beta",
			"feature",
			"changelog"
		],
		"desc": "Changelog 新增标签系统：支持“使用AI”“beta”“hotfix”“legacy”等内置标签，也可以在数据里写自定义标签对象，自由设置文字、颜色和背景色；更新日志页面增加标签筛选和标签图例。"
	},
	{
		"version": "3.0.0 beta 186 (186)",
		"tags": [
			"ai",
			"beta",
			"feature",
			"vue",
			"local",
			"profile",
			{
				"label": "自定义标签",
				"color": "#c2410c",
				"background": "#fff1e7"
			}
		],
		"desc": "用 Vue 恢复原个人主页与编辑资料功能：新增 /user 和 /edit，展示头像、背景图、Markdown 自我介绍和侧边文字，支持实时预览与保存；兼容原 ronly/users 公开资料并同步写回，聊天消息作者名可点击进入个人主页，登录账号页和首页也加入个人主页入口。"
	},
	{
		"version": "3.0.0 beta 185 (185)",
		"tags": [
			"ai",
			"beta",
			"hotfix",
			"vue",
			"local"
		],
		"desc": "修复本地运行版打包：PyInstaller 使用 --specpath 时会把 web-dist 解析到 build 目录下导致构建失败；改为在仓库根目录生成 spec 并使用可解析的相对路径，重新验证 Windows exe 打包流程。"
	},
	{
		"version": "3.0.0 beta 184 (184)",
		"tags": [
			"ai",
			"beta",
			"feature",
			"vue",
			"local"
		],
		"desc": "新增本地运行版：app.py 使用 Python 内置静态服务器，启动后自动打开浏览器；GitHub Actions 使用 PyInstaller 构建 Windows exe，并自动生成距上次发布的所有修改记录、完整 CHANGELOG、可执行文件和便携 zip，发布到 GitHub Releases；新增 build-app.bat 供本地构建。"
	},
	{
		"version": "3.0.0 (183)",
		"tags": [
			"ai",
			"feature",
			"vue"
		],
		"desc": "[借助DeepSeek之力] 正式版"
	},
	{
		"version": "3.0.0 beta 174 (174)",
		"tags": [
			"ai",
			"beta",
			"pages",
			"vue"
		],
		"desc": "[借助DeepSeek之力] 配置 GitHub Pages 自动部署"
	},
	{
		"version": "3.0.0 beta 173 (173)",
		"tags": [
			"ai",
			"beta",
			"vue",
			"feature"
		],
		"desc": "[借助DeepSeek之力] 使用 Vue 3 + Vite + Vue Router 重写整个项目"
	},
	{
		"version": "2.4.3 (164)",
		"tags": [
			"legacy"
		],
		"desc": "删除了登录相关文件"
	},
	{
		"version": "2.4.3 (163)",
		"tags": [
			"legacy"
		],
		"desc": "哦不不不禁止我们登录这是不好的！"
	},
	{
		"version": "2.4.2 (161)",
		"tags": [
			"legacy"
		],
		"desc": "增加了个人主页对公式的支持，同时小小的修改了一下背景图"
	},
	{
		"version": "2.4.1 (159)",
		"tags": [
			"legacy"
		],
		"desc": "最后调整一下格式"
	},
	{
		"version": "2.4.0 (154)",
		"tags": [
			"legacy"
		],
		"desc": "大体整完了"
	},
	{
		"version": "2.3.2 (153)",
		"tags": [
			"legacy"
		],
		"desc": "加入了编辑个人资料界面"
	},
	{
		"version": "2.3.1 (152)",
		"tags": [
			"legacy"
		],
		"desc": "修bug~"
	},
	{
		"version": "2.3.0 (150)",
		"tags": [
			"legacy"
		],
		"desc": "小小的挪动了一些文件"
	},
	{
		"version": "2.2.5 (149)",
		"tags": [
			"legacy"
		],
		"desc": "用户个人信息"
	},
	{
		"version": "2.2.4 (147)",
		"tags": [
			"legacy"
		],
		"desc": "增加了登陆检测"
	},
	{
		"version": "2.2.3 (145)",
		"tags": [
			"legacy"
		],
		"desc": "把两个文件合并了"
	},
	{
		"version": "2.2.1 (136)",
		"tags": [
			"legacy"
		],
		"desc": "改了改登陆页面"
	},
	{
		"version": "2.2.0 (134)",
		"tags": [
			"legacy"
		],
		"desc": "稍微加了一个注册页面"
	},
	{
		"version": "2.1.5 (131)",
		"tags": [
			"legacy"
		],
		"desc": "加了一个登录弹窗"
	},
	{
		"version": "2.1.5 (128)",
		"tags": [
			"legacy"
		],
		"desc": "增加了一点点移动端适配"
	},
	{
		"version": "2.1.5 (125)",
		"tags": [
			"legacy"
		],
		"desc": "用一个iframe显示消息"
	},
	{
		"version": "2.1.5 (124)",
		"tags": [
			"legacy"
		],
		"desc": "加入了重复频道过滤+创建频道fallback"
	},
	{
		"version": "2.1.4 (120)",
		"tags": [
			"legacy"
		],
		"desc": "shift+enter发送"
	},
	{
		"version": "2.1.3 (115)",
		"tags": [
			"legacy"
		],
		"desc": "加入了代码块的高亮"
	},
	{
		"version": "2.1.1 (112)",
		"tags": [
			"legacy"
		],
		"desc": "可以正常创建独一无二的id了"
	},
	{
		"version": "2.1.1 (107)",
		"tags": [
			"legacy"
		],
		"desc": "和commit的数量同步一下awa"
	},
	{
		"version": "2.1.1 (90)",
		"tags": [
			"legacy"
		],
		"desc": "加入了Markdown渲染！！"
	},
	{
		"version": "2.1.0 (89)",
		"tags": [
			"legacy"
		],
		"desc": "删掉了预览Markdown（全屏）"
	},
	{
		"version": "2.1.0 (87)",
		"tags": [
			"legacy"
		],
		"desc": "复原了build.bat"
	},
	{
		"version": "2.1.0 (86)",
		"tags": [
			"legacy"
		],
		"desc": "删掉了上传文件的入口"
	},
	{
		"version": "2.0.6 (85)",
		"tags": [
			"legacy"
		],
		"desc": "预览修好了"
	},
	{
		"version": "2.0.6 (81)",
		"tags": [
			"legacy"
		],
		"desc": "解决了网速慢的问题"
	},
	{
		"version": "2.0.6 (80)",
		"tags": [
			"legacy"
		],
		"desc": "加入Markdown"
	},
	{
		"version": "2.0.3 (70)",
		"tags": [
			"legacy"
		],
		"desc": "把private的入口加上了"
	},
	{
		"version": "2.0.2 (64)",
		"tags": [
			"legacy"
		],
		"desc": "加了个资源下载进度条awa"
	},
	{
		"version": "2.0.1 (62)",
		"tags": [
			"legacy"
		],
		"desc": "对手机版用户更友好了"
	},
	{
		"version": "2.0.1 (61)",
		"tags": [
			"legacy"
		],
		"desc": "把两个格式合并了一下"
	},
	{
		"version": "2.0.0 (53)",
		"tags": [
			"legacy"
		],
		"desc": "404必须安排！"
	},
	{
		"version": "2.0.0 (52)",
		"tags": [
			"legacy"
		],
		"desc": "删掉了MarkdownPalettes，一路走好！"
	},
	{
		"version": "2.0.0 (50)",
		"tags": [
			"legacy"
		],
		"desc": "重构了上传文件代码"
	},
	{
		"version": "1.8.4 (47)",
		"tags": [
			"legacy"
		],
		"desc": "试图修复数学公式显示问题"
	},
	{
		"version": "1.8.4 (45)",
		"tags": [
			"legacy"
		],
		"desc": "加了个fallback"
	},
	{
		"version": "1.8.3 (43)",
		"tags": [
			"legacy"
		],
		"desc": "加了个进度条之类的"
	},
	{
		"version": "1.8.3 (41)",
		"tags": [
			"legacy"
		],
		"desc": "上传文件界面更友好了"
	},
	{
		"version": "1.8.2 (40)",
		"tags": [
			"legacy"
		],
		"desc": "更改了文件来源（会快一点）"
	},
	{
		"version": "1.8.1 (38)",
		"tags": [
			"legacy"
		],
		"desc": "把上传文件的UI加了进来"
	},
	{
		"version": "1.8.0 (37)",
		"tags": [
			"legacy"
		],
		"desc": "添加了上传文件的功能！！！"
	},
	{
		"version": "1.7.1 (36)",
		"tags": [
			"legacy"
		],
		"desc": "回退了1.6.2的改动"
	},
	{
		"version": "1.7.1 (34)",
		"tags": [
			"legacy"
		],
		"desc": "让界面更简陋了（"
	},
	{
		"version": "1.6.2 (32)",
		"tags": [
			"legacy"
		],
		"desc": "用“#”替换了“?”"
	},
	{
		"version": "1.6.1 (30)",
		"tags": [
			"legacy"
		],
		"desc": "增加了自动更新"
	},
	{
		"version": "1.5.3 (28)",
		"tags": [
			"legacy"
		],
		"desc": "离线版寿终正寝（喜"
	},
	{
		"version": "1.5.1 (25)",
		"tags": [
			"legacy"
		],
		"desc": "用了洛谷的Markdown，真好用！"
	},
	{
		"version": "1.4.8 (23)",
		"tags": [
			"legacy"
		],
		"desc": "把原来的文件链接过来了awa"
	},
	{
		"version": "1.4.8 (22)",
		"tags": [
			"legacy"
		],
		"desc": "把模板套了上去awa"
	},
	{
		"version": "1.4.5 (20)",
		"tags": [
			"legacy"
		],
		"desc": "把更改频道扔到控制栏了"
	},
	{
		"version": "1.4.4 (19)",
		"tags": [
			"legacy"
		],
		"desc": "增加了聊天数据的安全性"
	},
	{
		"version": "1.4.4 (18)",
		"tags": [
			"legacy"
		],
		"desc": "修复了数据怎么也存不上去的bug"
	},
	{
		"version": "1.4.3 (17)",
		"tags": [
			"legacy"
		],
		"desc": "名字有效期延长至2147483647秒"
	},
	{
		"version": "1.4.2 (15)",
		"tags": [
			"legacy"
		],
		"desc": "稳定版，支持HTML说话"
	},
	{
		"version": "1.4.0 (12)",
		"tags": [
			"legacy"
		],
		"desc": "加入了频道，详见main"
	},
	{
		"version": "1.3.3 (9)",
		"tags": [
			"legacy"
		],
		"desc": "优化UI，去掉了两个框"
	},
	{
		"version": "1.3.3 (8)",
		"tags": [
			"legacy"
		],
		"desc": "修复了bug"
	},
	{
		"version": "Early build 1~7",
		"tags": [
			"legacy"
		],
		"desc": "加入了初步发送/存储消息的功能"
	}
];
