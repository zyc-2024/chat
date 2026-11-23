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
import MessageCard from "../components/MessageCard.vue";
import Modal from "../components/Modal.vue";
import {
	deleteChannel,
	readChannel,
	recallChannelMessage,
	sendChannelMessage,
} from "../services/chat.js";
import { auth } from "../services/auth.js";
import { rewriteLegacyFileUrls } from "../services/gitee.js";
import { copyText } from "../lib/clipboard.js";
import { t } from "../i18n/index.js";
import { prettyTime, safeDecode, timeStamp } from "../lib/format.js";
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
		? t("私密频道 · 消息在浏览器内使用口令加解密")
		: t("公开频道 · 任何人都可以进入"),
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
const editorEl = ref(null);
const switchTarget = ref("");
const channelStatus = ref(null);
const quoting = ref(null);
const moreActionsOpen = ref(false);
const latexOpen = ref(false);
const latexSelection = ref({ start: 0, end: 0 });
const messageMenu = ref({
	open: false,
	x: 0,
	y: 0,
	index: -1,
	items: [],
});

const latexGroups = [
	{
		title: "常用公式",
		items: [
			{ label: "行内公式", symbol: "$x$", snippet: "$ $SEL $", placeholder: "x" },
			{
				label: "独立公式",
				symbol: "$$",
				snippet: "$$\n$SEL\n$$",
				placeholder: "x",
			},
			{ label: "分数", symbol: "a/b", snippet: "\\frac{$CURSOR}{b}" },
			{ label: "根号", symbol: "√", snippet: "\\sqrt{$CURSOR}" },
			{ label: "上标", symbol: "x²", snippet: "x^{$CURSOR}" },
			{ label: "下标", symbol: "x₂", snippet: "x_{$CURSOR}" },
		],
	},
	{
		title: "公式结构",
		items: [
			{
				label: "求和",
				symbol: "∑",
				snippet: "\\sum_{i=1}^{n} $CURSOR",
			},
			{
				label: "积分",
				symbol: "∫",
				snippet: "\\int_{a}^{b} $CURSOR \\, dx",
			},
			{ label: "极限", symbol: "lim", snippet: "\\lim_{x \\to $CURSOR}" },
			{ label: "向量", symbol: "a⃗", snippet: "\\vec{$CURSOR}" },
			{
				label: "矩阵",
				symbol: "[ ]",
				snippet:
					"\\begin{pmatrix}\n$CURSOR & \\\\\n & \n\\end{pmatrix}",
			},
			{
				label: "分段函数",
				symbol: "{",
				snippet: "\\begin{cases}\n$CURSOR \\\\\n\\end{cases}",
			},
			{
				label: "对齐环境",
				symbol: "≡",
				snippet: "\\begin{aligned}\n$CURSOR\n\\end{aligned}",
			},
		],
	},
	{
		title: "希腊字母",
		items: [
			{ label: "α", symbol: "α", snippet: "\\alpha" },
			{ label: "β", symbol: "β", snippet: "\\beta" },
			{ label: "γ", symbol: "γ", snippet: "\\gamma" },
			{ label: "δ", symbol: "δ", snippet: "\\delta" },
			{ label: "θ", symbol: "θ", snippet: "\\theta" },
			{ label: "λ", symbol: "λ", snippet: "\\lambda" },
			{ label: "μ", symbol: "μ", snippet: "\\mu" },
			{ label: "π", symbol: "π", snippet: "\\pi" },
			{ label: "σ", symbol: "σ", snippet: "\\sigma" },
			{ label: "φ", symbol: "φ", snippet: "\\phi" },
			{ label: "ω", symbol: "ω", snippet: "\\omega" },
			{ label: "Δ", symbol: "Δ", snippet: "\\Delta" },
			{ label: "Ω", symbol: "Ω", snippet: "\\Omega" },
		],
	},
	{
		title: "运算符",
		items: [
			{ label: "×", symbol: "×", snippet: "\\times" },
			{ label: "÷", symbol: "÷", snippet: "\\div" },
			{ label: "·", symbol: "·", snippet: "\\cdot" },
			{ label: "±", symbol: "±", snippet: "\\pm" },
			{ label: "≤", symbol: "≤", snippet: "\\le" },
			{ label: "≥", symbol: "≥", snippet: "\\ge" },
			{ label: "≠", symbol: "≠", snippet: "\\ne" },
			{ label: "≈", symbol: "≈", snippet: "\\approx" },
			{ label: "∞", symbol: "∞", snippet: "\\infty" },
			{ label: "∂", symbol: "∂", snippet: "\\partial" },
			{ label: "∇", symbol: "∇", snippet: "\\nabla" },
			{ label: "→", symbol: "→", snippet: "\\to" },
			{ label: "⇒", symbol: "⇒", snippet: "\\Rightarrow" },
		],
	},
];

const EDITOR_HEIGHT_KEY = "chat_composer_height_v1";
const EDITOR_HEIGHT_MIN = 64;
const EDITOR_HEIGHT_MAX = 420;

function maxEditorHeight() {
	const viewport =
		typeof window === "undefined" ? 800 : window.innerHeight;
	return Math.max(
		EDITOR_HEIGHT_MIN,
		Math.min(EDITOR_HEIGHT_MAX, Math.round(viewport * 0.42)),
	);
}

function clampEditorHeight(value) {
	return Math.min(
		maxEditorHeight(),
		Math.max(EDITOR_HEIGHT_MIN, Math.round(Number(value) || 0)),
	);
}

function defaultEditorHeight() {
	const mobile =
		typeof window !== "undefined" &&
		window.matchMedia &&
		window.matchMedia("(max-width: 760px)").matches;
	return clampEditorHeight(mobile ? 70 : 106);
}

function loadEditorHeight() {
	try {
		const stored = Number(localStorage.getItem(EDITOR_HEIGHT_KEY));
		if (Number.isFinite(stored) && stored > 0) {
			return clampEditorHeight(stored);
		}
	} catch (e) {
		// localStorage 不可用时使用默认高度
	}
	return defaultEditorHeight();
}

function saveEditorHeight() {
	try {
		localStorage.setItem(EDITOR_HEIGHT_KEY, String(editorHeight.value));
	} catch (e) {
		// ignore
	}
}

const editorHeight = ref(loadEditorHeight());
const resizingEditor = ref(false);
let resizeMoveHandler = null;
let resizeUpHandler = null;
let resizeStartY = 0;
let resizeStartHeight = 0;

function startEditorResize(event) {
	if (event.pointerType === "mouse" && event.button !== 0) return;
	resizeStartY = event.clientY;
	resizeStartHeight = editorHeight.value;
	resizingEditor.value = true;
	resizeMoveHandler = (moveEvent) => {
		editorHeight.value = clampEditorHeight(
			resizeStartHeight + (resizeStartY - moveEvent.clientY),
		);
	};
	resizeUpHandler = () => stopEditorResize();
	window.addEventListener("pointermove", resizeMoveHandler);
	window.addEventListener("pointerup", resizeUpHandler, { once: true });
	window.addEventListener("pointercancel", resizeUpHandler, { once: true });
	event.preventDefault();
}

function stopEditorResize() {
	if (!resizingEditor.value) return;
	resizingEditor.value = false;
	if (resizeMoveHandler) {
		window.removeEventListener("pointermove", resizeMoveHandler);
	}
	if (resizeUpHandler) {
		window.removeEventListener("pointerup", resizeUpHandler);
		window.removeEventListener("pointercancel", resizeUpHandler);
	}
	resizeMoveHandler = null;
	resizeUpHandler = null;
	saveEditorHeight();
}

function resetEditorHeight() {
	editorHeight.value = defaultEditorHeight();
	saveEditorHeight();
}

function openLatexHelper() {
	const el = editorEl.value;
	const length = draft.value.length;
	const start = el
		? Math.min(el.selectionStart ?? length, length)
		: length;
	const end = el ? Math.min(el.selectionEnd ?? length, length) : length;
	latexSelection.value = { start, end };
	latexOpen.value = true;
}

function insertLatexSnippet(item) {
	const snippet = String(item.snippet || "");
	const placeholder = item.placeholder || "x";
	const selection = latexSelection.value;
	const length = draft.value.length;
	const start = Math.min(selection.start, length);
	const end = Math.min(Math.max(selection.end, start), length);
	const selected = draft.value.slice(start, end);
	const body = selected || placeholder;
	const bodyIndex = snippet.indexOf("$SEL");
	const cursorIndex = snippet.indexOf("$CURSOR");
	let inserted = snippet.replaceAll("$SEL", body);
	let selectStart = start + inserted.length;
	let selectEnd = selectStart;
	if (cursorIndex >= 0) {
		const position = inserted.indexOf("$CURSOR");
		inserted = inserted.replace("$CURSOR", "");
		selectStart = selectEnd = start + position;
	} else if (bodyIndex >= 0 && !selected) {
		selectStart = start + bodyIndex;
		selectEnd = selectStart + body.length;
	}
	draft.value =
		draft.value.slice(0, start) + inserted + draft.value.slice(end);
	latexSelection.value = { start: selectStart, end: selectEnd };
}

function closeLatexHelper() {
	latexOpen.value = false;
	nextTick(() => {
		const el = editorEl.value;
		if (!el) return;
		el.focus();
		el.setSelectionRange(
			latexSelection.value.start,
			latexSelection.value.end,
		);
	});
}

const renameOpen = ref(false);
const renameValue = ref("");
const renameBusy = ref(false);
const intervalOpen = ref(false);
const intervalValue = ref(5);
const deleteOpen = ref(false);
const deleteBusy = ref(false);
const deleteError = ref("");

let timer = null;
let highlightTimer = null;

const identity = computed(() => currentIdentity());
const canDelete = computed(() => {
	const status = channelStatus.value;
	if (status && status.deleted) return false;
	if (identity.value.admin) return true;
	if (!status) return false;
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
const messageByHash = computed(() => {
	const map = new Map();
	for (const message of allMessages.value) {
		if (message.hash) map.set(message.hash, message);
	}
	return map;
});
const lastRecalledIndex = computed(() => {
	const me = currentIdentity().name;
	for (let i = allMessages.value.length - 1; i >= 0; i--) {
		const message = allMessages.value[i];
		if (message.recalled && message.user === me) return i;
	}
	return -1;
});
const chatStats = computed(() => {
	const count = allMessages.value.length;
	const last = allMessages.value[count - 1];
	return {
		count,
		lastTime: last ? prettyTime(last.time) : "",
	};
});
const statusText = computed(() => {
	if (loading.value) return t("正在加载聊天记录…");
	if (refreshing.value) return t("正在刷新…");
	if (sendError.value) return sendError.value;
	if (refreshError.value) return refreshError.value;
	return t("每 {seconds} 秒自动刷新 · 当前身份：{name}", {
		seconds: refreshSeconds.value,
		name: chatName.value,
	});
});

function atBottom() {
	const el = scrollEl.value;
	if (!el) return true;
	return el.scrollHeight - el.scrollTop - el.clientHeight < 90;
}

function updateScrollState() {
	const el = scrollEl.value;
	if (!el) return;
	const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
	if (distance < 90) newCount.value = 0;
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
	updateScrollState();
	const el = scrollEl.value;
	if (el && el.scrollTop < 70 && canLoadMore.value) {
		loadOlder();
	}
}

function snippet(text, max = 90) {
	const flat = String(text || "")
		.replace(/\s+/g, " ")
		.trim();
	if (!flat) return t("[空消息]");
	return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

function resolveQuote(message) {
	const quote = message && message.quote;
	if (!quote || !quote.hash) return null;
	const target = messageByHash.value.get(quote.hash);
	return {
		hash: quote.hash,
		name: (target && target.name) || quote.name || t("匿名"),
		content: target ? target.content || "" : "",
		recalled: !!(target && target.recalled),
		missing: !target,
	};
}

function startQuote(message) {
	if (!message || message.recalled) return;
	quoting.value = {
		hash: message.hash,
		name: message.name || t("匿名"),
		content: message.content || "",
	};
	nextTick(() => editorEl.value?.focus());
}

function closeMessageMenu() {
	if (messageMenu.value.open) {
		messageMenu.value = { ...messageMenu.value, open: false };
	}
}

function openMessageMenu(event, index) {
	const message = allMessages.value[index];
	if (!message) return;
	event.preventDefault();
	if (message.recalled) {
		closeMessageMenu();
		return;
	}
	const items = [
		{ key: "copy", label: t("复制") },
		{ key: "quote", label: t("引用") },
	];
	if (canRecallMessage(message)) {
		items.push({ key: "recall", label: t("撤回"), danger: true });
	}
	const width = 156;
	const height = items.length * 36 + 12;
	const margin = 8;
	const x = Math.min(
		Math.max(event.clientX, margin),
		Math.max(margin, window.innerWidth - width - margin),
	);
	const y = Math.min(
		Math.max(event.clientY, margin),
		Math.max(margin, window.innerHeight - height - margin),
	);
	messageMenu.value = { open: true, x, y, index, items };
}

function runMessageMenu(key) {
	const index = messageMenu.value.index;
	closeMessageMenu();
	const message = allMessages.value[index];
	if (!message) return;
	if (key === "copy") {
		copyMessage(message);
	} else if (key === "quote") {
		startQuote(message);
	} else if (key === "recall") {
		recallMessageAt(index);
	}
}

async function copyMessage(message) {
	const ok = await copyText(
		rewriteLegacyFileUrls(message.content || ""),
	);
	showToast(
		ok ? t("消息已复制") : t("复制失败，请手动选择"),
		ok ? "success" : "error",
	);
}

function onGlobalPointerDown() {
	closeMessageMenu();
}

function onGlobalKeydown(event) {
	if (event.key === "Escape") closeMessageMenu();
}

function onGlobalScroll() {
	closeMessageMenu();
}

async function jumpToMessage(hash) {
	const index = allMessages.value.findIndex(
		(message) => message.hash === hash,
	);
	if (index < 0) {
		showToast(t("找不到被引用的消息"), "error");
		return;
	}
	if (index < visibleStart.value) {
		visibleStart.value = Math.max(0, index - 2);
		await nextTick();
	}
	const container = scrollEl.value;
	const target =
		container &&
		container.querySelector(`[data-message-hash="${hash}"]`);
	if (!target) {
		showToast(t("找不到被引用的消息"), "error");
		return;
	}
	target.scrollIntoView({ behavior: "smooth", block: "center" });
	if (highlightTimer) clearTimeout(highlightTimer);
	container
		.querySelectorAll(".message-highlight")
		.forEach((item) => item.classList.remove("message-highlight"));
	target.classList.add("message-highlight");
	highlightTimer = window.setTimeout(() => {
		target.classList.remove("message-highlight");
	}, 1800);
}

async function load() {
	loading.value = true;
	loadError.value = "";
	refreshError.value = "";
	try {
		if (isPrivate.value && (!options.value.id || !options.value.key)) {
			throw new Error(
				t("私密频道缺少 id 或凭证，请从首页重新进入"),
			);
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
		await nextTick();
		updateScrollState();
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
		refreshError.value = t("自动刷新失败，稍后会重试");
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
	if (ok) showToast(t("已刷新"), "success");
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
		showToast(t("消息不能为空"), "error");
		return;
	}
	sending.value = true;
	sendError.value = "";
	try {
		const message = {
			name: chatName.value,
			user: identity.value.name,
			time: timeStamp(),
			ts: Date.now(),
			quote: quoting.value
				? {
						hash: quoting.value.hash,
						name: quoting.value.name || t("匿名"),
					}
				: null,
			recalled: false,
			content: draft.value,
		};
		const messages = await sendChannelMessage(options.value, message);
		allMessages.value = messages;
		visibleStart.value = Math.max(0, messages.length - PAGE_SIZE);
		draft.value = "";
		quoting.value = null;
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
			t("游客用户名由设备自动生成，登录后才能修改昵称"),
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
		showToast(t("昵称不能为空"), "error");
		return;
	}
	renameBusy.value = true;
	try {
		const synced = await rename(value);
		renameOpen.value = false;
		showToast(
			synced
				? t("昵称已更新")
				: t("昵称已在本地更新（云端同步失败）"),
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
		showToast(t("请输入 1-3600 之间的秒数"), "error");
		return;
	}
	refreshSeconds.value = Math.floor(value);
	intervalOpen.value = false;
	restartTimer();
	showToast(
		t("刷新间隔已改为 {seconds} 秒", {
			seconds: refreshSeconds.value,
		}),
		"success",
	);
}

function canRecallMessage(message) {
	if (!message || message.recalled) return false;
	if (identity.value.admin) return true;
	return !!message.user && message.user === identity.value.name;
}

async function recallMessageAt(index) {
	const message = allMessages.value[index];
	if (!message) return;
	try {
		const messages = await recallChannelMessage(
			options.value,
			index,
			identity.value,
		);
		allMessages.value = messages;
		showToast(t("消息已撤回"), "success");
	} catch (e) {
		if (e && e.code === "CHANNEL_DELETED") {
			loaded.value = false;
			allMessages.value = [];
			visibleStart.value = 0;
			loadError.value = e.message;
			return;
		}
		showToast(e && e.message ? e.message : String(e), "error");
	}
}

function reeditMessage(message) {
	draft.value = message.content || "";
	if (message.quote && message.quote.hash) {
		const target = messageByHash.value.get(message.quote.hash);
		quoting.value = {
			hash: message.quote.hash,
			name: (target && target.name) || message.quote.name || "Anonymous",
			content: target ? target.content || "" : "",
		};
	} else {
		quoting.value = null;
	}
	showToast(t("已放回消息框，可修改后重新发送"), "info");
	nextTick(() => editorEl.value?.focus());
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
		showToast(t("频道已删除"), "success");
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
		showToast(t("请输入频道名称"), "error");
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
		quoting.value = null;
		moreActionsOpen.value = false;
		latexOpen.value = false;
		closeMessageMenu();
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
	window.addEventListener("pointerdown", onGlobalPointerDown);
	window.addEventListener("keydown", onGlobalKeydown);
	window.addEventListener("scroll", onGlobalScroll, true);
	window.addEventListener("resize", onGlobalScroll);
});

onBeforeUnmount(() => {
	if (timer) clearInterval(timer);
	if (highlightTimer) clearTimeout(highlightTimer);
	stopEditorResize();
	window.removeEventListener("pointerdown", onGlobalPointerDown);
	window.removeEventListener("keydown", onGlobalKeydown);
	window.removeEventListener("scroll", onGlobalScroll, true);
	window.removeEventListener("resize", onGlobalScroll);
});
</script>

<template>
	<div class="chat-page">
		<div class="chat-shell">
			<header class="chat-header">
				<button
					type="button"
					class="chat-back"
					:title="t('回到主页')"
					@click="router.push({ name: 'home' })"
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path d="m15 18-6-6 6-6" />
					</svg>
				</button>
				<div class="chat-title-wrap">
					<h1 class="chat-title">{{ channelName }}</h1>
					<div class="chat-sub">
						{{ channelSub }} ·
						{{ t("{count} 条消息", { count: chatStats.count }) }}<span
							v-if="chatStats.lastTime"
						>
							· {{ t("最后发言 {time}", { time: chatStats.lastTime }) }}</span
						>
					</div>
				</div>
				<div class="chat-header-right">
					<LanguageSwitcher compact />
					<router-link
						class="chat-user"
						:to="userLink"
						:title="
							auth.session ? t('查看我的个人主页') : t('登录 / 注册')
						"
					>
						<span class="chat-user-dot"></span>
						<span class="chat-user-name">{{ chatName }}</span>
					</router-link>
				</div>
			</header>

			<div class="chat-main">
				<main ref="scrollEl" class="chat-scroll" @scroll="onScroll">
				<div v-if="loading" class="chat-empty">
					{{ t("正在加载聊天记录…") }}<br />{{
						t("如果加载时间过长，则可能是页面不存在")
					}}
				</div>

				<div v-else-if="loadError" class="chat-error">
					<strong>{{ t("无法打开这个频道") }}</strong>
					{{ loadError }}
					<div class="chat-error-actions">
						<button type="button" class="ghost-button" @click="load">
							{{ t("重试") }}
						</button>
						<button
							type="button"
							class="primary-button"
							@click="router.push({ name: 'home' })"
						>
							{{ t("返回首页") }}
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
							{{
								loadingOlder
									? t("加载中……")
									: t("加载更早的消息")
							}}
						</button>
					</div>
					<div v-if="!visibleMessages.length" class="chat-empty">
						{{ t("还没有消息，发第一条吧。") }}
					</div>
					<MessageCard
						v-for="(message, index) in visibleMessages"
						:key="visibleStart + index"
						:message="message"
						:can-reedit="visibleStart + index === lastRecalledIndex"
						:quoted="resolveQuote(message)"
						@reedit="reeditMessage(message)"
						@jump-quote="jumpToMessage"
						@menu="openMessageMenu($event, visibleStart + index)"
						@contextmenu.prevent="
							openMessageMenu($event, visibleStart + index)
						"
					/>
				</template>
				</main>

				<button
					v-if="loaded && !loadError"
					type="button"
					class="chat-jump-bottom"
					:title="t('回到最新消息')"
					@click="scrollToBottom('smooth')"
				>
					{{ t("一键到底 ↓") }}
				</button>
				<button
					v-if="newCount > 0"
					type="button"
					class="chat-new-messages"
					@click="scrollToBottom('smooth')"
				>
					{{ t("有 {count} 条新消息 ↓", { count: newCount }) }}
				</button>
			</div>

			<div
				v-if="!loadError"
				class="chat-composer"
				:class="{ resizing: resizingEditor }"
			>
				<div v-if="quoting" class="composer-quote">
					<div class="composer-quote-info">
						<span class="composer-quote-label">
							{{
								t("引用 {name}", {
									name: quoting.name || t("匿名"),
								})
							}}
						</span>
						<span class="composer-quote-text">
							{{ snippet(quoting.content) }}
						</span>
					</div>
					<button
						type="button"
						class="composer-quote-cancel"
						:title="t('取消引用')"
						:aria-label="t('取消引用')"
						@click="quoting = null"
					>
						×
					</button>
				</div>
				<div class="composer-grid">
					<div class="composer-editor">
						<textarea
							ref="editorEl"
							v-model="draft"
							:style="{ height: editorHeight + 'px' }"
							:placeholder="
								t(
									'输入消息，按 Shift+Enter 发送；支持 Markdown 与 LaTeX',
								)
							"
							@keydown="onKeydown"
						></textarea>
					</div>
					<div
						class="composer-preview"
						:style="{ height: editorHeight + 'px' }"
					>
						<div v-if="!draft.trim()" class="empty-preview">
							{{ t("Markdown / LaTeX 预览") }}
						</div>
						<div
							v-else
							class="markdown-body"
							v-html="preview"
						></div>
					</div>
				</div>

				<div
					class="composer-resize-handle"
					role="separator"
					aria-orientation="horizontal"
					:aria-label="t('拖动调整输入框高度')"
					:title="t('拖动调整输入框高度，双击恢复默认')"
					@pointerdown="startEditorResize"
					@dblclick="resetEditorHeight"
				></div>

				<div class="composer-actions">
					<button
						type="button"
						class="primary-button"
						:disabled="sending"
						@click="send"
					>
						{{ sending ? t("发送中…") : t("发送") }}
					</button>
					<button
						type="button"
						class="ghost-button latex-helper-toggle"
						:title="t('LaTeX 辅助编辑')"
						@click="openLatexHelper"
					>
						∑ LaTeX
					</button>
					<button
						type="button"
						class="ghost-button composer-more-toggle"
						@click="moreActionsOpen = !moreActionsOpen"
					>
						{{ moreActionsOpen ? t("收起") : t("更多") }}
					</button>
					<div
						class="composer-more"
						:class="{ open: moreActionsOpen }"
					>
						<button
							type="button"
							class="ghost-button"
							@click="refreshNow"
						>
							{{ t("刷新") }}
						</button>
						<button
							type="button"
							class="ghost-button"
							@click="openRename"
						>
							{{ t("改名") }}
						</button>
						<button
							type="button"
							class="ghost-button"
							@click="goUpload"
						>
							{{ t("上传文件") }}
						</button>
						<button
							type="button"
							class="ghost-button"
							@click="openInterval"
						>
							{{ t("刷新间隔") }}
						</button>
						<button
							v-if="canDelete"
							type="button"
							class="danger-button"
							@click="openDelete"
						>
							{{ t("删除频道") }}
						</button>
					</div>
					<span class="composer-status">{{ statusText }}</span>
				</div>

				<form
					v-if="!isPrivate"
					class="chat-switch"
					@submit.prevent="switchChannel"
				>
					<input
						v-model="switchTarget"
						:placeholder="t('输入你想去的聊天室')"
					/>
					<button type="submit">{{ t("前往") }}</button>
				</form>
			</div>
		</div>

		<Teleport to="body">
			<div
				v-if="messageMenu.open"
				class="message-context-menu"
				:style="{
					left: messageMenu.x + 'px',
					top: messageMenu.y + 'px',
				}"
				@pointerdown.stop
				@contextmenu.prevent
			>
				<button
					v-for="item in messageMenu.items"
					:key="item.key"
					type="button"
					:class="{ danger: item.danger }"
					@click="runMessageMenu(item.key)"
				>
					{{ item.label }}
				</button>
			</div>
		</Teleport>

		<Modal
			:open="renameOpen"
			:title="t('修改聊天昵称')"
			@close="renameOpen = false"
		>
			<form @submit.prevent="submitRename">
				<div class="modal-field">
					<label for="rename-input">{{ t("新的昵称") }}</label>
					<input
						id="rename-input"
						v-model="renameValue"
						maxlength="32"
						:placeholder="t('输入新的昵称')"
					/>
				</div>
				<div class="modal-actions">
					<button
						type="button"
						class="ghost-button"
						@click="renameOpen = false"
					>
						{{ t("取消") }}
					</button>
					<button
						type="submit"
						class="primary-button"
						:disabled="renameBusy"
					>
						{{ renameBusy ? t("保存中……") : t("保存") }}
					</button>
				</div>
			</form>
		</Modal>

		<Modal
			:open="intervalOpen"
			:title="t('修改自动刷新间隔')"
			@close="intervalOpen = false"
		>
			<form @submit.prevent="submitInterval">
				<div class="modal-field">
					<label for="interval-input">{{
						t("刷新间隔（秒，1-3600）")
					}}</label>
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
						{{ t("取消") }}
					</button>
					<button type="submit" class="primary-button">
						{{ t("保存") }}
					</button>
				</div>
			</form>
		</Modal>

		<Modal
			:open="latexOpen"
			:title="t('LaTeX 辅助编辑')"
			width="560px"
			@close="closeLatexHelper"
		>
			<div class="latex-helper">
				<p class="latex-helper-intro">
					{{
						t(
							"点击模板插入到光标位置；先选中文字再点击，可以把选中内容放进公式。",
						)
					}}
				</p>
				<section
					v-for="group in latexGroups"
					:key="group.title"
					class="latex-group"
				>
					<h3 class="latex-group-title">{{ t(group.title) }}</h3>
					<div class="latex-grid">
						<button
							v-for="item in group.items"
							:key="item.label"
							type="button"
							class="latex-item"
							:title="item.label"
							@click="insertLatexSnippet(item)"
						>
							<span class="latex-item-symbol">
								{{ item.symbol }}
							</span>
							<span
								v-if="item.label !== item.symbol"
								class="latex-item-label"
							>
								{{ t(item.label) }}
							</span>
						</button>
					</div>
				</section>
				<div class="latex-helper-actions">
					<button
						type="button"
						class="primary-button"
						@click="closeLatexHelper"
					>
						{{ t("完成") }}
					</button>
				</div>
			</div>
		</Modal>

		<Modal
			:open="deleteOpen"
			:title="t('删除频道')"
			@close="deleteOpen = false"
		>
			<p class="chat-delete-note">
				{{
					t(
						"删除后会写入 deleted 标记，频道会从首页隐藏。只有创建者可以操作。",
					)
				}}
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
					{{ t("取消") }}
				</button>
				<button
					type="button"
					class="danger-button"
					:disabled="deleteBusy"
					@click="confirmDelete"
				>
					{{ deleteBusy ? t("删除中…") : t("确认删除") }}
				</button>
			</div>
		</Modal>
	</div>
</template>
