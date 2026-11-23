<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import LanguageSwitcher from "../components/LanguageSwitcher.vue";
import {
	createPrivateChannel,
	createPublicChannel,
} from "../services/chat.js";
import { t } from "../i18n/index.js";
import { chatName, currentIdentity } from "../lib/identity.js";
import "../styles/pages.css";

const route = useRoute();
const router = useRouter();

const progress = ref(0);
const status = ref(t("准备中……"));
const error = ref("");
const resultText = ref("");
const running = ref(false);
let redirectTimer = null;
let redirectTarget = null;

function queryString(name, fallback = "") {
	const value = route.query[name];
	if (Array.isArray(value)) return String(value[0] ?? fallback);
	return typeof value === "string" ? value : fallback;
}

const type = computed(() =>
	queryString("type") === "r" ? "private" : "public",
);
const steps = computed(() =>
	type.value === "private"
		? [
				{ at: 10, text: t("读取频道 id") },
				{ at: 35, text: t("分配新的频道 id") },
				{ at: 65, text: t("使用凭证加密初始消息") },
				{ at: 100, text: t("创建完成") },
			]
		: [
				{ at: 10, text: t("读取公开频道列表") },
				{ at: 30, text: t("把频道加入列表") },
				{ at: 60, text: t("创建聊天记录文件") },
				{ at: 80, text: t("写入欢迎消息") },
				{ at: 100, text: t("创建完成") },
			],
);

function onProgress(value, text) {
	progress.value = value;
	status.value = t(text);
}

function goToChat() {
	if (!redirectTarget) return;
	router.replace(redirectTarget).catch(() => {});
}

function startRedirect(target) {
	redirectTarget = target;
	if (redirectTimer) clearInterval(redirectTimer);
	goToChat();
	redirectTimer = window.setInterval(goToChat, 1000);
}

async function run() {
	if (running.value) return;
	if (redirectTimer) {
		clearInterval(redirectTimer);
		redirectTimer = null;
	}
	redirectTarget = null;
	error.value = "";
	resultText.value = "";
	progress.value = 0;
	running.value = true;
	try {
		if (type.value === "public") {
			const name = queryString("ch");
			if (!name) throw new Error(t("缺少频道名称，请回到首页重新创建"));
			const result = await createPublicChannel(
				name,
				chatName.value,
				onProgress,
				currentIdentity(),
			);
			resultText.value = t("公开频道“{name}”已经创建好了，正在进入……", {
				name: result.channel,
			});
			startRedirect({
				name: "chat",
				query: { type: "u", ch: result.channel },
			});
		} else {
			const key = queryString("key");
			if (!key) throw new Error(t("缺少凭证，请回到首页重新创建"));
			const result = await createPrivateChannel(
				key,
				chatName.value,
				onProgress,
				currentIdentity(),
			);
			resultText.value = t(
				"私密频道已创建。频道 id：{id}，凭证：{key}。请务必保存好这两项，正在进入……",
				{ id: result.id, key: result.key },
			);
			startRedirect({
				name: "chat",
				query: { type: "r", id: String(result.id), key: result.key },
			});
		}
	} catch (e) {
		error.value = e && e.message ? e.message : String(e);
		status.value = t("创建失败");
	} finally {
		running.value = false;
	}
}

onMounted(run);
onBeforeUnmount(() => {
	if (redirectTimer) clearInterval(redirectTimer);
});
</script>

<template>
	<div class="standalone-page">
		<div class="standalone-card">
			<div class="standalone-head">
				<div>
					<h1>
						{{
							type === "private"
								? t("创建私密频道")
								: t("创建公开频道")
						}}
					</h1>
					<p>
						{{
							type === "private"
								? t(
										"频道 id 会写入仓库，凭证只用于浏览器内的消息加密。",
									)
								: t(
										"公开频道会出现在首页列表里，所有人都可以进入。",
									)
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

			<div class="create-progress">
				<div class="progress-track">
					<div
						class="progress-fill"
						:style="{ width: progress + '%' }"
					></div>
				</div>
				<div class="progress-label">
					<span>{{ status }}</span>
					<span>{{ progress }}%</span>
				</div>
			</div>

			<ul class="create-steps">
				<li
					v-for="step in steps"
					:key="step.text"
					:class="{ done: progress >= step.at }"
				>
					{{ step.text }}
				</li>
			</ul>

			<div v-if="resultText" class="create-result">
				{{ resultText }}
			</div>

			<div v-if="error" class="create-error">
				<strong>{{ t("创建失败：") }}</strong>{{ error }}
				<div class="page-actions">
					<button type="button" class="primary-button" @click="run">
						{{ t("重试") }}
					</button>
					<button
						type="button"
						class="ghost-button"
						@click="router.push({ name: 'home' })"
					>
						{{ t("返回首页") }}
					</button>
				</div>
			</div>
		</div>
	</div>
</template>
