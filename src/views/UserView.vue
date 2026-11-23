<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { auth } from "../services/auth.js";
import { loadProfile } from "../services/profile.js";
import { renderMarkdown } from "../lib/markdown.js";
import "../styles/profile.css";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref("");
const profile = ref(null);
const avatarFailed = ref(false);

const username = computed(() => {
	const value = route.query.u;
	if (Array.isArray(value)) return String(value[0] || "");
	return typeof value === "string" ? value : "";
});
const isOwner = computed(
	() => !!(auth.session && auth.session.username === username.value),
);
const initial = computed(() => {
	const name = (profile.value && profile.value.user) || username.value || "?";
	return name.trim().charAt(0) || "?";
});
const bioHtml = computed(() =>
	renderMarkdown((profile.value && profile.value.profile) || ""),
);
const sideHtml = computed(() =>
	renderMarkdown((profile.value && profile.value.pf_text) || ""),
);
const backgroundStyle = computed(() => {
	const url = profile.value && profile.value.pf_header;
	if (!url) return {};
	return { backgroundImage: `url("${String(url).replace(/["\\\n\r]/g, "")}")` };
});
const metaText = computed(() => {
	if (!profile.value) return "";
	const joined = formatDate(profile.value.reg_time);
	const parts = [`个人主页 · @${username.value}`];
	if (joined) parts.push(`加入于 ${joined}`);
	return parts.join(" · ");
});

function formatDate(value) {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return String(value);
	return date.toLocaleDateString("zh-CN", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

async function load() {
	loading.value = true;
	error.value = "";
	profile.value = null;
	avatarFailed.value = false;
	if (!username.value) {
		if (auth.session) {
			router.replace({
				name: "user",
				query: { u: auth.session.username },
			});
			return;
		}
		error.value = "未指定用户。";
		loading.value = false;
		return;
	}
	if (/^Guest_/i.test(username.value)) {
		error.value = "游客身份没有个人主页。登录真实账号后才能使用个人主页。";
		document.title = "游客没有个人主页 · zyc2024 的聊天网页";
		loading.value = false;
		return;
	}
	try {
		const data = await loadProfile(username.value);
		if (!data) {
			error.value = "没这个用户！";
			document.title = "用户不存在 · zyc2024 的聊天网页";
			return;
		}
		profile.value = data;
		document.title = `${data.user} 的个人主页 · zyc2024 的聊天网页`;
	} catch (e) {
		error.value = e && e.message ? e.message : String(e);
	} finally {
		loading.value = false;
	}
}

watch(() => route.query.u, load);
onMounted(load);
</script>

<template>
	<div class="profile-page">
		<div class="profile-backdrop" :style="backgroundStyle"></div>
		<main class="profile-layout">
			<aside class="profile-side">
				<div
					v-if="sideHtml"
					class="profile-side-text markdown-body"
					v-html="sideHtml"
				></div>
			</aside>

			<section class="profile-card">
				<div v-if="loading" class="profile-loading">个人主页加载中……</div>

				<div v-else-if="profile" class="profile-content">
					<div class="profile-top">
						<img
							v-if="!avatarFailed"
							class="profile-avatar"
							:src="profile.avatar"
							:alt="profile.user + ' 的头像'"
							@error="avatarFailed = true"
						/>
						<div v-else class="profile-avatar profile-avatar-fallback">
							{{ initial }}
						</div>
						<div class="profile-identity">
							<h1 class="profile-name">{{ profile.user }}</h1>
							<div class="profile-meta">{{ metaText }}</div>
						</div>
						<router-link
							v-if="isOwner"
							class="profile-edit-button"
							:to="{ name: 'edit-profile' }"
						>
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path d="M12 20h9"></path>
								<path
									d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"
								></path>
							</svg>
							编辑资料
						</router-link>
					</div>

					<hr class="profile-divider" />

					<div
						v-if="profile.profile"
						class="profile-bio markdown-body"
						v-html="bioHtml"
					></div>
					<div v-else class="profile-empty">
						这个人很懒，还没有写自我介绍。
					</div>

					<div class="profile-actions">
						<router-link class="ghost-button" :to="{ name: 'home' }">
							返回首页
						</router-link>
						<router-link
							v-if="auth.session"
							class="ghost-button"
							:to="{
								name: 'user',
								query: { u: auth.session.username },
							}"
						>
							我的主页
						</router-link>
						<router-link
							v-if="!auth.session"
							class="primary-button"
							:to="{ name: 'login' }"
						>
							登录
						</router-link>
					</div>
				</div>

				<div v-else class="profile-error">
					<strong>无法打开个人主页</strong>
					<p>{{ error || "没这个用户！" }}</p>
					<div class="profile-actions">
						<router-link class="primary-button" :to="{ name: 'home' }">
							返回首页
						</router-link>
						<router-link
							class="ghost-button"
							:to="{ name: 'login' }"
						>
							登录
						</router-link>
					</div>
				</div>
			</section>
		</main>
	</div>
</template>
