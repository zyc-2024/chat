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
import MessageCard from "../components/MessageCard.vue";
import Modal from "../components/Modal.vue";
import {
	deleteChannel,
	readChannel,
	sendChannelMessage,
} from "../services/chat.js";
import { auth } from "../services/auth.js";
import { safeDecode, timeStamp } from "../lib/format.js";
import { renderMarkdown } from "../lib/markdown.js";
import { chatName, currentIdentity, useIdentity } from "../lib/identity.js";
import { showToast } from "../lib/toast.js";
import "../styles/chat.css";

const route = useRoute();
const router = useRouter();
const { rename } = useIdentity();

const PAGE_SIZE = 20;

function queryString(name, fallback = "") {
	const value = route.query[name];
	if (Array.isArray(value)) return String(value[0] ?? fallback);
	return typeof value === "string" ? value : fallback;
}

const options = computed(() => {
	const type = queryString("type") === "r" ? "r" : "u";
	return {
		type,
		ch: queryString("ch", "main") || "main",
		id: queryString("id"),
		key: queryString("key"),
	};
});
const isPrivate = computed(() => options.value.type === "r");
const channelName = computed(() =>
	isPrivate.value ? `#${options.value.id}` : `# ${safeDecode(options.value.ch)}`,
);
const channelSub = computed(() =>
	isPrivate.value
		? "私密频道 · 消息在浏览器内使用口令加解密"
		: "公开频道 · 任何人都可以进入",
);
const userLink = computed(() =>
	auth.session
		? { name: "user", query: { u: auth.session.username } }
		: { name: "login" },
);

const allMessages = ref([]);
const visibleStart = ref(0);
const loaded = ref(false);
const loading = ref(true);
const loadError = ref("");
const refreshError = ref("");
const sendError = ref("");
const refreshing = ref(false);
const sending = ref(false);
const loadingOlder = ref(false);
const newCount = ref(0);
const draft = ref("");
const refreshSeconds = ref(5);
const scrollEl = ref(null);
const switchTarget = ref("");
const channelStatus = ref(null);

const renameOpen = ref(false);
const renameValue = ref("");
const renameBusy = ref(false);
const intervalOpen = ref(false);
const intervalValue = ref(5);
const deleteOpen = ref(false);
const deleteBusy = ref(false);
const deleteError = ref("");

let timer = null;

const identity = computed(() => currentIdentity());
const canDelete = computed(() => {
	const status = channelStatus.value;
	if (!status || status.deleted) return false;
	if (status.owner !== identity.value.name) return false;
	if (
		status.ownerType &&
		identity.value.type &&
		status.ownerType !== identity.value.type
	) {
		return false;
	}
	return true;
});

const visibleMessages = computed(() =>
	allMessages.value.slice(visibleStart.value),
);
const canLoadMore = computed(() => visibleStart.value > 0);
const preview = computed(() => renderMarkdown(draft.value));
const statusText = computed(() => {
	if (loading.value) return "正在加载聊天记录…";
	if (refreshing.value) return "正在刷新…";
	if (sendError.value) return sendError.value;
	if (refreshError.value) return refreshError.value;
	return `每 ${refreshSeconds.value} 秒自动刷新 · 当前身份：${chatName.value}`;
});

function atBottom() {
	const el = scrollEl.value;
	if (!el) return true;
	return el.scrollHeight - el.scrollTop - el.clientHeight < 90;
}

function scrollToBottom(behavior = "auto") {
	nextTick(() => {
		const el = scrollEl.value;
		if (!el) return;
		el.scrollTo({ top: el.scrollHeight, behavior });
		newCount.value = 0;
	});
}

function onScroll() {
	if (atBottom()) newCount.value = 0;
	const el = scrollEl.value;
	if (el && el.scrollTop < 70 && canLoadMore.value) {
		loadOlder();
	}
}

async function load() {
	loading.value = true;
	loadError.value = "";
	refreshError.value = "";
	try {
		if (isPrivate.value && (!options.value.id || !options.value.key)) {
			throw new Error("私密频道缺少 id 或凭证，请从首页重新进入");
		}
		const result = await readChannel(options.value);
		channelStatus.value = result.status || null;
		allMessages.value = result.messages;
		visibleStart.value = Math.max(0, result.messages.length - PAGE_SIZE);
		loaded.value = true;
		await nextTick();
		scrollToBottom("auto");
	} catch (e) {
		loaded.value = false;
		allMessages.value = [];
		loadError.value = e && e.message ? e.message : String(e);
	} finally {
		loading.value = false;
	}
}

async function refresh(silent = true) {
	if (refreshing.value || !loaded.value || sending.value) return false;
	refreshing.value = true;
	try {
		const result = await readChannel(options.value);
		channelStatus.value = result.status || null;
		const oldLength = allMessages.value.length;
		const wasAtBottom = atBottom();
		const visibleCount = Math.max(0, oldLength - visibleStart.value);
		allMessages.value = result.messages;
		if (visibleStart.value > 0) {
			visibleStart.value = Math.max(
				0,
				result.messages.length - visibleCount,
			);
		} else {
			visibleStart.value = 0;
		}
		const added = result.messages.length - oldLength;
		if (added > 0) {
			if (wasAtBottom) {
				await nextTick();
				scrollToBottom("smooth");
			} else {
				newCount.value += added;
			}
		}
		refreshError.value = "";
		return true;
	} catch (e) {
		if (e && e.code === "CHANNEL_DELETED") {
			loaded.value = false;
			allMessages.value = [];
			visibleStart.value = 0;
			newCount.value = 0;
			loadError.value = e.message;
			refreshError.value = "";
			if (!silent) showToast(e.message, "error");
			return false;
		}
		refreshError.value = "自动刷新失败，稍后会重试";
		if (!silent) {
			showToast(e && e.message ? e.message : String(e), "error");
		}
		return false;
	} finally {
		refreshing.value = false;
	}
}

async function refreshNow() {
	const ok = await refresh(false);
	if (ok) showToast("已刷新", "success");
}

async function loadOlder() {
	const el = scrollEl.value;
	if (!el || visibleStart.value === 0 || loadingOlder.value) return;
	loadingOlder.value = true;
	try {
		const oldHeight = el.scrollHeight;
		const oldTop = el.scrollTop;
		visibleStart.value = Math.max(0, visibleStart.value - PAGE_SIZE);
		await nextTick();
		el.scrollTop = oldTop + (el.scrollHeight - oldHeight);
	} finally {
		loadingOlder.value = false;
	}
}

async function send() {
	if (sending.value) return;
	if (!draft.value.trim()) {
		showToast("消息不能为空", "error");
		return;
	}
	sending.value = true;
	sendError.value = "";
	try {
		const message = {
			name: chatName.value,
			user: auth.session ? auth.session.username : "",
			time: timeStamp(),
			ts: Date.now(),
			content: draft.value,
		};
		const messages = await sendChannelMessage(options.value, message);
		allMessages.value = messages;
		visibleStart.value = Math.max(0, messages.length - PAGE_SIZE);
		draft.value = "";
		newCount.value = 0;
		await nextTick();
		scrollToBottom("smooth");
	} catch (e) {
		if (e && e.code === "CHANNEL_DELETED") {
			loaded.value = false;
			allMessages.value = [];
			visibleStart.value = 0;
			loadError.value = e.message;
			sendError.value = "";
			showToast(e.message, "error", 4000);
			return;
		}
		sendError.value = e && e.message ? e.message : String(e);
		showToast(sendError.value, "error", 4000);
	} finally {
		sending.value = false;
	}
}

function onKeydown(event) {
	if (event.key === "Enter" && event.shiftKey) {
		event.preventDefault();
		send();
	}
}

function restartTimer() {
	if (timer) {
		clearInterval(timer);
		timer = null;
	}
	const seconds = Number(refreshSeconds.value);
	if (!Number.isFinite(seconds) || seconds <= 0) return;
	timer = window.setInterval(() => refresh(true), seconds * 1000);
}

function openRename() {
	if (!auth.session) {
		showToast(
			"游客用户名由设备自动生成，登录后才能修改昵称",
			"info",
			3500,
		);
		return;
	}
	renameValue.value = chatName.value;
	renameOpen.value = true;
}

async function submitRename() {
	const value = renameValue.value.trim();
	if (!value) {
		showToast("昵称不能为空", "error");
		return;
	}
	renameBusy.value = true;
	try {
		const synced = await rename(value);
		renameOpen.value = false;
		showToast(
			synced ? "昵称已更新" : "昵称已在本地更新（云端同步失败）",
			synced ? "success" : "info",
		);
	} catch (e) {
		showToast(e && e.message ? e.message : String(e), "error");
	} finally {
		renameBusy.value = false;
	}
}

function openInterval() {
	intervalValue.value = refreshSeconds.value;
	intervalOpen.value = true;
}

function submitInterval() {
	const value = Number(intervalValue.value);
	if (!Number.isFinite(value) || value < 1 || value > 3600) {
		showToast("请输入 1-3600 之间的秒数", "error");
		return;
	}
	refreshSeconds.value = Math.floor(value);
	intervalOpen.value = false;
	restartTimer();
	showToast(`刷新间隔已改为 ${refreshSeconds.value} 秒`, "success");
}

function openDelete() {
	if (!canDelete.value) return;
	deleteError.value = "";
	deleteOpen.value = true;
}

async function confirmDelete() {
	if (deleteBusy.value) return;
	deleteBusy.value = true;
	deleteError.value = "";
	try {
		await deleteChannel(options.value, identity.value);
		deleteOpen.value = false;
		showToast("频道已删除", "success");
		router.push({ name: "home" });
	} catch (e) {
		deleteError.value = e && e.message ? e.message : String(e);
	} finally {
		deleteBusy.value = false;
	}
}

function switchChannel() {
	const value = switchTarget.value.trim();
	if (!value) {
		showToast("请输入频道名称", "error");
		return;
	}
	switchTarget.value = "";
	router.push({ name: "chat", query: { type: "u", ch: value } });
}

function goUpload() {
	router.push({ name: "upload" });
}

watch(
	() => [
		route.query.type,
		route.query.ch,
		route.query.id,
		route.query.key,
	],
	async () => {
		loaded.value = false;
		allMessages.value = [];
		visibleStart.value = 0;
		newCount.value = 0;
		draft.value = "";
		loadError.value = "";
		refreshError.value = "";
		sendError.value = "";
		channelStatus.value = null;
		deleteOpen.value = false;
		deleteError.value = "";
		await load();
		restartTimer();
	},
);

watch(refreshSeconds, restartTimer);

onMounted(() => {
	load();
	restartTimer();
});

onBeforeUnmount(() => {
	if (timer) clearInterval(timer);
});
</script>

<template>
	<div class="chat-page">
		<div class="chat-shell">
			<header class="chat-header">
				<button
					type="button"
					class="chat-back"
					title="回到主页"
					@click="router.push({ name: 'home' })"
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="m15 18-6-6 6-6" />
					</svg>
				</button>
				<div class="chat-title-wrap">
					<h1 class="chat-title">{{ channelName }}</h1>
					<div class="chat-sub">{{ channelSub }}</div>
				</div>
				<div class="chat-header-right">
					<router-link
						class="chat-user"
						:to="userLink"
						:title="
							auth.session ? '查看我的个人主页' : '登录 / 注册'
						"
					>
						<span class="chat-user-dot"></span>
						<span class="chat-user-name">{{ chatName }}</span>
					</router-link>
				</div>
			</header>

			<main ref="scrollEl" class="chat-scroll" @scroll="onScroll">
				<div v-if="loading" class="chat-empty">
					聊天记录加载中……<br />如果加载时间过长，则可能是页面不存在
				</div>

				<div v-else-if="loadError" class="chat-error">
					<strong>无法打开这个频道</strong>
					{{ loadError }}
					<div class="chat-error-actions">
						<button type="button" class="ghost-button" @click="load">
							重试
						</button>
						<button
							type="button"
							class="primary-button"
							@click="router.push({ name: 'home' })"
						>
							返回首页
						</button>
					</div>
				</div>

				<template v-else>
					<div v-if="canLoadMore" class="chat-load-more">
						<button
							type="button"
							:disabled="loadingOlder"
							@click="loadOlder"
						>
							{{ loadingOlder ? "加载中……" : "加载更早的消息" }}
						</button>
					</div>
					<div v-if="!visibleMessages.length" class="chat-empty">
						还没有消息，发第一条吧。
					</div>
					<MessageCard
						v-for="(message, index) in visibleMessages"
						:key="visibleStart + index"
						:message="message"
					/>
				</template>

				<button
					v-if="newCount > 0"
					type="button"
					class="chat-new-messages"
					@click="scrollToBottom('smooth')"
				>
					有 {{ newCount }} 条新消息 ↓
				</button>
			</main>

			<div v-if="!loadError" class="chat-composer">
				<div class="composer-grid">
					<div class="composer-editor">
						<textarea
							v-model="draft"
							placeholder="输入消息，按 Shift+Enter 发送；支持 Markdown 与 LaTeX"
							@keydown="onKeydown"
						></textarea>
					</div>
					<div class="composer-preview">
						<div v-if="!draft.trim()" class="empty-preview">
							Markdown / LaTeX 预览
						</div>
						<div
							v-else
							class="markdown-body"
							v-html="preview"
						></div>
					</div>
				</div>

				<div class="composer-actions">
					<button
						type="button"
						class="primary-button"
						:disabled="sending"
						@click="send"
					>
						{{ sending ? "发送中…" : "发送" }}
					</button>
					<button type="button" class="ghost-button" @click="refreshNow">
						刷新
					</button>
					<button type="button" class="ghost-button" @click="openRename">
						改名
					</button>
					<button type="button" class="ghost-button" @click="goUpload">
						上传文件
					</button>
					<button type="button" class="ghost-button" @click="openInterval">
						刷新间隔
					</button>
					<button
						v-if="canDelete"
						type="button"
						class="danger-button"
						@click="openDelete"
					>
						删除频道
					</button>
					<span class="composer-status">{{ statusText }}</span>
				</div>

				<form
					v-if="!isPrivate"
					class="chat-switch"
					@submit.prevent="switchChannel"
				>
					<input
						v-model="switchTarget"
						placeholder="输入你想去的聊天室"
					/>
					<button type="submit">前往</button>
				</form>
			</div>
		</div>

		<Modal
			:open="renameOpen"
			title="修改聊天昵称"
			@close="renameOpen = false"
		>
			<form @submit.prevent="submitRename">
				<div class="modal-field">
					<label for="rename-input">新的昵称</label>
					<input
						id="rename-input"
						v-model="renameValue"
						maxlength="32"
						placeholder="输入新的昵称"
					/>
				</div>
				<div class="modal-actions">
					<button
						type="button"
						class="ghost-button"
						@click="renameOpen = false"
					>
						取消
					</button>
					<button
						type="submit"
						class="primary-button"
						:disabled="renameBusy"
					>
						{{ renameBusy ? "保存中…" : "保存" }}
					</button>
				</div>
			</form>
		</Modal>

		<Modal
			:open="intervalOpen"
			title="修改自动刷新间隔"
			@close="intervalOpen = false"
		>
			<form @submit.prevent="submitInterval">
				<div class="modal-field">
					<label for="interval-input">刷新间隔（秒，1-3600）</label>
					<input
						id="interval-input"
						v-model.number="intervalValue"
						type="number"
						min="1"
						max="3600"
					/>
				</div>
				<div class="modal-actions">
					<button
						type="button"
						class="ghost-button"
						@click="intervalOpen = false"
					>
						取消
					</button>
					<button type="submit" class="primary-button">保存</button>
				</div>
			</form>
		</Modal>

		<Modal
			:open="deleteOpen"
			title="删除频道"
			@close="deleteOpen = false"
		>
			<p class="chat-delete-note">
				删除后会写入 deleted 标记，频道会从首页隐藏；聊天记录不会被立即从仓库删除。只有创建者可以操作。
			</p>
			<div v-if="deleteError" class="chat-delete-error">
				{{ deleteError }}
			</div>
			<div class="modal-actions">
				<button
					type="button"
					class="ghost-button"
					@click="deleteOpen = false"
				>
					取消
				</button>
				<button
					type="button"
					class="danger-button"
					:disabled="deleteBusy"
					@click="confirmDelete"
				>
					{{ deleteBusy ? "删除中…" : "确认删除" }}
				</button>
			</div>
		</Modal>
	</div>
</template>
