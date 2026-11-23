<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import {
	checkForUpdate,
	dismissUpdate,
	wasUpdateDismissed,
} from "../services/appUpdate.js";
import { currentAppVersion, isLocalAppRuntime } from "../lib/appVersion.js";
import { t } from "../i18n/index.js";

const visible = ref(false);
const checking = ref(false);
const latest = ref(null);
const current = ref(currentAppVersion());

let timer = null;

async function check() {
	if (checking.value || !isLocalAppRuntime()) return;
	checking.value = true;
	try {
		const result = await checkForUpdate(current.value.build);
		current.value = result.current;
		if (
			result.available &&
			result.latest &&
			!wasUpdateDismissed(result.latest.build)
		) {
			latest.value = result.latest;
			visible.value = true;
		}
	} catch (error) {
		console.warn("检查 app 更新失败：", error);
	} finally {
		checking.value = false;
	}
}

function later() {
	if (latest.value) dismissUpdate(latest.value.build);
	visible.value = false;
}

onMounted(() => {
	if (!isLocalAppRuntime()) return;
	timer = window.setTimeout(check, 1800);
});

onBeforeUnmount(() => {
	if (timer) clearTimeout(timer);
});
</script>

<template>
	<Transition name="update-notice">
		<aside v-if="visible && latest" class="update-notice">
			<div class="update-notice-head">
				<span class="update-dot" aria-hidden="true"></span>
				<strong>
					{{ t("发现新版本 {version}", { version: latest.display }) }}
				</strong>
				<span v-if="latest.beta" class="update-beta">beta</span>
			</div>
			<p>
				{{ t("当前版本：{version}", { version: current.display }) }}
			</p>
			<div class="update-actions">
				<a
					class="primary-button"
					:href="latest.downloadUrl"
					target="_blank"
					rel="noreferrer"
					@click="visible = false"
				>
					{{ t("下载更新") }}
				</a>
				<a
					class="ghost-button"
					:href="latest.htmlUrl"
					target="_blank"
					rel="noreferrer"
				>
					{{ t("查看更新说明") }}
				</a>
				<button type="button" class="ghost-button" @click="later">
					{{ t("稍后") }}
				</button>
			</div>
		</aside>
	</Transition>
</template>

<style scoped>
.update-notice {
	position: fixed;
	right: 18px;
	bottom: 18px;
	z-index: 6200;
	width: min(360px, calc(100vw - 36px));
	padding: 14px 16px;
	border: 1px solid var(--theme-border);
	border-left: 4px solid var(--theme-accent);
	border-radius: 12px;
	background: var(--theme-surface);
	color: var(--theme-text);
	box-shadow: 0 14px 42px rgba(0, 0, 0, 0.2);
}

.update-notice-head {
	display: flex;
	align-items: center;
	gap: 7px;
	font-size: 14px;
	line-height: 1.4;
}

.update-notice-head strong {
	flex: 1;
	min-width: 0;
}

.update-dot {
	flex: 0 0 auto;
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: var(--theme-accent);
	box-shadow: 0 0 0 4px var(--theme-accent-soft);
}

.update-beta {
	padding: 1px 6px;
	border-radius: 4px;
	background: #fff1e7;
	color: #c2410c;
	font-size: 10px;
	font-weight: 600;
	text-transform: uppercase;
}

.update-notice p {
	margin: 6px 0 12px;
	color: var(--theme-muted);
	font-size: 12px;
	line-height: 1.6;
}

.update-actions {
	display: flex;
	flex-wrap: wrap;
	gap: 7px;
}

.update-actions .primary-button,
.update-actions .ghost-button {
	height: 32px;
	padding: 0 11px;
	font-size: 12px;
	text-decoration: none;
}

.update-notice-enter-active,
.update-notice-leave-active {
	transition: opacity 0.2s ease, transform 0.2s ease;
}

.update-notice-enter-from,
.update-notice-leave-to {
	opacity: 0;
	transform: translateY(8px);
}

@media (max-width: 520px) {
	.update-notice {
		right: 10px;
		bottom: 10px;
		width: calc(100vw - 20px);
	}
}
</style>
