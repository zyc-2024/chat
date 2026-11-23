<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import LanguageSwitcher from "../components/LanguageSwitcher.vue";
import {
	auth,
	loadNudgeFromAccount,
	loadThemeFromAccount,
	saveNudgeToAccount,
	saveThemeToAccount,
} from "../services/auth.js";
import {
	THEME_PRESETS,
	applyTheme,
	currentTheme,
	normalizeTheme,
	saveThemeLocal,
} from "../services/theme.js";
import { publishThemePreset } from "../services/themeStore.js";
import { t } from "../i18n/index.js";
import { chatName } from "../lib/identity.js";
import { showToast } from "../lib/toast.js";
import "../styles/pages.css";
import "../styles/theme.css";

const router = useRouter();
const draft = reactive({ ...currentTheme.value });
const uploadName = ref("");
const uploading = ref(false);
const busy = ref("");
const nudgeText = ref("");
const nudgeBusy = ref(false);

const previewPageStyle = computed(() => ({
	backgroundColor: draft.pageBackground,
	backgroundImage:
		"linear-gradient(var(--theme-overlay), var(--theme-overlay)), var(--theme-page-image)",
	backgroundSize: "cover",
	backgroundPosition: "center",
}));

const colorFields = [
	{ key: "accent", label: "强调色" },
	{ key: "pageBackground", label: "页面背景" },
	{ key: "surface", label: "卡片背景" },
	{ key: "text", label: "文字颜色" },
	{ key: "muted", label: "次要文字" },
	{ key: "border", label: "边框颜色" },
	{ key: "chatBackground", label: "聊天背景" },
	{ key: "messageBackground", label: "消息背景" },
];

function applyDraft() {
	applyTheme(draft);
}

function setDraft(theme) {
	Object.assign(draft, normalizeTheme(theme));
	applyDraft();
}

function usePreset(preset) {
	setDraft(preset.theme);
	showToast(t("已应用预设：{name}", { name: t(preset.name) }), "info");
}

function saveLocal() {
	const saved = saveThemeLocal(draft);
	Object.assign(draft, saved);
	showToast(t("主题已保存到本地"), "success");
}

async function syncToAccount() {
	if (busy.value) return;
	busy.value = "sync";
	try {
		const saved = saveThemeLocal(draft);
		Object.assign(draft, saved);
		await saveThemeToAccount(saved);
		showToast(t("主题已同步到账号"), "success");
	} catch (error) {
		showToast(error && error.message ? error.message : String(error), "error", 4000);
	} finally {
		busy.value = "";
	}
}

async function loadFromAccount() {
	if (busy.value) return;
	busy.value = "load";
	try {
		const theme = await loadThemeFromAccount();
		if (!theme) {
			showToast(t("账号还没有保存主题"), "info");
			return;
		}
		const saved = saveThemeLocal(theme);
		Object.assign(draft, saved);
		showToast(t("已从账号读取主题"), "success");
	} catch (error) {
		showToast(error && error.message ? error.message : String(error), "error", 4000);
	} finally {
		busy.value = "";
	}
}

async function uploadPreset() {
	if (uploading.value) return;
	const name = uploadName.value.trim();
	if (!name) {
		showToast(t("主题名称不能为空"), "error");
		return;
	}
	uploading.value = true;
	try {
		await publishThemePreset({
			name,
			author: chatName.value,
			theme: draft,
		});
		uploadName.value = "";
		showToast(t("主题已上传到商店"), "success");
	} catch (error) {
		showToast(error && error.message ? error.message : String(error), "error", 4000);
	} finally {
		uploading.value = false;
	}
}

function goStore() {
	router.push({ name: "theme-store" });
}

async function saveNudge() {
	if (nudgeBusy.value || !auth.session) return;
	nudgeBusy.value = true;
	try {
		nudgeText.value = await saveNudgeToAccount(nudgeText.value);
		showToast(t("拍一拍内容已保存"), "success");
	} catch (error) {
		showToast(
			error && error.message ? error.message : String(error),
			"error",
			4000,
		);
	} finally {
		nudgeBusy.value = false;
	}
}

onMounted(async () => {
	applyTheme(draft);
	if (auth.session) {
		try {
			nudgeText.value = await loadNudgeFromAccount();
		} catch (e) {
			// 读取失败时保留空值
		}
	}
});

onBeforeUnmount(() => {
	applyTheme(currentTheme.value);
});
</script>

<template>
	<div class="standalone-page">
		<div class="standalone-card theme-settings-card">
			<div class="standalone-head">
				<div>
					<h1>{{ t("个性设置") }}</h1>
					<p>{{ t("调整颜色和背景，保存在本机或同步到账号。") }}</p>
				</div>
				<div class="standalone-head-actions">
					<LanguageSwitcher />
					<router-link class="back-link" :to="{ name: 'home' }">
						{{ t("返回首页") }}
					</router-link>
				</div>
			</div>

			<div class="theme-live-preview">
				<div class="theme-preview-page" :style="previewPageStyle">
					<div
						class="theme-preview-card"
						:style="{
							background: draft.surface,
							color: draft.text,
							borderColor: draft.border,
						}"
					>
						<strong>{{ t("主题预览") }}</strong>
						<p :style="{ color: draft.muted }">
							{{ t("这是个性设置的应用效果预览。") }}
						</p>
						<span
							class="theme-preview-button"
							:style="{ background: draft.accent }"
						>
							{{ t("按钮示例") }}
						</span>
					</div>
				</div>
			</div>

			<section class="theme-section">
				<h2 class="theme-section-title">{{ t("颜色") }}</h2>
				<div class="theme-color-grid">
					<label
						v-for="field in colorFields"
						:key="field.key"
						class="theme-color-field"
					>
						<span>{{ t(field.label) }}</span>
						<input
							v-model="draft[field.key]"
							type="color"
							@input="applyDraft"
						/>
					</label>
				</div>
			</section>

			<section class="theme-section">
				<h2 class="theme-section-title">{{ t("背景图片") }}</h2>
				<label class="theme-field">
					<span>{{ t("背景图片网址") }}</span>
					<input
						v-model="draft.backgroundImage"
						type="url"
						placeholder="https://example.com/background.jpg"
						@input="applyDraft"
					/>
				</label>
				<label class="theme-field">
					<span>{{ t("背景遮罩：{value}", { value: draft.backgroundOverlay }) }}</span>
					<input
						v-model.number="draft.backgroundOverlay"
						type="range"
						min="0"
						max="0.85"
						step="0.05"
						@input="applyDraft"
					/>
				</label>
				<p class="theme-hint">
					{{ t("开启背景图片后，可以调整遮罩让文字更清晰。") }}
				</p>
			</section>

			<section class="theme-section">
				<h2 class="theme-section-title">{{ t("内置预设") }}</h2>
				<div class="preset-grid">
					<button
						v-for="preset in THEME_PRESETS"
						:key="preset.id"
						type="button"
						class="preset-card"
						:style="{
							background: preset.theme.pageBackground,
							borderColor: preset.theme.border,
						}"
						@click="usePreset(preset)"
					>
						<span class="preset-swatches">
							<i :style="{ background: preset.theme.accent }"></i>
							<i :style="{ background: preset.theme.surface }"></i>
							<i :style="{ background: preset.theme.chatBackground }"></i>
						</span>
						<span
							class="preset-name"
							:style="{ color: preset.theme.text }"
						>
							{{ t(preset.name) }}
						</span>
					</button>
				</div>
			</section>

			<section class="theme-section">
				<h2 class="theme-section-title">{{ t("保存与同步") }}</h2>
				<p class="theme-hint">
					{{ t("保存到本地只影响这台设备；同步到账号后可以在其他设备读取。") }}
				</p>
				<div class="theme-actions">
					<button type="button" class="primary-button" @click="saveLocal">
						{{ t("保存到本地") }}
					</button>
					<button
						type="button"
						class="ghost-button"
						:disabled="busy === 'sync' || !auth.session"
						@click="syncToAccount"
					>
						{{ busy === "sync" ? t("同步中……") : t("同步到账号") }}
					</button>
					<button
						type="button"
						class="ghost-button"
						:disabled="busy === 'load' || !auth.session"
						@click="loadFromAccount"
					>
						{{ busy === "load" ? t("读取中……") : t("从账号读取") }}
					</button>
					<button type="button" class="ghost-button" @click="goStore">
						{{ t("打开主题商店") }}
					</button>
				</div>
				<p v-if="!auth.session" class="theme-hint">
					{{ t("同步到账号需要先登录。") }}
				</p>
			</section>

			<section class="theme-section">
				<h2 class="theme-section-title">{{ t("拍一拍") }}</h2>
				<p class="theme-hint">
					{{
						t(
							"设置别人拍你时显示的后缀，例如“的小脑袋”，预览：{example}",
							{
								example: t("{name} 拍了拍你{suffix}", {
									name: chatName,
									suffix: nudgeText || t("的肩膀"),
								}),
							},
						)
					}}
				</p>
				<div class="theme-upload-row">
					<input
						v-model="nudgeText"
						type="text"
						maxlength="40"
						:disabled="!auth.session"
						:placeholder="t('输入拍一拍后缀，例如：的小脑袋')"
					/>
					<button
						type="button"
						class="primary-button"
						:disabled="nudgeBusy || !auth.session"
						@click="saveNudge"
					>
						{{ nudgeBusy ? t("保存中……") : t("保存拍一拍") }}
					</button>
				</div>
				<p v-if="!auth.session" class="theme-hint">
					{{ t("拍一拍设置需要登录账号。") }}
				</p>
			</section>

			<section class="theme-section">
				<h2 class="theme-section-title">{{ t("上传到主题商店") }}</h2>
				<p class="theme-hint">
					{{ t("所有主题免费，不需要购买。上传后会出现在公开主题商店中。") }}
				</p>
				<div class="theme-upload-row">
					<input
						v-model="uploadName"
						type="text"
						maxlength="40"
						:placeholder="t('主题名称')"
					/>
					<button
						type="button"
						class="primary-button"
						:disabled="uploading"
						@click="uploadPreset"
					>
						{{ uploading ? t("上传中……") : t("上传当前主题") }}
					</button>
				</div>
			</section>
		</div>
	</div>
</template>
