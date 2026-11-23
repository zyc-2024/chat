import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { changelog } from "./src/data/changelog.js";
import {
	createPrivateChannel,
	createPublicChannel,
	deleteChannel,
	fetchPublicChannelSummaries,
	getChannelStatus,
	readChannel,
	recallChannelMessage,
	sendChannelMessage,
} from "./src/services/chat.js";
import {
	decodeBase64,
	fileRepoApi,
	fileRepoFullName,
	fileShard,
	rewriteLegacyFileUrl,
	rewriteLegacyFileUrls,
} from "./src/services/gitee.js";
import { isAdminUsername } from "./src/services/auth.js";
import {
	latestReleaseFrom,
	parseReleaseVersion,
	updateAvailable,
} from "./src/services/appUpdate.js";
import {
	findLatestStableEntry,
	findNowEntry,
	isBetaVersion,
} from "./src/lib/changelogMeta.js";
import {
	addFriend,
	friendConversationPath,
	loadFriendMessages,
	loadFriends,
	sendFriendMessage,
	sendFriendNudge,
} from "./src/services/friends.js";
import { fetchNudgeSuffix } from "./src/services/nudge.js";
import { setLocale, t } from "./src/i18n/index.js";

// CI 的 Node 可能带有英文 navigator；服务层错误断言依赖默认中文。
setLocale("zh-CN");

assert.equal(
	fileShard("42e874ae9692483e15ef9c9d0b6a5f8e"),
	"42",
);
assert.equal(
	fileRepoFullName("42e874ae9692483e15ef9c9d0b6a5f8e"),
	"zyc-2024/chat-files-42",
);
assert.equal(
	fileRepoApi("ABCDEF0123456789ABCDEF0123456789"),
	"https://gitee.com/api/v5/repos/zyc-2024/chat-files-ab",
);
assert.throws(() => fileShard("not-a-hash"), /32 位 MD5/);
const legacyFileUrl =
	"https://gitee.com/api/v5/repos/zyc-2024/chat/raw/f%2F42e874ae9692483e15ef9c9d0b6a5f8e%2FIMG_6854.jpeg?access_token=abc";
assert.equal(
	rewriteLegacyFileUrl(legacyFileUrl),
	"https://gitee.com/api/v5/repos/zyc-2024/chat-files-42/raw/f%2F42e874ae9692483e15ef9c9d0b6a5f8e%2FIMG_6854.jpeg?access_token=abc",
);
assert.equal(
	rewriteLegacyFileUrls(`a ${legacyFileUrl} b`),
	`a https://gitee.com/api/v5/repos/zyc-2024/chat-files-42/raw/f%2F42e874ae9692483e15ef9c9d0b6a5f8e%2FIMG_6854.jpeg?access_token=abc b`,
);
assert.equal(
	rewriteLegacyFileUrl("https://example.com/file.png"),
	"https://example.com/file.png",
);
assert.equal(isAdminUsername("ChattingSuperAdmin"), true);
assert.equal(isAdminUsername("ChattingSuperAdmin "), false);
assert.equal(isAdminUsername("zyc2024"), false);
assert.equal(isAdminUsername(""), false);

setLocale("en");
assert.equal(t("返回首页"), "Back to home");
assert.equal(t("{count} 条消息", { count: 2 }), "2 messages");
assert.equal(t("未知的提示"), "未知的提示");
setLocale("zh-CN");
assert.equal(t("返回首页"), "返回首页");

const sampleVersions = [
	{ version: "3.9.0 beta 1 (223)" },
	{ version: "3.8.0 (222)" },
	{ version: "3.7.0 beta 1 (219)" },
];
assert.equal(isBetaVersion("3.9.0 beta 1 (223)"), true);
assert.equal(findNowEntry(sampleVersions).version, "3.9.0 beta 1 (223)");
assert.equal(
	findNowEntry(sampleVersions, "3.8.0 (222)").version,
	"3.8.0 (222)",
);
assert.equal(
	findLatestStableEntry(sampleVersions).version,
	"3.8.0 (222)",
);
assert.equal(findNowEntry(changelog).version, "3.9.1 (226)");
assert.equal(
	findLatestStableEntry(changelog).version,
	"3.9.1 (226)",
);

const releaseA = parseReleaseVersion({
	name: "3.9.0 beta 1 (224)",
	tag_name: "v3.9.0-beta.1",
	html_url: "https://example.com/beta",
	assets: [
		{
			name: "zyc-chat-3.9.0-beta.1.exe",
			browser_download_url: "https://example.com/beta.exe",
		},
	],
});
const releaseB = parseReleaseVersion({
	name: "3.8.2 (225)",
	tag_name: "v3.8.2-225",
	html_url: "https://example.com/stable",
	assets: [],
});
assert.equal(releaseA.build, 224);
assert.equal(releaseA.beta, true);
assert.equal(releaseA.downloadUrl, "https://example.com/beta.exe");
assert.equal(
	latestReleaseFrom([
		{ name: "3.9.0 beta 1 (224)", tag_name: "v3.9.0-beta.1" },
		{ name: "3.8.2 (225)", tag_name: "v3.8.2-225" },
	]).build,
	225,
);
assert.equal(updateAvailable(223, releaseB), true);
assert.equal(updateAvailable(225, releaseB), false);

const files = new Map();
let shaCounter = 0;

function put(path, content) {
	const sha = `sha-${++shaCounter}`;
	files.set(path, { content, sha });
	return sha;
}

globalThis.fetch = async (url, options = {}) => {
	const parsed = new URL(url);
	const marker = "/contents/";
	const rawPath = parsed.pathname.split(marker)[1] || "";
	const path = decodeURIComponent(rawPath);
	const method = (options.method || "GET").toUpperCase();
	if (method === "GET") {
		const file = files.get(path);
		if (!file) return new Response("{}", { status: 404 });
		return Response.json({
			sha: file.sha,
			content: Buffer.from(file.content, "utf8").toString("base64"),
		});
	}
	const body = JSON.parse(options.body);
	const content = decodeBase64(body.content);
	if (method === "POST") {
		if (files.has(path)) {
			return Response.json({ message: "文件已存在" }, { status: 400 });
		}
		put(path, content);
		return Response.json({ content: { path } }, { status: 201 });
	}
	if (method === "PUT") {
		const current = files.get(path);
		if (current && body.sha && body.sha !== current.sha) {
			return Response.json({ message: "sha mismatch" }, { status: 409 });
		}
		put(path, content);
		return Response.json({ content: { path } }, { status: 200 });
	}
	return new Response("bad", { status: 500 });
};

put("private/id.json", "7");

const alice = { name: "Alice", type: "user" };
const bob = { name: "Bob", type: "guest" };

const progress = [];
const pub = await createPublicChannel(
	"测试频道",
	"Alice",
	(value, text) => progress.push([value, text]),
	alice,
);
assert.equal(pub.channel, "测试频道");

const index = JSON.parse(files.get("public/index.json").content);
assert.deepEqual(index.ch, [encodeURIComponent("测试频道")]);

const publicStatusPath = "status/public/测试频道.json";
const publicStatusRaw = files.get(publicStatusPath).content;
assert.match(publicStatusRaw, /Alice/);
assert.equal(JSON.parse(publicStatusRaw).deleted, false);

const publicStatus = await getChannelStatus({ type: "u", ch: "测试频道" });
assert.equal(publicStatus.data.owner, "Alice");
assert.equal(publicStatus.data.ownerType, "user");
assert.equal(publicStatus.data.messageCount, 1);
assert.ok(publicStatus.data.lastMessageTime);

const first = await readChannel({ type: "u", ch: "测试频道" });
assert.equal(first.messages.length, 1);
assert.match(first.messages[0].content, /Created channel/);
assert.equal(first.status.owner, "Alice");
assert.ok(first.messages[0].hash);
assert.equal(first.messages[0].quote, null);

const afterSend = await sendChannelMessage(
	{ type: "u", ch: "测试频道" },
	{
		name: "Alice",
		user: "Alice",
		time: "20260101 00:00:00",
		ts: Date.now(),
		recalled: false,
		content: "hello",
	},
);
assert.equal(afterSend.length, 2);
assert.equal(afterSend[1].content, "hello");
assert.equal(afterSend[0].hash, first.messages[0].hash);
assert.ok(afterSend[1].hash);
assert.notEqual(afterSend[0].hash, afterSend[1].hash);
assert.equal(afterSend[1].quote, null);

const quotedSend = await sendChannelMessage(
	{ type: "u", ch: "测试频道" },
	{
		name: "Bob",
		user: "Bob",
		time: "20260101 00:01:00",
		ts: Date.now(),
		quote: {
			hash: afterSend[1].hash,
			name: "Alice",
			content: "引用时不应复制原消息内容",
		},
		recalled: false,
		content: "reply with quote",
	},
);
assert.equal(quotedSend.length, 3);
assert.equal(quotedSend[2].quote.hash, afterSend[1].hash);
assert.equal(quotedSend[2].quote.name, "Alice");
assert.equal(quotedSend[2].quote.content, undefined);
assert.ok(quotedSend[2].hash);

const publicStatusAfterSend = await getChannelStatus({
	type: "u",
	ch: "测试频道",
});
assert.equal(publicStatusAfterSend.data.messageCount, 3);

const recallByOther = await recallChannelMessage(
	{ type: "u", ch: "测试频道" },
	1,
	{ name: "Bob", type: "user" },
).then(
	() => null,
	(error) => error,
);
assert.ok(recallByOther instanceof Error);
assert.match(recallByOther.message, /只能撤回自己发送的消息/);

const publicRecalled = await recallChannelMessage(
	{ type: "u", ch: "测试频道" },
	1,
	{ name: "Bob", type: "user", admin: true },
);
assert.equal(publicRecalled[1].recalled, true);
assert.equal(publicRecalled[1].user, "Alice");
const publicAfterRecall = await readChannel({
	type: "u",
	ch: "测试频道",
});
assert.equal(publicAfterRecall.messages[1].recalled, true);
assert.equal(publicAfterRecall.messages[1].content, "hello");
assert.equal(publicAfterRecall.messages[1].hash, afterSend[1].hash);
assert.equal(publicAfterRecall.messages[2].quote.hash, afterSend[1].hash);

const publicSummaries = await fetchPublicChannelSummaries([
	encodeURIComponent("测试频道"),
]);
assert.equal(
	publicSummaries.get(encodeURIComponent("测试频道")).messageCount,
	3,
);

const legacyPath = "public/msg/测试频道.json";
const legacyData = JSON.parse(files.get(legacyPath).content);
delete legacyData.msg[2].hash;
files.set(legacyPath, {
	content: JSON.stringify(legacyData),
	sha: files.get(legacyPath).sha,
});
const legacyReadA = await readChannel({ type: "u", ch: "测试频道" });
const legacyReadB = await readChannel({ type: "u", ch: "测试频道" });
assert.ok(legacyReadA.messages[2].hash);
assert.equal(
	legacyReadA.messages[2].hash,
	legacyReadB.messages[2].hash,
);
assert.equal(legacyReadA.messages[2].quote.hash, afterSend[1].hash);
assert.equal(legacyReadA.messages[2].quote.content, undefined);

const priv = await createPrivateChannel("secret-key", "Bob", () => {}, bob);
assert.equal(priv.id, 8);
assert.equal(files.get("private/id.json").content, "8");
assert.ok(!files.get("private/msg/8_"));

const privateStatusPath = "status/private/8.json";
const privateStatusRaw = files.get(privateStatusPath).content;
assert.ok(!privateStatusRaw.includes("Bob"));
assert.equal(JSON.parse(privateStatusRaw).version, 1);

const privateStatus = await getChannelStatus({
	type: "r",
	id: "8",
	key: "secret-key",
});
assert.equal(privateStatus.data.owner, "Bob");
assert.equal(privateStatus.data.ownerType, "guest");
assert.equal(privateStatus.data.messageCount, 3);
assert.ok(privateStatus.data.lastMessageTime);

const privRead = await readChannel({
	type: "r",
	id: "8",
	key: "secret-key",
});
assert.equal(privRead.messages.length, 3);
assert.match(privRead.messages[1].content, /Key: secret-key/);
assert.equal(privRead.status.owner, "Bob");

const privSend = await sendChannelMessage(
	{ type: "r", id: "8", key: "secret-key" },
	{
		name: "Bob",
		user: "Bob",
		time: "20260101 00:00:00",
		ts: Date.now(),
		recalled: false,
		content: "secret",
	},
);
assert.equal(privSend.length, 4);
assert.equal(privSend[3].content, "secret");
assert.ok(privSend[3].hash);
assert.equal(privSend[3].quote, null);

const privateQuoted = await sendChannelMessage(
	{ type: "r", id: "8", key: "secret-key" },
	{
		name: "Bob",
		user: "Bob",
		time: "20260101 00:01:00",
		ts: Date.now(),
		quote: { hash: privSend[3].hash, name: "Bob" },
		recalled: false,
		content: "private reply with quote",
	},
);
assert.equal(privateQuoted.length, 5);
assert.equal(privateQuoted[4].quote.hash, privSend[3].hash);
assert.ok(privateQuoted[4].hash);
const encryptedPrivatePath = [...files.keys()].find((path) =>
	path.startsWith("private/msg/8_"),
);
assert.ok(
	!files.get(encryptedPrivatePath).content.includes("private reply with quote"),
);

const privateStatusAfterSend = await getChannelStatus({
	type: "r",
	id: "8",
	key: "secret-key",
});
assert.equal(privateStatusAfterSend.data.messageCount, 5);

const privateRecalled = await recallChannelMessage(
	{ type: "r", id: "8", key: "secret-key" },
	3,
	bob,
);
assert.equal(privateRecalled[3].recalled, true);
const privateAfterRecall = await readChannel({
	type: "r",
	id: "8",
	key: "secret-key",
});
assert.equal(privateAfterRecall.messages[3].recalled, true);
assert.equal(privateAfterRecall.messages[3].content, "secret");
assert.equal(privateAfterRecall.messages[3].hash, privSend[3].hash);
assert.equal(privateAfterRecall.messages[4].quote.hash, privSend[3].hash);

const wrongKey = await readChannel({
	type: "r",
	id: "8",
	key: "wrong",
}).then(
	() => null,
	(error) => error,
);
assert.ok(wrongKey instanceof Error);
assert.match(wrongKey.message, /频道状态解密失败/);

const privatePath = [...files.keys()].find((path) =>
	path.startsWith("private/msg/8_"),
);
files.set(privatePath, {
	content: JSON.stringify({
		version: 1,
		salt: "00".repeat(16),
		iv: "00".repeat(16),
		data: "AAAA",
	}),
	sha: "corrupt",
});
const corrupt = await readChannel({
	type: "r",
	id: "8",
	key: "secret-key",
}).then(
	() => null,
	(error) => error,
);
assert.ok(corrupt instanceof Error);
assert.match(corrupt.message, /无法解密/);

const friendAccountHash = createHash("sha256")
	.update("zyc2024-chat-auth-v1:user:FriendUser")
	.digest("hex");
put(
	`private/user_${friendAccountHash}.json`,
	JSON.stringify({
		username: "FriendUser",
		settings: { lastName: "Friend User", nudge: "的小脑袋" },
		profile: { username: "FriendUser" },
	}),
);
const friendMe = { username: "TestUser", name: "Tester" };
const addedFriend = await addFriend(friendMe, "FriendUser");
assert.equal(addedFriend.username, "FriendUser");
assert.equal(addedFriend.name, "Friend User");
const myFriends = await loadFriends("TestUser");
assert.ok(myFriends.some((item) => item.username === "FriendUser"));
const theirFriends = await loadFriends("FriendUser");
assert.ok(theirFriends.some((item) => item.username === "TestUser"));
const emptyFriendMessages = await loadFriendMessages(friendMe, "FriendUser");
assert.equal(emptyFriendMessages.length, 0);
const sentFriendMessages = await sendFriendMessage(
	friendMe,
	"FriendUser",
	"hello friend",
);
assert.equal(sentFriendMessages.length, 1);
assert.equal(sentFriendMessages[0].user, "TestUser");
const friendMessages = await loadFriendMessages(friendMe, "FriendUser");
assert.equal(friendMessages.length, 1);
assert.equal(friendMessages[0].content, "hello friend");
assert.equal(
	friendConversationPath("TestUser", "FriendUser").startsWith(
		"friends/msg/",
	),
	true,
);
assert.ok(
	files.has(friendConversationPath("TestUser", "FriendUser")),
);
assert.equal(await fetchNudgeSuffix("FriendUser"), "的小脑袋");
const nudgedFriendMessages = await sendFriendNudge(friendMe, {
	username: "FriendUser",
	name: "Friend User",
});
assert.equal(nudgedFriendMessages.length, 2);
assert.equal(nudgedFriendMessages[1].type, "nudge");
assert.equal(nudgedFriendMessages[1].suffix, "的小脑袋");
assert.match(nudgedFriendMessages[1].content, /拍了拍/);
const friendRejected = await sendFriendMessage(
	friendMe,
	"SomeoneElse",
	"x",
).then(
	() => null,
	(error) => error,
);
assert.ok(friendRejected instanceof Error);
assert.match(friendRejected.message, /还不是好友/);

const badDelete = await deleteChannel(
	{ type: "u", ch: "测试频道" },
	{ name: "Bob", type: "user" },
).then(
	() => null,
	(error) => error,
);
assert.ok(badDelete instanceof Error);
assert.match(badDelete.message, /只能删除自己创建的频道/);

const admin = { name: "Bob", type: "user", admin: true };
await createPublicChannel("管理员频道", "Alice", () => {}, alice);
const adminDeleted = await deleteChannel(
	{ type: "u", ch: "管理员频道" },
	admin,
);
assert.equal(adminDeleted.deleted, true);
assert.equal(adminDeleted.owner, "Alice");
assert.equal(adminDeleted.deletedBy, "Bob");
const adminDeletedStatus = await getChannelStatus({
	type: "u",
	ch: "管理员频道",
});
assert.equal(adminDeletedStatus.data.deleted, true);

put(
	"public/msg/无标记频道.json",
	JSON.stringify({
		msg: [
			{
				name: "Legacy",
				user: "Legacy",
				time: "20250101 00:00:00",
				ts: 1,
				hash: "legacy-hash",
				quote: null,
				recalled: false,
				content: "old",
			},
		],
	}),
);
const noStatusNormalDelete = await deleteChannel(
	{ type: "u", ch: "无标记频道" },
	{ name: "Bob", type: "user" },
).then(
	() => null,
	(error) => error,
);
assert.ok(noStatusNormalDelete instanceof Error);
assert.match(noStatusNormalDelete.message, /没有创建者标记/);
const noStatusAdminDelete = await deleteChannel(
	{ type: "u", ch: "无标记频道" },
	admin,
);
assert.equal(noStatusAdminDelete.deleted, true);
assert.ok(files.has("status/public/无标记频道.json"));

const deletedPublic = await deleteChannel(
	{ type: "u", ch: "测试频道" },
	alice,
);
assert.equal(deletedPublic.deleted, true);

const publicStatusAfter = await getChannelStatus({
	type: "u",
	ch: "测试频道",
});
assert.equal(publicStatusAfter.data.deleted, true);
const deletedSummaries = await fetchPublicChannelSummaries([
	encodeURIComponent("测试频道"),
]);
assert.equal(
	deletedSummaries.get(encodeURIComponent("测试频道")).deleted,
	true,
);
assert.equal(
	deletedSummaries.get(encodeURIComponent("测试频道")).messageCount,
	3,
);

const readDeletedPublic = await readChannel({
	type: "u",
	ch: "测试频道",
}).then(
	() => null,
	(error) => error,
);
assert.ok(readDeletedPublic instanceof Error);
assert.equal(readDeletedPublic.code, "CHANNEL_DELETED");

const recreateDeleted = await createPublicChannel(
	"测试频道",
	"Alice",
	() => {},
	alice,
).then(
	() => null,
	(error) => error,
);
assert.ok(recreateDeleted instanceof Error);
assert.equal(recreateDeleted.code, "CHANNEL_DELETED");

const badPrivateDelete = await deleteChannel(
	{ type: "r", id: "8", key: "secret-key" },
	{ name: "Alice", type: "user" },
).then(
	() => null,
	(error) => error,
);
assert.ok(badPrivateDelete instanceof Error);
assert.match(badPrivateDelete.message, /只能删除自己创建的频道/);

const deletedPrivate = await deleteChannel(
	{ type: "r", id: "8", key: "secret-key" },
	bob,
);
assert.equal(deletedPrivate.deleted, true);

const privateStatusAfter = await getChannelStatus({
	type: "r",
	id: "8",
	key: "secret-key",
});
assert.equal(privateStatusAfter.data.deleted, true);
assert.ok(!files.get(privateStatusPath).content.includes("Bob"));

const readDeletedPrivate = await readChannel({
	type: "r",
	id: "8",
	key: "secret-key",
}).then(
	() => null,
	(error) => error,
);
assert.ok(readDeletedPrivate instanceof Error);
assert.equal(readDeletedPrivate.code, "CHANNEL_DELETED");

const filesList = [...files.keys()];
assert.ok(filesList.includes("public/msg/测试频道.json"));
assert.ok(filesList.includes(publicStatusPath));
assert.ok(filesList.includes(privateStatusPath));
assert.ok(filesList.some((path) => path.startsWith("private/msg/8_")));

console.log("core service tests passed");
console.log({
	progressSteps: progress.length,
	publicMessages: quotedSend.length,
	privateMessages: privateQuoted.length,
	files: filesList,
});
