<script setup>
import { computed, ref } from "vue";
import SparkMD5 from "spark-md5";
import LanguageSwitcher from "../components/LanguageSwitcher.vue";
import { GITEE_TOKEN, fileRepoApi } from "../services/gitee.js";
import { t } from "../i18n/index.js";
import { formatBytes } from "../lib/format.js";
import { copyText } from "../lib/clipboard.js";
import { showToast } from "../lib/toast.js";
import "../styles/pages.css";

const file = ref(null);
const progress = ref(0);
const progressText = ref("");
const busy = ref(false);
const output = ref(null);
const error = ref("");
const dragging = ref(false);

const fileInfo = computed(() => {
	if (!file.value) return "";
	return `${file.value.name} · ${formatBytes(file.value.size)}`;
});

function setFile(selected) {
	if (!selected) return false;
	if (selected.size >= 104857600) {
		showToast(t("文件不能超过 100MB"), "error");
		return false;
	}
	file.value = selected;
	output.value = null;
	error.value = "";
	progress.value = 0;
	progressText.value = "";
	return true;
}

function chooseFile(event) {
	const selected = event.target.files && event.target.files[0];
	setFile(selected || null);
	event.target.value = "";
}

function hasFiles(event) {
	const types = event.dataTransfer && event.dataTransfer.types;
	return !!types && Array.from(types).includes("Files");
}

function onDragEnter(event) {
	if (!hasFiles(event)) return;
	event.preventDefault();
	dragging.value = true;
}

function onDragOver(event) {
	if (!hasFiles(event)) return;
	event.preventDefault();
	event.dataTransfer.dropEffect = "copy";
	dragging.value = true;
}

function onDragLeave(event) {
	if (!hasFiles(event)) return;
	if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget)) {
		return;
	}
	dragging.value = false;
}

function onDrop(event) {
	if (!hasFiles(event)) return;
	event.preventDefault();
	dragging.value = false;
	if (busy.value) {
		showToast(t("正在上传，请稍后再拖入文件"), "info");
		return;
	}
	const files = Array.from(event.dataTransfer.files || []);
	if (!files.length) return;
	if (files.length > 1) {
		showToast(t("一次只能上传一个文件，已选择第一个"), "info");
	}
	if (setFile(files[0])) {
		upload();
	}
}

function arrayBufferToBase64(buffer) {
	const bytes = new Uint8Array(buffer);
	let binary = "";
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode.apply(
			null,
			bytes.subarray(i, Math.min(i + chunk, bytes.length)),
		);
	}
	return btoa(binary);
}

function readAsArrayBuffer(selected) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result);
		reader.onerror = () =>
			reject(reader.error || new Error(t("读取文件失败")));
		reader.readAsArrayBuffer(selected);
	});
}

function uploadRequest(url, body) {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("POST", url, true);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.upload.onprogress = (event) => {
			if (event.lengthComputable) {
				progress.value = Math.min(
					99,
					Math.round((event.loaded / event.total) * 100),
				);
				progressText.value = `${formatBytes(event.loaded)} / ${formatBytes(
					event.total,
				)}`;
			}
		};
		xhr.onerror = () => reject(new Error(t("网络错误，上传失败")));
		xhr.onabort = () => reject(new Error(t("上传已取消")));
		xhr.onload = () => {
			let data = null;
			try {
				data = JSON.parse(xhr.responseText);
			} catch (e) {
				// ignore
			}
			resolve({ status: xhr.status, data, text: xhr.responseText });
		};
		xhr.send(JSON.stringify(body));
	});
}

async function upload() {
	if (busy.value) return;
	const selected = file.value;
	if (!selected) {
		showToast(t("请先选择文件"), "error");
		return;
	}
	if (selected.size >= 104857600) {
		showToast(t("文件不能超过 100MB"), "error");
		return;
	}
	busy.value = true;
	output.value = null;
	error.value = "";
	progress.value = 0;
	progressText.value = t("读取中……");
	try {
		const buffer = await readAsArrayBuffer(selected);
		progressText.value = t("计算 MD5 并编码……");
		const md5 = SparkMD5.ArrayBuffer.hash(buffer);
		const base64 = arrayBufferToBase64(buffer);
		const repoApi = fileRepoApi(md5);
		const path = `f%2F${md5}%2F${encodeURIComponent(selected.name)}`;
		const rawUrl = `${repoApi}/raw/${path}?access_token=${GITEE_TOKEN}`;
		const markdown = `[${selected.name}](${rawUrl})`;

		progress.value = 1;
		const response = await uploadRequest(`${repoApi}/contents/${path}`, {
			access_token: GITEE_TOKEN,
			content: base64,
			message: `u[${selected.name}]s[${formatBytes(
				selected.size,
			)}]m[${md5}]`,
		});

		const message = response.data && response.data.message;
		const exists =
			typeof message === "string" &&
			(message.includes("已存在") || message.includes("already exists"));
		if ((response.status >= 200 && response.status < 300) || exists) {
			progress.value = 100;
			progressText.value = t("上传完成");
			output.value = {
				ok: true,
				note: exists
					? t("文件名已存在，仍然可以使用下面的链接。")
					: t("上传成功！"),
				markdown,
				rawUrl,
			};
			showToast(t("上传成功"), "success");
		} else {
			throw new Error(
				t("上传失败（{status}）", { status: response.status }) +
					(message ? `: ${message}` : `: ${response.text.slice(0, 200)}`),
			);
		}
	} catch (e) {
		error.value = e && e.message ? e.message : String(e);
		progressText.value = t("上传失败");
		showToast(error.value, "error", 4000);
	} finally {
		busy.value = false;
	}
}

async function copy(value, label) {
	const ok = await copyText(value);
	showToast(
		ok ? t("{label}已复制", { label }) : t("复制失败，请手动选择"),
		ok ? "success" : "error",
	);
}
</script>

<template>
	<div
		class="standalone-page"
		@dragenter="onDragEnter"
		@dragover="onDragOver"
		@dragleave="onDragLeave"
		@drop="onDrop"
	>
		<div class="standalone-card">
			<div class="standalone-head">
				<div>
					<h1>{{ t("上传文件") }}</h1>
					<p>
						{{
							t(
								"文件会以 base64 形式保存到 Gitee 分片仓库（按 MD5 前两位选择 256 个仓库之一），上传后生成可直接引用的链接。",
							)
						}}<br />{{
							t("也可以把文件直接拖到页面中，拖入后会自动上传。")
						}}
					</p>
				</div>
				<div class="standalone-head-actions">
					<LanguageSwitcher />
					<router-link class="back-link" :to="{ name: 'home' }">
						{{ t("返回首页") }}
					</router-link>
				</div>
			</div>

			<div class="upload-tabs">
				<router-link :to="{ name: 'upload' }">
					{{ t("选择文件") }}
				</router-link>
				<router-link :to="{ name: 'upload-base64' }">
					{{ t("粘贴 Base64") }}
				</router-link>
			</div>

			<label class="file-drop" :class="{ dragging }">
				<input type="file" @change="chooseFile" />
				<strong>
					{{ file ? file.name : t("拖拽文件到这里，或点击选择") }}
				</strong>
				<span v-if="file">{{ formatBytes(file.size) }}</span>
				<span v-else>{{
					t("单个文件不超过 100MB · 拖入后自动上传")
				}}</span>
			</label>

			<div v-if="fileInfo" class="file-meta">
				{{ t("已选择：{info}", { info: fileInfo }) }}
			</div>

			<div class="page-actions">
				<button
					type="button"
					class="primary-button"
					:disabled="busy || !file"
					@click="upload"
				>
					{{ busy ? t("上传中……") : t("开始上传") }}
				</button>
			</div>

			<div v-if="progress > 0 || progressText" class="upload-progress">
				<div class="progress-track">
					<div
						class="progress-fill"
						:style="{ width: progress + '%' }"
					></div>
				</div>
				<div class="progress-detail">
					{{ progress }}% · {{ progressText }}
				</div>
			</div>

			<div v-if="error" class="output-box error">{{ error }}</div>

			<div v-if="output" class="output-box success">
				<div>{{ output.note }}</div>
				<a
					class="output-link"
					:href="output.rawUrl"
					target="_blank"
					rel="noreferrer"
					>{{ output.rawUrl }}</a
				>
				<div>
					{{ t("复制下面的 Markdown 到聊天框即可引用：") }}
				</div>
				<code class="output-link">{{ output.markdown }}</code>
				<div class="copy-row">
					<button
						type="button"
						class="mini-button"
						@click="copy(output.markdown, t('复制 Markdown'))"
					>
						{{ t("复制 Markdown") }}
					</button>
					<button
						type="button"
						class="mini-button"
						@click="copy(output.rawUrl, t('复制链接'))"
					>
						{{ t("复制链接") }}
					</button>
				</div>
			</div>

			<div class="file-meta">
				{{
					t(
						"提示：上传使用原项目的公开 Gitee API 令牌。请不要上传包含隐私信息的文件。",
					)
				}}
			</div>
		</div>
	</div>
</template>
