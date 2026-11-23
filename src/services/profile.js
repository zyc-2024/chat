import {
	getJson,
	rewriteLegacyFileUrl,
	saveJson,
} from "./gitee.js";
import { getProfile, updateAccountProfile } from "./auth.js";

export const DEFAULT_AVATAR = "https://zyc-2024.github.io/res/nailong.png";
export const DEFAULT_HEADER = "https://zyc-2024.github.io/res/1.18.png";
export const DEFAULT_SIDE_TEXT = "Nothing here to be viewed...";

export function profilePath(username) {
	return `ronly/users/${username}.json`;
}

function text(value, fallback = "") {
	if (value === undefined || value === null) return fallback;
	return String(value);
}

function normalizeProfile(username, raw, fallback = {}) {
	const source = raw && typeof raw === "object" ? raw : {};
	const profileText =
		source.profile !== undefined
			? text(source.profile)
			: source.bio !== undefined
				? text(source.bio)
				: text(fallback.profile, "");
	return {
		user: text(source.user || source.username, username),
		reg_time: text(source.reg_time || fallback.reg_time, ""),
		avatar:
			rewriteLegacyFileUrl(
				text(source.avatar, fallback.avatar || DEFAULT_AVATAR),
			) || DEFAULT_AVATAR,
		pf_header:
			rewriteLegacyFileUrl(
				text(source.pf_header, fallback.pf_header || DEFAULT_HEADER),
			) || DEFAULT_HEADER,
		profile: profileText,
		pf_text:
			text(source.pf_text, fallback.pf_text || DEFAULT_SIDE_TEXT) ||
			DEFAULT_SIDE_TEXT,
	};
}

/**
 * 读取个人主页资料。
 *
 * 优先兼容原项目的 ronly/users/<username>.json 公开资料；
 * 如果没有，就使用当前登录系统 private/user_<hash>.json 里的 profile。
 * 两处都存在时，新账号里非空的字段优先。
 */
export async function loadProfile(username) {
	const name = String(username || "").trim();
	if (!name) return null;
	if (/^Guest_/i.test(name)) return null;

	let publicProfile = null;
	let publicError = null;
	try {
		const file = await getJson(profilePath(name));
		if (file && file.data && typeof file.data === "object") {
			publicProfile = normalizeProfile(name, file.data);
		}
	} catch (error) {
		publicError = error;
	}

	let account = null;
	let accountError = null;
	try {
		account = await getProfile(name);
	} catch (error) {
		accountError = error;
	}

	if (publicProfile) {
		const raw = account && account.profile ? account.profile : {};
		const merged = { ...publicProfile };
		for (const field of ["avatar", "pf_header", "pf_text"]) {
			if (raw[field]) merged[field] = String(raw[field]);
		}
		const accountBio =
			raw.profile !== undefined ? raw.profile : raw.bio;
		if (accountBio) merged.profile = String(accountBio);
		return merged;
	}

	if (account) {
		return normalizeProfile(name, account.profile || {}, {
			reg_time: account.registeredAt || "",
			avatar: DEFAULT_AVATAR,
			pf_header: DEFAULT_HEADER,
			pf_text: DEFAULT_SIDE_TEXT,
		});
	}

	if (publicError && accountError) {
		throw new Error(
			`读取个人资料失败：${publicError.message || publicError}`,
		);
	}
	return null;
}

/**
 * 保存个人主页资料。会同时更新当前账号和原项目使用的公开资料文件。
 */
export async function saveProfile(username, fields) {
	const name = String(username || "").trim();
	if (!name) throw new Error("缺少用户名");
	if (/^Guest_/i.test(name)) {
		throw new Error("游客身份没有个人主页");
	}
	const updates = {
		avatar: String(fields.avatar ?? "").trim(),
		pf_header: String(fields.pf_header ?? "").trim(),
		profile: String(fields.profile ?? ""),
		pf_text: String(fields.pf_text ?? ""),
	};
	const accountResult = await updateAccountProfile(name, updates);

	let publicSynced = true;
	try {
		const path = profilePath(name);
		const existing = await getJson(path);
		const safeProfile = {
			user: name,
			reg_time:
				(existing && existing.data && existing.data.reg_time) ||
				accountResult.registeredAt ||
				new Date().toISOString(),
			avatar: updates.avatar || DEFAULT_AVATAR,
			pf_header: updates.pf_header || DEFAULT_HEADER,
			profile: updates.profile,
			pf_text: updates.pf_text || DEFAULT_SIDE_TEXT,
		};
		await saveJson(
			path,
			safeProfile,
			`user_profile_update_${new Date().toISOString()}_${name}`,
			existing ? existing.sha : null,
		);
	} catch (error) {
		publicSynced = false;
		console.warn("公开个人主页同步失败：", error);
	}

	return {
		profile: normalizeProfile(name, {
			...accountResult.profile,
			reg_time: accountResult.registeredAt,
		}),
		publicSynced,
	};
}
