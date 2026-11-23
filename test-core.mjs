import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
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
import { decodeBase64 } from "./src/services/gitee.js";

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

const publicStatusAfterSend = await getChannelStatus({
	type: "u",
	ch: "测试频道",
});
assert.equal(publicStatusAfterSend.data.messageCount, 2);

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
	alice,
);
assert.equal(publicRecalled[1].recalled, true);
const publicAfterRecall = await readChannel({
	type: "u",
	ch: "测试频道",
});
assert.equal(publicAfterRecall.messages[1].recalled, true);
assert.equal(publicAfterRecall.messages[1].content, "hello");

const publicSummaries = await fetchPublicChannelSummaries([
	encodeURIComponent("测试频道"),
]);
assert.equal(
	publicSummaries.get(encodeURIComponent("测试频道")).messageCount,
	2,
);

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

const privateStatusAfterSend = await getChannelStatus({
	type: "r",
	id: "8",
	key: "secret-key",
});
assert.equal(privateStatusAfterSend.data.messageCount, 4);

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

const badDelete = await deleteChannel(
	{ type: "u", ch: "测试频道" },
	{ name: "Bob", type: "user" },
).then(
	() => null,
	(error) => error,
);
assert.ok(badDelete instanceof Error);
assert.match(badDelete.message, /只能删除自己创建的频道/);

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
	2,
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
	publicMessages: afterSend.length,
	privateMessages: privSend.length,
	files: filesList,
});
