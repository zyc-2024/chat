import { currentAppVersion } from "../lib/appVersion.js";
import { t } from "../i18n/index.js";

const RELEASES_API =
	"https://api.github.com/repos/zyc-2024/chat/releases?per_page=30";
const UPDATE_DISMISS_KEY = "chat_update_dismissed_v1";

function parseBuildNumber(value) {
	const displayBuild = String(value || "").match(/\((\d+)\)\s*$/);
	if (displayBuild) return Number(displayBuild[1]);
	const tagBuild = String(value || "").match(/-(\d+)$/);
	return tagBuild ? Number(tagBuild[1]) : 0;
}

export function parseReleaseVersion(release) {
	if (!release || typeof release !== "object") return null;
	const name = String(release.name || "").trim();
	const tag = String(release.tag_name || "").trim();
	const display = name || tag.replace(/^v/, "");
	const build = parseBuildNumber(name) || parseBuildNumber(tag);
	if (!build) return null;
	const assets = Array.isArray(release.assets) ? release.assets : [];
	const exe = assets.find(
		(asset) =>
			asset &&
			typeof asset.name === "string" &&
			asset.name.toLowerCase().endsWith(".exe"),
	);
	return {
		display,
		tag,
		build,
		beta: /\bbeta\b/i.test(display),
		htmlUrl: String(release.html_url || ""),
		downloadUrl: String(
			(exe && exe.browser_download_url) ||
				release.html_url ||
				"",
		),
		publishedAt: String(release.published_at || ""),
	};
}

export function latestReleaseFrom(releases) {
	return (Array.isArray(releases) ? releases : [])
		.map(parseReleaseVersion)
		.filter(Boolean)
		.sort((a, b) => b.build - a.build)[0] || null;
}

export function updateAvailable(currentBuild, latest) {
	return !!(
		latest &&
		Number(latest.build) > Number(currentBuild || 0)
	);
}

export async function checkForUpdate(currentBuild) {
	const current = Number(
		currentBuild === undefined
			? currentAppVersion().build
			: currentBuild,
	);
	const response = await fetch(RELEASES_API, {
		cache: "no-store",
		headers: {
			Accept: "application/vnd.github+json",
		},
	});
	if (!response.ok) {
		throw new Error(
			t("检查更新失败（{status}）", { status: response.status }),
		);
	}
	const releases = await response.json();
	const latest = latestReleaseFrom(releases);
	return {
		current: currentAppVersion(),
		currentBuild: current,
		latest,
		available: updateAvailable(current, latest),
	};
}

export function wasUpdateDismissed(build) {
	try {
		return (
			localStorage.getItem(UPDATE_DISMISS_KEY) === String(build)
		);
	} catch (e) {
		return false;
	}
}

export function dismissUpdate(build) {
	try {
		localStorage.setItem(UPDATE_DISMISS_KEY, String(build));
	} catch (e) {
		// ignore
	}
}

export { UPDATE_DISMISS_KEY };
