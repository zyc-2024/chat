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
import { safeDecode, timeStamp } from "../lib/format.js";

const INDEX_PATH = "public/index.json";
const ID_PATH = "private/id.json";

export function publicMessagePath(channelName) {
	return `public/msg/${channelName}.json`;
}

export function privateMessagePath(id, key) {
	return `private/msg/${id}_${SparkMD5.hash(String(key))}.json`;
}

export function publicStatusPath(channelName) {
	return `status/public/${channelName}.json`;
}

export function privateStatusPath(id) {
	return `status/private/${id}.json`;
}

function statusPath({ type, ch, id }) {
	if (type === "r") {
		if (!id) throw new Error("私密频道缺少 id");
		return privateStatusPath(id);
	}
	return publicStatusPath(String(ch || "main"));
}

function normalizeOwner(owner, fallbackName = "") {
	const name = String((owner && owner.name) || fallbackName || "").trim();
	if (!name) throw new Error("缺少频道创建者信息");
	return {
		name,
		type: owner && owner.type === "user" ? "user" : "guest",
	};
}

function buildStatus(owner) {
	return {
		owner: owner.name,
		ownerType: owner.type,
		createdAt: new Date().toISOString(),
		deleted: false,
		deletedAt: null,
		messageCount: 0,
		lastMessageAt: null,
		lastMessageTime: null,
		lastMessageName: null,
	};
}

function channelDeletedError() {
	const error = new Error("频道已被创建者删除");
	error.code = "CHANNEL_DELETED";
	return error;
}

async function writeStatusSummary(path, key, summary) {
	try {
		const file = await getJson(path);
		let data;
		if (file) {
			data = key ? decryptData(file.data, key) : file.data;
		} else {
			data = {
				owner: null,
				ownerType: null,
				createdAt: null,
				deleted: false,
				deletedAt: null,
			};
		}
		const next = { ...data, ...summary };
		const payload = key ? encryptData(next, key) : next;
		if (file) {
			await putJson(path, payload, `summary ${path}`, file.sha);
		} else {
			await postJson(path, payload, { message: `summary ${path}` });
		}
	} catch (error) {
		console.warn("更新频道统计失败：", error);
	}
}

async function ensureStatusFile(path, owner, key = null) {
	const existing = await getJson(path);
	if (existing) {
		let data;
		try {
			data = key ? decryptData(existing.data, key) : existing.data;
		} catch (e) {
			throw new Error("频道状态解密失败，可能是频道凭证错误");
		}
		if (data && data.deleted) throw channelDeletedError();
		return { path, sha: existing.sha, data };
	}
	const data = buildStatus(owner);
	const payload = key ? encryptData(data, key) : data;
	await postJson(path, payload, { message: `status ${path}` });
	return { path, sha: null, data };
}

/** 读取频道状态。私有频道的状态文件同样使用频道口令加密。 */
export async function getChannelStatus(options) {
	const path = statusPath(options);
	const file = await getJson(path);
	if (!file) return null;
	let data;
	try {
		data = options.type === "r" ? decryptData(file.data, options.key) : file.data;
	} catch (e) {
		throw new Error("频道状态解密失败，可能是频道凭证错误");
	}
	return { path, sha: file.sha, data };
}

/** 批量读取公开频道状态与消息统计，用于首页列表。 */
export async function fetchPublicChannelSummaries(rawNames) {
	const entries = await Promise.all(
		(rawNames || []).map(async (raw) => {
			const name = safeDecode(raw);
			let status = null;
			try {
				const file = await getJson(publicStatusPath(name));
				status = file && file.data ? file.data : null;
			} catch (e) {
				status = null;
			}
			if (status && status.deleted) {
				return [
					raw,
					{
						...status,
						deleted: true,
						messageCount: Number(status.messageCount) || 0,
						lastMessageTime: status.lastMessageTime || "",
					},
				];
			}
			let messageCount = Number(status && status.messageCount);
			let lastMessageTime = (status && status.lastMessageTime) || "";
			let lastMessageAt = (status && status.lastMessageAt) || null;
			if (
				!status ||
				!Number.isFinite(messageCount) ||
				!lastMessageTime
			) {
				try {
					const file = await getJson(publicMessagePath(name));
					const messages =
						file && file.data && Array.isArray(file.data.msg)
							? file.data.msg
							: [];
					messageCount = messages.length;
					const last = messages[messages.length - 1];
					lastMessageTime = (last && last.time) || "";
					lastMessageAt = last && last.ts
						? new Date(last.ts).toISOString()
						: lastMessageAt;
				} catch (e) {
					// 旧频道或消息文件损坏时保持默认值
				}
			}
			return [
				raw,
				{
					...(status || {}),
					deleted: false,
					messageCount: Number.isFinite(messageCount) ? messageCount : 0,
					lastMessageTime,
					lastMessageAt,
				},
			];
		}),
	);
	return new Map(entries);
}

/**
 * 删除频道：只写入 deleted 标记，不删除聊天记录或频道索引。
 * 只有状态文件中记录的创建者可以操作。
 */
export async function deleteChannel(options, owner) {
	const normalized = normalizeOwner(owner);
	const path = statusPath(options);
	const file = await getJson(path);
	if (!file) throw new Error("频道没有创建者标记，无法删除");
	let data;
	try {
		data = options.type === "r" ? decryptData(file.data, options.key) : file.data;
	} catch (e) {
		throw new Error("频道状态解密失败，可能是频道凭证错误");
	}
	if (
		!data ||
		data.owner !== normalized.name ||
		(data.ownerType && data.ownerType !== normalized.type)
	) {
		throw new Error("只能删除自己创建的频道");
	}
	if (data.deleted) return data;
	const next = {
		...data,
		deleted: true,
		deletedAt: new Date().toISOString(),
		deletedBy: normalized.name,
	};
	const payload =
		options.type === "r" ? encryptData(next, options.key) : next;
	await putJson(path, payload, `delete ${path}`, file.sha);
	return next;
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
export async function createPublicChannel(
	channelName,
	author,
	onProgress = () => {},
	owner = null,
) {
	const name = String(channelName || "").trim();
	if (!name) throw new Error("频道名称不能为空");
	const normalizedOwner = normalizeOwner(owner, author);
	const encoded = encodeURIComponent(name);
	const statusFile = await getJson(publicStatusPath(name));
	if (statusFile && statusFile.data && statusFile.data.deleted) {
		throw channelDeletedError();
	}

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

	onProgress(55, "检查频道状态");
	const path = publicMessagePath(name);
	const existing = await getFile(path);
	if (!existing) {
		if (!statusFile) {
			onProgress(70, "写入频道创建者标记");
			await ensureStatusFile(publicStatusPath(name), normalizedOwner);
		}
		onProgress(80, "写入欢迎消息");
		const createdTs = Date.now();
		const createdTime = timeStamp(new Date(createdTs));
		await postJson(
			path,
			{
				msg: [
					{
						name: author,
						time: createdTime,
						ts: createdTs,
						recalled: false,
						content: `Created channel "${name}"`,
					},
				],
			},
			{ message: `initial public[${encoded}]` },
		);
		await writeStatusSummary(publicStatusPath(name), null, {
			messageCount: 1,
			lastMessageAt: new Date(createdTs).toISOString(),
			lastMessageTime: createdTime,
			lastMessageName: author,
		});
	}
	onProgress(100, "完成");
	return { channel: name, encoded };
}

/**
 * 创建私密频道。id 从 private/id.json 递增，消息使用口令加密。
 */
export async function createPrivateChannel(
	key,
	author,
	onProgress = () => {},
	owner = null,
) {
	const password = String(key || "");
	if (!password) throw new Error("凭证不能为空");
	const normalizedOwner = normalizeOwner(owner, author);

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

	onProgress(50, "写入加密的频道创建者标记");
	await ensureStatusFile(privateStatusPath(id), normalizedOwner, password);

	onProgress(65, "加密初始消息");
	const createdTs = Date.now();
	const createdTime = timeStamp(new Date(createdTs));
	const initial = {
		msg: [
			{
				name: author,
				time: createdTime,
				ts: createdTs,
				recalled: false,
				content: "This private channel has just been created!",
			},
			{
				name: author,
				time: createdTime,
				ts: createdTs,
				recalled: false,
				content: `Id: ${id}\nKey: ${password}`,
			},
			{
				name: author,
				time: createdTime,
				ts: createdTs,
				recalled: false,
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
	await writeStatusSummary(privateStatusPath(id), password, {
		messageCount: 3,
		lastMessageAt: new Date(createdTs).toISOString(),
		lastMessageTime: createdTime,
		lastMessageName: author,
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
	const status = await getChannelStatus(options);
	if (status && status.data && status.data.deleted) {
		throw channelDeletedError();
	}
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
		status: status ? status.data : null,
		statusSha: status ? status.sha : null,
	};
}

/**
 * 追加一条消息。遇到并发写入冲突时会重新读取再试一次。
 */
export async function sendChannelMessage(options, message) {
	const status = await getChannelStatus(options);
	if (status && status.data && status.data.deleted) {
		throw channelDeletedError();
	}
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
			await writeStatusSummary(
				statusPath(options),
				options.type === "r" ? options.key : null,
				{
					messageCount: messages.length,
					lastMessageAt: new Date(
						message.ts || Date.now(),
					).toISOString(),
					lastMessageTime: message.time || timeStamp(),
					lastMessageName: message.name || "Anonymous",
				},
			);
			return messages;
		} catch (error) {
			attempt++;
			if (attempt >= 2) throw error;
		}
	}
}

/** 撤回一条消息。内容会保留，只有发送者能操作。 */
export async function recallChannelMessage(options, messageIndex, owner) {
	const normalized = normalizeOwner(owner);
	const status = await getChannelStatus(options);
	if (status && status.data && status.data.deleted) {
		throw channelDeletedError();
	}
	const path = channelPath(options);
	let attempt = 0;
	while (attempt < 2) {
		try {
			const file = await getJson(path);
			if (!file) throw new Error("聊天记录不存在");
			const data = unpack(file.data, options.type, options.key);
			const messages = Array.isArray(data.msg) ? data.msg.slice() : [];
			const target = messages[messageIndex];
			if (!target) throw new Error("消息不存在");
			if (target.user !== normalized.name) {
				throw new Error("只能撤回自己发送的消息");
			}
			if (target.recalled) return messages;
			messages[messageIndex] = {
				...target,
				recalled: true,
				recalledAt: new Date().toISOString(),
			};
			const next = { ...data, msg: messages };
			const payload =
				options.type === "r" ? encryptData(next, options.key) : next;
			await putJson(
				path,
				payload,
				`recall ${messageIndex} ${path}`,
				file.sha,
			);
			return messages;
		} catch (error) {
			attempt++;
			if (attempt >= 2) throw error;
		}
	}
}
