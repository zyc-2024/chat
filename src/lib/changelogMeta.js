/** 判断标签是否代表 AI 辅助开发。 */
export function isAiTag(tag) {
	const value =
		typeof tag === "string"
			? tag
			: String((tag && (tag.id || tag.label)) || "");
	return /^(ai|使用ai|ai生成)$/i.test(value.trim());
}

/** 判断某个版本是否使用了 AI 辅助开发。 */
export function isAiAssistedEntry(entry) {
	return (
		!!entry &&
		Array.isArray(entry.tags) &&
		entry.tags.some((tag) => isAiTag(tag))
	);
}

/** 判断版本号是否属于 beta。 */
export function isBetaVersion(version) {
	return /\bbeta\b/i.test(String(version || ""));
}

/** 最新一个非 beta 版本。 */
export function findLatestStableEntry(entries) {
	return (
		(Array.isArray(entries) ? entries : []).find(
			(entry) => entry && !isBetaVersion(entry.version),
		) || null
	);
}

/**
 * “now”标签对应的版本。
 *
 * 网页版指向当前部署的第一条记录，也就是网站最新版；
 * 本地 app 指向当前正在运行的内置版本。
 */
export function findNowEntry(entries, currentVersion = "") {
	const list = Array.isArray(entries) ? entries : [];
	if (currentVersion) {
		return (
			list.find((entry) => entry && entry.version === currentVersion) ||
			null
		);
	}
	return list[0] || null;
}
