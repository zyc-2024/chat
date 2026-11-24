<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import AuthBadge from "../components/AuthBadge.vue";
import LanguageSwitcher from "../components/LanguageSwitcher.vue";
import Modal from "../components/Modal.vue";
import {
	fetchChannelIndex,
	fetchPublicChannelSummaries,
} from "../services/chat.js";
import { auth } from "../services/auth.js";
import { loadUserGroups } from "../services/groups.js";
import { loadProfile } from "../services/profile.js";
import {
	channelColor,
	channelInitial,
	prettyTime,
	safeDecode,
} from "../lib/format.js";
import { currentAppVersion } from "../lib/appVersion.js";
import { t } from "../i18n/index.js";
import { chatName, currentIdentity } from "../lib/identity.js";
import { showToast } from "../lib/toast.js";
import "../styles/home.css";

const router = useRouter();
const channels = ref([]);
const summaries = ref(new Map());
const loading = ref(true);
const error = ref("");
const search = ref("");
const version = currentAppVersion().display;
const createName = ref("");
const groupName = ref("");
const groups = ref([]);
const groupsLoading = ref(false);
const groupsError = ref("");
const privateKey = ref("");
const joinId = ref("");
const joinKey = ref("");
const createNameInput = ref(null);
const createDialogOpen = ref(false);
const createDialogName = ref("");
const createDialogError = ref("");
const createDialogInput = ref(null);
const avatarUrl = ref("");
const avatarFailed = ref(false);

const filteredChannels = computed(() => {
	const query = search.value.trim().toLowerCase();
	if (!query) return channels.value;
	return channels.value.filter((channel) =>
		safeDecode(channel).toLowerCase().includes(query),
	);
});

const avatarInitial = computed(() => {
	const name = chatName.value.trim();
	return name ? name.charAt(0) : "?";
});

async function loadChannels() {
	loading.value = true;
	error.value = "";
	try {
		const list = await fetchChannelIndex();
		let summaryMap = new Map();
		try {
			summaryMap = await fetchPublicChannelSummaries(list);
		} catch (e) {
			console.warn("读取频道统计失败，暂不隐藏已删除频道", e);
		}
		channels.value = list.filter(
			(channel) =>
				!(summaryMap.get(channel) && summaryMap.get(channel).deleted),
		);
		summaries.value = summaryMap;
	} catch (e) {
		channels.value = [];
		error.value = e && e.message ? e.message : String(e);
	} finally {
		loading.value = false;
	}
}

function openChannel(rawName) {
	router.push({ name: "chat", query: { type: "u", ch: safeDecode(rawName) } });
}

function shortTime(value) {
	const formatted = prettyTime(value || "");
	if (!formatted) return "";
	return formatted.startsWith(String(new Date().getFullYear()))
		? formatted.slice(5, 16)
		: formatted.slice(0, 16);
}

function channelPreview(rawName) {
	const summary = summaries.value.get(rawName);
	if (!summary) return t("公开频道 · 点击进入");
	const count = Number(summary.messageCount) || 0;
	const lastTime = shortTime(summary.lastMessageTime);
	return lastTime
		? t("{count} 条消息 · 最近 {time}", { count, time: lastTime })
		: t("{count} 条消息 · 暂无发言", { count });
}

function createPublicChannel() {
	const name = createName.value.trim();
	if (!name) {
		showToast(t("请输入频道名称"), "error");
		createNameInput.value?.focus();
		return;
	}
	router.push({ name: "create", query: { type: "u", ch: name } });
}

async function loadGroups() {
	groupsLoading.value = true;
	groupsError.value = "";
	try {
		groups.value = await loadUserGroups(currentIdentity().name);
	} catch (e) {
		groups.value = [];
		groupsError.value = e && e.message ? e.message : String(e);
	} finally {
		groupsLoading.value = false;
	}
}

function createGroupChannel() {
	const name = groupName.value.trim();
	if (!name) {
		showToast(t("请输入群组名称"), "error");
		return;
	}
	router.push({ name: "create", query: { type: "g", ch: name } });
}

function openGroup(group) {
	if (!group) return;
	router.push({
		name: "chat",
		query: { type: "g", id: String(group.id), key: group.key },
	});
}

function createPrivateChannel() {
	if (!privateKey.value) {
		showToast(t("请先设置一段凭证字符串"), "error");
		return;
	}
	router.push({ name: "create", query: { type: "r", key: privateKey.value } });
}

function joinPrivateChannel() {
	const id = joinId.value.trim();
	if (!id || !joinKey.value) {
		showToast(t("请填写频道 id 和凭证"), "error");
		return;
	}
	router.push({ name: "chat", query: { type: "r", id, key: joinKey.value } });
}

function openCreateDialog() {
	createDialogName.value = createName.value.trim();
	createDialogError.value = "";
	createDialogOpen.value = true;
	nextTick(() => {
		createDialogInput.value?.focus();
		createDialogInput.value?.select();
	});
}

function submitCreateDialog() {
	const name = createDialogName.value.trim();
	if (!name) {
		createDialogError.value = t("请输入频道名称");
		nextTick(() => createDialogInput.value?.focus());
		return;
	}
	createDialogOpen.value = false;
	createName.value = name;
	router.push({ name: "create", query: { type: "u", ch: name } });
}

async function loadAvatar() {
	avatarUrl.value = "";
	avatarFailed.value = false;
	if (!auth.session) return;
	try {
		const profile = await loadProfile(auth.session.username);
		if (profile && profile.avatar) {
			avatarUrl.value = profile.avatar;
		}
	} catch (e) {
		console.warn("读取用户头像失败：", e);
	}
}

watch(
	() => (auth.session ? auth.session.username : ""),
	loadAvatar,
	{ immediate: true },
);

watch(
	() => (auth.session ? auth.session.username : ""),
	loadGroups,
	{ immediate: true },
);

function openAccount() {
	if (auth.session) {
		router.push({ name: "user", query: { u: auth.session.username } });
	} else {
		router.push({ name: "login" });
	}
}

onMounted(() => {
	loadChannels();
});
</script>

<template>
	<div class="home-page">
		<div class="home-shell">
			<aside class="home-rail">
				<button
					type="button"
					class="home-avatar"
					:title="t('当前身份：{name}', { name: chatName })"
					@click="openAccount"
				>
					<img
						v-if="avatarUrl && !avatarFailed"
						class="home-avatar-img"
						:src="avatarUrl"
						alt=""
						@error="avatarFailed = true"
					/>
					<span v-else>{{ avatarInitial }}</span>
				</button>
				<nav class="home-rail-nav">
					<button type="button" class="rail-button active" :title="t('频道')">
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path
								d="M21 11.5a8.4 8.4 0 0 1-8.5 8.3 8.9 8.9 0 0 1-3.6-.7L4 21l1.6-4.2A8.1 8.1 0 0 1 4 11.5 8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z"
							/>
						</svg>
					</button>
					<button
						type="button"
						class="rail-button"
						:title="t('新建频道')"
						@click="openCreateDialog"
					>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M12 5v14M5 12h14" />
						</svg>
					</button>
					<button
						type="button"
						class="rail-button"
						:title="t('上传文件')"
						@click="router.push({ name: 'upload' })"
					>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="M12 16V4" />
							<path d="m7 9 5-5 5 5" />
							<path d="M5 20h14" />
						</svg>
					</button>
					<button
						type="button"
						class="rail-button"
						:title="t('个性设置')"
						@click="router.push({ name: 'settings' })"
					>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path
								d="M12 3a9 9 0 1 0 0 18h1.5a1.5 1.5 0 0 0 0-3H12a2 2 0 0 1 0-4h3a6 6 0 0 0 0-12h-3Z"
							/>
							<circle cx="8.5" cy="9" r="1" />
							<circle cx="12" cy="7" r="1" />
							<circle cx="15.5" cy="9" r="1" />
						</svg>
					</button>
					<button
						v-if="auth.session"
						type="button"
						class="rail-button"
						:title="t('好友')"
						@click="router.push({ name: 'friends' })"
					>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<circle cx="9" cy="8" r="3" />
							<path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
							<path d="M16 6a3 3 0 0 1 0 6" />
							<path d="M17 14a5 5 0 0 1 4 5" />
						</svg>
					</button>
					<button
						type="button"
						class="rail-button"
						:title="auth.session ? t('我的主页') : t('登录 / 账号')"
						@click="openAccount"
					>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<circle cx="12" cy="8" r="3.4" />
							<path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
						</svg>
					</button>
				</nav>
				<div class="rail-spacer"></div>
				<div class="rail-dot" :title="t('在线')"></div>
			</aside>

			<section class="home-sidebar">
				<div class="sidebar-head">
					<h1 class="sidebar-title">
						{{ t("zyc2024 的聊天网页") }} <small>Ver{{ version }}</small>
					</h1>
					<div class="search-wrap">
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<circle cx="11" cy="11" r="7" />
							<path d="m20 20-3.6-3.6" />
						</svg>
						<input
							v-model="search"
							type="search"
							:placeholder="t('搜索频道')"
							autocomplete="off"
						/>
					</div>
				</div>

				<div class="sidebar-list">
					<div class="list-head">
						<span>{{ t("公开频道") }}</span>
						<span>{{
							loading
								? "…"
								: t("{count} 个", {
										count: filteredChannels.length,
									})
						}}</span>
					</div>

					<ul v-if="filteredChannels.length" class="channel-list">
						<li
							v-for="channel in filteredChannels"
							:key="channel"
							class="channel-item"
						>
							<a
								class="channel-link"
								href="#"
								@click.prevent="openChannel(channel)"
							>
								<span
									class="channel-avatar"
									:style="{ background: channelColor(channel) }"
								>
									{{ channelInitial(channel) }}
								</span>
								<span class="channel-main">
									<span class="channel-name">{{ safeDecode(channel) }}</span>
									<span class="channel-preview">
										{{ channelPreview(channel) }}
									</span>
								</span>
								<span class="channel-meta">{{ t("公开") }}</span>
							</a>
						</li>
					</ul>

					<div v-else-if="loading" class="empty-channels">
						{{ t("正在加载频道…") }}
					</div>
					<div v-else-if="error" class="channel-error">
						{{ t("频道列表加载失败") }}<br />{{ error }}
						<button type="button" class="mini-button" @click="loadChannels">
							{{ t("重试") }}
						</button>
					</div>
					<div v-else class="empty-channels">
						{{ t("暂无频道，创建一个吧") }}
					</div>
				</div>

				<div class="sidebar-foot">
					<LanguageSwitcher />
					<AuthBadge />
					<div class="copyright">
						&copy; zyc-2024, 2025~2026 ·
						<a
							href="https://github.com/zyc-2024/chat"
							target="_blank"
							rel="noreferrer"
							>Github</a
						>
						·
						<router-link :to="{ name: 'changelog' }">
							{{ t("更新日志") }}
						</router-link>
						·
						<router-link :to="{ name: 'settings' }">
							{{ t("个性设置") }}
						</router-link>
						<template v-if="auth.session">
							·
							<router-link :to="{ name: 'friends' }">
								{{ t("好友") }}
							</router-link>
						</template>
						·
						<a
							href="https://github.com/zyc-2024/chat/releases/latest"
							target="_blank"
							rel="noreferrer"
							>{{ t("本地版下载") }}</a
						>
						·
						<a href="licenses.html" target="_blank" rel="noreferrer"
							>Licenses</a
						>
					</div>
				</div>
			</section>

			<main class="home-detail">
				<div class="detail-head">
					<div class="detail-title">{{ t("频道广场") }}</div>
					<div class="detail-sub">
						{{ t("加入一个公开频道，或创建私有频道和群组") }}
					</div>
				</div>

				<div class="detail-body">
					<div v-if="!auth.session" class="notice-bar">
						<span>
							{{
								t(
									"无需登录也能创建频道、聊天和上传文件，系统会自动分配设备游客名 Guest_<HASH>。登录后将使用账号昵称，并在本机记住 7 天。",
								)
							}}
						</span>
						<router-link
							:to="
								auth.session
									? {
											name: 'user',
											query: { u: auth.session.username },
										}
									: { name: 'login' }
							"
						>
							{{ auth.session ? t("我的主页 →") : t("去登录 →") }}
						</router-link>
					</div>

					<section class="home-card home-groups-card">
						<div class="card-title">
							{{ t("群组") }}
							<span class="badge">{{ t("群聊") }}</span>
						</div>
						<p class="card-desc">
							{{
								t(
									"创建群组后可以邀请好友，或复制邀请链接发给其他人，点击链接即可加入。登录后才能邀请好友；群组消息使用群凭证加密。",
								)
							}}
						</p>
						<form
							class="card-form"
							autocomplete="off"
							@submit.prevent="createGroupChannel"
						>
							<input
								v-model="groupName"
								type="text"
								maxlength="32"
								:placeholder="t('输入群组名称')"
								required
							/>
							<button type="submit">{{ t("创建群组") }}</button>
						</form>

						<div v-if="groups.length" class="home-group-list">
							<div class="home-group-list-head">
								<span>{{ t("我的群组") }}</span>
								<span>{{ t("{count} 个", { count: groups.length }) }}</span>
							</div>
							<button
								v-for="group in groups"
								:key="group.id"
								type="button"
								class="home-group-item"
								@click="openGroup(group)"
							>
								<span class="home-group-avatar">
									{{ group.name.charAt(0) }}
								</span>
								<span class="home-group-main">
									<span class="home-group-name">
										{{ group.name }}
									</span>
									<span class="home-group-sub">
										{{
											group.role === "owner"
												? t("群主 · 点击进入")
												: t("成员 · 点击进入")
										}}
									</span>
								</span>
								<span class="home-group-meta">#{{ group.id }}</span>
							</button>
						</div>
						<div v-else-if="groupsLoading" class="home-group-empty">
							{{ t("群组加载中……") }}
						</div>
						<div v-else-if="groupsError" class="home-group-empty">
							{{ groupsError }}
							<button
								type="button"
								class="mini-button"
								@click="loadGroups"
							>
								{{ t("重试") }}
							</button>
						</div>
						<div v-else class="home-group-empty">
							{{ t("还没有加入群组，创建一个吧。") }}
						</div>
					</section>

					<section class="home-card">
						<div class="card-title">
							{{ t("创建公开频道") }}
							<span class="badge">{{ t("公开") }}</span>
						</div>
						<p class="card-desc">
							{{ t("公开频道会显示在左侧列表里，所有人都可以进入。") }}
						</p>
						<form class="card-form" @submit.prevent="createPublicChannel">
							<input
								ref="createNameInput"
								v-model="createName"
								type="text"
								maxlength="32"
								:placeholder="t('输入频道名称')"
								required
							/>
							<button type="submit">{{ t("创建并进入") }}</button>
						</form>
					</section>

					<section class="home-card">
						<div class="card-title">
							{{ t("创建私有频道") }}
							<span class="badge blue">{{ t("私密") }}</span>
						</div>
						<p class="card-desc">
							{{
								t(
									"私有频道不会出现在列表中，消息会用凭证加密，进入时需要 id 和凭证。",
								)
							}}
						</p>
						<form
							class="card-form"
							autocomplete="off"
							@submit.prevent="createPrivateChannel"
						>
							<input
								v-model="privateKey"
								type="password"
								name="private-channel-new-key"
								autocomplete="new-password"
								autocapitalize="off"
								spellcheck="false"
								data-form-type="other"
								data-lpignore="true"
								data-1p-ignore="true"
								data-bwignore="true"
								:aria-label="t('设置一段凭证字符串')"
								:placeholder="t('设置一段凭证字符串')"
								required
							/>
							<button class="btn-blue" type="submit">{{ t("创建") }}</button>
						</form>
					</section>

					<section class="home-card">
						<div class="card-title">
							{{ t("进入私有频道") }}
							<span class="badge gray">{{ t("需要 id") }}</span>
						</div>
						<p class="card-desc">
							{{ t("输入创建时保存的频道 id 和凭证即可进入。") }}
						</p>
						<form
							class="card-form stacked"
							autocomplete="off"
							@submit.prevent="joinPrivateChannel"
						>
							<input
								v-model="joinId"
								type="text"
								name="private-channel-id"
								autocomplete="off"
								autocapitalize="off"
								spellcheck="false"
								inputmode="numeric"
								data-form-type="other"
								data-lpignore="true"
								data-1p-ignore="true"
								data-bwignore="true"
								:aria-label="t('频道 id')"
								:placeholder="t('频道 id')"
								required
							/>
							<input
								v-model="joinKey"
								type="password"
								name="private-channel-join-key"
								autocomplete="new-password"
								autocapitalize="off"
								spellcheck="false"
								data-form-type="other"
								data-lpignore="true"
								data-1p-ignore="true"
								data-bwignore="true"
								:aria-label="t('频道凭证')"
								:placeholder="t('频道凭证')"
								required
							/>
							<button class="btn-blue" type="submit">{{ t("进入") }}</button>
						</form>
					</section>
				</div>
			</main>
		</div>

		<Modal
			:open="createDialogOpen"
			:title="t('新建公开频道')"
			@close="createDialogOpen = false"
		>
			<form class="home-create-form" @submit.prevent="submitCreateDialog">
				<div class="home-create-field">
					<label for="quick-create-name">{{ t("频道名称") }}</label>
					<input
						id="quick-create-name"
						ref="createDialogInput"
						v-model="createDialogName"
						type="text"
						maxlength="32"
						:placeholder="t('输入频道名称')"
						@input="createDialogError = ''"
					/>
				</div>
				<div v-if="createDialogError" class="home-create-error">
					{{ createDialogError }}
				</div>
				<div class="home-create-actions">
					<button
						type="button"
						class="ghost-button"
						@click="createDialogOpen = false"
					>
						{{ t("取消") }}
					</button>
					<button type="submit" class="primary-button">
						{{ t("创建并进入") }}
					</button>
				</div>
			</form>
		</Modal>
	</div>
</template>
