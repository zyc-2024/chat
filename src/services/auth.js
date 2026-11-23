import { reactive, computed } from "vue";
import CryptoJS from "crypto-js";
import { t } from "../i18n/index.js";
import { getJson, postJson, putJson } from "./gitee.js";

const SALT = "zyc2024-chat-auth-v1";
const USER_PREFIX = "private/user_";
const SESSION_KEY = "chat_auth_v1";
const SESSION_DAYS = 7;
const ADMIN_SALT =
	"1b929792268d0f634f62536adb93cac826b5974f06a2ea64c4c7c2e8f15ff8bb42425f7b867ff5ba59c3b2397de554a4077e722460ecf645fa83ad321209c168";
const ADMIN_HASH = "e2d5fd3543c295d58b9a3228fc629701";

function sha256(text) {
	return CryptoJS.SHA256(text).toString(CryptoJS.enc.Hex);
}

/** 管理员由用户名和隐藏 salt 的 MD5 自动判定，不依赖账号文件里的字段。 */
export function isAdminUsername(username) {
	const name = String(username || "");
	if (!name) return false;
	return (
		CryptoJS.MD5(name + ADMIN_SALT).toString(CryptoJS.enc.Hex) ===
		ADMIN_HASH
	);
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
		// 管理员只看用户名判定结果，忽略本地会话里可能残留的旧 admin 字段。
		session.admin = isAdminUsername(session.username);
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
		admin: isAdminUsername(username),
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
export const isAdmin = computed(
	() => !!(auth.session && auth.session.admin === true),
);
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
	if (/^Guest_/i.test(username)) {
		throw new Error(t("Guest_ 开头的用户名保留给自动游客身份"));
	}
	const account = await readAccount(username);
	if (!account || account.data.username !== username) {
		throw new Error(t("用户不存在或密码错误"));
	}
	if (account.data.password !== passwordHash(username, password)) {
		throw new Error(t("用户不存在或密码错误"));
	}
	const displayName =
		(account.data.settings && account.data.settings.lastName) || username;
	auth.session = saveSession(username, displayName);
	return auth.session;
}

export async function register(username, password) {
	if (!/^[\w\u4e00-\u9fa5.-]{1,32}$/.test(username)) {
		throw new Error(t("用户名只能包含中英文、数字和 _-.，长度 1-32"));
	}
	if (/^Guest_/i.test(username)) {
		throw new Error(t("Guest_ 开头的用户名保留给自动游客身份"));
	}
	if (!password || password.length < 6) {
		throw new Error(t("密码至少需要 6 位"));
	}
	const existing = await readAccount(username);
	if (existing) {
		throw new Error(t("该用户名已被注册"));
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

/** 按当前用户名同步隐藏管理员属性。 */
export function refreshAdmin() {
	if (!auth.session) return false;
	const admin = isAdminUsername(auth.session.username);
	if (admin !== (auth.session.admin === true)) {
		auth.session = { ...auth.session, admin };
		persistSession(auth.session);
	}
	return admin;
}

/** 把个性主题同步到当前登录账号。 */
export async function saveThemeToAccount(theme) {
	if (!auth.session) {
		throw new Error(t("请先登录自己的账号"));
	}
	const username = auth.session.username;
	const account = await readAccount(username);
	if (!account) {
		throw new Error(t("找不到这个账号"));
	}
	account.data.settings = {
		...(account.data.settings || {}),
		theme,
	};
	await putJson(
		account.path,
		account.data,
		"theme update " + username,
		account.sha,
	);
	return theme;
}

/** 读取当前登录账号保存的个性主题。 */
export async function loadThemeFromAccount() {
	if (!auth.session) {
		throw new Error(t("请先登录自己的账号"));
	}
	const account = await readAccount(auth.session.username);
	if (!account) {
		throw new Error(t("找不到这个账号"));
	}
	return (account.data.settings && account.data.settings.theme) || null;
}

/** 保存“拍一拍”后缀到当前登录账号。 */
export async function saveNudgeToAccount(text) {
	if (!auth.session) {
		throw new Error(t("请先登录自己的账号"));
	}
	const username = auth.session.username;
	const account = await readAccount(username);
	if (!account) {
		throw new Error(t("找不到这个账号"));
	}
	const suffix = String(text || "").trim().slice(0, 40);
	account.data.settings = {
		...(account.data.settings || {}),
		nudge: suffix,
	};
	await putJson(
		account.path,
		account.data,
		"nudge update " + username,
		account.sha,
	);
	return suffix;
}

/** 读取当前登录账号的“拍一拍”后缀。 */
export async function loadNudgeFromAccount() {
	if (!auth.session) {
		throw new Error(t("请先登录自己的账号"));
	}
	const account = await readAccount(auth.session.username);
	if (!account) {
		throw new Error(t("找不到这个账号"));
	}
	return String(
		(account.data.settings && account.data.settings.nudge) || "",
	);
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

const PROFILE_FIELDS = ["avatar", "pf_header", "profile", "pf_text"];

/**
 * 更新当前登录账号的 profile 字段。
 */
export async function updateAccountProfile(username, updates) {
	if (!auth.session || auth.session.username !== username) {
		throw new Error(t("请先登录自己的账号"));
	}
	const account = await readAccount(username);
	if (!account) {
		throw new Error(t("找不到这个账号"));
	}
	const current =
		account.data.profile && typeof account.data.profile === "object"
			? account.data.profile
			: {};
	const profile = { ...current, username };
	for (const field of PROFILE_FIELDS) {
		if (updates[field] !== undefined) {
			profile[field] = String(updates[field] ?? "");
		}
	}
	// 兼容旧版账号里的 bio 字段
	profile.bio = profile.profile || "";
	account.data.profile = profile;
	await putJson(account.path, account.data, "profile update " + username, account.sha);
	return {
		profile,
		registeredAt: account.data.registeredAt || "",
	};
}

export async function getProfile(username) {
	const account = await readAccount(username);
	if (!account || account.data.username !== username) return null;
	const data = { ...account.data };
	delete data.password;
	return data;
}
