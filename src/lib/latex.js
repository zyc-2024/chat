/**
 * 粗略检测某个位置是否处在 $...$ 或 $$...$$ 公式环境中。
 * 返回 "inline"、"display" 或 null。
 */
export function mathModeAt(text, index) {
	const source = String(text || "");
	const end = Math.min(Math.max(Number(index) || 0, 0), source.length);
	let mode = null;
	let i = 0;
	while (i < end) {
		const char = source[i];
		if (char === "\\") {
			i += 2;
			continue;
		}
		if (char === "$") {
			if (source[i + 1] === "$") {
				if (mode === null) mode = "display";
				else if (mode === "display") mode = null;
				i += 2;
				continue;
			}
			if (mode === null) mode = "inline";
			else if (mode === "inline") mode = null;
		}
		i++;
	}
	return mode;
}

/**
 * 不在公式环境时自动补全 $ 或 $$。
 */
export function wrapLatexSnippet(snippet, mode, display = false) {
	const text = String(snippet || "");
	if (mode || /^\${1,2}/.test(text)) return text;
	if (display) return `$$\n${text}\n$$`;
	return `$${text}$`;
}
