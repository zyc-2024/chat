<script setup>
import { ref } from "vue";
import { GITEE_API, GITEE_TOKEN } from "../services/gitee.js";
import { formatBytes } from "../lib/format.js";
import { copyText } from "../lib/clipboard.js";
import { showToast } from "../lib/toast.js";
import "../styles/pages.css";

const content = ref("");
const progress = ref(0);
const progressText = ref("");
const busy = ref(false);
const output = ref(null);
const error = ref("");

function uploadRaw(stamp, body) {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("POST", `${GITEE_API}/contents/f%2F${stamp}`, true);
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
		xhr.onload = () => resolve({ status: xhr.status, text: xhr.responseText });
		xhr.send(JSON.stringify(body));
	});
}

async function upload() {
	if (busy.value) return;
	const raw = content.value.trim();
	if (!raw) {
		showToast("请先粘贴 Base64 内容", "error");
		return;
	}
	busy.value = true;
	output.value = null;
	error.value = "";
	progress.value = 0;
	progressText.value = "";
	const stamp = Date.now();
	const rawUrl = `${GITEE_API}/raw/f%2F${stamp}?access_token=${GITEE_TOKEN}`;
	try {
		const response = await uploadRaw(stamp, {
			access_token: GITEE_TOKEN,
			content: raw,
			message: `u[${stamp}]b64`,
		});
		if (response.status >= 200 && response.status < 300) {
			progress.value = 100;
			progressText.value = "上传完成";
			output.value = { rawUrl };
			showToast("上传成功", "success");
		} else {
			throw new Error(
				`上传失败（${response.status}）：${response.text.slice(0, 240)}`,
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

async function copy(value) {
	const ok = await copyText(value);
	showToast(ok ? "链接已复制" : "复制失败，请手动选择", ok ? "success" : "error");
}
</script>

<template>
	<div class="standalone-page">
		<div class="standalone-card">
			<div class="standalone-head">
				<div>
					<h1>粘贴 Base64 上传</h1>
					<p>把一段 Base64 文本直接上传到 Gitee 仓库并生成链接。</p>
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

			<div class="form-block">
				<label for="base64-input">Base64 内容</label>
				<textarea
					id="base64-input"
					v-model="content"
					placeholder="在这里粘贴 Base64 内容"
				></textarea>
			</div>

			<div class="page-actions">
				<button
					type="button"
					class="primary-button"
					:disabled="busy || !content.trim()"
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
				<div>上传成功！链接：</div>
				<a
					class="output-link"
					:href="output.rawUrl"
					target="_blank"
					rel="noreferrer"
					>{{ output.rawUrl }}</a
				>
				<div class="copy-row">
					<button
						type="button"
						class="mini-button"
						@click="copy(output.rawUrl)"
					>
						复制链接
					</button>
				</div>
			</div>

			<div class="file-meta">
				提示：Base64 内容会原样保存，请不要上传隐私或敏感信息。
			</div>
		</div>
	</div>
</template>
