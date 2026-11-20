import fs from "node:fs";
import { currentAppVersion } from "../src/lib/appVersion.js";

const version = currentAppVersion();

if (process.argv.includes("--github-output")) {
	const output = process.env.GITHUB_OUTPUT;
	if (!output) {
		console.error("GITHUB_OUTPUT is not set");
		process.exit(1);
	}
	const lines = [
		`display=${version.display}`,
		`slug=${version.slug}`,
		`tag=${version.tag}`,
		`build=${version.build}`,
		`semver=${version.semver}`,
	];
	fs.appendFileSync(output, `${lines.join("\n")}\n`);
}

console.log(JSON.stringify(version, null, 2));
