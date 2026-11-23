import { ref } from "vue";
import {
	changelog as localChangelog,
	changelogTags as localTags,
} from "../data/changelog.js";
import { isLocalAppRuntime } from "../lib/appVersion.js";

const REMOTE_CHANGELOG_URL =
	"https://chat.zyc2024.com.cn/changelog.json";

export const changelogEntries = ref(localChangelog);
export const changelogDefinitions = ref(localTags);
export const changelogSource = ref("local");
export const changelogLoading = ref(false);
export const changelogError = ref("");

function normalizeEntry(entry) {
	if (!entry || typeof entry !== "object") return null;
	const version = String(entry.version || "").trim();
	if (!version) return null;
	return {
		...entry,
		version,
		desc: String(entry.desc || ""),
		tags: Array.isArray(entry.tags) ? entry.tags : [],
	};
}

function normalizeDefinitions(definitions) {
	if (!Array.isArray(definitions)) return null;
	const list = definitions.filter(
		(tag) =>
			tag &&
			typeof tag === "object" &&
			(String(tag.id || "").trim() || String(tag.label || "").trim()),
	);
	return list.length ? list : null;
}

export function useLocalChangelog() {
	changelogEntries.value = localChangelog;
	changelogDefinitions.value = localTags;
	changelogSource.value = "local";
}

/**
 * 本地 app 优先读取远端更新日志；网络或数据异常时保留内置日志。
 */
export async function loadRemoteChangelog() {
	if (!isLocalAppRuntime()) {
		useLocalChangelog();
		return false;
	}
	changelogLoading.value = true;
	changelogError.value = "";
	try {
		const response = await fetch(REMOTE_CHANGELOG_URL, {
			cache: "no-store",
			headers: { Accept: "application/json" },
		});
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const data = await response.json();
		const entries = (Array.isArray(data && data.changelog)
			? data.changelog
			: []
		)
			.map(normalizeEntry)
			.filter(Boolean);
		if (!entries.length) {
			throw new Error("empty changelog");
		}
		changelogEntries.value = entries;
		changelogDefinitions.value =
			normalizeDefinitions(data.changelogTags) || localTags;
		changelogSource.value = "remote";
		return true;
	} catch (error) {
		useLocalChangelog();
		changelogError.value =
			error && error.message ? error.message : String(error);
		return false;
	} finally {
		changelogLoading.value = false;
	}
}

export { REMOTE_CHANGELOG_URL };
