<script setup>
import { computed, ref } from "vue";
import LanguageSwitcher from "../components/LanguageSwitcher.vue";
import { changelog, changelogTags } from "../data/changelog.js";
import { isLocalAppRuntime } from "../lib/appVersion.js";
import {
	findLatestStableEntry,
	findNowEntry,
} from "../lib/changelogMeta.js";
import { locale, t } from "../i18n/index.js";
import "../styles/pages.css";

const activeTag = ref("");

const latestFallback = {
	id: "latest",
	label: "latest",
	color: "#23db66",
	background: "#f0f3f1",
};
const latestDefinition =
	changelogTags.find((tag) =>
		/latest|最新/i.test(`${tag.id || ""} ${tag.label || ""}`),
	) || latestFallback;
const nowFallback = {
	id: "now",
	label: "now",
	color: "#0b8ec2",
	background: "#eaf7fd",
};
const nowDefinition =
	changelogTags.find(
		(tag) => String(tag.id || "").toLowerCase() === "now",
	) || nowFallback;

const latestEntry = findLatestStableEntry(changelog);
const nowEntry = findNowEntry(changelog);
const appRuntime = isLocalAppRuntime();
const latestHint = t("最新一个非 beta 版本");
const nowHint = appRuntime
	? t("当前正在使用的 app 版本")
	: t("网页当前最新版本");

function withHint(tag, hint) {
	return tag ? { ...tag, hint } : null;
}

function resolveTag(tag) {
	if (typeof tag === "string") {
		const found = changelogTags.find((item) => item.id === tag);
		if (found) return { ...found, key: found.id || found.label };
		return {
			key: tag,
			label: tag,
			color: "#69736d",
			background: "#f0f3f1",
		};
	}
	if (!tag || typeof tag !== "object") return null;
	return { ...tag, key: tag.id || tag.label };
}

function tagsOf(entry) {
	const tags = (entry.tags || []).map(resolveTag).filter(Boolean);
	if (entry === latestEntry) {
		const latest = withHint(resolveTag(latestDefinition), latestHint);
		if (latest && !tags.some((tag) => tag.key === latest.key)) {
			tags.unshift(latest);
		}
	}
	if (entry === nowEntry) {
		const now = withHint(resolveTag(nowDefinition), nowHint);
		if (now && !tags.some((tag) => tag.key === now.key)) {
			tags.unshift(now);
		}
	}
	return tags;
}

const allTags = computed(() => {
	const map = new Map();
	for (const tag of changelogTags) {
		const resolved = resolveTag(tag);
		if (resolved) map.set(resolved.key, resolved);
	}
	const latest = resolveTag(latestDefinition);
	if (latest) map.set(latest.key, latest);
	const now = resolveTag(nowDefinition);
	if (now) map.set(now.key, now);
	for (const entry of changelog) {
		for (const tag of tagsOf(entry)) {
			if (!map.has(tag.key)) map.set(tag.key, tag);
		}
	}
	return [...map.values()];
});

const tagCounts = computed(() => {
	const counts = Object.create(null);
	for (const entry of changelog) {
		for (const tag of tagsOf(entry)) {
			counts[tag.key] = (counts[tag.key] || 0) + 1;
		}
	}
	return counts;
});

const filteredChangelog = computed(() =>
	activeTag.value
		? changelog.filter((entry) =>
				tagsOf(entry).some((tag) => tag.key === activeTag.value),
			)
		: changelog,
);

function toggleTag(key) {
	activeTag.value = activeTag.value === key ? "" : key;
}

function tagStyle(tag) {
	const color = tag.color || "#69736d";
	const isHex = /^#[0-9a-f]{6}$/i.test(color);
	return {
		color,
		borderColor: isHex ? `${color}55` : color,
		backgroundColor:
			tag.background || (isHex ? `${color}14` : "transparent"),
	};
}
</script>

<template>
	<div class="standalone-page">
		<div class="standalone-card changelog-card">
			<div class="standalone-head">
				<div>
					<h1>{{ t("更新日志") }}</h1>
				</div>
				<div class="standalone-head-actions">
					<LanguageSwitcher />
					<router-link class="back-link" :to="{ name: 'home' }">
						{{ t("返回首页") }}
					</router-link>
				</div>
			</div>

			<div
				class="tag-filter"
				:aria-label="t('按标签筛选更新记录')"
			>
				<button
					type="button"
					class="tag-filter-item"
					:class="{ active: activeTag === '' }"
					:aria-pressed="activeTag === ''"
					@click="activeTag = ''"
				>
					{{ t("全部") }}
					<span class="tag-filter-count">{{ changelog.length }}</span>
				</button>
				<button
					v-for="tag in allTags"
					:key="tag.key"
					type="button"
					class="tag-filter-item"
					:class="{ active: activeTag === tag.key }"
					:style="{ '--tag-color': tag.color || '#69736d' }"
					:aria-pressed="activeTag === tag.key"
					@click="toggleTag(tag.key)"
				>
					<span
						class="tag-dot"
						:style="{ background: tag.color || '#69736d' }"
					></span>
					{{ t(tag.label) }}
					<span class="tag-filter-count">
						{{ tagCounts[tag.key] || 0 }}
					</span>
				</button>
			</div>

			<div class="changelog-table-wrap">
				<table class="changelog-table">
					<thead>
						<tr>
							<th>{{ t("版本号") }}</th>
							<th>{{ t("标签") }}</th>
							<th>{{ t("描述") }}</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="item in filteredChangelog"
							:key="item.version"
						>
							<td>{{ item.version }}</td>
							<td class="changelog-tags">
								<button
									v-for="tag in tagsOf(item)"
									:key="tag.key"
									type="button"
									class="changelog-tag"
									:style="tagStyle(tag)"
									:title="
										t('筛选标签：{label}', {
											label: t(tag.label),
										}) +
										(tag.hint ? ' · ' + tag.hint : '')
									"
									@click="toggleTag(tag.key)"
								>
									{{ t(tag.label) }}
								</button>
							</td>
							<td>{{ item.desc }}</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div v-if="!filteredChangelog.length" class="tag-empty">
				{{ t("没有匹配这个标签的更新记录。") }}
			</div>

			<p class="tag-help">
				{{
					t(
						"点击标签可以筛选。标签的文字、颜色和背景色可以在 src/data/changelog.js 中自定义。",
					)
				}}
			</p>
			<p v-if="locale === 'en'" class="tag-help ai-translation-note">
				{{ t("英文界面和标签由 AI 翻译，历史更新描述保留原始中文。") }}
			</p>
		</div>
	</div>
</template>
