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
import ContactCard from "../components/ContactCard.vue";
import LanguageSwitcher from "../components/LanguageSwitcher.vue";
import Modal from "../components/Modal.vue";
import { auth } from "../services/auth.js";
import {
	approveFriendRequest,
	loadFriendMessages,
	loadFriendRequests,
	loadFriends,
	rejectFriendRequest,
	requestFriend,
	sendFriendCard,
	sendFriendMessage,
	sendFriendNudge,
} from "../services/friends.js";
import { loadProfile } from "../services/profile.js";
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
const requests = ref([]);
const requestBusy = ref("");
const selected = ref(null);
const messages = ref([]);
const messagesLoading = ref(false);
const sending = ref(false);
const nudging = ref(false);
const addName = ref("");
const adding = ref(false);
const cardPickerOpen = ref(false);
const cardSending = ref("");
const cardBusy = ref("");
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
const cardCandidates = computed(() =>
	friends.value.filter(
		(friend) => !selected.value || friend.username !== selected.value.username,
	),
);

function isFriendUsername(username) {
	return friends.value.some((friend) => friend.username === username);
}

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

function nudgeLine(message) {
	return t("{from} 拍了拍 {to}{suffix}", {
		from: message.fromName || message.name || t("匿名"),
		to: message.toName || selected.value?.name || t("匿名"),
		suffix: message.suffix || "",
	});
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
		requests.value = [];
		selected.value = null;
		return;
	}
	loading.value = true;
	error.value = "";
	try {
		const [list, pending] = await Promise.all([
			loadFriends(me.value.username),
			loadFriendRequests(me.value.username).catch(() => []),
		]);
		friends.value = list;
		requests.value = pending;
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

async function nudgeFriend() {
	if (!me.value || !selected.value || nudging.value) return;
	nudging.value = true;
	try {
		messages.value = await sendFriendNudge(me.value, {
			username: selected.value.username,
			name: selected.value.name,
		});
		scrollToBottom();
		showToast(
			t("已拍一拍 {name}", { name: selected.value.name }),
			"success",
		);
	} catch (e) {
		showToast(e && e.message ? e.message : String(e), "error", 4000);
	} finally {
		nudging.value = false;
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
		await requestFriend(me.value, username);
		addName.value = "";
		showToast(t("好友申请已发送，等待对方通过"), "success");
	} catch (e) {
		showToast(e && e.message ? e.message : String(e), "error", 4000);
	} finally {
		adding.value = false;
	}
}

async function approveRequest(request) {
	if (!me.value || !request || requestBusy.value) return;
	requestBusy.value = request.from;
	try {
		await approveFriendRequest(me.value.username, request.from);
		requests.value = requests.value.filter(
			(item) => item.from !== request.from,
		);
		await loadFriendList();
		const added = friends.value.find(
			(item) => item.username === request.from,
		);
		if (added) await selectFriend(added, true);
		showToast(
			t("已通过 {name} 的好友申请", { name: request.name }),
			"success",
		);
	} catch (e) {
		showToast(e && e.message ? e.message : String(e), "error", 4000);
	} finally {
		requestBusy.value = "";
	}
}

async function rejectRequest(request) {
	if (!me.value || !request || requestBusy.value) return;
	requestBusy.value = request.from;
	try {
		await rejectFriendRequest(me.value.username, request.from);
		requests.value = requests.value.filter(
			(item) => item.from !== request.from,
		);
		showToast(t("已拒绝好友申请"), "success");
	} catch (e) {
		showToast(e && e.message ? e.message : String(e), "error", 4000);
	} finally {
		requestBusy.value = "";
	}
}

function openCardPicker() {
	if (!selected.value || !friends.value.length) return;
	cardPickerOpen.value = true;
}

async function sendCard(friend) {
	if (!me.value || !selected.value || !friend || cardSending.value) {
		return;
	}
	cardSending.value = friend.username;
	try {
		const profile = await loadProfile(friend.username).catch(() => null);
		messages.value = await sendFriendCard(me.value, selected.value.username, {
			username: friend.username,
			name: friend.name,
			avatar: (profile && profile.avatar) || "",
			bio: (profile && profile.profile) || "",
		});
		cardPickerOpen.value = false;
		scrollToBottom();
		showToast(t("名片已发送"), "success");
	} catch (e) {
		showToast(e && e.message ? e.message : String(e), "error", 4000);
	} finally {
		cardSending.value = "";
	}
}

function openCardProfile(card) {
	if (!card || !card.username) return;
	router.push({ name: "user", query: { u: card.username } });
}

async function addCardFriend(card) {
	if (!me.value || !card || cardBusy.value) return;
	if (isFriendUsername(card.username)) {
		showToast(t("你们已经是好友"), "info");
		return;
	}
	cardBusy.value = card.username;
	try {
		await requestFriend(me.value, card.username);
		showToast(t("好友申请已发送，等待对方通过"), "success");
	} catch (e) {
		showToast(e && e.message ? e.message : String(e), "error", 4000);
	} finally {
		cardBusy.value = "";
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
		requests.value = [];
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
			<aside
				class="friends-sidebar"
				:class="{ 'has-requests': requests.length }"
			>
				<div class="friends-sidebar-head">
					<router-link
						class="friends-back"
						:to="{ name: 'home' }"
						:title="t('返回首页')"
						:aria-label="t('返回首页')"
					>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path d="m15 18-6-6 6-6" />
						</svg>
					</router-link>
					<div class="friends-sidebar-title">
						<h1>{{ t("好友") }}</h1>
						<p>{{ t("选择好友开始私信") }}</p>
					</div>
					<LanguageSwitcher compact />
				</div>

				<div v-if="requests.length" class="friend-requests">
					<div class="friend-requests-head">
						<span>{{ t("好友申请") }}</span>
						<span>{{ requests.length }}</span>
					</div>
					<div
						v-for="request in requests"
						:key="request.from"
						class="friend-request"
					>
						<div class="friend-request-main">
							<span class="friend-request-name">
								{{ request.name }}
							</span>
							<span class="friend-request-username">
								@{{ request.from }}
							</span>
						</div>
						<div class="friend-request-actions">
							<button
								type="button"
								class="mini-button primary"
								:disabled="requestBusy === request.from"
								@click="approveRequest(request)"
							>
								{{ t("通过") }}
							</button>
							<button
								type="button"
								class="mini-button danger"
								:disabled="requestBusy === request.from"
								@click="rejectRequest(request)"
							>
								{{ t("拒绝") }}
							</button>
						</div>
					</div>
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
								@click="openCardPicker"
							>
								{{ t("名片") }}
							</button>
							<button
								type="button"
								class="ghost-button"
								:disabled="nudging"
								@click="nudgeFriend"
							>
								{{ nudging ? t("拍一拍中……") : t("拍一拍") }}
							</button>
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
						<template
							v-for="message in messages"
							:key="message.hash"
						>
							<div
								v-if="message.type === 'nudge'"
								class="friend-nudge"
							>
								<span>{{ nudgeLine(message) }}</span>
								<time>{{ prettyTime(message.time) }}</time>
							</div>
							<div
								v-else-if="message.type === 'card' && message.card"
								class="friend-card-message"
								:class="{ mine: isMine(message) }"
							>
								<div class="friend-message-meta">
									<span>{{ message.name || message.user }}</span>
									<time>{{ prettyTime(message.time) }}</time>
								</div>
								<ContactCard
									:card="message.card"
									compact
									:added="
										isFriendUsername(message.card.username)
									"
									:busy="cardBusy === message.card.username"
									@open="openCardProfile(message.card)"
									@add="addCardFriend(message.card)"
								/>
							</div>
							<div
								v-else
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
						</template>
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

	<Modal
		:open="cardPickerOpen"
		:title="t('发送名片')"
		@close="cardPickerOpen = false"
	>
		<div class="card-picker">
			<p class="card-picker-hint">
				{{ t("选择一个好友的名片，发送给当前私信对象。") }}
			</p>
			<div v-if="!cardCandidates.length" class="friends-empty">
				{{ t("没有其他好友可以分享名片。") }}
			</div>
			<div v-else class="card-picker-list">
				<div
					v-for="friend in cardCandidates"
					:key="friend.username"
					class="card-picker-item"
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
					<button
						type="button"
						class="primary-button"
						:disabled="cardSending === friend.username"
						@click="sendCard(friend)"
					>
						{{
							cardSending === friend.username
								? t("发送中…")
								: t("发送")
						}}
					</button>
				</div>
			</div>
		</div>
	</Modal>
</template>
