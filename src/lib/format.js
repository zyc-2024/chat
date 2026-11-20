/** 原项目的消息时间格式：YYYYMMDD HH:mm:ss（UTC+8）。 */
export function timeStamp(date = new Date()) {
	const shifted = new Date(date.getTime() + 8 * 3600 * 1000);
	return shifted
		.toISOString()
		.slice(0, 19)
		.replace("T", " ")
		.replaceAll("-", "");
}

/** 把旧的时间戳格式美化成可读文本。 */
export function prettyTime(value) {
	const text = String(value || "");
	const spaced = text.match(
		/^(\d{4})(\d{2})(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/,
	);
	if (spaced) {
		return `${spaced[1]}-${spaced[2]}-${spaced[3]} ${spaced[4]}:${spaced[5]}:${spaced[6]}`;
	}
	const compact = text.match(
		/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/,
	);
	if (compact) {
		return `${compact[1]}-${compact[2]}-${compact[3]} ${compact[4]}:${compact[5]}:${compact[6]}`;
	}
	return text;
}

export function formatBytes(bytes) {
	if (!bytes) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const index = Math.min(
		sizes.length - 1,
		Math.floor(Math.log(bytes) / Math.log(k)),
	);
	return `${(bytes / Math.pow(k, index)).toFixed(2)} ${sizes[index]}`;
}

export function safeDecode(value) {
	try {
		return decodeURIComponent(String(value ?? ""));
	} catch (e) {
		return String(value ?? "");
	}
}

export function channelColor(name) {
	let hash = 0;
	const text = safeDecode(name);
	for (let i = 0; i < text.length; i++) {
		hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
	}
	return `hsl(${hash % 360} 58% 52%)`;
}

export function channelInitial(name) {
	const label = safeDecode(name).trim();
	return label ? label.charAt(0) : "?";
}
