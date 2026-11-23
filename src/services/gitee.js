/**
 * Gitee 仓库作为后端的极简数据层。
 *
 * 这和原项目使用的存储方式一致：聊天记录、频道索引和账号信息都存在
 * zyc-2024/chat 仓库里。GitHub Pages / 静态托管无法运行服务端代码，
 * 所以这是原项目既有的设计。
 */
import { t } from "../i18n/index.js";

export const GITEE_API = "https://gitee.com/api/v5/repos/zyc-2024/chat";
export const GITEE_TOKEN = "19f7b43872c256d52d1bc71cbd2d0ffa";
export const FILE_REPO_OWNER = "zyc-2024";
export const FILE_REPO_PREFIX = "chat-files-";
export const FILE_REPO_COUNT = 256;

/** 取 32 位 MD5 的前两位，作为 256 个文件仓库的编号。 */
export function fileShard(hash) {
	const normalized = String(hash || "").trim().toLowerCase();
	if (!/^[0-9a-f]{32}$/.test(normalized)) {
		throw new Error(t("文件 hash 必须是 32 位 MD5"));
	}
	return normalized.slice(0, 2);
}

/** 文件仓库名，例如 chat-files-42。 */
export function fileRepoName(hash) {
	return `${FILE_REPO_PREFIX}${fileShard(hash)}`;
}

/** 文件仓库完整名称，例如 zyc-2024/chat-files-42。 */
export function fileRepoFullName(hash) {
	return `${FILE_REPO_OWNER}/${fileRepoName(hash)}`;
}

/** 文件仓库的 Gitee API 根地址。 */
export function fileRepoApi(hash) {
	return `https://gitee.com/api/v5/repos/${fileRepoFullName(hash)}`;
}

const LEGACY_FILE_RAW_RE =
	/https:\/\/(?:gitee\.com\/api\/v5\/repos\/zyc-2024\/chat|gitee\.com\/zyc-2024\/chat)\/raw\/f(?:%2F|\/)([0-9a-f]{32})/gi;

/**
 * 把旧主仓库里的上传文件链接改写到对应的分片仓库。
 * 迁移旧文件后，聊天记录里的历史链接仍然可以继续打开。
 */
export function rewriteLegacyFileUrls(text) {
	return String(text || "").replace(
		LEGACY_FILE_RAW_RE,
		(match, hash) =>
			`https://gitee.com/api/v5/repos/${fileRepoFullName(hash)}/raw/f%2F${hash.toLowerCase()}`,
	);
}

export function rewriteLegacyFileUrl(url) {
	return rewriteLegacyFileUrls(url);
}

function bytesToBinary(bytes) {
	let binary = "";
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode.apply(
			null,
			bytes.subarray(i, Math.min(i + chunk, bytes.length)),
		);
	}
	return binary;
}

/** UTF-8 安全的 base64 编码（Gitee contents API 要求）。 */
export function encodeBase64(text) {
	const bytes = new TextEncoder().encode(String(text));
	return btoa(bytesToBinary(bytes));
}

/** UTF-8 安全的 base64 解码。 */
export function decodeBase64(value) {
	const binary = atob(String(value || "").replace(/\s+/g, ""));
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return new TextDecoder().decode(bytes);
}

async function readError(response) {
	try {
		const data = await response.json();
		return data && data.message ? data.message : "";
	} catch (e) {
		return "";
	}
}

/**
 * 读取一个文件。
 * @returns {Promise<null | { sha: string, content: string }>}
 */
export async function getFile(path) {
	const response = await fetch(
		`${GITEE_API}/contents/${encodeURIComponent(path)}?access_token=${GITEE_TOKEN}`,
		{ cache: "no-store" },
	);
	if (response.status === 404) return null;
	if (!response.ok) {
		const message = await readError(response);
		throw new Error(
			t("读取文件失败（{status}）", { status: response.status }) +
				(message ? `: ${message}` : ""),
		);
	}
	const data = await response.json();
	if (Array.isArray(data) || !data || typeof data.content !== "string") {
		return null;
	}
	return { sha: data.sha, content: decodeBase64(data.content) };
}

/** 读取 JSON 文件，返回 { data, sha }，文件不存在时返回 null。 */
export async function getJson(path) {
	const file = await getFile(path);
	if (!file) return null;
	try {
		return { data: JSON.parse(file.content), sha: file.sha };
	} catch (e) {
		throw new Error(t("文件 {path} 不是有效的 JSON", { path }));
	}
}

/** 写入文本文件（PUT）。 */
export async function putFile(path, content, { message, sha }) {
	const body = {
		access_token: GITEE_TOKEN,
		message: message || "update " + path,
		content: encodeBase64(content),
	};
	if (sha) body.sha = sha;
	const response = await fetch(
		`${GITEE_API}/contents/${encodeURIComponent(path)}`,
		{
			method: "PUT",
			headers: { "Content-Type": "application/json;charset=UTF-8" },
			body: JSON.stringify(body),
		},
	);
	if (!response.ok) {
		const detail = await readError(response);
		throw new Error(
			t("保存文件失败（{status}）", { status: response.status }) +
				(detail ? `: ${detail}` : ""),
		);
	}
	return response.json();
}

/** 新建文本文件（POST）。 */
export async function postFile(path, content, { message } = {}) {
	const response = await fetch(
		`${GITEE_API}/contents/${encodeURIComponent(path)}`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json;charset=UTF-8" },
			body: JSON.stringify({
				access_token: GITEE_TOKEN,
				message: message || "create " + path,
				content: encodeBase64(content),
			}),
		},
	);
	if (!response.ok) {
		const detail = await readError(response);
		throw new Error(
			t("创建文件失败（{status}）", { status: response.status }) +
				(detail ? `: ${detail}` : ""),
		);
	}
	return response.json();
}

/** 写入 JSON：有 sha 时更新，没有时新建。 */
export async function saveJson(path, data, message, sha = null) {
	const content = JSON.stringify(data);
	if (sha) return putFile(path, content, { message, sha });
	return postFile(path, content, { message });
}

/** 更新一个已存在的 JSON 文件。 */
export async function putJson(path, data, message, sha) {
	return putFile(path, JSON.stringify(data), { message, sha });
}

/** 新建一个 JSON 文件。 */
export async function postJson(path, data, options = {}) {
	return postFile(path, JSON.stringify(data), options);
}

/** 读取 JSON；文件不存在时返回 fallback。 */
export async function getJsonOr(path, fallback) {
	const file = await getJson(path);
	return file || { data: fallback, sha: null };
}
