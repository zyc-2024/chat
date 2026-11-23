import { computed, ref } from "vue";
import CryptoJS from "crypto-js";
import { t } from "../i18n/index.js";
import { auth, setCookie, setDisplayName } from "../services/auth.js";

const GUEST_NAME_KEY = "chat_guest_username_v2";
const LEGACY_GUEST_KEY = "chat_guest_name";
const GUEST_PREFIX = "Guest_";

function storageGet(key) {
	try {
		return localStorage.getItem(key);
	} catch (e) {
		return null;
	}
}

function storageSet(key, value) {
	try {
		localStorage.setItem(key, value);
	} catch (e) {
		// ignore
	}
}

function storageRemove(key) {
	try {
		localStorage.removeItem(key);
	} catch (e) {
		// ignore
	}
}

function deviceSignature() {
	const nav = typeof navigator !== "undefined" ? navigator : {};
	const scr = typeof screen !== "undefined" ? screen : {};
	let timezone = "";
	try {
		timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
	} catch (e) {
		// ignore
	}
	return [
		"zyc2024-chat-guest-v1",
		nav.userAgent || "",
		nav.platform || "",
		nav.language || "",
		Array.isArray(nav.languages) ? nav.languages.join(",") : "",
		String(nav.hardwareConcurrency || ""),
		String(nav.deviceMemory || ""),
		String(nav.maxTouchPoints || ""),
		String(scr.width || ""),
		String(scr.height || ""),
		String(scr.availWidth || ""),
		String(scr.availHeight || ""),
		String(scr.colorDepth || ""),
		String(typeof window !== "undefined" ? window.devicePixelRatio || "" : ""),
		timezone,
	].join("|");
}

function computeGuestUsername() {
	const hash = CryptoJS.SHA256(deviceSignature())
		.toString(CryptoJS.enc.Hex)
		.slice(0, 12)
		.toUpperCase();
	return `${GUEST_PREFIX}${hash}`;
}

function loadOrCreateGuestUsername() {
	const stored = storageGet(GUEST_NAME_KEY);
	if (stored && /^Guest_[A-F0-9]{12}$/.test(stored)) {
		setCookie("n", stored);
		return stored;
	}
	// 旧的游客名是用户自己输入的，现在统一改为设备生成的 Guest_<HASH>
	storageRemove(LEGACY_GUEST_KEY);
	const name = computeGuestUsername();
	storageSet(GUEST_NAME_KEY, name);
	setCookie("n", name);
	return name;
}

/** 自动登录的游客用户名，例如 Guest_1A2B3C4D5E6F。 */
export const guestUsername = ref(loadOrCreateGuestUsername());

/** 是否可以当作游客身份使用（未登录真实账号）。 */
export const isGuestSession = computed(() => !auth.session);

/** 当前用于发消息的名字：已登录用账号显示名，否则用设备游客名。 */
export const chatName = computed(() => {
	if (auth.session) {
		return auth.session.displayName || auth.session.username;
	}
	return guestUsername.value;
});

/** 频道归属使用的唯一身份：真实账号用 username，游客用 Guest_<HASH>。 */
export function currentIdentity() {
	if (auth.session) {
		return {
			name: auth.session.username,
			type: "user",
			admin: auth.session.admin === true,
		};
	}
	return { name: guestUsername.value, type: "guest", admin: false };
}

export function useIdentity() {
	async function rename(name) {
		if (!auth.session) {
			throw new Error(t("游客用户名由设备自动生成，登录后才能修改昵称"));
		}
		const next = String(name || "").trim();
		if (!next) return false;
		return await setDisplayName(next);
	}

	return { guestUsername, isGuestSession, chatName, rename, currentIdentity };
}
