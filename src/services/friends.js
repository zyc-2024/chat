import CryptoJS from "crypto-js";
import { getJson, postJson, putJson } from "./gitee.js";
import { getProfile, updateAccountProfileRecord } from "./auth.js";
import { t } from "../i18n/index.js";
import { timeStamp } from "../lib/format.js";
import { createNudgeMessage, fetchNudgeSuffix } from "./nudge.js";

const FRIEND_DIR = "friends";
const FRIEND_MSG_DIR = "friends/msg";
const MAX_FRIENDS = 200;
const MAX_REQUESTS = 100;
const MAX_CARDS = 100;

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

function normalizeFriendRequest(entry) {
	if (!entry || typeof entry !== "object") return null;
	const from = String(entry.from || entry.username || "").trim();
	if (!from) return null;
	return {
		from,
		name: String(entry.name || from).trim() || from,
		at: String(entry.at || ""),
	};
}

function normalizeFriendRequests(list) {
	return (Array.isArray(list) ? list : [])
		.map(normalizeFriendRequest)
		.filter(Boolean);
}

function normalizeCard(entry) {
	if (!entry || typeof entry !== "object") return null;
	const username = String(entry.username || "").trim();
	if (!username) return null;
	return {
		username,
		name: String(entry.name || username).trim() || username,
		avatar: String(entry.avatar || ""),
		bio: String(entry.bio || ""),
		from: String(entry.from || "").trim(),
		fromName: String(entry.fromName || "").trim(),
		at: String(entry.at || ""),
	};
}

function normalizeCards(list) {
	return (Array.isArray(list) ? list : [])
		.map(normalizeCard)
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

function accountDisplayName(profile, username) {
	return (
		String(
			(profile && profile.settings && profile.settings.lastName) ||
				username ||
				"",
		).trim() || username
	);
}

async function linkFriends(me, targetUsername, targetName = "") {
	const target = String(targetUsername || "").trim();
	if (!target) throw new Error(t("没有找到这个用户。"));
	if (!me || !me.username) {
		throw new Error(t("请先登录自己的账号"));
	}
	if (target === me.username) {
		throw new Error(t("不能添加自己为好友"));
	}
	if (/^Guest_/i.test(target)) {
		throw new Error(t("只能添加真实登录用户为好友"));
	}
	const profile = await getProfile(target);
	if (!profile) throw new Error(t("没有找到这个用户。"));
	const targetDisplay =
		String(targetName || "").trim() ||
		accountDisplayName(profile, target);
	const myDisplay = String(me.name || me.username).trim() || me.username;
	const now = new Date().toISOString();
	const friend = { username: target, name: targetDisplay, addedAt: now };
	const myEntry = { username: me.username, name: myDisplay, addedAt: now };
	const existing = await loadFriends(me.username);
	if (existing.some((item) => item.username === target)) {
		return existing.find((item) => item.username === target);
	}
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

/** 发送好友申请；对方通过后才会真正成为好友。 */
export async function requestFriend(me, targetUsername) {
	if (!me || !me.username) {
		throw new Error(t("请先登录自己的账号"));
	}
	const target = String(targetUsername || "").trim();
	if (!target) throw new Error(t("没有找到这个用户。"));
	if (target === me.username) throw new Error(t("不能添加自己为好友"));
	if (/^Guest_/i.test(target)) {
		throw new Error(t("只能添加真实登录用户为好友"));
	}
	const profile = await getProfile(target);
	if (!profile) throw new Error(t("没有找到这个用户。"));
	const friends = await loadFriends(me.username);
	if (friends.some((item) => item.username === target)) {
		throw new Error(t("你们已经是好友"));
	}
	const requests = await loadFriendRequests(target);
	if (requests.some((item) => item.from === me.username)) {
		return { status: "pending", existing: true, target };
	}
	const myDisplay = String(me.name || me.username).trim() || me.username;
	const request = {
		from: me.username,
		name: myDisplay,
		at: new Date().toISOString(),
	};
	await updateAccountProfileRecord(
		target,
		(accountProfile) => {
			const list = normalizeFriendRequests(accountProfile.friendRequests);
			if (list.some((item) => item.from === me.username)) {
				return accountProfile;
			}
			if (list.length >= MAX_REQUESTS) {
				throw new Error(t("好友申请过多，请稍后再试"));
			}
			return {
				...accountProfile,
				friendRequests: [...list, request],
			};
		},
		`friend request ${me.username} -> ${target}`,
	);
	return {
		status: "pending",
		existing: false,
		target: {
			username: target,
			name: accountDisplayName(profile, target),
		},
	};
}

export async function loadFriendRequests(username) {
	const data = await getProfile(username);
	if (!data) return [];
	const profile =
		data.profile && typeof data.profile === "object" ? data.profile : {};
	return normalizeFriendRequests(profile.friendRequests);
}

async function removeFriendRequest(username, fromUsername) {
	const from = String(fromUsername || "").trim();
	if (!from) return;
	await updateAccountProfileRecord(
		username,
		(profile) => {
			const list = normalizeFriendRequests(profile.friendRequests);
			const next = list.filter((item) => item.from !== from);
			if (next.length === list.length) return profile;
			return { ...profile, friendRequests: next };
		},
		`friend request remove ${from}`,
	);
}

/** 通过好友申请，双方好友列表同时写入。 */
export async function approveFriendRequest(username, fromUsername) {
	const meName = String(username || "").trim();
	const from = String(fromUsername || "").trim();
	if (!meName || !from) throw new Error(t("好友申请不存在或已处理"));
	const account = await getProfile(meName);
	if (!account) throw new Error(t("找不到这个账号"));
	const requests = normalizeFriendRequests(
		account.profile && account.profile.friendRequests,
	);
	const request = requests.find((item) => item.from === from);
	if (!request) throw new Error(t("好友申请不存在或已处理"));
	const me = {
		username: meName,
		name: accountDisplayName(account, meName),
	};
	const friend = await linkFriends(me, from, request.name);
	await removeFriendRequest(meName, from);
	return friend;
}

export async function rejectFriendRequest(username, fromUsername) {
	await removeFriendRequest(username, fromUsername);
}

export async function loadReceivedCards(username) {
	const data = await getProfile(username);
	if (!data) return [];
	const profile =
		data.profile && typeof data.profile === "object" ? data.profile : {};
	return normalizeCards(profile.cards);
}

export async function saveReceivedCard(username, card) {
	const normalized = normalizeCard(card);
	if (!normalized) throw new Error(t("名片信息不完整"));
	await updateAccountProfileRecord(
		username,
		(profile) => {
			const cards = normalizeCards(profile.cards);
			const next = cards.filter(
				(item) =>
					!(
						item.username === normalized.username &&
						item.from === normalized.from
					),
			);
			next.unshift(normalized);
			return { ...profile, cards: next.slice(0, MAX_CARDS) };
		},
		`friend card ${normalized.from || "unknown"} -> ${username}`,
	);
	return normalized;
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

/** 发送好友名片，并把名片保存到接收者的 profile 里。 */
export async function sendFriendCard(me, target, card) {
	if (!(await areFriends(me, target))) {
		throw new Error(t("你们还不是好友"));
	}
	const normalized = normalizeCard(card);
	if (!normalized) throw new Error(t("名片信息不完整"));
	const displayName = String(me.name || me.username).trim() || me.username;
	const at = new Date().toISOString();
	const cardEntry = {
		...normalized,
		from: me.username,
		fromName: displayName,
		at,
	};
	const ts = Date.now();
	const messages = await appendFriendMessage(me, target, {
		type: "card",
		name: displayName,
		user: me.username,
		time: timeStamp(new Date(ts)),
		ts,
		content: t("分享名片：{name}", { name: normalized.name }),
		card: cardEntry,
	});
	try {
		await saveReceivedCard(target, cardEntry);
	} catch (error) {
		console.warn("名片写入对方 profile 失败：", error);
	}
	return messages;
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
