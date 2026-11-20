<script setup>
import { computed, ref } from "vue";
import { changelog, changelogTags } from "../data/changelog.js";
import "../styles/pages.css";

const activeTag = ref("");

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
	return (entry.tags || []).map(resolveTag).filter(Boolean);
}

const allTags = computed(() => {
	const map = new Map();
	for (const tag of changelogTags) {
		const resolved = resolveTag(tag);
		if (resolved) map.set(resolved.key, resolved);
	}
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

function isLatest(entry) {
	return changelog[0] === entry;
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
					<h1>更新日志</h1>
					<!-- <p>从最初的聊天记录到 Vue 重写版，一共 {{ changelog.length }} 条记录。</p> -->
				</div>
				<router-link class="back-link" :to="{ name: 'home' }">
					返回首页
				</router-link>
			</div>

			<div class="tag-filter" aria-label="按标签筛选更新记录">
				<button
					type="button"
					class="tag-filter-item"
					:class="{ active: activeTag === '' }"
					:aria-pressed="activeTag === ''"
					@click="activeTag = ''"
				>
					全部
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
					{{ tag.label }}
					<span class="tag-filter-count">
						{{ tagCounts[tag.key] || 0 }}
					</span>
				</button>
			</div>

			<div class="changelog-table-wrap">
				<table class="changelog-table">
					<thead>
						<tr>
							<th>版本号</th>
							<th>标签</th>
							<th>描述</th>
						</tr>
					</thead>
					<tbody>
						<tr
							v-for="item in filteredChangelog"
							:key="item.version"
						>
							<td>
								{{ item.version }}
								<span v-if="isLatest(item)" class="latest-tag">
									最新
								</span>
							</td>
							<td class="changelog-tags">
								<button
									v-for="tag in tagsOf(item)"
									:key="tag.key"
									type="button"
									class="changelog-tag"
									:style="tagStyle(tag)"
									:title="'筛选标签：' + tag.label"
									@click="toggleTag(tag.key)"
								>
									{{ tag.label }}
								</button>
							</td>
							<td>{{ item.desc }}</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div v-if="!filteredChangelog.length" class="tag-empty">
				没有匹配这个标签的更新记录。
			</div>

			<p class="tag-help">
				点击标签可以筛选。标签的文字、颜色和背景色可以在
				<code>src/data/changelog.js</code> 中自定义。
			</p>
		</div>
	</div>
</template>
