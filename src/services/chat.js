import SparkMD5 from "spark-md5";
import {
	getFile,
	getJson,
	postJson,
	putFile,
	putJson,
	saveJson,
} from "./gitee.js";
import { decryptData, encryptData } from "../lib/crypto.js";
import { timeStamp } from "../lib/format.js";

const INDEX_PATH = "public/index.json";
const ID_PATH = "private/id.json";

export function publicMessagePath(channelName) {
	return `public/msg/${channelName}.json`;
}

export function privateMessagePath(id, key) {
	return `private/msg/${id}_${SparkMD5.hash(String(key))}.json`;
}

/** 读取公开频道索引。索引里保存的是 URL 编码后的频道名（与原项目一致）。 */
export async function fetchChannelIndex() {
	const file = await getJson(INDEX_PATH);
	const list = file && file.data && Array.isArray(file.data.ch) ? file.data.ch : [];
	return list.slice();
}

/**
 * 创建公开频道，并把频道加入 public/index.json。
 * @param {string} channelName 解码后的频道名
 */
export async function createPublicChannel(channelName, author, onProgress = () => {}) {
	const name = String(channelName || "").trim();
	if (!name) throw new Error("频道名称不能为空");
	const encoded = encodeURIComponent(name);

	onProgress(10, "读取频道列表");
	let indexFile = await getJson(INDEX_PATH);
	let list = [];
	let sha = null;
	if (indexFile) {
		list = Array.isArray(indexFile.data && indexFile.data.ch)
			? indexFile.data.ch.slice()
			: [];
		sha = indexFile.sha;
	}

	if (!list.includes(encoded) && !list.includes(name)) {
		list.push(encoded);
		onProgress(30, "更新频道列表");
		await saveJson(INDEX_PATH, { ch: list }, `add public channel [${encoded}]`, sha);
	}

	onProgress(60, "创建聊天记录");
	const path = publicMessagePath(name);
	const existing = await getFile(path);
	if (!existing) {
		onProgress(80, "写入欢迎消息");
		await postJson(
			path,
			{
				msg: [
					{
						name: author,
						time: timeStamp(),
						content: `Created channel "${name}"`,
					},
				],
			},
			{ message: `initial public[${encoded}]` },
		);
	}
	onProgress(100, "完成");
	return { channel: name, encoded };
}

/**
 * 创建私密频道。id 从 private/id.json 递增，消息使用口令加密。
 */
export async function createPrivateChannel(key, author, onProgress = () => {}) {
	const password = String(key || "");
	if (!password) throw new Error("凭证不能为空");

	onProgress(10, "读取频道 id");
	const file = await getFile(ID_PATH);
	if (!file) throw new Error("无法读取频道 id 文件");
	const current = parseInt(file.content, 10);
	if (!Number.isFinite(current)) throw new Error("频道 id 文件内容无效");
	const id = current + 1;

	onProgress(35, "分配频道 id");
	await putFile(ID_PATH, String(id), {
		message: "id add 1",
		sha: file.sha,
	});

	onProgress(65, "加密初始消息");
	const initial = {
		msg: [
			{
				name: author,
				time: timeStamp(),
				content: "This private channel has just been created!",
			},
			{
				name: author,
				time: timeStamp(),
				content: `Id: ${id}\nKey: ${password}`,
			},
			{
				name: author,
				time: timeStamp(),
				content: "Please remember them!",
			},
		],
	};
	const path = privateMessagePath(id, password);
	const existing = await getFile(path);
	if (existing) throw new Error("频道 id 冲突，请重试");
	await postJson(path, encryptData(initial, password), {
		message: `initial private[${id}]+[${SparkMD5.hash(password)}]`,
	});
	onProgress(100, "完成");
	return { id, key: password };
}

function channelPath({ type, ch, id, key }) {
	if (type === "r") {
		if (!id || !key) throw new Error("私密频道缺少 id 或凭证");
		return privateMessagePath(id, key);
	}
	const name = String(ch || "main");
	return publicMessagePath(name);
}

function unpack(raw, type, key) {
	if (type !== "r") return raw;
	// 兼容早期未加密的私密频道数据
	if (raw && raw.version === undefined && Array.isArray(raw.msg)) return raw;
	return decryptData(raw, key);
}

/** 读取一个频道的全部消息。 */
export async function readChannel(options) {
	const path = channelPath(options);
	const file = await getJson(path);
	if (!file) {
		throw new Error("聊天记录不存在，可能是频道 id 或频道名有误");
	}
	const data = unpack(file.data, options.type, options.key);
	return {
		path,
		sha: file.sha,
		data,
		messages: Array.isArray(data && data.msg) ? data.msg : [],
	};
}

/**
 * 追加一条消息。遇到并发写入冲突时会重新读取再试一次。
 */
export async function sendChannelMessage(options, message) {
	const path = channelPath(options);
	let attempt = 0;
	while (attempt < 2) {
		try {
			const file = await getJson(path);
			if (!file) throw new Error("聊天记录不存在");
			const data = unpack(file.data, options.type, options.key);
			const messages = Array.isArray(data.msg) ? data.msg.slice() : [];
			messages.push(message);
			const next = { ...data, msg: messages };
			const payload = options.type === "r" ? encryptData(next, options.key) : next;
			await putJson(
				path,
				payload,
				`${message.name} @ ${Date.now()}`,
				file.sha,
			);
			return messages;
		} catch (error) {
			attempt++;
			if (attempt >= 2) throw error;
		}
	}
}
