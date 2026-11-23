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
 * 本地 app 内置的 changelog 第一条就是正在运行的版本。
 */
export function findNowEntry(entries) {
	return (Array.isArray(entries) ? entries : [])[0] || null;
}
