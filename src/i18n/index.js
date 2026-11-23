import { computed, ref } from "vue";

const LOCALE_KEY = "chat_locale_v1";

export const locales = [
	{ id: "zh-CN", label: "简体中文", ai: false },
	{ id: "en", label: "English", ai: true },
];

// English strings are AI translations; the Chinese source is the canonical UI text.
const english = {
	"zyc2024 的聊天网页": "zyc2024 Chat",
	"主页": "Home",
	"聊天": "Chat",
	"创建频道": "Create channel",
	"上传 Base64": "Upload Base64",
	"个人主页": "Profile",
	"编辑个人资料": "Edit profile",
	"更新日志": "Changelog",
	"404": "404",
	"语言": "Language",
	"关闭": "Close",
	"AI 翻译": "AI translation",
	"界面英文由 AI 翻译，如有偏差请以中文为准":
		"The English interface is AI-translated. Refer to the Chinese text if anything is unclear.",

	"返回首页": "Back to home",
	"返回上一页": "Go back",
	"返回主页": "Back to home",
	"取消": "Cancel",
	"保存": "Save",
	"保存中……": "Saving…",
	"重试": "Retry",
	"刷新": "Refresh",
	"登录": "Log in",
	"退出登录": "Log out",
	"退出": "Log out",
	"注册": "Register",
	"去登录": "Log in",
	"复制": "Copy",
	"引用": "Quote",
	"撤回": "Recall",
	"删除": "Delete",
	"更多": "More",
	"收起": "Collapse",
	"改名": "Rename",
	"上传文件": "Upload file",
	"刷新间隔": "Refresh interval",
	"删除频道": "Delete channel",
	"确认删除": "Confirm delete",
	"发送": "Send",
	"发送中…": "Sending…",
	"创建": "Create",
	"进入": "Enter",
	"全部": "All",
	"版本号": "Version",
	"标签": "Tags",
	"描述": "Description",
	"选择文件": "Choose file",
	"粘贴 Base64": "Paste Base64",

	"频道广场": "Channels",
	"加入一个公开频道，或创建自己的私有频道":
		"Join a public channel or create your own private channel.",
	"搜索频道": "Search channels",
	"公开频道": "Public channels",
	"正在加载频道…": "Loading channels…",
	"频道列表加载失败": "Could not load channels",
	"暂无频道，创建一个吧": "No channels yet. Create one!",
	"公开": "Public",
	"私密": "Private",
	"无需登录也能创建频道、聊天和上传文件，系统会自动分配设备游客名 Guest_<HASH>。登录后将使用账号昵称，并在本机记住 7 天。":
		"You can create channels, chat, and upload files without logging in; a device guest name Guest_<HASH> is assigned automatically. After login, your account nickname is used and remembered on this device for 7 days.",
	"去登录 →": "Log in →",
	"我的主页 →": "My profile →",
	"频道": "Channels",
	"新建频道": "New channel",
	"我的主页": "My profile",
	"登录 / 账号": "Log in / Account",
	"在线": "Online",
	"创建公开频道": "Create public channel",
	"公开频道会显示在左侧列表里，所有人都可以进入。":
		"Public channels appear in the list and are open to everyone.",
	"输入频道名称": "Enter a channel name",
	"创建并进入": "Create and enter",
	"创建私有频道": "Create private channel",
	"创建私密频道": "Create private channel",
	"私有频道不会出现在列表中，消息会用凭证加密，进入时需要 id 和凭证。":
		"Private channels are not listed. Messages are encrypted with a key, and you need the channel ID and key to enter.",
	"设置一段凭证字符串": "Set a channel key",
	"进入私有频道": "Join private channel",
	"需要 id": "ID required",
	"输入创建时保存的频道 id 和凭证即可进入。":
		"Enter the channel ID and key you saved when creating it.",
	"频道 id": "Channel ID",
	"频道凭证": "Channel key",
	"本地版下载": "Desktop app",
	"新建公开频道": "New public channel",
	"频道名称": "Channel name",
	"请输入频道名称": "Please enter a channel name.",
	"公开频道 · 点击进入": "Public channel · Click to enter",
	"当前身份：{name}": "Signed in as {name}",
	"请先设置一段凭证字符串": "Set a channel key first.",
	"请填写频道 id 和凭证": "Enter the channel ID and key.",
	"{count} 条消息 · 最近 {time}": "{count} messages · Last {time}",
	"{count} 条消息 · 暂无发言": "{count} messages · No messages yet",
	"{count} 条消息": "{count} messages",
	"{count} 个": "{count}",

	"私密频道 · 消息在浏览器内使用口令加解密":
		"Private channel · Messages are encrypted and decrypted in your browser.",
	"公开频道 · 任何人都可以进入": "Public channel · Open to everyone",
	"私密频道缺少 id 或凭证，请从首页重新进入":
		"Missing channel ID or key. Please enter again from the home page.",
	"聊天记录不存在，可能是频道 id 或频道名有误":
		"Chat history not found. Check the channel ID or name.",
	"频道状态解密失败，可能是频道凭证错误":
		"Could not decrypt the channel. Check the channel key.",
	"频道已被创建者删除": "This channel was deleted by its creator.",
	"正在加载聊天记录…": "Loading messages…",
	"如果加载时间过长，则可能是页面不存在":
		"If this takes too long, the page may not exist.",
	"无法打开这个频道": "Cannot open this channel",
	"加载更早的消息": "Load earlier messages",
	"加载中……": "Loading…",
	"还没有消息，发第一条吧。": "No messages yet. Start the conversation.",
	"有 {count} 条新消息 ↓": "{count} new messages ↓",
	"一键到底 ↓": "Jump to latest ↓",
	"最后发言 {time}": "Last message {time}",
	"回到最新消息": "Jump to the latest message",
	"回到主页": "Back to home",
	"查看我的个人主页": "View my profile",
	"登录 / 注册": "Log in / Sign up",
	"输入消息，按 Shift+Enter 发送；支持 Markdown 与 LaTeX":
		"Type a message. Press Shift+Enter to send. Markdown and LaTeX are supported.",
	"Markdown / LaTeX 预览": "Markdown / LaTeX preview",
	"引用 {name}": "Quoting {name}",
	"取消引用": "Cancel quote",
	"每 {seconds} 秒自动刷新 · 当前身份：{name}":
		"Auto-refresh every {seconds}s · Signed in as {name}",
	"正在刷新…": "Refreshing…",
	"自动刷新失败，稍后会重试": "Auto-refresh failed. Retrying soon.",
	"已刷新": "Refreshed",
	"消息不能为空": "Message cannot be empty.",
	"消息已撤回": "Message recalled.",
	"消息已复制": "Message copied.",
	"复制失败，请手动选择": "Copy failed. Please select and copy manually.",
	"找不到被引用的消息": "Could not find the quoted message.",
	"已放回消息框，可修改后重新发送":
		"Restored to the composer. Edit it and send again.",
	"删除后会写入 deleted 标记，频道会从首页隐藏。只有创建者可以操作。":
		"Deleting hides this channel from the home page. Only the creator can do this.",
	"删除中…": "Deleting…",
	"频道已删除": "Channel deleted.",
	"只能删除自己创建的频道": "You can only delete channels you created.",
	"频道没有创建者标记，无法删除":
		"This channel has no creator record and cannot be deleted.",
	"只能撤回自己发送的消息": "You can only recall your own messages.",
	"消息不存在": "Message not found.",
	"私密频道缺少 id 或凭证": "Missing private channel ID or key.",
	"修改聊天昵称": "Change chat nickname",
	"新的昵称": "New nickname",
	"输入新的昵称": "Enter a new nickname",
	"昵称不能为空": "Nickname cannot be empty.",
	"昵称已更新": "Nickname updated.",
	"昵称已在本地更新（云端同步失败）":
		"Nickname updated locally (cloud sync failed).",
	"游客用户名由设备自动生成，登录后才能修改昵称":
		"Guest names are generated automatically. Log in to change your nickname.",
	"修改自动刷新间隔": "Change auto-refresh interval",
	"刷新间隔（秒，1-3600）": "Refresh interval (seconds, 1–3600)",
	"请输入 1-3600 之间的秒数": "Enter a number from 1 to 3600.",
	"刷新间隔已改为 {seconds} 秒": "Refresh interval set to {seconds}s.",
	"输入你想去的聊天室": "Enter a channel name",
	"前往": "Go",
	"该消息已被撤回": "This message was recalled.",
	"重新编辑": "Edit again",
	"引用的消息不在当前记录中":
		"The quoted message is not in the current history.",
	"[空消息]": "[Empty message]",
	"跳到被引用的消息": "Jump to the quoted message",
	"复制、引用或撤回": "Copy, quote, or recall",
	"消息操作": "Message actions",
	"查看 {user} 的个人主页": "View {user}'s profile",
	"匿名": "Anonymous",
	"拖动调整输入框高度": "Drag to resize the composer",
	"拖动调整输入框高度，双击恢复默认":
		"Drag to resize the composer; double-click to reset",

	"登录可选": "Optional login",
	"你已登录。账号仅用于保存昵称和个人资料，聊天、创建频道和上传文件无需登录。":
		"You are signed in. Your account only stores your nickname and profile; chatting, creating channels, and uploading files do not require login.",
	"账号：{username}": "Account: {username}",
	"编辑资料": "Edit profile",
	"无需登录即可使用全部功能。系统会自动分配设备游客名 Guest_<HASH>；登录后将使用账号昵称，并在本机记住 7 天。":
		"All features are available without logging in. A device guest name Guest_<HASH> is assigned automatically. After login, your account nickname is used and remembered on this device for 7 days.",
	"用户名": "Username",
	"密码": "Password",
	"确认密码": "Confirm password",
	"请输入用户名": "Please enter a username.",
	"请输入密码": "Please enter a password.",
	"中英文、数字和 _-.，最多 32 位":
		"Chinese/English letters, digits, _, -, . — up to 32 characters.",
	"至少 6 位": "At least 6 characters.",
	"请再次输入密码": "Re-enter your password.",
	"登录中……": "Logging in…",
	"注册中……": "Registering…",
	"注册并登录": "Register and log in",
	"不登录，以游客身份继续 →": "Continue as guest →",
	"登录成功": "Logged in.",
	"注册成功，已自动登录": "Registered and signed in.",
	"已退出登录": "Logged out.",
	"密码至少需要 6 位": "Password must be at least 6 characters.",
	"两次输入的密码不一致": "Passwords do not match.",
	"用户不存在或密码错误": "Incorrect username or password.",
	"该用户名已被注册": "This username is already taken.",
	"用户名只能包含中英文、数字和 _-.，长度 1-32":
		"Username may contain Chinese/English letters, digits, _, -, . and must be 1–32 characters.",
	"Guest_ 开头的用户名保留给自动游客身份":
		"Usernames starting with Guest_ are reserved for guest identities.",
	"请先登录自己的账号": "Please log in to your own account.",
	"找不到这个账号": "Account not found.",
	"缺少用户名": "Username is required.",
	"游客身份没有个人主页": "Guest identities do not have profiles.",
	"游客用户名由设备自动生成，登录后才能修改昵称":
		"Guest names are generated automatically. Log in to change your nickname.",

	"准备中……": "Preparing…",
	"读取频道 id": "Reading channel ID",
	"分配新的频道 id": "Allocating a new channel ID",
	"使用凭证加密初始消息": "Encrypting initial messages",
	"创建完成": "Done",
	"读取公开频道列表": "Reading public channel list",
	"把频道加入列表": "Adding channel to the list",
	"创建聊天记录文件": "Creating chat history",
	"写入欢迎消息": "Adding welcome message",
	"读取频道列表": "Reading channel list",
	"更新频道列表": "Updating channel list",
	"检查频道状态": "Checking channel status",
	"写入频道创建者标记": "Writing channel creator record",
	"分配频道 id": "Allocating a channel ID",
	"写入加密的频道创建者标记": "Writing encrypted creator record",
	"加密初始消息": "Encrypting initial messages",
	"完成": "Done",
	"缺少频道名称，请回到首页重新创建":
		"Missing channel name. Return home and try again.",
	"缺少凭证，请回到首页重新创建":
		"Missing channel key. Return home and try again.",
	"公开频道“{name}”已经创建好了，正在进入……":
		"Public channel “{name}” is ready. Entering…",
	"私密频道已创建。频道 id：{id}，凭证：{key}。请务必保存好这两项，正在进入……":
		"Private channel created. Channel ID: {id}; key: {key}. Save both; entering…",
	"创建失败": "Creation failed",
	"创建失败：": "Creation failed:",
	"频道 id 会写入仓库，凭证只用于浏览器内的消息加密。":
		"The channel ID is stored in the repository. The key is only used to encrypt messages in your browser.",
	"公开频道会出现在首页列表里，所有人都可以进入。":
		"Public channels appear on the home page and are open to everyone.",

	"文件会以 base64 形式保存到 Gitee 分片仓库（按 MD5 前两位选择 256 个仓库之一），上传后生成可直接引用的链接。":
		"Files are stored as Base64 in one of 256 Gitee shard repositories, chosen by the first two MD5 characters. A direct link is generated after upload.",
	"点击选择文件": "Click to choose a file",
	"单个文件不超过 100MB": "Up to 100 MB per file",
	"已选择：{info}": "Selected: {info}",
	"上传中……": "Uploading…",
	"开始上传": "Start upload",
	"读取中……": "Reading…",
	"计算 MD5 并编码……": "Calculating MD5 and encoding…",
	"上传完成": "Upload complete",
	"上传成功": "Uploaded.",
	"文件名已存在，仍然可以使用下面的链接。":
		"The file already exists. You can still use the link below.",
	"上传成功！": "Upload complete!",
	"上传失败（{status}）": "Upload failed ({status})",
	"复制下面的 Markdown 到聊天框即可引用：":
		"Copy the Markdown below into the composer to share it:",
	"复制 Markdown": "Copy Markdown",
	"复制链接": "Copy link",
	"提示：上传使用原项目的公开 Gitee API 令牌。请不要上传包含隐私信息的文件。":
		"Note: uploads use the public Gitee API token. Do not upload private information.",
	"上传失败": "Upload failed",
	"请先选择文件": "Choose a file first.",
	"文件不能超过 100MB": "Files must be smaller than 100 MB.",
	"读取文件失败": "Could not read the file.",
	"网络错误，上传失败": "Network error. Upload failed.",
	"上传已取消": "Upload cancelled.",
	"{label}已复制": "{label} copied.",
	"链接已复制": "Link copied.",
	"粘贴 Base64 上传": "Upload Base64",
	"把一段 Base64 文本按内容 MD5 前两位上传到对应的 Gitee 分片仓库并生成链接。":
		"Store Base64 text in the Gitee shard repository chosen by the first two characters of its MD5 hash.",
	"Base64 内容": "Base64 content",
	"在这里粘贴 Base64 内容": "Paste Base64 content here",
	"请先粘贴 Base64 内容": "Paste Base64 content first.",
	"上传成功！链接：": "Upload complete! Link:",
	"提示：Base64 内容会按 MD5 前两位保存到 256 个分片仓库之一，请不要上传隐私或敏感信息。":
		"Note: Base64 content is stored in one of 256 repositories based on the first two MD5 characters. Do not upload private or sensitive information.",

	"个人主页加载中……": "Loading profile…",
	"个人主页 · @{username}": "Profile · @{username}",
	"加入于 {date}": "Joined {date}",
	"这个人很懒，还没有写自我介绍。":
		"This user hasn't written a bio yet.",
	"无法打开个人主页": "Cannot open profile",
	"没有找到这个用户。": "User not found.",
	"未指定用户。": "No user specified.",
	"游客身份没有个人主页。登录真实账号后才能使用个人主页。":
		"Guest identities don't have profiles. Log in with a real account to use profiles.",
	"游客没有个人主页 · zyc2024 的聊天网页":
		"Guest has no profile · zyc2024 Chat",
	"用户不存在 · zyc2024 的聊天网页": "User not found · zyc2024 Chat",
	"{name} 的个人主页 · zyc2024 的聊天网页":
		"{name}'s profile · zyc2024 Chat",
	"{name} 的头像": "{name}'s avatar",
	"编辑头像、背景、自我介绍和侧边文字。":
		"Edit your avatar, header image, bio, and sidebar text.",
	"编辑个人资料需要登录账号。登录是可选的，不影响聊天和其他功能。":
		"You need an account to edit your profile. Login is optional elsewhere and does not affect chat or other features.",
	"当前账号：{username}。保存后会更新账号资料，并同步原项目的公开个人主页文件。":
		"Account: {username}. Saving updates your account profile and syncs the public profile file.",
	"查看主页": "View profile",
	"资料加载中……": "Loading profile…",
	"头像图片网址": "Avatar image URL",
	"留空会使用默认头像。": "Leave blank to use the default avatar.",
	"背景图片网址": "Header image URL",
	"显示在个人主页背景，留空会使用默认背景。":
		"Shown as the profile background. Leave blank for the default.",
	"自我介绍（支持 Markdown / LaTeX）": "Bio (Markdown / LaTeX supported)",
	"介绍一下自己吧": "Tell people about yourself",
	"侧边文字（支持 Markdown / LaTeX）":
		"Sidebar text (Markdown / LaTeX supported)",
	"显示在个人主页左侧的文字":
		"Text shown on the left side of your profile",
	"保存资料": "Save profile",
	"实时预览": "Live preview",
	"还没有填写自我介绍。": "No bio yet.",
	"还没有填写侧边文字。": "No sidebar text yet.",
	"个人资料已保存": "Profile saved.",
	"账号资料已保存，但公开主页同步失败，稍后会显示账号里的资料":
		"Account profile saved, but the public profile sync failed. Your account profile will be shown later.",

	"按标签筛选更新记录": "Filter changelog by tag",
	"没有匹配这个标签的更新记录。": "No entries match this tag.",
	"点击标签可以筛选。标签的文字、颜色和背景色可以在 src/data/changelog.js 中自定义。":
		"Click a tag to filter. Tag labels, colors, and backgrounds can be customized in src/data/changelog.js.",
	"筛选标签：{label}": "Filter by tag: {label}",
	"英文界面和标签由 AI 翻译，历史更新描述保留原始中文。":
		"The English interface and tag names are AI-translated. Historical release notes remain in their original Chinese.",
	"使用AI": "AI-assisted",
	"旧版": "Legacy",
	"最新版": "Latest",
	"抱歉，您访问的页面不存在。":
		"Sorry, this page does not exist.",
	"已登录：{name}": "Signed in: {name}",
	"自动登录：{name}": "Guest: {name}",
	"游客用户名由设备信息自动生成，没有对应的个人主页":
		"Guest names are generated from this device and have no profile.",
	"账号登录": "Log in",
	"已退出账号，已自动切换为游客身份":
		"Logged out. Switched to a guest identity.",

	"读取文件失败（{status}）": "Could not read file ({status})",
	"保存文件失败（{status}）": "Could not save file ({status})",
	"创建文件失败（{status}）": "Could not create file ({status})",
	"文件 {path} 不是有效的 JSON": "File {path} is not valid JSON",
	"频道 id 文件内容无效": "The channel ID file is invalid.",
	"无法读取频道 id 文件": "Could not read the channel ID file.",
	"频道 id 冲突，请重试": "Channel ID conflict. Try again.",
	"聊天记录不存在": "Chat history not found.",
	"文件 hash 必须是 32 位 MD5": "The file hash must be a 32-character MD5.",
	"缺少频道创建者信息": "Channel creator information is missing.",
	"缺少私密频道 id": "Private channel ID is missing.",
	"私密频道缺少 id": "Private channel ID is missing.",
	"频道名称不能为空": "Channel name cannot be empty.",
	"凭证不能为空": "Channel key cannot be empty.",
	"读取个人资料失败：{message}": "Could not load profile: {message}",
	"加密数据格式不受支持或已损坏":
		"The encrypted data format is unsupported or corrupted.",
	"无法解密，可能是凭证错误":
		"Could not decrypt the data. Check the channel key.",
};

function normalizeLocale(value) {
	return String(value || "").toLowerCase().startsWith("en") ? "en" : "zh-CN";
}

function detectLocale() {
	try {
		const stored = localStorage.getItem(LOCALE_KEY);
		if (stored === "zh-CN" || stored === "en") return stored;
	} catch (e) {
		// ignore
	}
	if (typeof navigator !== "undefined" && navigator.language) {
		return normalizeLocale(navigator.language);
	}
	return "zh-CN";
}

export const locale = ref(detectLocale());
export const isEnglish = computed(() => locale.value === "en");
export const isAiTranslation = computed(() => locale.value === "en");

function interpolate(text, params) {
	if (!params) return text;
	return String(text).replace(/\{(\w+)\}/g, (match, key) =>
		params[key] === undefined ? match : String(params[key]),
	);
}

export function t(key, params) {
	const source = String(key ?? "");
	const translated =
		locale.value === "en" && Object.hasOwn(english, source)
			? english[source]
			: source;
	return interpolate(translated, params);
}

export function setLocale(next) {
	const normalized = next === "en" ? "en" : "zh-CN";
	locale.value = normalized;
	try {
		localStorage.setItem(LOCALE_KEY, normalized);
	} catch (e) {
		// ignore
	}
	if (typeof document !== "undefined") {
		document.documentElement.lang = normalized;
	}
}

if (typeof document !== "undefined") {
	document.documentElement.lang = locale.value;
}
