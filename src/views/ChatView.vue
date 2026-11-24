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
import {
	addFriend,
	loadFriends,
	sendFriendMessage,
} from "../services/friends.js";
import {
	addGroupMember,
	joinGroup,
	loadGroupMeta,
	removeGroupFromIndex,
} from "../services/groups.js";
import { rewriteLegacyFileUrls } from "../services/gitee.js";
import { createNudgeMessage, fetchNudgeSuffix } from "../services/nudge.js";
import { copyText } from "../lib/clipboard.js";
import { t } from "../i18n/index.js";
import { mathModeAt, wrapLatexSnippet } from "../lib/latex.js";
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

const groupMeta = ref(null);

const options = computed(() => {
	const rawType = queryString("type");
	const type = rawType === "r" || rawType === "g" ? rawType : "u";
	return {
		type,
		ch: queryString("ch", "main") || "main",
		id: queryString("id"),
		key: queryString("key"),
	};
});
const isGroup = computed(() => options.value.type === "g");
const isPrivate = computed(
	() => options.value.type === "r" || isGroup.value,
);
const channelName = computed(() => {
	if (isGroup.value) {
		return groupMeta.value && groupMeta.value.name
			? groupMeta.value.name
			: `#${options.value.id}`;
	}
	return isPrivate.value
		? `#${options.value.id}`
		: `# ${safeDecode(options.value.ch)}`;
});
const channelSub = computed(() => {
	if (isGroup.value) {
		if (!groupMeta.value) {
			return t("群组 · 正在读取群组信息…");
		}
		const count = groupMeta.value.members.length;
		return t("群组 · {count} 位成员 · 消息在浏览器内加密", {
			count,
		});
	}
	return isPrivate.value
		? t("私密频道 · 消息在浏览器内使用口令加解密")
		: t("公开频道 · 任何人都可以进入");
});
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
const activeLatexGroup = ref("common");
const latexQuery = ref("");
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
		id: "common",
		title: "常用公式",
		items: [
			{
				label: "行内公式",
				symbol: "$x$",
				snippet: "$ $SEL $",
				placeholder: "x",
				wrap: false,
				template: "inline",
			},
			{
				label: "独立公式",
				symbol: "$$",
				snippet: "$$\n$SEL\n$$",
				placeholder: "x",
				wrap: false,
				template: "display",
			},
			{
				label: "分数",
				symbol: "a/b",
				snippet: "\\frac{$SEL}{b}",
				placeholder: "a",
			},
			{
				label: "根号",
				symbol: "√",
				snippet: "\\sqrt{$SEL}",
				placeholder: "x",
			},
			{
				label: "n 次根",
				symbol: "ⁿ√",
				snippet: "\\sqrt[n]{$SEL}",
				placeholder: "x",
			},
			{
				label: "上标",
				symbol: "x²",
				snippet: "x^{$SEL}",
				placeholder: "2",
			},
			{
				label: "下标",
				symbol: "x₂",
				snippet: "x_{$SEL}",
				placeholder: "i",
			},
			{
				label: "上下标",
				symbol: "x²₃",
				snippet: "x_{$SEL}^{n}",
				placeholder: "i",
			},
			{
				label: "组合数",
				symbol: "C",
				snippet: "\\binom{n}{$SEL}",
				placeholder: "k",
			},
			{
				label: "绝对值",
				symbol: "|x|",
				snippet: "\\left|$SEL\\right|",
				placeholder: "x",
			},
		],
	},
	{
		id: "structure",
		title: "公式结构",
		items: [
			{ label: "求和", symbol: "∑", snippet: "\\sum_{i=1}^{n} $CURSOR" },
			{ label: "连乘", symbol: "∏", snippet: "\\prod_{i=1}^{n} $CURSOR" },
			{
				label: "积分",
				symbol: "∫",
				snippet: "\\int_{a}^{b} $CURSOR \\, dx",
			},
			{
				label: "二重积分",
				symbol: "∬",
				snippet: "\\iint_{D} $CURSOR \\, dA",
			},
			{ label: "极限", symbol: "lim", snippet: "\\lim_{x \\to $CURSOR}" },
			{
				label: "向量",
				symbol: "a⃗",
				snippet: "\\vec{$SEL}",
				placeholder: "a",
			},
			{
				label: "矩阵",
				symbol: "[ ]",
				snippet:
					"\\begin{pmatrix}\n$CURSOR & \\\\\n & \n\\end{pmatrix}",
				block: true,
			},
			{
				label: "行列式",
				symbol: "| |",
				snippet:
					"\\begin{vmatrix}\n$CURSOR & \\\\\n & \n\\end{vmatrix}",
				block: true,
			},
			{
				label: "增广矩阵",
				symbol: "[|]",
				snippet:
					"\\left(\\begin{array}{cc|c}\n$CURSOR & & \\\\\n & & \n\\end{array}\\right)",
				block: true,
			},
			{
				label: "分段函数",
				symbol: "{",
				snippet: "\\begin{cases}\n$CURSOR \\\\\n\\end{cases}",
				block: true,
			},
			{
				label: "对齐环境",
				symbol: "≡",
				snippet: "\\begin{aligned}\n$CURSOR\n\\end{aligned}",
				block: true,
			},
			{
				label: "方程组",
				symbol: "eq",
				snippet:
					"\\begin{cases}\nx + y = 1 \\\\\n$CURSOR\n\\end{cases}",
				block: true,
			},
		],
	},
	{
		id: "greek",
		title: "希腊字母",
		items: [
			{ label: "α", symbol: "α", snippet: "\\alpha" },
			{ label: "β", symbol: "β", snippet: "\\beta" },
			{ label: "γ", symbol: "γ", snippet: "\\gamma" },
			{ label: "δ", symbol: "δ", snippet: "\\delta" },
			{ label: "ε", symbol: "ε", snippet: "\\varepsilon" },
			{ label: "ζ", symbol: "ζ", snippet: "\\zeta" },
			{ label: "η", symbol: "η", snippet: "\\eta" },
			{ label: "θ", symbol: "θ", snippet: "\\theta" },
			{ label: "ι", symbol: "ι", snippet: "\\iota" },
			{ label: "κ", symbol: "κ", snippet: "\\kappa" },
			{ label: "λ", symbol: "λ", snippet: "\\lambda" },
			{ label: "μ", symbol: "μ", snippet: "\\mu" },
			{ label: "ν", symbol: "ν", snippet: "\\nu" },
			{ label: "ξ", symbol: "ξ", snippet: "\\xi" },
			{ label: "π", symbol: "π", snippet: "\\pi" },
			{ label: "ρ", symbol: "ρ", snippet: "\\rho" },
			{ label: "σ", symbol: "σ", snippet: "\\sigma" },
			{ label: "τ", symbol: "τ", snippet: "\\tau" },
			{ label: "φ", symbol: "φ", snippet: "\\varphi" },
			{ label: "χ", symbol: "χ", snippet: "\\chi" },
			{ label: "ψ", symbol: "ψ", snippet: "\\psi" },
			{ label: "ω", symbol: "ω", snippet: "\\omega" },
			{ label: "Γ", symbol: "Γ", snippet: "\\Gamma" },
			{ label: "Δ", symbol: "Δ", snippet: "\\Delta" },
			{ label: "Θ", symbol: "Θ", snippet: "\\Theta" },
			{ label: "Λ", symbol: "Λ", snippet: "\\Lambda" },
			{ label: "Ξ", symbol: "Ξ", snippet: "\\Xi" },
			{ label: "Π", symbol: "Π", snippet: "\\Pi" },
			{ label: "Σ", symbol: "Σ", snippet: "\\Sigma" },
			{ label: "Φ", symbol: "Φ", snippet: "\\Phi" },
			{ label: "Ψ", symbol: "Ψ", snippet: "\\Psi" },
			{ label: "Ω", symbol: "Ω", snippet: "\\Omega" },
		],
	},
	{
		id: "operators",
		title: "运算符",
		items: [
			{ label: "×", symbol: "×", snippet: "\\times" },
			{ label: "÷", symbol: "÷", snippet: "\\div" },
			{ label: "·", symbol: "·", snippet: "\\cdot" },
			{ label: "±", symbol: "±", snippet: "\\pm" },
			{ label: "∓", symbol: "∓", snippet: "\\mp" },
			{ label: "≤", symbol: "≤", snippet: "\\le" },
			{ label: "≥", symbol: "≥", snippet: "\\ge" },
			{ label: "≠", symbol: "≠", snippet: "\\ne" },
			{ label: "≈", symbol: "≈", snippet: "\\approx" },
			{ label: "≡", symbol: "≡", snippet: "\\equiv" },
			{ label: "∼", symbol: "∼", snippet: "\\sim" },
			{ label: "∞", symbol: "∞", snippet: "\\infty" },
			{ label: "∂", symbol: "∂", snippet: "\\partial" },
			{ label: "∇", symbol: "∇", snippet: "\\nabla" },
			{ label: "∈", symbol: "∈", snippet: "\\in" },
			{ label: "∉", symbol: "∉", snippet: "\\notin" },
			{ label: "⊂", symbol: "⊂", snippet: "\\subset" },
			{ label: "⊆", symbol: "⊆", snippet: "\\subseteq" },
			{ label: "∪", symbol: "∪", snippet: "\\cup" },
			{ label: "∩", symbol: "∩", snippet: "\\cap" },
			{ label: "∅", symbol: "∅", snippet: "\\varnothing" },
			{ label: "∀", symbol: "∀", snippet: "\\forall" },
			{ label: "∃", symbol: "∃", snippet: "\\exists" },
			{ label: "¬", symbol: "¬", snippet: "\\neg" },
			{ label: "∧", symbol: "∧", snippet: "\\land" },
			{ label: "∨", symbol: "∨", snippet: "\\lor" },
			{ label: "⇒", symbol: "⇒", snippet: "\\Rightarrow" },
			{ label: "⇔", symbol: "⇔", snippet: "\\Leftrightarrow" },
		],
	},
	{
		id: "arrows",
		title: "箭头",
		items: [
			{ label: "→", symbol: "→", snippet: "\\to" },
			{ label: "←", symbol: "←", snippet: "\\leftarrow" },
			{ label: "↔", symbol: "↔", snippet: "\\leftrightarrow" },
			{ label: "⇒", symbol: "⇒", snippet: "\\Rightarrow" },
			{ label: "⇐", symbol: "⇐", snippet: "\\Leftarrow" },
			{ label: "⇔", symbol: "⇔", snippet: "\\Leftrightarrow" },
			{ label: "↑", symbol: "↑", snippet: "\\uparrow" },
			{ label: "↓", symbol: "↓", snippet: "\\downarrow" },
			{ label: "↗", symbol: "↗", snippet: "\\nearrow" },
			{ label: "↘", symbol: "↘", snippet: "\\searrow" },
			{ label: "↦", symbol: "↦", snippet: "\\mapsto" },
			{ label: "⟶", symbol: "⟶", snippet: "\\longrightarrow" },
		],
	},
	{
		id: "calculus",
		title: "微积分",
		items: [
			{ label: "导数", symbol: "d/dx", snippet: "\\frac{d}{dx} $CURSOR" },
			{
				label: "偏导",
				symbol: "∂/∂x",
				snippet: "\\frac{\\partial}{\\partial x} $CURSOR",
			},
			{ label: "梯度", symbol: "∇", snippet: "\\nabla $CURSOR" },
			{ label: "散度", symbol: "div", snippet: "\\nabla \\cdot $CURSOR" },
			{ label: "旋度", symbol: "curl", snippet: "\\nabla \\times $CURSOR" },
			{ label: "拉普拉斯", symbol: "Δ", snippet: "\\nabla^2 $CURSOR" },
			{
				label: "定积分",
				symbol: "∫ᵃᵇ",
				snippet: "\\int_{a}^{b} $CURSOR \\, dx",
			},
			{
				label: "不定积分",
				symbol: "∫",
				snippet: "\\int $CURSOR \\, dx",
			},
			{
				label: "级数",
				symbol: "∞",
				snippet: "\\sum_{n=1}^{\\infty} $CURSOR",
			},
			{ label: "上极限", symbol: "limsup", snippet: "\\limsup_{n \\to \\infty} $CURSOR" },
			{ label: "下极限", symbol: "liminf", snippet: "\\liminf_{n \\to \\infty} $CURSOR" },
		],
	},
	{
		id: "accents",
		title: "重音与修饰",
		items: [
			{
				label: "向量",
				symbol: "a⃗",
				snippet: "\\vec{$SEL}",
				placeholder: "a",
			},
			{
				label: "横线",
				symbol: "a̅",
				snippet: "\\bar{$SEL}",
				placeholder: "a",
			},
			{
				label: "帽子",
				symbol: "â",
				snippet: "\\hat{$SEL}",
				placeholder: "a",
			},
			{
				label: "点",
				symbol: "ȧ",
				snippet: "\\dot{$SEL}",
				placeholder: "a",
			},
			{
				label: "双点",
				symbol: "ä",
				snippet: "\\ddot{$SEL}",
				placeholder: "a",
			},
			{
				label: "波浪",
				symbol: "ã",
				snippet: "\\tilde{$SEL}",
				placeholder: "a",
			},
			{
				label: "上划线",
				symbol: "‾",
				snippet: "\\overline{$SEL}",
				placeholder: "a",
			},
			{
				label: "下划线",
				symbol: "_",
				snippet: "\\underline{$SEL}",
				placeholder: "a",
			},
			{
				label: "上括号",
				symbol: "⏞",
				snippet: "\\overbrace{$SEL}",
				placeholder: "a",
			},
			{
				label: "下括号",
				symbol: "⏟",
				snippet: "\\underbrace{$SEL}",
				placeholder: "a",
			},
		],
	},
	{
		id: "brackets",
		title: "括号",
		items: [
			{
				label: "圆括号",
				symbol: "( )",
				snippet: "\\left($SEL\\right)",
				placeholder: "x",
			},
			{
				label: "方括号",
				symbol: "[ ]",
				snippet: "\\left[$SEL\\right]",
				placeholder: "x",
			},
			{
				label: "花括号",
				symbol: "{ }",
				snippet: "\\left\\{$SEL\\right\\}",
				placeholder: "x",
			},
			{
				label: "尖括号",
				symbol: "⟨ ⟩",
				snippet: "\\left\\langle $SEL\\right\\rangle",
				placeholder: "x",
			},
			{
				label: "范数",
				symbol: "‖ ‖",
				snippet: "\\left\\|$SEL\\right\\|",
				placeholder: "x",
			},
			{
				label: "取整",
				symbol: "⌊ ⌋",
				snippet: "\\left\\lfloor $SEL\\right\\rfloor",
				placeholder: "x",
			},
			{
				label: "上取整",
				symbol: "⌈ ⌉",
				snippet: "\\left\\lceil $SEL\\right\\rceil",
				placeholder: "x",
			},
		],
	},
	{
		id: "functions",
		title: "函数",
		items: [
			{ label: "正弦", symbol: "sin", snippet: "\\sin $CURSOR" },
			{ label: "余弦", symbol: "cos", snippet: "\\cos $CURSOR" },
			{ label: "正切", symbol: "tan", snippet: "\\tan $CURSOR" },
			{ label: "对数", symbol: "log", snippet: "\\log_{$CURSOR}" },
			{ label: "自然对数", symbol: "ln", snippet: "\\ln $CURSOR" },
			{ label: "指数", symbol: "exp", snippet: "\\exp $CURSOR" },
			{ label: "最大值", symbol: "max", snippet: "\\max_{$CURSOR}" },
			{ label: "最小值", symbol: "min", snippet: "\\min_{$CURSOR}" },
			{ label: "最大公约数", symbol: "gcd", snippet: "\\gcd($CURSOR)" },
			{ label: "行列式", symbol: "det", snippet: "\\det($CURSOR)" },
			{ label: "取模", symbol: "mod", snippet: "\\bmod $CURSOR" },
		],
	},
	{
		id: "font",
		title: "字体",
		items: [
			{
				label: "黑板粗体",
				symbol: "ℝ",
				snippet: "\\mathbb{$SEL}",
				placeholder: "R",
			},
			{
				label: "花体",
				symbol: "ℱ",
				snippet: "\\mathcal{$SEL}",
				placeholder: "F",
			},
			{
				label: "粗体",
				symbol: "𝐱",
				snippet: "\\mathbf{$SEL}",
				placeholder: "x",
			},
			{
				label: "斜体",
				symbol: "𝑥",
				snippet: "\\mathit{$SEL}",
				placeholder: "x",
			},
			{
				label: "正体",
				symbol: "x",
				snippet: "\\mathrm{$SEL}",
				placeholder: "x",
			},
			{
				label: "文本",
				symbol: "text",
				snippet: "\\text{$SEL}",
				placeholder: "text",
			},
			{
				label: "无衬线",
				symbol: "𝗑",
				snippet: "\\mathsf{$SEL}",
				placeholder: "x",
			},
			{
				label: "等宽",
				symbol: "𝚡",
				snippet: "\\mathtt{$SEL}",
				placeholder: "x",
			},
		],
	},
	{
		id: "spacing",
		title: "间距与排版",
		items: [
			{ label: "小空格", symbol: "␣", snippet: "\\," },
			{ label: "中空格", symbol: "␣␣", snippet: "\\:" },
			{ label: "大空格", symbol: "␣␣␣", snippet: "\\;" },
			{ label: "负空格", symbol: "⌫", snippet: "\\!" },
			{ label: "全角空格", symbol: "⇥", snippet: "\\quad" },
			{ label: "双全角空格", symbol: "⇥⇥", snippet: "\\qquad" },
			{ label: "换行", symbol: "↵", snippet: "\\\\" },
			{ label: "对齐", symbol: "&", snippet: "&" },
			{ label: "显示上下限", symbol: "lim", snippet: "\\limits" },
			{ label: "取消上下限", symbol: "lim", snippet: "\\nolimits" },
		],
	},
	{
		id: "misc",
		title: "其他符号",
		items: [
			{ label: "无穷", symbol: "∞", snippet: "\\infty" },
			{ label: "空集", symbol: "∅", snippet: "\\varnothing" },
			{ label: "角", symbol: "∠", snippet: "\\angle" },
			{ label: "度", symbol: "°", snippet: "^{\\circ}" },
			{ label: "撇", symbol: "′", snippet: "^{\\prime}" },
			{ label: "省略号", symbol: "…", snippet: "\\dots" },
			{ label: "居中省略号", symbol: "⋯", snippet: "\\cdots" },
			{ label: "竖省略号", symbol: "⋮", snippet: "\\vdots" },
			{ label: "斜省略号", symbol: "⋱", snippet: "\\ddots" },
			{ label: "所以", symbol: "∴", snippet: "\\therefore" },
			{ label: "因为", symbol: "∵", snippet: "\\because" },
			{ label: "约化普朗克常数", symbol: "ℏ", snippet: "\\hbar" },
			{ label: "脚本 l", symbol: "ℓ", snippet: "\\ell" },
			{ label: "实部", symbol: "ℜ", snippet: "\\Re" },
			{ label: "虚部", symbol: "ℑ", snippet: "\\Im" },
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

function toggleLatexHelper() {
	if (latexOpen.value) {
		closeLatexHelper();
		return;
	}
	openLatexHelper();
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

function syncLatexSelection() {
	const el = editorEl.value;
	if (!el) return;
	const length = draft.value.length;
	latexSelection.value = {
		start: Math.min(el.selectionStart ?? length, length),
		end: Math.min(el.selectionEnd ?? length, length),
	};
}

function selectLatexGroup(id) {
	activeLatexGroup.value = id;
	latexQuery.value = "";
}

function insertLatexSnippet(item) {
	const snippet = String(item.snippet || "");
	const placeholder = item.placeholder || "x";
	const el = editorEl.value;
	const length = draft.value.length;
	const start = el
		? Math.min(el.selectionStart ?? length, length)
		: Math.min(latexSelection.value.start, length);
	const end = el
		? Math.min(el.selectionEnd ?? length, length)
		: Math.min(Math.max(latexSelection.value.end, start), length);
	const selected = draft.value.slice(start, end);
	const body = selected || placeholder;
	const mode = mathModeAt(draft.value, start);
	const focusAt = (selectStart, selectEnd) => {
		latexSelection.value = { start: selectStart, end: selectEnd };
		nextTick(() => {
			const editor = editorEl.value;
			if (!editor) return;
			editor.focus();
			editor.setSelectionRange(selectStart, selectEnd);
		});
	};
	if (item.template && mode) {
		draft.value =
			draft.value.slice(0, start) + body + draft.value.slice(end);
		focusAt(start + body.length, start + body.length);
		return;
	}
	const marker = "\u0000SEL\u0000";
	let inserted = snippet.replaceAll("$SEL", marker);
	if (item.wrap !== false) {
		const wrapped = wrapLatexSnippet(
			inserted,
			mode,
			Boolean(item.block),
		);
		if (wrapped !== inserted) {
			const before = draft.value[start - 1] || "";
			const after = draft.value[end] || "";
			inserted = `${before === "$" ? " " : ""}${wrapped}${after === "$" ? " " : ""}`;
		} else {
			inserted = wrapped;
		}
	}
	const markerIndex = inserted.indexOf(marker);
	inserted = inserted.replace(marker, body);
	const cursorIndex = inserted.indexOf("$CURSOR");
	let selectStart = start + inserted.length;
	let selectEnd = selectStart;
	if (cursorIndex >= 0) {
		inserted = inserted.replace("$CURSOR", "");
		selectStart = selectEnd = start + cursorIndex;
	} else if (markerIndex >= 0 && !selected) {
		selectStart = start + markerIndex;
		selectEnd = selectStart + body.length;
	}
	draft.value =
		draft.value.slice(0, start) + inserted + draft.value.slice(end);
	focusAt(selectStart, selectEnd);
}

function closeLatexHelper() {
	latexOpen.value = false;
	latexQuery.value = "";
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
const groupInfoOpen = ref(false);
const groupFriends = ref([]);
const groupFriendsLoading = ref(false);
const groupAddBusy = ref("");
const groupActionError = ref("");

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

const groupInviteLink = computed(() => {
	if (!isGroup.value || !options.value.id || !options.value.key) {
		return "";
	}
	try {
		const target = router.resolve({
			name: "chat",
			query: {
				type: "g",
				id: options.value.id,
				key: options.value.key,
			},
		});
		return new URL(target.href, window.location.href).href;
	} catch (e) {
		return "";
	}
});
const groupMemberCount = computed(() =>
	groupMeta.value ? groupMeta.value.members.length : 0,
);
const groupInviteableFriends = computed(() => {
	if (!groupMeta.value) return [];
	const memberNames = new Set(
		groupMeta.value.members.map((member) => member.username),
	);
	return groupFriends.value.filter(
		(friend) => !memberNames.has(friend.username),
	);
});

const visibleMessages = computed(() =>
	allMessages.value.slice(visibleStart.value),
);
const canLoadMore = computed(() => visibleStart.value > 0);
const preview = computed(() => renderMarkdown(draft.value));
const latexFilteredGroups = computed(() => {
	const query = latexQuery.value.trim().toLowerCase();
	if (!query) {
		const group =
			latexGroups.find((item) => item.id === activeLatexGroup.value) ||
			latexGroups[0];
		return group ? [group] : [];
	}
	return latexGroups
		.map((group) => ({
			...group,
			items: group.items.filter((item) =>
				[item.label, item.symbol, item.snippet].some((value) =>
					String(value || "").toLowerCase().includes(query),
				),
			),
		}))
		.filter((group) => group.items.length);
});
const latexMode = computed(() =>
	latexOpen.value
		? mathModeAt(draft.value, latexSelection.value.start)
		: null,
);
const latexModeHint = computed(() => {
	if (latexMode.value === "inline") {
		return t("当前在行内公式中，点击直接插入");
	}
	if (latexMode.value === "display") {
		return t("当前在块公式中，点击直接插入");
	}
	return t("当前不在公式中，点击会自动补全 $");
});
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
	if (message.recalled || message.type === "nudge") {
		closeMessageMenu();
		return;
	}
	const items = [
		{ key: "copy", label: t("复制") },
		{ key: "quote", label: t("引用") },
	];
	if (
		auth.session &&
		message.user &&
		message.user !== auth.session.username &&
		!/^Guest_/i.test(message.user)
	) {
		items.push({ key: "friend", label: t("加好友") });
		items.push({ key: "nudge", label: t("拍一拍") });
	}
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
	} else if (key === "friend") {
		addFriendFromMessage(message);
	} else if (key === "nudge") {
		nudgeMessage(message);
	}
}

async function nudgeMessage(message) {
	if (!auth.session) return;
	try {
		const suffix = await fetchNudgeSuffix(message.user);
		const nudge = createNudgeMessage(
			{
				username: auth.session.username,
				name: chatName.value,
			},
			{ username: message.user, name: message.name },
			suffix,
		);
		const messages = await sendChannelMessage(options.value, nudge);
		allMessages.value = messages;
		visibleStart.value = Math.max(0, messages.length - PAGE_SIZE);
		await nextTick();
		scrollToBottom("smooth");
		showToast(
			t("已拍一拍 {name}", { name: message.name || message.user }),
			"success",
		);
	} catch (error) {
		showToast(
			error && error.message ? error.message : String(error),
			"error",
			4000,
		);
	}
}

async function addFriendFromMessage(message) {
	if (!auth.session) return;
	try {
		await addFriend(
			{
				username: auth.session.username,
				name: chatName.value,
			},
			message.user,
			message.name,
		);
		showToast(t("已添加好友"), "success");
	} catch (error) {
		showToast(
			error && error.message ? error.message : String(error),
			"error",
			4000,
		);
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
				isGroup.value
					? t("群组缺少 id 或邀请凭证，请重新打开邀请链接")
					: t("私密频道缺少 id 或凭证，请从首页重新进入"),
			);
		}
		const result = await readChannel(options.value);
		if (isGroup.value) {
			const joined = await joinGroup(options.value, {
				name: identity.value.name,
				displayName: chatName.value,
				type: identity.value.type,
			});
			groupMeta.value = joined.meta;
			if (joined.joined) {
				showToast(
					t("已加入群组“{name}”", {
						name: joined.meta.name,
					}),
					"success",
				);
			}
		}
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
		if (isGroup.value) {
			await removeGroupFromIndex(
				identity.value.name,
				options.value.id,
			).catch(() => {});
		}
		deleteOpen.value = false;
		showToast(
			isGroup.value ? t("群组已删除") : t("频道已删除"),
			"success",
		);
		router.push({ name: "home" });
	} catch (e) {
		deleteError.value = e && e.message ? e.message : String(e);
	} finally {
		deleteBusy.value = false;
	}
}

async function openGroupInfo() {
	if (!isGroup.value) return;
	groupInfoOpen.value = true;
	groupActionError.value = "";
	groupFriendsLoading.value = true;
	try {
		groupMeta.value = await loadGroupMeta(options.value);
		if (auth.session) {
			groupFriends.value = await loadFriends(auth.session.username);
		} else {
			groupFriends.value = [];
		}
	} catch (e) {
		groupActionError.value = e && e.message ? e.message : String(e);
	} finally {
		groupFriendsLoading.value = false;
	}
}

async function copyGroupInvite() {
	const link = groupInviteLink.value;
	if (!link) return;
	const ok = await copyText(link);
	showToast(
		ok ? t("邀请链接已复制") : t("复制失败，请手动复制"),
		ok ? "success" : "error",
	);
}

async function inviteFriendToGroup(friend) {
	if (!friend || groupAddBusy.value) return;
	groupAddBusy.value = friend.username;
	groupActionError.value = "";
	try {
		const result = await addGroupMember(options.value, friend);
		groupMeta.value = result.meta;
		const link = groupInviteLink.value;
		if (result.added && auth.session && link) {
			await sendFriendMessage(
				{
					username: auth.session.username,
					name: chatName.value,
				},
				friend.username,
				t("邀请你加入群组「{name}」：{link}", {
					name: result.meta.name,
					link,
				}),
			).catch((error) => {
				console.warn("发送群组邀请私信失败：", error);
			});
		}
		showToast(
			result.added
				? t("已邀请 {name} 加入群组", { name: friend.name })
				: t("{name} 已经在群组里了", { name: friend.name }),
			"success",
		);
	} catch (e) {
		groupActionError.value = e && e.message ? e.message : String(e);
	} finally {
		groupAddBusy.value = "";
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
		groupMeta.value = null;
		groupInfoOpen.value = false;
		groupFriends.value = [];
		groupActionError.value = "";
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
					<button
						v-if="isGroup"
						type="button"
						class="ghost-button chat-group-toggle"
						:title="t('群组信息')"
						@click="openGroupInfo"
					>
						{{ t("群组") }}
					</button>
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
				<section
					v-if="latexOpen"
					class="latex-panel"
					:aria-label="t('LaTeX 辅助编辑')"
				>
					<header class="latex-panel-head">
						<div class="latex-panel-title">
							<strong>{{ t("LaTeX 辅助编辑") }}</strong>
							<span>{{ t("公式外自动补全 $，块公式使用 $$") }}</span>
						</div>
						<div class="latex-panel-tools">
							<input
								v-model="latexQuery"
								class="latex-search"
								type="search"
								:placeholder="t('搜索符号或命令')"
								:aria-label="t('搜索符号或命令')"
							/>
							<button
								type="button"
								class="latex-panel-close"
								:title="t('收起')"
								:aria-label="t('收起')"
								@click="closeLatexHelper"
							>
								×
							</button>
						</div>
					</header>
					<nav class="latex-tabs" :aria-label="t('公式分类')">
						<button
							v-for="group in latexGroups"
							:key="group.id"
							type="button"
							class="latex-tab"
							:class="{
								active:
									group.id === activeLatexGroup &&
									!latexQuery.trim(),
							}"
							@click="selectLatexGroup(group.id)"
						>
							{{ t(group.title) }}
						</button>
					</nav>
					<div class="latex-panel-body">
						<div
							v-if="!latexFilteredGroups.length"
							class="latex-empty"
						>
							{{ t("没有匹配的公式") }}
						</div>
						<section
							v-for="group in latexFilteredGroups"
							:key="group.id"
							class="latex-group"
						>
							<h3
								v-if="latexQuery.trim()"
								class="latex-group-title"
							>
								{{ t(group.title) }}
							</h3>
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
					</div>
					<footer class="latex-panel-foot">
						<span
							class="latex-mode-hint"
							:class="{ inside: latexMode }"
						>
							{{ latexModeHint }}
						</span>
						<button
							type="button"
							class="primary-button latex-done"
							@click="closeLatexHelper"
						>
							{{ t("完成") }}
						</button>
					</footer>
				</section>
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
							@select="syncLatexSelection"
							@keyup="syncLatexSelection"
							@click="syncLatexSelection"
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
						:class="{ active: latexOpen }"
						:title="t('LaTeX 辅助编辑')"
						:aria-expanded="latexOpen"
						@click="toggleLatexHelper"
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
							{{ isGroup ? t("删除群组") : t("删除频道") }}
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
			:open="groupInfoOpen"
			:title="t('群组信息')"
			width="580px"
			@close="groupInfoOpen = false"
		>
			<div class="group-info">
				<div class="group-info-head">
					<div>
						<strong class="group-info-name">
							{{ groupMeta ? groupMeta.name : t("加载中……") }}
						</strong>
						<span class="group-info-sub">
							#{{ options.id }} ·
							{{ t("{count} 位成员", { count: groupMemberCount }) }}
						</span>
					</div>
					<button
						type="button"
						class="ghost-button"
						@click="copyGroupInvite"
					>
						{{ t("复制邀请链接") }}
					</button>
				</div>

				<div class="modal-field group-invite-field">
					<label for="group-invite-link">{{ t("邀请链接") }}</label>
					<div class="group-invite-row">
						<input
							id="group-invite-link"
							:value="groupInviteLink"
							readonly
							@focus="$event.target.select()"
						/>
						<button
							type="button"
							class="primary-button"
							@click="copyGroupInvite"
						>
							{{ t("复制") }}
						</button>
					</div>
					<p class="group-hint">
						{{
							t(
								"其他人打开这个链接后会自动加入群组，并能在首页看到群组。",
							)
						}}
					</p>
				</div>

				<section class="group-section">
					<h3 class="group-section-title">
						{{ t("成员（{count}）", { count: groupMemberCount }) }}
					</h3>
					<div v-if="groupMeta" class="group-members">
						<div
							v-for="member in groupMeta.members"
							:key="member.username"
							class="group-member"
						>
							<span class="group-member-avatar">
								{{ member.name.charAt(0) }}
							</span>
							<span class="group-member-main">
								<span class="group-member-name">
									{{ member.name }}
								</span>
								<span class="group-member-sub">
									@{{ member.username }}
								</span>
							</span>
							<span
								v-if="member.role === 'owner'"
								class="group-owner-badge"
							>
								{{ t("群主") }}
							</span>
						</div>
					</div>
					<div v-else class="group-hint">
						{{ t("正在读取群组成员……") }}
					</div>
				</section>

				<section class="group-section">
					<h3 class="group-section-title">{{ t("邀请好友") }}</h3>
					<p v-if="!auth.session" class="group-hint">
						{{ t("登录后才能邀请好友进群。") }}
					</p>
					<div v-else-if="groupFriendsLoading" class="group-hint">
						{{ t("好友加载中……") }}
					</div>
					<div
						v-else-if="!groupInviteableFriends.length"
						class="group-hint"
					>
						{{ t("没有可邀请的好友。") }}
					</div>
					<div v-else class="group-friends">
						<div
							v-for="friend in groupInviteableFriends"
							:key="friend.username"
							class="group-friend"
						>
							<span class="group-friend-main">
								<span class="group-member-name">
									{{ friend.name }}
								</span>
								<span class="group-member-sub">
									@{{ friend.username }}
								</span>
							</span>
							<button
								type="button"
								class="ghost-button"
								:disabled="groupAddBusy === friend.username"
								@click="inviteFriendToGroup(friend)"
							>
								{{
									groupAddBusy === friend.username
										? t("邀请中……")
										: t("邀请")
								}}
							</button>
						</div>
					</div>
				</section>

				<div v-if="groupActionError" class="group-error">
					{{ groupActionError }}
				</div>
			</div>
		</Modal>

		<Modal
			:open="deleteOpen"
			:title="isGroup ? t('删除群组') : t('删除频道')"
			@close="deleteOpen = false"
		>
			<p class="chat-delete-note">
				{{
					isGroup
						? t(
								"删除后会写入 deleted 标记，群组将无法继续进入。只有群主可以操作。",
							)
						: t(
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
