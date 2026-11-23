<script setup>
import {
	computed,
	nextTick,
	onBeforeUnmount,
	onMounted,
	ref,
	watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import LanguageSwitcher from "../components/LanguageSwitcher.vue";
import { auth } from "../services/auth.js";
import {
	addFriend,
	loadFriendMessages,
	loadFriends,
	sendFriendMessage,
} from "../services/friends.js";
import { t } from "../i18n/index.js";
import { chatName } from "../lib/identity.js";
import {
	channelColor,
	channelInitial,
	prettyTime,
} from "../lib/format.js";
import { renderMarkdown } from "../lib/markdown.js";
import { showToast } from "../lib/toast.js";
import "../styles/pages.css";
import "../styles/friends.css";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const friends = ref([]);
const selected = ref(null);
const messages = ref([]);
const messagesLoading = ref(false);
const sending = ref(false);
const addName = ref("");
const adding = ref(false);
const error = ref("");
const draft = ref("");
const scrollEl = ref(null);
const editorEl = ref(null);

let timer = null;

const me = computed(() =>
	auth.session
		? { username: auth.session.username, name: chatName.value }
		: null,
);

function friendInitial(friend) {
	return channelInitial(friend.name || friend.username);
}

function friendColor(friend) {
	return channelColor(friend.username);
}

function messageHtml(message) {
	return renderMarkdown(message.content || "");
}

function isMine(message) {
	return me.value && message.user === me.value.username;
}

function scrollToBottom() {
	nextTick(() => {
		const el = scrollEl.value;
		if (el) el.scrollTop = el.scrollHeight;
	});
}

async function selectFriend(friend, force = false) {
	if (!friend) return;
	if (!force && selected.value && selected.value.username === friend.username) {
		return;
	}
	selected.value = friend;
	messages.value = [];
	await loadMessages();
}

async function loadFriendList() {
	if (!me.value) {
		friends.value = [];
		selected.value = null;
		return;
	}
	loading.value = true;
	error.value = "";
	try {
		friends.value = await loadFriends(me.value.username);
		const wanted = String(route.query.u || "");
		const target =
			friends.value.find((item) => item.username === wanted) ||
			(selected.value &&
				friends.value.find(
					(item) => item.username === selected.value.username,
				)) ||
			friends.value[0] ||
			null;
		if (target) {
			await selectFriend(target, true);
		} else {
			selected.value = null;
			messages.value = [];
		}
	} catch (e) {
		error.value = e && e.message ? e.message : String(e);
		friends.value = [];
		selected.value = null;
	} finally {
		loading.value = false;
	}
}

async function loadMessages(silent = false) {
	if (!me.value || !selected.value) return;
	if (!silent) messagesLoading.value = true;
	try {
		const list = await loadFriendMessages(
			me.value,
			selected.value.username,
		);
		messages.value = list;
		if (!silent) scrollToBottom();
	} catch (e) {
		if (!silent) {
			showToast(e && e.message ? e.message : String(e), "error", 4000);
		}
	} finally {
		if (!silent) messagesLoading.value = false;
	}
}

async function refreshNow() {
	await Promise.all([loadFriendList(), loadMessages()]);
	showToast(t("已刷新"), "success");
}

async function send() {
	if (!me.value || !selected.value || sending.value) return;
	const text = draft.value;
	if (!text.trim()) {
		showToast(t("消息不能为空"), "error");
		return;
	}
	sending.value = true;
	try {
		messages.value = await sendFriendMessage(
			me.value,
			selected.value.username,
			text,
		);
		draft.value = "";
		scrollToBottom();
	} catch (e) {
		showToast(e && e.message ? e.message : String(e), "error", 4000);
	} finally {
		sending.value = false;
	}
}

async function addFriendByUsername() {
	if (!me.value || adding.value) return;
	const username = addName.value.trim();
	if (!username) {
		showToast(t("请输入用户名"), "error");
		return;
	}
	adding.value = true;
	try {
		const friend = await addFriend(me.value, username);
		addName.value = "";
		await loadFriendList();
		const existing = friends.value.find(
			(item) => item.username === friend.username,
		);
		if (existing) await selectFriend(existing, true);
		showToast(t("已添加好友"), "success");
	} catch (e) {
		showToast(e && e.message ? e.message : String(e), "error", 4000);
	} finally {
		adding.value = false;
	}
}

function onKeydown(event) {
	if (event.key === "Enter" && event.shiftKey) {
		event.preventDefault();
		send();
	}
}

function restartTimer() {
	if (timer) clearInterval(timer);
	timer = window.setInterval(() => {
		if (selected.value) loadMessages(true);
	}, 5000);
}

function init() {
	if (!me.value) {
		friends.value = [];
		selected.value = null;
		return;
	}
	loadFriendList();
	restartTimer();
}

watch(
	() => (auth.session ? auth.session.username : ""),
	() => init(),
);

watch(
	() => route.query.u,
	() => {
		if (me.value) loadFriendList();
	},
);

onMounted(init);
onBeforeUnmount(() => {
	if (timer) clearInterval(timer);
});
</script>

<template>
	<div v-if="!auth.session" class="standalone-page">
		<div class="standalone-card">
			<div class="standalone-head">
				<div>
					<h1>{{ t("好友") }}</h1>
					<p>{{ t("好友列表和私信仅限登录用户使用。") }}</p>
				</div>
				<div class="standalone-head-actions">
					<LanguageSwitcher />
					<router-link class="back-link" :to="{ name: 'home' }">
						{{ t("返回首页") }}
					</router-link>
				</div>
			</div>
			<div class="page-actions">
				<router-link
					class="primary-button"
					:to="{ name: 'login', query: { redirect: route.fullPath } }"
				>
					{{ t("去登录") }}
				</router-link>
			</div>
		</div>
	</div>

	<div v-else class="friends-page">
		<div class="friends-shell">
			<aside class="friends-sidebar">
				<div class="friends-sidebar-head">
					<div>
						<h1>{{ t("好友") }}</h1>
						<p>{{ t("选择好友开始私信") }}</p>
					</div>
					<LanguageSwitcher compact />
				</div>

				<div class="friends-list">
					<div v-if="loading" class="friends-empty">
						{{ t("好友加载中……") }}
					</div>
					<div v-else-if="error" class="friends-empty friends-error">
						{{ error }}
						<button type="button" class="mini-button" @click="loadFriendList">
							{{ t("重试") }}
						</button>
					</div>
					<div v-else-if="!friends.length" class="friends-empty">
						{{ t("还没有好友，输入用户名添加一个吧。") }}
					</div>
					<template v-else>
						<button
							v-for="friend in friends"
							:key="friend.username"
							type="button"
							class="friend-item"
							:class="{
								active:
									selected &&
									selected.username === friend.username,
							}"
							@click="selectFriend(friend)"
						>
							<span
								class="friend-avatar"
								:style="{ background: friendColor(friend) }"
							>
								{{ friendInitial(friend) }}
							</span>
							<span class="friend-info">
								<span class="friend-name">{{ friend.name }}</span>
								<span class="friend-username">@{{ friend.username }}</span>
							</span>
						</button>
					</template>
				</div>

				<form class="friend-add" autocomplete="off" @submit.prevent="addFriendByUsername">
					<input
						v-model="addName"
						type="text"
						name="friend-username"
						autocomplete="off"
						:placeholder="t('输入用户名添加好友')"
					/>
					<button type="submit" :disabled="adding">
						{{ adding ? t("添加中……") : t("添加好友") }}
					</button>
				</form>
			</aside>

			<main class="friends-main">
				<template v-if="selected">
					<header class="friends-main-head">
						<div>
							<div class="friends-main-name">{{ selected.name }}</div>
							<div class="friends-main-sub">@{{ selected.username }}</div>
						</div>
						<div class="friends-main-actions">
							<button
								type="button"
								class="ghost-button"
								@click="refreshNow"
							>
								{{ t("刷新") }}
							</button>
							<router-link
								class="ghost-button"
								:to="{ name: 'home' }"
							>
								{{ t("返回首页") }}
							</router-link>
						</div>
					</header>

					<div ref="scrollEl" class="friends-scroll">
						<div v-if="messagesLoading" class="friends-empty">
							{{ t("私信加载中……") }}
						</div>
						<div v-else-if="!messages.length" class="friends-empty">
							{{ t("还没有私信，发第一条吧。") }}
						</div>
						<div
							v-for="message in messages"
							:key="message.hash"
							class="friend-message"
							:class="{ mine: isMine(message) }"
						>
							<div class="friend-message-meta">
								<span>{{ message.name || message.user }}</span>
								<time>{{ prettyTime(message.time) }}</time>
							</div>
							<div
								class="friend-message-body markdown-body"
								v-html="messageHtml(message)"
							></div>
						</div>
					</div>

					<div class="friends-composer">
						<textarea
							ref="editorEl"
							v-model="draft"
							:placeholder="
								t(
									'输入私信，按 Shift+Enter 发送；支持 Markdown 与 LaTeX',
								)
							"
							@keydown="onKeydown"
						></textarea>
						<button
							type="button"
							class="primary-button"
							:disabled="sending"
							@click="send"
						>
							{{ sending ? t("发送中…") : t("发送") }}
						</button>
					</div>
				</template>
				<div v-else class="friends-empty friends-main-empty">
					{{ t("选择一位好友开始私信") }}
				</div>
			</main>
		</div>
	</div>
</template>
