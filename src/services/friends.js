import CryptoJS from "crypto-js";
import { getJson, postJson, putJson } from "./gitee.js";
import { getProfile } from "./auth.js";
import { t } from "../i18n/index.js";
import { timeStamp } from "../lib/format.js";
import { createNudgeMessage, fetchNudgeSuffix } from "./nudge.js";

const FRIEND_DIR = "friends";
const FRIEND_MSG_DIR = "friends/msg";
const MAX_FRIENDS = 200;

function sha256(text) {
	return CryptoJS.SHA256(text).toString(CryptoJS.enc.Hex);
}

function userHash(username) {
	return sha256(`zyc2024-friend-user-v1:${String(username || "").trim()}`);
}

export function friendListPath(username) {
	return `${FRIEND_DIR}/${userHash(username)}.json`;
}

export function friendConversationId(a, b) {
	const names = [String(a || ""), String(b || "")].sort();
	return sha256(`zyc2024-friend-chat-v1:${names.join("|")}`);
}

export function friendConversationPath(a, b) {
	return `${FRIEND_MSG_DIR}/${friendConversationId(a, b)}.json`;
}

function normalizeFriend(entry) {
	if (!entry || typeof entry !== "object") return null;
	const username = String(entry.username || "").trim();
	if (!username) return null;
	return {
		username,
		name: String(entry.name || username).trim() || username,
		addedAt: String(entry.addedAt || ""),
	};
}

function normalizeFriends(list) {
	return (Array.isArray(list) ? list : [])
		.map(normalizeFriend)
		.filter(Boolean);
}

async function updateFriendList(username, mutate, message) {
	let attempt = 0;
	while (attempt < 3) {
		try {
			const path = friendListPath(username);
			const file = await getJson(path);
			const data =
				file && file.data && typeof file.data === "object"
					? file.data
					: { owner: username, friends: [] };
			const friends = normalizeFriends(data.friends);
			const next = mutate(friends) || friends;
			const payload = {
				owner: username,
				friends: next,
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
	throw new Error(t("好友列表更新失败"));
}

export async function loadFriends(username) {
	const file = await getJson(friendListPath(username));
	if (!file || !file.data) return [];
	return normalizeFriends(file.data.friends);
}

export async function addFriend(me, targetUsername, targetName = "") {
	if (!me || !me.username) {
		throw new Error(t("请先登录自己的账号"));
	}
	const target = String(targetUsername || "").trim();
	if (!target) {
		throw new Error(t("没有找到这个用户。"));
	}
	if (target === me.username) {
		throw new Error(t("不能添加自己为好友"));
	}
	if (/^Guest_/i.test(target)) {
		throw new Error(t("只能添加真实登录用户为好友"));
	}
	const profile = await getProfile(target);
	if (!profile) {
		throw new Error(t("没有找到这个用户。"));
	}
	const targetDisplay =
		String(targetName || "").trim() ||
		String(
			(profile.settings && profile.settings.lastName) || target,
		).trim() ||
		target;
	const myDisplay = String(me.name || me.username).trim() || me.username;
	const now = new Date().toISOString();
	const friend = { username: target, name: targetDisplay, addedAt: now };
	const myEntry = { username: me.username, name: myDisplay, addedAt: now };
	await updateFriendList(
		me.username,
		(friends) => {
			if (friends.some((item) => item.username === target)) {
				return friends;
			}
			if (friends.length >= MAX_FRIENDS) {
				throw new Error(t("好友列表已满"));
			}
			return [...friends, friend];
		},
		`friend add ${target}`,
	);
	try {
		await updateFriendList(
			target,
			(friends) => {
				if (friends.some((item) => item.username === me.username)) {
					return friends;
				}
				return [...friends, myEntry];
			},
			`friend add ${me.username}`,
		);
	} catch (error) {
		// 对方列表写入失败时回滚自己的列表，避免单边好友。
		await updateFriendList(
			me.username,
			(friends) => friends.filter((item) => item.username !== target),
			`friend rollback ${target}`,
		).catch(() => {});
		throw error;
	}
	return friend;
}

export async function areFriends(me, target) {
	if (!me || !me.username || !target) return false;
	const friends = await loadFriends(me.username);
	return friends.some((item) => item.username === target);
}

function normalizeMessage(message, index) {
	const source = message && typeof message === "object" ? message : {};
	const hash =
		String(source.hash || "").trim() ||
		CryptoJS.MD5(
			[
				index,
				source.ts || "",
				source.user || "",
				source.time || "",
				source.content || "",
			].join("|"),
		).toString(CryptoJS.enc.Hex);
	return {
		...source,
		hash,
		name: String(source.name || source.user || t("匿名")),
		user: String(source.user || ""),
		content: String(source.content || ""),
	};
}

export async function loadFriendMessages(me, target) {
	if (!(await areFriends(me, target))) {
		throw new Error(t("你们还不是好友"));
	}
	const path = friendConversationPath(me.username, target);
	const file = await getJson(path);
	if (!file || !file.data) return [];
	return (Array.isArray(file.data.msg) ? file.data.msg : []).map(
		normalizeMessage,
	);
}

async function appendFriendMessage(me, target, message) {
	const path = friendConversationPath(me.username, target);
	let attempt = 0;
	while (attempt < 2) {
		try {
			const file = await getJson(path);
			const data = file && file.data ? file.data : { msg: [] };
			const messages = (Array.isArray(data.msg) ? data.msg : []).map(
				normalizeMessage,
			);
			const prepared = {
				...message,
				hash:
					String(message.hash || "").trim() ||
					CryptoJS.MD5(
						`${message.ts}|${Math.random()}|${message.user}|${message.content}`,
					).toString(CryptoJS.enc.Hex),
			};
			messages.push(prepared);
			const payload = { ...data, msg: messages };
			if (file) {
				await putJson(
					path,
					payload,
					`friend message ${me.username} -> ${target}`,
					file.sha,
				);
			} else {
				await postJson(path, payload, {
					message: `friend message ${me.username} -> ${target}`,
				});
			}
			return messages;
		} catch (error) {
			attempt++;
			if (attempt >= 2) throw error;
		}
	}
	throw new Error(t("好友消息发送失败"));
}

export async function sendFriendMessage(me, target, content) {
	const text = String(content || "");
	if (!text.trim()) {
		throw new Error(t("消息不能为空"));
	}
	if (!(await areFriends(me, target))) {
		throw new Error(t("你们还不是好友"));
	}
	const ts = Date.now();
	return appendFriendMessage(me, target, {
		name: String(me.name || me.username),
		user: me.username,
		time: timeStamp(new Date(ts)),
		ts,
		content: text,
	});
}

export async function sendFriendNudge(me, target) {
	const targetUsername = target && target.username;
	if (!(await areFriends(me, targetUsername))) {
		throw new Error(t("你们还不是好友"));
	}
	const suffix = await fetchNudgeSuffix(target.username);
	return appendFriendMessage(
		me,
		targetUsername,
		createNudgeMessage(me, target, suffix),
	);
}
