/**
 * 生成频道分享链接使用的路由参数。
 * 群组和私密频道都依赖 id + 凭证，公开频道只需要频道名。
 */
export function channelShareQuery(options) {
	const source = options && typeof options === "object" ? options : {};
	const type = source.type === "r" || source.type === "g" ? source.type : "u";
	if (type === "u") {
		return {
			type: "u",
			ch: String(source.ch || "main"),
		};
	}
	return {
		type,
		id: String(source.id || ""),
		key: String(source.key || ""),
	};
}
