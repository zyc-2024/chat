import SparkMD5 from "spark-md5";
import CryptoJS from "crypto-js";
import {
	getFile,
	getJson,
	postJson,
	putFile,
	putJson,
} from "./gitee.js";
import { decryptData, encryptData } from "../lib/crypto.js";
import { t } from "../i18n/index.js";
import { timeStamp } from "../lib/format.js";
import {
	createMessageHash,
	privateMessagePath,
	privateStatusPath,
} from "./chat.js";

const GROUP_DIR = "groups";
const GROUP_INDEX_DIR = "groups/index";
const ID_PATH = "private/id.json";

function sha256(text) {
	return CryptoJS.SHA256(text).toString(CryptoJS.enc.Hex);
}

export function groupIndexPath(username) {
	return `${GROUP_INDEX_DIR}/${sha256(`zyc2024-group-index-v1:${String(username || "").trim()}`)}.json`;
}

export function groupMetaPath(id, key) {
	return `${GROUP_DIR}/${id}_${SparkMD5.hash(String(key))}.json`;
}

/** 群组凭证同时用于加密群组信息和聊天记录。 */
export function createGroupKey() {
	const bytes = new Uint8Array(18);
	if (typeof crypto !== "undefined" && crypto.getRandomValues) {
		crypto.getRandomValues(bytes);
	} else {
		for (let i = 0; i < bytes.length; i++) {
			bytes[i] = Math.floor(Math.random() * 256);
		}
	}
	return Array.from(bytes, (value) =>
		value.toString(16).padStart(2, "0"),
	).join("");
}

export function normalizeGroupMember(entry) {
	if (!entry || typeof entry !== "object") return null;
	const username = String(entry.username || entry.name || "").trim();
	if (!username) return null;
	return {
		username,
		name: String(entry.name || username).trim() || username,
		type: entry.type === "user" ? "user" : "guest",
		role: entry.role === "owner" ? "owner" : "member",
		joinedAt: String(entry.joinedAt || ""),
	};
}

export function normalizeGroupMeta(raw, fallbackId = "") {
	const source = raw && typeof raw === "object" ? raw : {};
	const members = (Array.isArray(source.members) ? source.members : [])
		.map(normalizeGroupMember)
		.filter(Boolean);
	return {
		version: 1,
		type: "group",
		id: String(source.id || fallbackId || "").trim(),
		name: String(source.name || "").trim() || t("未命名群组"),
		owner: String(source.owner || "").trim(),
		ownerName: String(source.ownerName || source.owner || "").trim(),
		createdAt: String(source.createdAt || ""),
		updatedAt: String(source.updatedAt || ""),
		members,
	};
}

function normalizeGroupEntry(entry) {
	if (!entry || typeof entry !== "object") return null;
	const id = String(entry.id || "").trim();
	const key = String(entry.key || "").trim();
	if (!id || !key) return null;
	return {
		id,
		key,
		name: String(entry.name || "").trim() || t("未命名群组"),
		joinedAt: String(entry.joinedAt || ""),
		role: entry.role === "owner" ? "owner" : "member",
	};
}

export function normalizeGroupIndex(list) {
	return (Array.isArray(list) ? list : [])
		.map(normalizeGroupEntry)
		.filter(Boolean);
}

async function allocateGroupId() {
	const file = await getFile(ID_PATH);
	if (!file) throw new Error(t("无法读取群组 id 文件"));
	const current = parseInt(file.content, 10);
	if (!Number.isFinite(current)) throw new Error(t("群组 id 文件内容无效"));
	const id = current + 1;
	await putFile(ID_PATH, String(id), {
		message: "group id add 1",
		sha: file.sha,
	});
	return id;
}

export async function loadUserGroups(username) {
	const name = String(username || "").trim();
	if (!name) return [];
	const file = await getJson(groupIndexPath(name));
	if (!file || !file.data) return [];
	return normalizeGroupIndex(file.data.groups).sort((a, b) =>
		String(b.joinedAt).localeCompare(String(a.joinedAt)),
	);
}

export async function removeGroupFromIndex(username, id) {
	const target = String(id || "").trim();
	if (!target) return;
	await updateGroupIndex(
		username,
		(groups) => groups.filter((item) => item.id !== target),
		`group index remove ${target}`,
	);
}

async function updateGroupIndex(username, mutate, message) {
	const owner = String(username || "").trim();
	if (!owner) throw new Error(t("缺少用户名"));
	let attempt = 0;
	while (attempt < 3) {
		try {
			const path = groupIndexPath(owner);
			const file = await getJson(path);
			const data =
				file && file.data && typeof file.data === "object"
					? file.data
					: { owner, groups: [] };
			const groups = normalizeGroupIndex(data.groups);
			const next = mutate(groups) || groups;
			if (JSON.stringify(next) === JSON.stringify(groups)) {
				return { owner, groups };
			}
			const payload = {
				owner,
				groups: next,
				updatedAt: new Date().toISOString(),
			};
			if (file) {
				await putJson(path, payload, message, file.sha);
			} else {
				await postJson(path, payload, { message });
			}
			return payload;
		} catch (error) {
			attempt++;
			if (attempt >= 3) throw error;
		}
	}
	throw new Error(t("群组列表更新失败"));
}

async function addGroupToIndex(username, entry) {
	const normalized = normalizeGroupEntry(entry);
	if (!normalized) return;
	await updateGroupIndex(
		username,
		(groups) => {
			const index = groups.findIndex((item) => item.id === normalized.id);
			if (index >= 0) {
				const existing = groups[index];
				if (
					existing.key === normalized.key &&
					existing.name === normalized.name &&
					existing.role === normalized.role
				) {
					return groups;
				}
				const next = groups.slice();
				next[index] = { ...existing, ...normalized };
				return next;
			}
			return [...groups, normalized];
		},
		`group index ${normalized.id}`,
	);
}

export async function loadGroupMeta({ id, key }) {
	if (!id || !key) throw new Error(t("群组缺少 id 或凭证"));
	const file = await getJson(groupMetaPath(id, key));
	if (!file) throw new Error(t("群组信息不存在或邀请链接已失效"));
	let data;
	try {
		data = decryptData(file.data, key);
	} catch (e) {
		throw new Error(t("群组凭证错误，无法读取群组信息"));
	}
	return normalizeGroupMeta(data, id);
}

async function updateGroupMeta(options, mutate, message) {
	let attempt = 0;
	while (attempt < 3) {
		try {
			const file = await getJson(groupMetaPath(options.id, options.key));
			if (!file) throw new Error(t("群组信息不存在或邀请链接已失效"));
			const current = normalizeGroupMeta(
				decryptData(file.data, options.key),
				options.id,
			);
			const next = mutate(current) || current;
			if (JSON.stringify(next) === JSON.stringify(current)) {
				return current;
			}
			const updated = {
				...next,
				updatedAt: new Date().toISOString(),
			};
			await putJson(
				groupMetaPath(options.id, options.key),
				encryptData(updated, options.key),
				message,
				file.sha,
			);
			return updated;
		} catch (error) {
			attempt++;
			if (attempt >= 3) throw error;
		}
	}
	throw new Error(t("群组信息更新失败"));
}

export async function joinGroup(options, identity) {
	const meta = await loadGroupMeta(options);
	const member = normalizeGroupMember({
		username: identity && identity.name,
		name: identity && (identity.displayName || identity.name),
		type: identity && identity.type,
		role: "member",
	});
	if (!member) throw new Error(t("缺少当前用户信息"));
	const alreadyMember = meta.members.some(
		(item) => item.username === member.username,
	);
	let next = meta;
	if (!alreadyMember) {
		next = await updateGroupMeta(
			options,
			(current) => {
				if (
					current.members.some(
						(item) => item.username === member.username,
					)
				) {
					return current;
				}
				return {
					...current,
					members: [...current.members, member],
				};
			},
			`group join ${options.id} ${member.username}`,
		);
	}
	try {
		await addGroupToIndex(member.username, {
			id: options.id,
			key: options.key,
			name: meta.name,
			joinedAt: member.joinedAt || new Date().toISOString(),
			role:
				meta.owner === member.username ? "owner" : "member",
		});
	} catch (error) {
		console.warn("写入群组列表失败：", error);
	}
	return { meta: next, joined: !alreadyMember };
}

export async function addGroupMember(options, friend) {
	const target = normalizeGroupMember({
		username: friend && friend.username,
		name: friend && friend.name,
		type: "user",
		role: "member",
	});
	if (!target) throw new Error(t("缺少好友信息"));
	const meta = await loadGroupMeta(options);
	const alreadyMember = meta.members.some(
		(item) => item.username === target.username,
	);
	let next = meta;
	if (!alreadyMember) {
		next = await updateGroupMeta(
			options,
			(current) => {
				if (
					current.members.some(
						(item) => item.username === target.username,
					)
				) {
					return current;
				}
				return {
					...current,
					members: [...current.members, target],
				};
			},
			`group invite ${options.id} ${target.username}`,
		);
	}
	await addGroupToIndex(target.username, {
		id: options.id,
		key: options.key,
		name: meta.name,
		joinedAt: target.joinedAt || new Date().toISOString(),
		role: "member",
	});
	return { meta: next, added: !alreadyMember };
}

export async function createGroup(
	name,
	author,
	onProgress = () => {},
	owner = null,
) {
	const groupName = String(name || "").trim();
	if (!groupName) throw new Error(t("群组名称不能为空"));
	const normalizedOwner = {
		name: String((owner && owner.name) || author || "").trim(),
		type: owner && owner.type === "user" ? "user" : "guest",
	};
	if (!normalizedOwner.name) throw new Error(t("缺少群组创建者信息"));
	const key = createGroupKey();

	onProgress(10, "读取群组 id");
	const id = await allocateGroupId();
	const chatPath = privateMessagePath(id, key);
	const existingChat = await getFile(chatPath);
	if (existingChat) throw new Error(t("群组 id 冲突，请重试"));

	onProgress(35, "写入群组创建者标记");
	const createdTs = Date.now();
	const createdAt = new Date(createdTs).toISOString();
	const createdTime = timeStamp(new Date(createdTs));
	const ownerMember = normalizeGroupMember({
		username: normalizedOwner.name,
		name: String(author || normalizedOwner.name),
		type: normalizedOwner.type,
		role: "owner",
		joinedAt: createdAt,
	});
	const meta = normalizeGroupMeta(
		{
			id,
			name: groupName,
			owner: normalizedOwner.name,
			ownerName: String(author || normalizedOwner.name),
			createdAt,
			updatedAt: createdAt,
			members: [ownerMember],
		},
		id,
	);
	const status = {
		owner: normalizedOwner.name,
		ownerType: normalizedOwner.type,
		createdAt,
		deleted: false,
		deletedAt: null,
		messageCount: 2,
		lastMessageAt: createdAt,
		lastMessageTime: createdTime,
		lastMessageName: String(author || normalizedOwner.name),
	};
	await postJson(privateStatusPath(id), encryptData(status, key), {
		message: `group status [${id}]`,
	});

	onProgress(60, "加密群组聊天记录");
	const initial = {
		msg: [
			{
				name: String(author || normalizedOwner.name),
				time: createdTime,
				ts: createdTs,
				hash: createMessageHash(),
				quote: null,
				recalled: false,
				content: t("群组“{name}”已创建", { name: groupName }),
			},
			{
				name: String(author || normalizedOwner.name),
				time: createdTime,
				ts: createdTs,
				hash: createMessageHash(),
				quote: null,
				recalled: false,
				content: t(
					"在群组信息里邀请好友，或复制邀请链接发给其他人，点击链接即可加入。",
				),
			},
		],
	};
	await postJson(
		privateMessagePath(id, key),
		encryptData(initial, key),
		{ message: `group chat [${id}]` },
	);

	onProgress(80, "加密群组信息");
	await postJson(groupMetaPath(id, key), encryptData(meta, key), {
		message: `group meta [${id}]`,
	});

	onProgress(92, "写入我的群组列表");
	await addGroupToIndex(normalizedOwner.name, {
		id,
		key,
		name: groupName,
		joinedAt: createdAt,
		role: "owner",
	});

	onProgress(100, "完成");
	return {
		id,
		key,
		name: groupName,
		meta,
		invite: { type: "g", id: String(id), key },
	};
}
