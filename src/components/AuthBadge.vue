<script setup>
import { useRouter } from "vue-router";
import { auth, authDisplayName, logout } from "../services/auth.js";
import { showToast } from "../lib/toast.js";

const router = useRouter();

function goLogin() {
	router.push({ name: "login" });
}

function doLogout() {
	logout();
	showToast("已退出登录，现在是游客模式", "success");
}
</script>

<template>
	<div class="auth-badge">
		<template v-if="auth.session">
			<router-link
				class="auth-badge-name"
				:to="{ name: 'user', query: { u: auth.session.username } }"
				:title="'查看 ' + auth.session.username + ' 的个人主页'"
			>
				已登录：{{ authDisplayName }}
			</router-link>
			<button type="button" class="mini-button" @click="doLogout">退出</button>
		</template>
		<template v-else>
			<span class="auth-badge-name guest">游客模式（无需登录）</span>
			<button type="button" class="mini-button primary" @click="goLogin">
				登录
			</button>
		</template>
	</div>
</template>
