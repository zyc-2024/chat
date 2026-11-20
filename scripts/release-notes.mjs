import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { changelog } from "../src/data/changelog.js";
import { currentAppVersion } from "../src/lib/appVersion.js";

const version = currentAppVersion();
const currentBuild = version.build;
const lastTag = (process.argv[2] || "").trim();
const lastBuild = lastTag
	? Number((lastTag.match(/(\d+)\s*$/) || [])[1] || 0)
	: 164;

function buildNumberOf(entry) {
	const text = String(entry.version || "");
	const commit = text.match(/\((\d+)\)/);
	return commit ? Number(commit[1]) : 0;
}

let entries = changelog.filter((entry) => {
	const number = buildNumberOf(entry);
	return number > lastBuild && number <= currentBuild;
});

if (!entries.length) {
	const currentEntry =
		changelog.find((entry) => buildNumberOf(entry) === currentBuild) ||
		changelog[0];
	if (currentEntry) entries = [currentEntry];
}

const lines = [
	`# ${version.display}`,
	"",
	lastTag
		? `距上次发布 \`${lastTag}\` 以来的所有修改：`
		: "自 `2.4.3 (164)` 以来的所有修改：",
	"",
];

for (const entry of entries) {
	lines.push(`- **${entry.version}** — ${entry.desc}`);
}

if (lastTag) {
	try {
		execFileSync("git", ["rev-parse", "--verify", "--quiet", lastTag], {
			stdio: "ignore",
		});
		const commits = execFileSync(
			"git",
			[
				"log",
				`${lastTag}..HEAD`,
				"--pretty=format:- `%h` %s (%an)",
				"--no-merges",
			],
			{ encoding: "utf8" },
		).trim();
		if (commits) {
			lines.push("", "## 提交记录", "", commits);
		}
	} catch (error) {
		console.warn("读取 git 提交记录失败：", error.message);
	}
}

const notes = `${lines.join("\n").trim()}\n`;
fs.writeFileSync("release-notes.md", notes);

const fullChangelog = [
	"# Changelog",
	"",
	...changelog.flatMap((entry) => [
		`## ${entry.version}`,
		"",
		entry.desc,
		"",
	]),
]
	.join("\n")
	.trim();
fs.writeFileSync("CHANGELOG.md", `${fullChangelog}\n`);

console.log(notes);
