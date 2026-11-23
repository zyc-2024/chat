<script setup>
import { computed } from "vue";
import { locale, setLocale, t } from "../i18n/index.js";

defineProps({
	compact: { type: Boolean, default: false },
});

const isEnglishLocale = computed(() => locale.value === "en");
const aiLabel = computed(() => (isEnglishLocale.value ? "AI translation" : "AI 翻译"));
const aiHint = computed(() =>
	t("界面英文由 AI 翻译，如有偏差请以中文为准"),
);

function onChange(event) {
	setLocale(event.target.value);
}

function toggle() {
	setLocale(isEnglishLocale.value ? "zh-CN" : "en");
}
</script>

<template>
	<div class="language-switcher" :class="{ compact }">
		<span class="language-globe" aria-hidden="true">◎</span>
		<button
			v-if="compact"
			type="button"
			class="language-toggle"
			:title="t('语言')"
			@click="toggle"
		>
			{{ isEnglishLocale ? "中文" : "EN" }}
		</button>
		<select
			v-else
			class="language-select"
			:aria-label="t('语言')"
			:value="locale"
			@change="onChange"
		>
			<option value="zh-CN">简体中文</option>
			<option value="en">English · AI translation</option>
		</select>
		<span
			v-if="isEnglishLocale"
			class="ai-translation-badge"
			:title="aiHint"
			>{{ compact ? "AI" : aiLabel }}</span
		>
	</div>
</template>

<style scoped>
.language-switcher {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	color: #69736d;
	font-size: 12px;
	white-space: nowrap;
}

.language-globe {
	color: #7e8a83;
	font-size: 14px;
	line-height: 1;
}

.language-select {
	height: 28px;
	max-width: 170px;
	padding: 0 8px;
	border: 1px solid #e1e7e3;
	border-radius: 7px;
	outline: none;
	background: #fafcfa;
	color: #526158;
	font-size: 12px;
	cursor: pointer;
}

.language-select:focus {
	border-color: #04783e;
}

.language-toggle {
	height: 26px;
	min-width: 36px;
	padding: 0 7px;
	border: 1px solid #e1e7e3;
	border-radius: 7px;
	background: #fafcfa;
	color: #526158;
	font-size: 11px;
	font-weight: 600;
}

.language-toggle:hover {
	border-color: #bfe6d0;
	background: #f1fbf5;
	color: #056633;
}

.ai-translation-badge {
	padding: 2px 6px;
	border-radius: 5px;
	background: #f3edff;
	color: #6f42c1;
	font-size: 10px;
	font-weight: 600;
	line-height: 1.4;
}

.language-switcher.compact {
	gap: 4px;
}

.language-switcher.compact .language-globe {
	display: none;
}

.language-switcher.compact .ai-translation-badge {
	padding: 1px 4px;
}
</style>
