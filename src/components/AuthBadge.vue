<script setup>
import { useRouter } from "vue-router";
import {
	auth,
	authDisplayName,
	logout,
	setCookie,
} from "../services/auth.js";
import { guestUsername } from "../lib/identity.js";
import { showToast } from "../lib/toast.js";

const router = useRouter();

function goLogin() {
	router.push({ name: "login" });
}

function doLogout() {
	logout();
	setCookie("n", guestUsername.value);
	showToast("已退出账号，已自动切换为游客身份", "success");
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
			<span
				class="auth-badge-name guest"
				title="游客用户名由设备信息自动生成，没有对应的个人主页"
			>
				自动登录：{{ guestUsername }}
			</span>
			<button type="button" class="mini-button primary" @click="goLogin">
				账号登录
			</button>
		</template>
	</div>
</template>
