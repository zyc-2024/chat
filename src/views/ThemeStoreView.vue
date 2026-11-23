<script setup>
import { onMounted, ref } from "vue";
import LanguageSwitcher from "../components/LanguageSwitcher.vue";
import { fetchThemeStore } from "../services/themeStore.js";
import { saveThemeLocal } from "../services/theme.js";
import { locale, t } from "../i18n/index.js";
import { showToast } from "../lib/toast.js";
import "../styles/pages.css";
import "../styles/theme.css";

const loading = ref(true);
const error = ref("");
const themes = ref([]);

function formatDate(value) {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString(
		locale.value === "en" ? "en-US" : "zh-CN",
		{ year: "numeric", month: "long", day: "numeric" },
	);
}

async function load() {
	loading.value = true;
	error.value = "";
	try {
		themes.value = await fetchThemeStore();
	} catch (e) {
		error.value = e && e.message ? e.message : String(e);
		themes.value = [];
	} finally {
		loading.value = false;
	}
}

function apply(item) {
	saveThemeLocal(item.theme);
	showToast(t("主题已应用并保存到本地"), "success");
}

onMounted(load);
</script>

<template>
	<div class="standalone-page">
		<div class="standalone-card theme-store-card">
			<div class="standalone-head">
				<div>
					<h1>{{ t("主题商店") }}</h1>
					<p>{{ t("所有主题免费，选择喜欢的主题应用到本机。") }}</p>
				</div>
				<div class="standalone-head-actions">
					<LanguageSwitcher />
					<router-link class="back-link" :to="{ name: 'settings' }">
						{{ t("返回个性设置") }}
					</router-link>
					<router-link class="back-link" :to="{ name: 'home' }">
						{{ t("返回首页") }}
					</router-link>
				</div>
			</div>

			<div class="theme-actions">
				<button
					type="button"
					class="ghost-button"
					:disabled="loading"
					@click="load"
				>
					{{ loading ? t("加载中……") : t("刷新列表") }}
				</button>
				<router-link class="primary-button" :to="{ name: 'settings' }">
					{{ t("上传主题") }}
				</router-link>
			</div>

			<div v-if="error" class="theme-store-error">{{ error }}</div>

			<div v-if="loading" class="theme-store-empty">
				{{ t("主题列表加载中……") }}
			</div>
			<div v-else-if="!themes.length" class="theme-store-empty">
				{{ t("暂无社区主题，去个性设置上传第一个吧。") }}
			</div>
			<div v-else class="theme-store-grid">
				<article
					v-for="item in themes"
					:key="item.id"
					class="theme-store-item"
				>
					<div class="theme-store-preview">
						<span
							class="theme-store-swatch"
							:style="{ background: item.theme.accent }"
						></span>
						<span
							class="theme-store-swatch"
							:style="{ background: item.theme.pageBackground }"
						></span>
						<span
							class="theme-store-swatch"
							:style="{ background: item.theme.surface }"
						></span>
						<div
							class="theme-store-info"
							:style="{ color: item.theme.text }"
						>
							<div class="theme-store-name">
								{{ item.name }}
							</div>
							<div class="theme-store-meta">
								{{ item.author }}
								<span v-if="formatDate(item.createdAt)">
									· {{ formatDate(item.createdAt) }}
								</span>
							</div>
						</div>
					</div>
					<div class="theme-store-actions">
						<button
							type="button"
							class="primary-button"
							@click="apply(item)"
						>
							{{ t("应用主题") }}
						</button>
						<router-link class="ghost-button" :to="{ name: 'settings' }">
							{{ t("同步到账号") }}
						</router-link>
					</div>
				</article>
			</div>
		</div>
	</div>
</template>
