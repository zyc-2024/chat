import { computed, ref } from "vue";
import { auth, getCookie, setCookie, setDisplayName } from "../services/auth.js";

const GUEST_KEY = "chat_guest_name";
const cachedGuestName = (() => {
	try {
		const stored = localStorage.getItem(GUEST_KEY);
		if (stored) return stored;
	} catch (e) {
		// ignore
	}
	return getCookie("n") || "";
})();

const guestName = ref(cachedGuestName);

/** 当前用于发消息的名字：已登录用账号显示名，否则用游客名。 */
export const chatName = computed(() => {
	if (auth.session) {
		return auth.session.displayName || auth.session.username;
	}
	return guestName.value || "Anonymous";
});

export function useIdentity() {
	async function rename(name) {
		const next = String(name || "").trim();
		if (!next) return false;
		guestName.value = next;
		try {
			localStorage.setItem(GUEST_KEY, next);
		} catch (e) {
			// ignore
		}
		setCookie("n", next);
		if (auth.session) {
			return await setDisplayName(next);
		}
		return true;
	}

	return { guestName, chatName, rename };
}
