import fs from "node:fs";
import { currentAppVersion } from "../src/lib/appVersion.js";
import {
	changelog,
	changelogTags,
} from "../src/data/changelog.js";

const version = currentAppVersion();
fs.writeFileSync("public/version.txt", `${version.display}\n`);
fs.writeFileSync(
	"public/changelog.json",
	`${JSON.stringify({ changelog, changelogTags }, null, 2)}\n`,
);
console.log(`version.txt -> ${version.display}`);
console.log("changelog.json -> generated");
