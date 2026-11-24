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
	"个性设置": "Appearance",
	"主题商店": "Theme store",
	"好友": "Friends",
	"好友列表和私信仅限登录用户使用。":
		"Friend lists and private messages are available to signed-in users only.",
	"选择好友开始私信": "Choose a friend to start messaging",
	"好友加载中……": "Loading friends…",
	"还没有好友，输入用户名添加一个吧。":
		"No friends yet. Add one by username below.",
	"输入用户名添加好友": "Enter a username to add a friend",
	"添加中……": "Adding…",
	"添加好友": "Add friend",
	"私信加载中……": "Loading private messages…",
	"还没有私信，发第一条吧。":
		"No private messages yet. Send the first one.",
	"输入私信，按 Shift+Enter 发送；支持 Markdown 与 LaTeX":
		"Type a private message. Press Shift+Enter to send. Markdown and LaTeX are supported.",
	"选择一位好友开始私信": "Choose a friend to start messaging",
	"加好友": "Add friend",
	"已添加好友": "Friend added.",
	"只能添加真实登录用户为好友":
		"Only registered accounts can be added as friends.",
	"不能添加自己为好友": "You cannot add yourself as a friend.",
	"好友列表已满": "Your friend list is full.",
	"好友列表更新失败": "Could not update the friend list.",
	"你们还不是好友": "You are not friends yet.",
	"好友消息发送失败": "Could not send the private message.",
	"好友申请": "Friend requests",
	"好友申请已发送，等待对方通过":
		"Friend request sent. Waiting for approval.",
	"已通过 {name} 的好友申请": "Accepted {name}'s friend request.",
	"已拒绝好友申请": "Friend request declined.",
	"好友申请过多，请稍后再试":
		"Too many friend requests. Please try again later.",
	"好友申请不存在或已处理":
		"The friend request does not exist or has already been handled.",
	"你们已经是好友": "You are already friends.",
	"通过": "Accept",
	"拒绝": "Decline",
	"名片": "Contact card",
	"发送名片": "Send contact card",
	"名片已发送": "Contact card sent.",
	"名片信息不完整": "The contact card is incomplete.",
	"分享名片：{name}": "Shared contact card: {name}",
	"选择一个好友的名片，发送给当前私信对象。":
		"Choose a friend's contact card to send in this conversation.",
	"没有其他好友可以分享名片。": "No other friends available to share.",
	"收到的名片": "Received cards",
	"已是好友": "Already friends",
	"资料更新失败": "Could not update profile.",
	"私信": "Private message",
	"群组": "Groups",
	"群聊": "Group chat",
	"加入一个公开频道，或创建私有频道和群组":
		"Join a public channel, or create a private channel or group.",
	"创建群组": "Create group",
	"输入群组名称": "Group name",
	"请输入群组名称": "Please enter a group name.",
	"我的群组": "My groups",
	"群主 · 点击进入": "Owner · Click to open",
	"成员 · 点击进入": "Member · Click to open",
	"群组加载中……": "Loading groups…",
	"还没有加入群组，创建一个吧。":
		"You have not joined any groups. Create one below.",
	"创建群组后可以邀请好友，或复制邀请链接发给其他人，点击链接即可加入。登录后才能邀请好友；群组消息使用群凭证加密。":
		"Create a group, invite friends, or share an invite link. Anyone who opens the link can join. Sign in to invite friends. Group messages are encrypted with the group key.",
	"群组 · {count} 位成员 · 消息在浏览器内加密":
		"Group · {count} members · Messages are encrypted in the browser",
	"群组 · 正在读取群组信息…": "Group · Loading group info…",
	"群组缺少 id 或邀请凭证，请重新打开邀请链接":
		"The group id or invite key is missing. Open the invite link again.",
	"群组信息": "Group info",
	"群组已删除": "Group deleted.",
	"已加入群组“{name}”": "Joined the group “{name}”.",
	"邀请链接已复制": "Invite link copied.",
	"分享频道链接": "Share channel link",
	"链接包含频道 id 和凭证，拿到链接的人可以进入私密频道，请只分享给信任的人。":
		"The link contains the channel id and key. Anyone with the link can enter the private channel, so share it only with people you trust.",
	"任何拿到链接的人都可以进入这个公开频道。":
		"Anyone with the link can enter this public channel.",
	"复制失败，请手动复制": "Copy failed. Please copy it manually.",
	"邀请你加入群组「{name}」：{link}":
		"You're invited to join the group “{name}”: {link}",
	"已邀请 {name} 加入群组": "{name} was invited to the group.",
	"{name} 已经在群组里了": "{name} is already in the group.",
	"{count} 位成员": "{count} members",
	"复制邀请链接": "Copy invite link",
	"邀请链接": "Invite link",
	"其他人打开这个链接后会自动加入群组，并能在首页看到群组。":
		"Anyone who opens this link joins the group automatically and can see it on the home page.",
	"成员（{count}）": "Members ({count})",
	"群主": "Owner",
	"正在读取群组成员……": "Loading group members…",
	"邀请好友": "Invite friends",
	"登录后才能邀请好友进群。": "Sign in to invite friends.",
	"没有可邀请的好友。": "No friends available to invite.",
	"邀请中……": "Inviting…",
	"邀请": "Invite",
	"删除群组": "Delete group",
	"删除后会写入 deleted 标记，群组将无法继续进入。只有群主可以操作。":
		"Deleting writes a deleted marker; the group can no longer be opened. Only the owner can do this.",
	"群组名称不能为空": "Group name cannot be empty.",
	"缺少群组创建者信息": "Missing group creator.",
	"无法读取群组 id 文件": "Could not read the group id file.",
	"群组 id 文件内容无效": "The group id file is invalid.",
	"群组 id 冲突，请重试": "Group id conflict. Please try again.",
	"群组列表更新失败": "Could not update the group list.",
	"群组缺少 id 或凭证": "The group id or key is missing.",
	"频道缺少 id": "Channel id is missing.",
	"频道缺少 id 或凭证": "Channel id or key is missing.",
	"群组信息不存在或邀请链接已失效":
		"Group info not found or the invite link has expired.",
	"群组凭证错误，无法读取群组信息":
		"Wrong group key; cannot read group info.",
	"群组信息更新失败": "Could not update group info.",
	"缺少当前用户信息": "Missing current user.",
	"缺少好友信息": "Missing friend info.",
	"未命名群组": "Unnamed group",
	"群组“{name}”已创建": "Group “{name}” was created.",
	"在群组信息里邀请好友，或复制邀请链接发给其他人，点击链接即可加入。":
		"Invite friends from Group info, or share the invite link. Anyone with the link can join.",
	"读取群组 id": "Reading group id",
	"写入群组创建者标记": "Writing the group owner marker",
	"加密群组聊天记录": "Encrypting group chat",
	"加密群组信息": "Encrypting group info",
	"写入我的群组列表": "Adding to my groups",
	"缺少群组名称，请回到首页重新创建":
		"Missing group name. Go back home and create again.",
	"群组“{name}”已经创建好了。可以在群组信息里邀请好友或复制邀请链接，正在进入……":
		"Group “{name}” is ready. Use Group info to invite friends or copy the invite link. Opening it now…",
	"群组消息使用群凭证加密。创建后可以邀请好友，或分享邀请链接让其他人加入。":
		"Group messages are encrypted with the group key. After creating a group, invite friends or share the invite link.",
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
	"LaTeX 辅助编辑": "LaTeX helper",
	"点击模板插入到光标位置；先选中文字再点击，可以把选中内容放进公式。":
		"Click a template to insert it at the cursor. Select text first to place it inside the formula.",
	"常用公式": "Common formulas",
	"公式结构": "Structures",
	"希腊字母": "Greek letters",
	"运算符": "Operators",
	"行内公式": "Inline math",
	"独立公式": "Display math",
	"分数": "Fraction",
	"根号": "Square root",
	"上标": "Superscript",
	"下标": "Subscript",
	"求和": "Summation",
	"积分": "Integral",
	"极限": "Limit",
	"向量": "Vector",
	"矩阵": "Matrix",
	"分段函数": "Piecewise function",
	"对齐环境": "Aligned equations",
	"公式外自动补全 $，块公式使用 $$":
		"Adds $ automatically outside math; block formulas use $$.",
	"搜索符号或命令": "Search symbols or commands",
	"公式分类": "Formula categories",
	"没有匹配的公式": "No matching formulas.",
	"当前在行内公式中，点击直接插入":
		"Inside inline math; click to insert directly.",
	"当前在块公式中，点击直接插入":
		"Inside display math; click to insert directly.",
	"当前不在公式中，点击会自动补全 $":
		"Outside math; $ delimiters will be added automatically.",
	"行列式": "Determinant",
	"组合数": "Binomial coefficient",
	"n 次根": "nth root",
	"上下标": "Sub/superscript",
	"绝对值": "Absolute value",
	"增广矩阵": "Augmented matrix",
	"连乘": "Product",
	"二重积分": "Double integral",
	"方程组": "System of equations",
	"导数": "Derivative",
	"偏导": "Partial derivative",
	"梯度": "Gradient",
	"散度": "Divergence",
	"旋度": "Curl",
	"拉普拉斯": "Laplacian",
	"定积分": "Definite integral",
	"不定积分": "Indefinite integral",
	"级数": "Series",
	"上极限": "Limit superior",
	"下极限": "Limit inferior",
	"重音与修饰": "Accents",
	"箭头": "Arrows",
	"微积分": "Calculus",
	"横线": "Bar",
	"帽子": "Hat",
	"双点": "Double dot",
	"波浪": "Tilde",
	"上划线": "Overline",
	"下划线": "Underline",
	"上括号": "Overbrace",
	"下括号": "Underbrace",
	"括号": "Brackets",
	"圆括号": "Parentheses",
	"方括号": "Square brackets",
	"花括号": "Braces",
	"尖括号": "Angle brackets",
	"范数": "Norm",
	"取整": "Floor",
	"上取整": "Ceiling",
	"函数": "Functions",
	"正弦": "Sine",
	"余弦": "Cosine",
	"正切": "Tangent",
	"对数": "Logarithm",
	"自然对数": "Natural log",
	"指数": "Exponential",
	"最大值": "Maximum",
	"最小值": "Minimum",
	"最大公约数": "GCD",
	"取模": "Modulo",
	"字体": "Fonts",
	"黑板粗体": "Blackboard bold",
	"花体": "Calligraphic",
	"粗体": "Bold",
	"斜体": "Italic",
	"正体": "Roman",
	"文本": "Text",
	"无衬线": "Sans-serif",
	"等宽": "Monospace",
	"间距与排版": "Spacing & layout",
	"小空格": "Thin space",
	"中空格": "Medium space",
	"大空格": "Thick space",
	"负空格": "Negative space",
	"全角空格": "Quad space",
	"双全角空格": "Double quad",
	"换行": "Line break",
	"对齐": "Alignment",
	"显示上下限": "Show limits",
	"取消上下限": "Hide limits",
	"其他符号": "Other symbols",
	"无穷": "Infinity",
	"空集": "Empty set",
	"角": "Angle",
	"度": "Degree",
	"撇": "Prime",
	"省略号": "Ellipsis",
	"居中省略号": "Centered ellipsis",
	"竖省略号": "Vertical ellipsis",
	"斜省略号": "Diagonal ellipsis",
	"所以": "Therefore",
	"因为": "Because",
	"约化普朗克常数": "Reduced Planck constant",
	"脚本 l": "Script l",
	"实部": "Real part",
	"虚部": "Imaginary part",

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
	"调整颜色和背景，保存在本机或同步到账号。":
		"Adjust colors and backgrounds, save them locally, or sync them to your account.",
	"主题预览": "Theme preview",
	"这是个性设置的应用效果预览。":
		"This is a preview of your appearance settings.",
	"按钮示例": "Button",
	"颜色": "Colors",
	"强调色": "Accent color",
	"页面背景": "Page background",
	"卡片背景": "Card background",
	"文字颜色": "Text color",
	"次要文字": "Muted text",
	"边框颜色": "Border color",
	"聊天背景": "Chat background",
	"消息背景": "Message background",
	"背景图片": "Background image",
	"背景图片网址": "Background image URL",
	"背景遮罩：{value}": "Background overlay: {value}",
	"开启背景图片后，可以调整遮罩让文字更清晰。":
		"After setting a background image, adjust the overlay to keep text readable.",
	"内置预设": "Built-in presets",
	"已应用预设：{name}": "Applied preset: {name}",
	"保存与同步": "Save and sync",
	"保存到本地只影响这台设备；同步到账号后可以在其他设备读取。":
		"Saving locally only affects this device. Sync to your account to load it on other devices.",
	"保存到本地": "Save locally",
	"同步到账号": "Sync to account",
	"从账号读取": "Load from account",
	"打开主题商店": "Open theme store",
	"同步中……": "Syncing…",
	"读取中……": "Loading…",
	"同步到账号需要先登录。": "Log in to sync to your account.",
	"主题已保存到本地": "Theme saved locally.",
	"主题已同步到账号": "Theme synced to your account.",
	"账号还没有保存主题": "No theme is saved in your account yet.",
	"已从账号读取主题": "Theme loaded from your account.",
	"上传到主题商店": "Upload to theme store",
	"所有主题免费，不需要购买。上传后会出现在公开主题商店中。":
		"All themes are free. Uploaded themes appear in the public theme store.",
	"主题名称": "Theme name",
	"上传当前主题": "Upload current theme",
	"主题已上传到商店": "Theme uploaded to the store.",
	"主题名称不能为空": "Theme name cannot be empty.",
	"主题商店已满，请稍后再试":
		"The theme store is full. Please try again later.",
	"默认绿": "Default green",
	"森林绿": "Forest green",
	"海洋蓝": "Ocean blue",
	"樱花粉": "Sakura pink",
	"暖阳橙": "Sunset orange",
	"薰衣草": "Lavender",
	"所有主题免费，选择喜欢的主题应用到本机。":
		"All themes are free. Choose one to apply locally.",
	"返回个性设置": "Back to appearance",
	"刷新列表": "Refresh list",
	"上传主题": "Upload theme",
	"主题列表加载中……": "Loading themes…",
	"暂无社区主题，去个性设置上传第一个吧。":
		"No community themes yet. Upload the first one from Appearance.",
	"应用主题": "Apply theme",
	"主题已应用并保存到本地":
		"Theme applied and saved locally.",
	"最新一个非 beta 版本": "Latest non-beta version",
	"当前正在使用的 app 版本": "Currently running app version",
	"网页当前最新版本": "Latest web version",
	"发现新版本 {version}": "New version available: {version}",
	"当前版本：{version}": "Current version: {version}",
	"下载更新": "Download update",
	"查看更新说明": "View release notes",
	"稍后": "Later",
	"检查更新失败（{status}）": "Update check failed ({status})",
	"版本号前的 * 表示该版本使用 AI 辅助开发。":
		"A * before the version number means the version was developed with AI assistance.",
	"时间": "Time",
	"【数据丢失】": "[DATA LOST]",
	"正在获取远端更新日志…": "Loading remote changelog…",
	"已加载远端更新日志": "Remote changelog loaded.",
	"远端更新日志不可用，显示本地版本":
		"Remote changelog unavailable. Showing the local version.",
	"拍一拍": "Nudge",
	"设置别人拍你时显示的后缀，例如“的小脑袋”，预览：{example}":
		"Set the suffix shown when someone nudges you, for example “'s little head”. Preview: {example}",
	"的肩膀": "'s shoulder",
	"{name} 拍了拍你{suffix}": "{name} nudged you{suffix}",
	"{from} 拍了拍 {to}{suffix}": "{from} nudged {to}{suffix}",
	"输入拍一拍后缀，例如：的小脑袋":
		"Enter a nudge suffix, for example: 's little head",
	"保存拍一拍": "Save nudge",
	"拍一拍内容已保存": "Nudge text saved.",
	"拍一拍设置需要登录账号。": "Log in to customize your nudge text.",
	"拍一拍中……": "Nudging…",
	"已拍一拍 {name}": "Nudged {name}.",
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
