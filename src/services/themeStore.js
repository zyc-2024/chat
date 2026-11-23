import { getJson, postJson, putJson } from "./gitee.js";
import { t } from "../i18n/index.js";
import { normalizeTheme } from "./theme.js";

const THEME_STORE_PATH = "themes/index.json";
const MAX_THEMES = 120;

function normalizeEntry(entry) {
	if (!entry || typeof entry !== "object") return null;
	const name = String(entry.name || "").trim().slice(0, 40);
	if (!name) return null;
	return {
		id: String(entry.id || "").slice(0, 64),
		name,
		author: String(entry.author || t("匿名")).slice(0, 40),
		createdAt: String(entry.createdAt || ""),
		theme: normalizeTheme(entry.theme),
	};
}

export async function fetchThemeStore() {
	const file = await getJson(THEME_STORE_PATH);
	const list =
		file && file.data && Array.isArray(file.data.themes)
			? file.data.themes
			: [];
	return list.map(normalizeEntry).filter(Boolean);
}

function createId() {
	return `${Date.now().toString(36)}${Math.random()
		.toString(36)
		.slice(2, 8)}`;
}

export async function publishThemePreset({ name, author, theme }) {
	const cleanName = String(name || "").trim().slice(0, 40);
	if (!cleanName) {
		throw new Error(t("主题名称不能为空"));
	}
	const entry = {
		id: createId(),
		name: cleanName,
		author: String(author || t("匿名")).slice(0, 40),
		createdAt: new Date().toISOString(),
		theme: normalizeTheme({ ...theme, name: cleanName }),
	};
	let attempt = 0;
	while (attempt < 3) {
		try {
			const file = await getJson(THEME_STORE_PATH);
			const list =
				file && file.data && Array.isArray(file.data.themes)
					? file.data.themes
					: [];
			if (list.length >= MAX_THEMES) {
				throw new Error(t("主题商店已满，请稍后再试"));
			}
			const next = [entry, ...list];
			const payload = { themes: next };
			const message = `theme ${cleanName} by ${entry.author}`;
			if (file) {
				await putJson(
					THEME_STORE_PATH,
					payload,
					message,
					file.sha,
				);
			} else {
				await postJson(THEME_STORE_PATH, payload, { message });
			}
			return entry;
		} catch (error) {
			attempt++;
			if (attempt >= 3) throw error;
		}
	}
	throw new Error(t("主题商店已满，请稍后再试"));
}
