import fs from "node:fs";
import { currentAppVersion } from "../src/lib/appVersion.js";

const version = currentAppVersion();
fs.writeFileSync("public/version.txt", `${version.display}\n`);
console.log(`version.txt -> ${version.display}`);
