import { createRouter, createWebHashHistory } from "vue-router";

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

router.afterEach((to) => {
	const title = to.meta && to.meta.title;
	document.title = title
		? `${title} · zyc2024 的聊天网页`
		: "zyc2024 的聊天网页";
});

export default router;
