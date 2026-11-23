<script setup>
import { useRouter } from "vue-router";
import {
	auth,
	authDisplayName,
	logout,
	setCookie,
} from "../services/auth.js";
import { guestUsername } from "../lib/identity.js";
import { t } from "../i18n/index.js";
import { showToast } from "../lib/toast.js";

const router = useRouter();

function goLogin() {
	router.push({ name: "login" });
}

function doLogout() {
	logout();
	setCookie("n", guestUsername.value);
	showToast(t("已退出账号，已自动切换为游客身份"), "success");
}
</script>

<template>
	<div class="auth-badge">
		<template v-if="auth.session">
			<router-link
				class="auth-badge-name"
				:to="{ name: 'user', query: { u: auth.session.username } }"
				:title="
					t('查看 {user} 的个人主页', {
						user: auth.session.username,
					})
				"
			>
				{{ t("已登录：{name}", { name: authDisplayName }) }}
			</router-link>
			<button type="button" class="mini-button" @click="doLogout">
				{{ t("退出") }}
			</button>
		</template>
		<template v-else>
			<span
				class="auth-badge-name guest"
				:title="t('游客用户名由设备信息自动生成，没有对应的个人主页')"
			>
				{{ t("自动登录：{name}", { name: guestUsername }) }}
			</span>
			<button type="button" class="mini-button primary" @click="goLogin">
				{{ t("账号登录") }}
			</button>
		</template>
	</div>
</template>
