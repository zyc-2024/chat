import { getProfile } from "./auth.js";
import { t } from "../i18n/index.js";
import { timeStamp } from "../lib/format.js";

export async function fetchNudgeSuffix(username) {
	try {
		const profile = await getProfile(username);
		if (!profile || !profile.settings) return "";
		return String(profile.settings.nudge || "").trim().slice(0, 40);
	} catch (e) {
		return "";
	}
}

export function nudgeText(fromName, toName, suffix = "") {
	return t("{from} 拍了拍 {to}{suffix}", {
		from: fromName || t("匿名"),
		to: toName || t("匿名"),
		suffix: suffix || "",
	});
}

export function createNudgeMessage(me, target, suffix = "") {
	const ts = Date.now();
	const fromName = String(me.name || me.username);
	const toName = String(target.name || target.username);
	return {
		type: "nudge",
		name: fromName,
		user: me.username,
		time: timeStamp(new Date(ts)),
		ts,
		fromName,
		fromUsername: me.username,
		toName,
		toUsername: target.username,
		suffix: suffix || "",
		recalled: false,
		quote: null,
		content: nudgeText(fromName, toName, suffix),
	};
}
