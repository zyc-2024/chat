import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { changelog } from "../src/data/changelog.js";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const version = packageJson.version;
const currentBeta = Number((version.match(/-beta\.(\d+)/) || [])[1] || 0);
const lastTag = (process.argv[2] || "").trim();

if (!currentBeta) {
	console.error(`无法从版本号解析 beta 编号：${version}`);
	process.exit(1);
}

const lastBeta = lastTag
	? Number((lastTag.match(/beta\.(\d+)/i) || [])[1] || 0)
	: 164;

function buildNumberOf(entry) {
	const text = String(entry.version || "");
	const commit = text.match(/\((\d+)\)/);
	if (commit) return Number(commit[1]);
	const beta = text.match(/3\.0\.0 beta (\d+)/);
	return beta ? Number(beta[1]) : 0;
}

let entries = changelog.filter((entry) => {
	const number = buildNumberOf(entry);
	return number > lastBeta && number <= currentBeta;
});

if (!entries.length) {
	const currentEntry = changelog.find(
		(entry) => buildNumberOf(entry) === currentBeta,
	);
	if (currentEntry) entries = [currentEntry];
}

const label = `3.0.0 beta ${currentBeta} (${currentBeta})`;
const lines = [
	`# ${label}`,
	"",
	lastTag
		? `距上次发布 \`${lastTag}\` 以来的所有修改：`
		: "自 `2.4.3 (164)` 以来的所有修改：",
	"",
];

if (entries.length) {
	for (const entry of entries) {
		lines.push(`- **${entry.version}** — ${entry.desc}`);
	}
} else {
	lines.push("- 本次提交没有新的版本记录。");
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
