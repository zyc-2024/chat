#!/usr/bin/env node
/**
 * Gitee 上传文件分片仓库工具。
 *
 * 用法：
 *   node scripts/gitee-file-repos.mjs setup
 *   node scripts/gitee-file-repos.mjs migrate [md5前缀]
 *
 * setup   ：确保 zyc-2024/chat-files-00 ~ ff 共 256 个仓库存在并设为公开。
 * migrate ：把主仓库 f/<md5>/... 下的旧上传文件复制到分片仓库，校验后删除旧文件。
 */
import {
	FILE_REPO_COUNT,
	FILE_REPO_OWNER,
	FILE_REPO_PREFIX,
	GITEE_TOKEN,
	fileRepoFullName,
} from "../src/services/gitee.js";

const API = "https://gitee.com/api/v5";
const DATA_REPO = `${FILE_REPO_OWNER}/chat`;
const TOKEN_QUERY = `access_token=${encodeURIComponent(GITEE_TOKEN)}`;
const CONCURRENCY = 4;

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

class ApiError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

async function request(url, options = {}, attempts = 4) {
	let lastError = null;
	for (let attempt = 0; attempt < attempts; attempt++) {
		try {
			const response = await fetch(url, {
				...options,
				signal: AbortSignal.timeout(180000),
			});
			if (response.ok) return response.json();
			const text = await response.text();
			const error = new ApiError(
				response.status,
				`HTTP ${response.status}${text ? `：${text.slice(0, 300)}` : ""}`,
			);
			if (response.status === 429 || response.status >= 500) {
				lastError = error;
			} else {
				throw error;
			}
		} catch (error) {
			lastError = error;
			if (error instanceof ApiError && error.status < 500 && error.status !== 429) {
				throw error;
			}
		}
		await sleep(800 * (attempt + 1) ** 2);
	}
	throw lastError || new Error("请求失败");
}

function repoUrl(fullName, suffix = "") {
	return `${API}/repos/${fullName}${suffix}?${TOKEN_QUERY}`;
}

function contentsUrl(repo, path) {
	return repoUrl(repo, `/contents/${encodeURIComponent(path)}`);
}

async function getRepo(fullName) {
	try {
		return await request(repoUrl(fullName));
	} catch (error) {
		if (error instanceof ApiError && error.status === 404) return null;
		throw error;
	}
}

async function updateRepo(fullName, name) {
	return request(repoUrl(fullName), {
		method: "PATCH",
		headers: { "Content-Type": "application/json;charset=UTF-8" },
		body: JSON.stringify({
			access_token: GITEE_TOKEN,
			name,
			path: name,
			private: false,
		}),
	});
}

async function ensureRepo(shard) {
	const name = `${FILE_REPO_PREFIX}${shard}`;
	const fullName = `${FILE_REPO_OWNER}/${name}`;
	let repo = await getRepo(fullName);
	let created = false;
	if (!repo) {
		repo = await request(`${API}/user/repos?${TOKEN_QUERY}`, {
			method: "POST",
			headers: { "Content-Type": "application/json;charset=UTF-8" },
			body: JSON.stringify({
				access_token: GITEE_TOKEN,
				name,
				path: name,
				private: false,
				auto_init: true,
				description: `zyc chat uploaded files ${shard}`,
			}),
		});
		created = true;
	}
	if (repo.private) {
		repo = await updateRepo(fullName, name);
	}
	return { fullName, created, private: repo.private };
}

async function setupRepos() {
	const shards = Array.from({ length: FILE_REPO_COUNT }, (_, index) =>
		index.toString(16).padStart(2, "0"),
	);
	let cursor = 0;
	let created = 0;
	let checked = 0;
	async function worker() {
		while (cursor < shards.length) {
			const shard = shards[cursor++];
			const result = await ensureRepo(shard);
			if (result.created) created++;
			checked++;
			if (checked % 16 === 0 || checked === shards.length) {
				console.log(`checked ${checked}/${shards.length}, created ${created}`);
			}
		}
	}
	await Promise.all(
		Array.from({ length: CONCURRENCY }, () => worker()),
	);
	console.log(`file repos ready: ${shards.length}, newly created: ${created}`);
}

async function getContents(repo, path) {
	return request(contentsUrl(repo, path));
}

async function getContentsMaybe(repo, path) {
	try {
		return await getContents(repo, path);
	} catch (error) {
		if (error instanceof ApiError && error.status === 404) return null;
		throw error;
	}
}

function cleanBase64(value) {
	return String(value || "").replace(/\s+/g, "");
}

async function postFile(repo, path, content, message) {
	return request(contentsUrl(repo, path), {
		method: "POST",
		headers: { "Content-Type": "application/json;charset=UTF-8" },
		body: JSON.stringify({
			access_token: GITEE_TOKEN,
			content,
			message,
		}),
	});
}

async function deleteFile(repo, path, sha, message) {
	return request(contentsUrl(repo, path), {
		method: "DELETE",
		headers: { "Content-Type": "application/json;charset=UTF-8" },
		body: JSON.stringify({
			access_token: GITEE_TOKEN,
			sha,
			message,
		}),
	});
}

async function migrateFile(hash, entry) {
	const targetRepo = fileRepoFullName(hash);
	const source = await getContents(DATA_REPO, entry.path);
	if (Array.isArray(source)) {
		throw new Error(`${entry.path} 不是文件`);
	}
	const content = cleanBase64(source.content);
	if (!content) throw new Error(`${entry.path} 内容为空`);
	let target = await getContentsMaybe(targetRepo, entry.path);
	// Gitee 对不存在的文件有时返回空数组，而不是 404。
	if (Array.isArray(target)) target = null;
	if (target) {
		if (cleanBase64(target.content) !== content) {
			throw new Error(`${targetRepo}/${entry.path} 已存在且内容不同`);
		}
	} else {
		await postFile(
			targetRepo,
			entry.path,
			content,
			`move upload ${hash}/${entry.name} from ${DATA_REPO}`,
		);
		const written = await getContents(targetRepo, entry.path);
		if (cleanBase64(written.content) !== content) {
			throw new Error(`写入 ${targetRepo}/${entry.path} 后校验失败`);
		}
	}
	await deleteFile(
		DATA_REPO,
		entry.path,
		source.sha,
		`move upload ${hash}/${entry.name} to ${targetRepo}`,
	);
	console.log(`moved ${entry.path} -> ${targetRepo}`);
}

async function migrateUploads(onlyPrefix = "") {
	const root = await getContentsMaybe(DATA_REPO, "f");
	if (!root) {
		console.log("主仓库没有 f/ 目录，无需迁移");
		return;
	}
	const directories = root.filter(
		(entry) =>
			entry.type === "dir" &&
			/^[0-9a-f]{32}$/i.test(entry.name) &&
			(!onlyPrefix || entry.name.toLowerCase().startsWith(onlyPrefix)),
	);
	let files = 0;
	for (const directory of directories) {
		const hash = directory.name.toLowerCase();
		const entries = await getContents(DATA_REPO, directory.path);
		for (const entry of entries) {
			if (entry.type !== "file") continue;
			await migrateFile(hash, entry);
			files++;
		}
	}
	const remaining = await getContentsMaybe(DATA_REPO, "f");
	const keep = remaining && remaining.find((entry) => entry.name === ".keep");
	if (keep) {
		await deleteFile(DATA_REPO, keep.path, keep.sha, "remove empty upload keep");
		console.log("removed f/.keep");
	}
	console.log(`migrated ${files} files from ${DATA_REPO}/f`);
}

const command = process.argv[2];
if (command === "setup") {
	await setupRepos();
} else if (command === "migrate") {
	const prefix = String(process.argv[3] || "").toLowerCase();
	if (prefix && !/^[0-9a-f]{2,32}$/.test(prefix)) {
		console.error("md5 前缀只能是 2-32 位十六进制字符");
		process.exit(1);
	}
	await migrateUploads(prefix);
} else {
	console.error("用法：node scripts/gitee-file-repos.mjs setup|migrate [md5前缀]");
	process.exit(1);
}
