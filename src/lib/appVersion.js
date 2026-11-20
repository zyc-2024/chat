import { changelog } from "../data/changelog.js";

/**
 * 版本号唯一来源：changelog 第一条记录的 version。
 *
 * 支持：
 *   3.2.1 (188)            -> tag v3.2.1-188
 *   3.0.0 beta 2 (174)     -> tag v3.0.0-beta.2
 */
export function parseVersionLabel(label) {
	const display = String(label || "").trim();
	const buildMatch = display.match(/\((\d+)\)\s*$/);
	const build = buildMatch ? Number(buildMatch[1]) : 0;
	const base = display.replace(/\s*\(\d+\)\s*$/, "").trim();

	const betaMatch = base.match(/^(.*?)\s+beta\s+(\d+)$/i);
	let semver;
	let slug;

	if (betaMatch) {
		semver = `${betaMatch[1]}-beta.${betaMatch[2]}`;
		slug = semver;
	} else if (build) {
		semver = base;
		slug = `${base.replace(/\s+/g, "-")}-${build}`;
	} else {
		semver = base || "0.0.0";
		slug =
			base.replace(/[^0-9A-Za-z._-]+/g, "-").replace(/^-+|-+$/g, "") ||
			"0.0.0";
	}

	return {
		display,
		base,
		build,
		semver,
		slug,
		tag: `v${slug}`,
	};
}

export function currentAppVersion() {
	return parseVersionLabel(changelog[0]?.version || "0.0.0");
}
