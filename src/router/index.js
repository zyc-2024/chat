import { watch } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { locale, t } from "../i18n/index.js";

const router = createRouter({
	history: createWebHashHistory(),
	routes: [
		{
			path: "/",
			name: "home",
			meta: { title: "主页" },
			component: () => import("../views/HomeView.vue"),
		},
		{
			path: "/login",
			name: "login",
			meta: { title: "登录" },
			component: () => import("../views/LoginView.vue"),
		},
		{
			path: "/chat",
			name: "chat",
			meta: { title: "聊天" },
			component: () => import("../views/ChatView.vue"),
		},
		{
			path: "/create",
			name: "create",
			meta: { title: "创建频道" },
			component: () => import("../views/CreateView.vue"),
		},
		{
			path: "/upload",
			name: "upload",
			meta: { title: "上传文件" },
			component: () => import("../views/UploadView.vue"),
		},
		{
			path: "/upload/base64",
			name: "upload-base64",
			meta: { title: "上传 Base64" },
			component: () => import("../views/UploadBase64View.vue"),
		},
		{
			path: "/user",
			name: "user",
			meta: { title: "个人主页" },
			component: () => import("../views/UserView.vue"),
		},
		{
			path: "/edit",
			name: "edit-profile",
			meta: { title: "编辑个人资料" },
			component: () => import("../views/EditProfileView.vue"),
		},
		{
			path: "/changelog",
			name: "changelog",
			meta: { title: "更新日志" },
			component: () => import("../views/ChangelogView.vue"),
		},
		{
			path: "/settings",
			name: "settings",
			meta: { title: "个性设置" },
			component: () => import("../views/SettingsView.vue"),
		},
		{
			path: "/themes",
			name: "theme-store",
			meta: { title: "主题商店" },
			component: () => import("../views/ThemeStoreView.vue"),
		},
		{
			path: "/friends",
			name: "friends",
			meta: { title: "好友" },
			component: () => import("../views/FriendsView.vue"),
		},
		{
			path: "/:pathMatch(.*)*",
			name: "not-found",
			meta: { title: "404" },
			component: () => import("../views/NotFoundView.vue"),
		},
	],
	scrollBehavior() {
		return { top: 0 };
	},
});

function updateDocumentTitle(route) {
	const title = route && route.meta && route.meta.title;
	const appTitle = t("zyc2024 的聊天网页");
	document.title = title ? `${t(title)} · ${appTitle}` : appTitle;
}

router.afterEach(updateDocumentTitle);
watch(locale, () => updateDocumentTitle(router.currentRoute.value));

export default router;
