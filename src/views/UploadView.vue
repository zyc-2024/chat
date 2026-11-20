<script setup>
import { computed, ref } from "vue";
import SparkMD5 from "spark-md5";
import { GITEE_API, GITEE_TOKEN } from "../services/gitee.js";
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

const fileInfo = computed(() => {
	if (!file.value) return "";
	return `${file.value.name} · ${formatBytes(file.value.size)}`;
});

function chooseFile(event) {
	const selected = event.target.files && event.target.files[0];
	file.value = selected || null;
	output.value = null;
	error.value = "";
	progress.value = 0;
	progressText.value = "";
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
		reader.onerror = () => reject(reader.error || new Error("读取文件失败"));
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
		xhr.onerror = () => reject(new Error("网络错误，上传失败"));
		xhr.onabort = () => reject(new Error("上传已取消"));
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
		showToast("请先选择文件", "error");
		return;
	}
	if (selected.size >= 104857600) {
		showToast("文件不能超过 100MB", "error");
		return;
	}
	busy.value = true;
	output.value = null;
	error.value = "";
	progress.value = 0;
	progressText.value = "读取中……";
	try {
		const buffer = await readAsArrayBuffer(selected);
		progressText.value = "计算 MD5 并编码……";
		const md5 = SparkMD5.ArrayBuffer.hash(buffer);
		const base64 = arrayBufferToBase64(buffer);
		const path = `f%2F${md5}%2F${encodeURIComponent(selected.name)}`;
		const rawUrl = `${GITEE_API}/raw/${path}?access_token=${GITEE_TOKEN}`;
		const markdown = `[${selected.name}](${rawUrl})`;

		progress.value = 1;
		const response = await uploadRequest(`${GITEE_API}/contents/${path}`, {
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
			progressText.value = "上传完成";
			output.value = {
				ok: true,
				note: exists ? "文件名已存在，仍然可以使用下面的链接。" : "上传成功！",
				markdown,
				rawUrl,
			};
			showToast("上传成功", "success");
		} else {
			throw new Error(
				`上传失败（${response.status}）${
					message ? "：" + message : response.text.slice(0, 200)
				}`,
			);
		}
	} catch (e) {
		error.value = e && e.message ? e.message : String(e);
		progressText.value = "上传失败";
		showToast(error.value, "error", 4000);
	} finally {
		busy.value = false;
	}
}

async function copy(value, label) {
	const ok = await copyText(value);
	showToast(ok ? `${label}已复制` : "复制失败，请手动选择", ok ? "success" : "error");
}
</script>

<template>
	<div class="standalone-page">
		<div class="standalone-card">
			<div class="standalone-head">
				<div>
					<h1>上传文件</h1>
					<p>
						文件会以 base64 形式保存到 Gitee 仓库，上传后生成可直接引用的链接。
					</p>
				</div>
				<router-link class="back-link" :to="{ name: 'home' }">
					返回首页
				</router-link>
			</div>

			<div class="upload-tabs">
				<router-link :to="{ name: 'upload' }">选择文件</router-link>
				<router-link :to="{ name: 'upload-base64' }">
					粘贴 Base64
				</router-link>
			</div>

			<label class="file-drop">
				<input type="file" @change="chooseFile" />
				<strong>{{ file ? file.name : "点击选择文件" }}</strong>
				<span v-if="file">{{ formatBytes(file.size) }}</span>
				<span v-else>单个文件不超过 100MB</span>
			</label>

			<div v-if="fileInfo" class="file-meta">已选择：{{ fileInfo }}</div>

			<div class="page-actions">
				<button
					type="button"
					class="primary-button"
					:disabled="busy || !file"
					@click="upload"
				>
					{{ busy ? "上传中……" : "开始上传" }}
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
				<div>复制下面的 Markdown 到聊天框即可引用：</div>
				<code class="output-link">{{ output.markdown }}</code>
				<div class="copy-row">
					<button
						type="button"
						class="mini-button"
						@click="copy(output.markdown, 'Markdown')"
					>
						复制 Markdown
					</button>
					<button
						type="button"
						class="mini-button"
						@click="copy(output.rawUrl, '链接')"
					>
						复制链接
					</button>
				</div>
			</div>

			<div class="file-meta">
				提示：上传使用原项目的公开 Gitee API 令牌。请不要上传包含隐私信息的文件。
			</div>
		</div>
	</div>
</template>
