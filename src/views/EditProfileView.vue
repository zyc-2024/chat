<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import LanguageSwitcher from "../components/LanguageSwitcher.vue";
import { auth, authDisplayName } from "../services/auth.js";
import {
	DEFAULT_AVATAR,
	DEFAULT_HEADER,
	DEFAULT_SIDE_TEXT,
	loadProfile,
	saveProfile,
} from "../services/profile.js";
import { t } from "../i18n/index.js";
import { renderMarkdown } from "../lib/markdown.js";
import { showToast } from "../lib/toast.js";
import "../styles/profile.css";
import "../styles/pages.css";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const busy = ref(false);
const error = ref("");
const avatarFailed = ref(false);
const form = reactive({
	avatar: "",
	pf_header: "",
	profile: "",
	pf_text: "",
});

const username = computed(() => (auth.session ? auth.session.username : ""));
const bioPreview = computed(() =>
	renderMarkdown(form.profile || t("还没有填写自我介绍。")),
);
const sidePreview = computed(() =>
	renderMarkdown(form.pf_text || t("还没有填写侧边文字。")),
);
const avatarInitial = computed(() => {
	const name = authDisplayName.value || username.value || "?";
	return String(name).trim().charAt(0) || "?";
});
const backgroundStyle = computed(() => {
	const url = form.pf_header || DEFAULT_HEADER;
	if (!url) return {};
	return { backgroundImage: `url("${String(url).replace(/["\\\n\r]/g, "")}")` };
});
const profileLink = computed(() => ({
	name: "user",
	query: { u: username.value },
}));

function fillForm(data) {
	form.avatar = (data && data.avatar) || DEFAULT_AVATAR;
	form.pf_header = (data && data.pf_header) || DEFAULT_HEADER;
	form.profile = (data && data.profile) || "";
	form.pf_text = (data && data.pf_text) || DEFAULT_SIDE_TEXT;
}

async function load() {
	if (!auth.session) {
		loading.value = false;
		return;
	}
	loading.value = true;
	error.value = "";
	try {
		const data = await loadProfile(auth.session.username);
		fillForm(data);
	} catch (e) {
		error.value = e && e.message ? e.message : String(e);
		fillForm(null);
	} finally {
		loading.value = false;
	}
}

async function save() {
	if (busy.value || !auth.session) return;
	busy.value = true;
	error.value = "";
	try {
		const result = await saveProfile(auth.session.username, form);
		if (result.publicSynced) {
			showToast(t("个人资料已保存"), "success");
		} else {
			showToast(
				t(
					"账号资料已保存，但公开主页同步失败，稍后会显示账号里的资料",
				),
				"info",
				4000,
			);
		}
		router.push(profileLink.value);
	} catch (e) {
		error.value = e && e.message ? e.message : String(e);
		showToast(error.value, "error", 4000);
	} finally {
		busy.value = false;
	}
}

watch(
	() => form.avatar,
	() => {
		avatarFailed.value = false;
	},
);

onMounted(load);
</script>

<template>
	<div v-if="!auth.session" class="standalone-page">
		<div class="standalone-card">
			<div class="standalone-head">
				<div>
					<h1>{{ t("编辑个人资料") }}</h1>
					<p>{{ t("编辑头像、背景、自我介绍和侧边文字。") }}</p>
				</div>
				<div class="standalone-head-actions">
					<LanguageSwitcher />
					<router-link class="back-link" :to="{ name: 'home' }">
						{{ t("返回首页") }}
					</router-link>
				</div>
			</div>
			<div class="edit-error">
				{{
					t(
						"编辑个人资料需要登录账号。登录是可选的，不影响聊天和其他功能。",
					)
				}}
			</div>
			<div class="page-actions">
				<router-link
					class="primary-button"
					:to="{ name: 'login', query: { redirect: route.fullPath } }"
				>
					{{ t("去登录") }}
				</router-link>
				<router-link class="ghost-button" :to="{ name: 'home' }">
					{{ t("返回首页") }}
				</router-link>
			</div>
		</div>
	</div>

	<div v-else class="edit-profile-page">
		<div class="edit-profile-backdrop" :style="backgroundStyle"></div>
		<main class="edit-profile-shell">
			<div class="edit-profile-head">
				<div>
					<h1>{{ t("编辑个人资料") }}</h1>
					<p>
						{{
							t(
								"当前账号：{username}。保存后会更新账号资料，并同步原项目的公开个人主页文件。",
								{ username: auth.session.username },
							)
						}}
					</p>
				</div>
				<div class="standalone-head-actions">
					<LanguageSwitcher />
					<router-link class="back-link" :to="profileLink">
						{{ t("查看主页") }}
					</router-link>
				</div>
			</div>

			<div v-if="loading" class="profile-loading">
				{{ t("资料加载中……") }}
			</div>

			<form
				v-else
				class="edit-profile-layout"
				@submit.prevent="save"
			>
				<div class="edit-form">
					<div class="edit-field">
						<label for="profile-avatar">{{ t("头像图片网址") }}</label>
						<input
							id="profile-avatar"
							v-model="form.avatar"
							type="text"
							placeholder="https://..."
						/>
						<div class="edit-field-hint">
							{{ t("留空会使用默认头像。") }}
						</div>
					</div>

					<div class="edit-field">
						<label for="profile-header">{{ t("背景图片网址") }}</label>
						<input
							id="profile-header"
							v-model="form.pf_header"
							type="text"
							placeholder="https://..."
						/>
						<div class="edit-field-hint">
							{{ t("显示在个人主页背景，留空会使用默认背景。") }}
						</div>
					</div>

					<div class="edit-field">
						<label for="profile-bio">
							{{ t("自我介绍（支持 Markdown / LaTeX）") }}
						</label>
						<textarea
							id="profile-bio"
							v-model="form.profile"
							:placeholder="t('介绍一下自己吧')"
						></textarea>
					</div>

					<div class="edit-field">
						<label for="profile-side">
							{{ t("侧边文字（支持 Markdown / LaTeX）") }}
						</label>
						<textarea
							id="profile-side"
							v-model="form.pf_text"
							:placeholder="t('显示在个人主页左侧的文字')"
						></textarea>
					</div>

					<div v-if="error" class="edit-error">{{ error }}</div>

					<div class="edit-form-actions">
						<button
							type="submit"
							class="primary-button"
							:disabled="busy"
						>
							{{ busy ? t("保存中……") : t("保存资料") }}
						</button>
						<router-link class="ghost-button" :to="profileLink">
							{{ t("取消") }}
						</router-link>
					</div>
				</div>

				<aside class="edit-preview">
					<div class="edit-preview-label">{{ t("实时预览") }}</div>
					<div class="edit-preview-card">
						<div class="edit-preview-avatar-row">
							<div class="edit-preview-avatar">
								<img
									v-if="!avatarFailed && form.avatar"
									:src="form.avatar"
									alt=""
									@error="avatarFailed = true"
								/>
								<span v-else>{{ avatarInitial }}</span>
							</div>
							<div>
								<div class="edit-preview-name">
									{{ authDisplayName }}
								</div>
								<div class="edit-preview-username">
									@{{ auth.session.username }}
								</div>
							</div>
						</div>
						<div class="edit-preview-body markdown-body" v-html="bioPreview"></div>
						<div class="edit-preview-side markdown-body" v-html="sidePreview"></div>
					</div>
				</aside>
			</form>
		</main>
	</div>
</template>
