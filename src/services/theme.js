import { ref } from "vue";

const THEME_STORAGE_KEY = "chat_theme_v1";
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export const DEFAULT_THEME = {
	version: 1,
	name: "默认绿",
	accent: "#04783e",
	pageBackground: "#eef2ef",
	surface: "#ffffff",
	text: "#1d2b23",
	muted: "#69736d",
	border: "#e5eae7",
	chatBackground: "#fbfcfb",
	messageBackground: "#ffffff",
	backgroundImage: "",
	backgroundOverlay: 0.22,
};

function preset(id, name, colors) {
	return {
		id,
		name,
		theme: normalizeTheme({ ...DEFAULT_THEME, ...colors, name }),
	};
}

export const THEME_PRESETS = [
	preset("default", "默认绿", {}),
	preset("forest", "森林绿", {
		accent: "#15803d",
		pageBackground: "#f0fdf4",
		text: "#14532d",
		muted: "#6b7280",
		border: "#dcfce7",
		chatBackground: "#f7fef9",
	}),
	preset("ocean", "海洋蓝", {
		accent: "#2563eb",
		pageBackground: "#eff6ff",
		text: "#172554",
		muted: "#64748b",
		border: "#dbeafe",
		chatBackground: "#f8fbff",
	}),
	preset("sakura", "樱花粉", {
		accent: "#db2777",
		pageBackground: "#fdf2f8",
		text: "#500724",
		muted: "#9d6b84",
		border: "#fce7f3",
		chatBackground: "#fff7fb",
	}),
	preset("sunset", "暖阳橙", {
		accent: "#d97706",
		pageBackground: "#fff7ed",
		text: "#431407",
		muted: "#9a6b3f",
		border: "#fed7aa",
		chatBackground: "#fffbf5",
	}),
	preset("lavender", "薰衣草", {
		accent: "#7c3aed",
		pageBackground: "#f5f3ff",
		text: "#2e1065",
		muted: "#6b7280",
		border: "#ede9fe",
		chatBackground: "#faf8ff",
	}),
];

function normalizeColor(value, fallback) {
	const text = String(value || "").trim();
	if (HEX_COLOR.test(text)) return text.toLowerCase();
	if (/^#[0-9a-f]{3}$/i.test(text)) {
		return `#${text
			.slice(1)
			.split("")
			.map((char) => char + char)
			.join("")}`.toLowerCase();
	}
	return fallback;
}

function hexToRgb(hex) {
	const normalized = normalizeColor(hex, "#000000").slice(1);
	return {
		r: parseInt(normalized.slice(0, 2), 16),
		g: parseInt(normalized.slice(2, 4), 16),
		b: parseInt(normalized.slice(4, 6), 16),
	};
}

function rgba(hex, alpha) {
	const { r, g, b } = hexToRgb(hex);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function normalizeImage(value) {
	const text = String(value || "").trim();
	if (!text) return "";
	if (!/^https?:\/\//i.test(text)) return "";
	if (/["\\\n\r]/.test(text)) return "";
	return text.slice(0, 2000);
}

export function normalizeTheme(input) {
	const source = input && typeof input === "object" ? input : {};
	const overlay = Number(source.backgroundOverlay);
	return {
		version: 1,
		name: String(source.name || DEFAULT_THEME.name).trim().slice(0, 40),
		accent: normalizeColor(source.accent, DEFAULT_THEME.accent),
		pageBackground: normalizeColor(
			source.pageBackground,
			DEFAULT_THEME.pageBackground,
		),
		surface: normalizeColor(source.surface, DEFAULT_THEME.surface),
		text: normalizeColor(source.text, DEFAULT_THEME.text),
		muted: normalizeColor(source.muted, DEFAULT_THEME.muted),
		border: normalizeColor(source.border, DEFAULT_THEME.border),
		chatBackground: normalizeColor(
			source.chatBackground,
			DEFAULT_THEME.chatBackground,
		),
		messageBackground: normalizeColor(
			source.messageBackground,
			DEFAULT_THEME.messageBackground,
		),
		backgroundImage: normalizeImage(source.backgroundImage),
		backgroundOverlay: Number.isFinite(overlay)
			? Math.min(0.85, Math.max(0, overlay))
			: DEFAULT_THEME.backgroundOverlay,
	};
}

function loadLocalTheme() {
	try {
		const raw = localStorage.getItem(THEME_STORAGE_KEY);
		if (!raw) return { ...DEFAULT_THEME };
		return normalizeTheme(JSON.parse(raw));
	} catch (e) {
		return { ...DEFAULT_THEME };
	}
}

export const currentTheme = ref(loadLocalTheme());

export function applyTheme(input) {
	const theme = normalizeTheme(input);
	if (typeof document === "undefined") return theme;
	const root = document.documentElement;
	root.style.setProperty("--theme-accent", theme.accent);
	root.style.setProperty("--theme-accent-soft", rgba(theme.accent, 0.1));
	root.style.setProperty("--theme-accent-border", rgba(theme.accent, 0.28));
	root.style.setProperty("--theme-page-bg", theme.pageBackground);
	root.style.setProperty("--theme-surface", theme.surface);
	root.style.setProperty("--theme-text", theme.text);
	root.style.setProperty("--theme-muted", theme.muted);
	root.style.setProperty("--theme-border", theme.border);
	root.style.setProperty("--theme-chat-bg", theme.chatBackground);
	root.style.setProperty("--theme-message-bg", theme.messageBackground);
	root.style.setProperty(
		"--theme-page-image",
		theme.backgroundImage ? `url("${theme.backgroundImage}")` : "none",
	);
	root.style.setProperty(
		"--theme-overlay",
		rgba(theme.pageBackground, theme.backgroundOverlay),
	);
	document.body.classList.toggle(
		"theme-has-image",
		!!theme.backgroundImage,
	);
	return theme;
}

export function saveThemeLocal(input) {
	const theme = normalizeTheme(input);
	currentTheme.value = theme;
	try {
		localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
	} catch (e) {
		// localStorage 不可用时仍保留内存主题
	}
	applyTheme(theme);
	return theme;
}

export function resetThemeLocal() {
	return saveThemeLocal(DEFAULT_THEME);
}

export { THEME_STORAGE_KEY };
