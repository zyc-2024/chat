import { reactive, computed } from "vue";
import CryptoJS from "crypto-js";
import { getJson, postJson, putJson } from "./gitee.js";

const SALT = "zyc2024-chat-auth-v1";
const USER_PREFIX = "private/user_";
const SESSION_KEY = "chat_auth_v1";
const SESSION_DAYS = 7;

function sha256(text) {
	return CryptoJS.SHA256(text).toString(CryptoJS.enc.Hex);
}

function accountPath(username) {
	return USER_PREFIX + sha256(SALT + ":user:" + username) + ".json";
}

function passwordHash(username, password) {
	return sha256(SALT + ":pass:" + username + ":" + password);
}

export function getCookie(name) {
	const match = document.cookie.match(
		new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"),
	);
	if (!match) return null;
	try {
		return decodeURIComponent(match[1]);
	} catch (e) {
		return match[1];
	}
}

export function setCookie(name, value) {
	document.cookie =
		name +
		"=" +
		encodeURIComponent(value) +
		";path=/;expires=Fri, 31 Dec 9999 23:59:59 GMT;max-age=2147483647";
}

export function deleteCookie(name) {
	document.cookie = name + "=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

function loadSession() {
	try {
		const raw = localStorage.getItem(SESSION_KEY);
		if (!raw) return null;
		const session = JSON.parse(raw);
		if (!session.username || !session.expires || Date.now() > session.expires) {
			localStorage.removeItem(SESSION_KEY);
			return null;
		}
		return session;
	} catch (e) {
		return null;
	}
}

function persistSession(session) {
	try {
		if (session) {
			localStorage.setItem(SESSION_KEY, JSON.stringify(session));
		} else {
			localStorage.removeItem(SESSION_KEY);
		}
	} catch (e) {
		// localStorage 不可用时仍然保留内存会话
	}
}

function saveSession(username, displayName) {
	const session = {
		username,
		displayName: displayName || username,
		expires: Date.now() + SESSION_DAYS * 86400000,
	};
	persistSession(session);
	setCookie("n", session.displayName);
	setCookie("auth", username);
	return session;
}

export const auth = reactive({
	session: loadSession(),
});

export const isLoggedIn = computed(() => !!auth.session);
export const authDisplayName = computed(() =>
	auth.session ? auth.session.displayName || auth.session.username : "",
);

async function readAccount(username) {
	const path = accountPath(username);
	const file = await getJson(path);
	if (!file) return null;
	return {
		path,
		sha: file.sha,
		data: file.data,
	};
}

export async function login(username, password) {
	const account = await readAccount(username);
	if (!account || account.data.username !== username) {
		throw new Error("用户不存在或密码错误");
	}
	if (account.data.password !== passwordHash(username, password)) {
		throw new Error("用户不存在或密码错误");
	}
	const displayName =
		(account.data.settings && account.data.settings.lastName) || username;
	auth.session = saveSession(username, displayName);
	return auth.session;
}

export async function register(username, password) {
	if (!/^[\w\u4e00-\u9fa5.-]{1,32}$/.test(username)) {
		throw new Error("用户名只能包含中英文、数字和 _-.，长度 1-32");
	}
	if (!password || password.length < 6) {
		throw new Error("密码至少需要 6 位");
	}
	const existing = await readAccount(username);
	if (existing) {
		throw new Error("该用户名已被注册");
	}
	const now = new Date().toISOString();
	const data = {
		username,
		password: passwordHash(username, password),
		registeredAt: now,
		settings: { lastName: username, lastLogin: now },
		profile: { username, bio: "" },
	};
	const path = accountPath(username);
	await postJson(path, data, { message: "register " + username });
	auth.session = saveSession(username, username);
	return auth.session;
}

/**
 * 修改显示名。已登录时同时尝试同步到云端账号；失败也不影响本地使用。
 */
export async function setDisplayName(name) {
	const next = String(name || "").trim();
	if (!next) return false;
	setCookie("n", next);
	if (!auth.session) return true;
	const username = auth.session.username;
	auth.session = { ...auth.session, displayName: next };
	persistSession(auth.session);
	let synced = true;
	try {
		const account = await readAccount(username);
		if (account) {
			account.data.settings = account.data.settings || {};
			account.data.settings.lastName = next;
			await putJson(
				account.path,
				account.data,
				"rename " + username,
				account.sha,
			);
		}
	} catch (error) {
		synced = false;
		console.warn("显示名云端同步失败：", error);
	}
	return synced;
}

export function logout() {
	auth.session = null;
	persistSession(null);
	deleteCookie("n");
	deleteCookie("auth");
}

export async function getProfile(username) {
	const account = await readAccount(username);
	if (!account || account.data.username !== username) return null;
	const data = { ...account.data };
	delete data.password;
	return data;
}
