<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
	auth,
	authDisplayName,
	login as authLogin,
	logout as authLogout,
	register as authRegister,
} from "../services/auth.js";
import { showToast } from "../lib/toast.js";
import "../styles/login.css";

const route = useRoute();
const router = useRouter();

const mode = ref(route.query.mode === "register" ? "register" : "login");
const username = ref("");
const password = ref("");
const confirm = ref("");
const busy = ref(false);
const error = ref("");

const redirectTarget = computed(() => {
	const target = route.query.redirect;
	if (typeof target === "string" && target.startsWith("/")) return target;
	return "/";
});

function switchMode(next) {
	if (busy.value) return;
	mode.value = next;
	error.value = "";
	password.value = "";
	confirm.value = "";
}

function goBack() {
	if (window.history.length > 1) router.back();
	else router.replace("/");
}

async function submitLogin() {
	if (busy.value) return;
	error.value = "";
	const name = username.value.trim();
	if (!name) {
		error.value = "请输入用户名";
		return;
	}
	if (!password.value) {
		error.value = "请输入密码";
		return;
	}
	busy.value = true;
	try {
		await authLogin(name, password.value);
		showToast("登录成功", "success");
		router.replace(redirectTarget.value);
	} catch (e) {
		error.value = e && e.message ? e.message : String(e);
	} finally {
		busy.value = false;
	}
}

async function submitRegister() {
	if (busy.value) return;
	error.value = "";
	const name = username.value.trim();
	if (!name) {
		error.value = "请输入用户名";
		return;
	}
	if (password.value.length < 6) {
		error.value = "密码至少需要 6 位";
		return;
	}
	if (password.value !== confirm.value) {
		error.value = "两次输入的密码不一致";
		return;
	}
	busy.value = true;
	try {
		await authRegister(name, password.value);
		showToast("注册成功，已自动登录", "success");
		router.replace(redirectTarget.value);
	} catch (e) {
		error.value = e && e.message ? e.message : String(e);
	} finally {
		busy.value = false;
	}
}

function doLogout() {
	authLogout();
	showToast("已退出登录", "success");
	error.value = "";
	password.value = "";
	confirm.value = "";
}

function continueAsGuest() {
	router.push("/");
}
</script>

<template>
	<div class="login-page">
		<div class="login-card">
			<div class="login-brand">
				<h1>zyc2024 的聊天网页</h1>
				<span v-if="!auth.session">登录可选</span>
			</div>

			<template v-if="auth.session">
				<p class="login-tip">
					你已经登录。登录只会用于记住昵称与账号资料，聊天、创建频道和上传文件都不需要登录。
				</p>
				<div class="account-box">
					<div class="account-row">
						<div class="account-avatar">
							{{ (authDisplayName || "?").charAt(0) }}
						</div>
						<div class="account-meta">
							<div class="account-name">{{ authDisplayName }}</div>
							<div class="account-id">账号：{{ auth.session.username }}</div>
						</div>
					</div>
					<div class="account-actions">
						<router-link
							class="ghost-button"
							:to="{
								name: 'user',
								query: { u: auth.session.username },
							}"
						>
							我的主页
						</router-link>
						<router-link
							class="ghost-button"
							:to="{ name: 'edit-profile' }"
						>
							编辑资料
						</router-link>
						<button type="button" class="danger-button" @click="doLogout">
							退出登录
						</button>
					</div>
				</div>
			</template>

			<template v-else>
				<p class="login-tip">
					不登录也可以使用全部聊天功能。未登录时会自动分配与设备信息绑定的游客用户名
					Guest_&lt;HASH&gt;；登录后会使用你的账号昵称发消息，并在本机记住 7 天。
				</p>

				<div class="login-tabs">
					<button
						type="button"
						:class="{ active: mode === 'login' }"
						@click="switchMode('login')"
					>
						登录
					</button>
					<button
						type="button"
						:class="{ active: mode === 'register' }"
						@click="switchMode('register')"
					>
						注册
					</button>
				</div>

				<form
					v-if="mode === 'login'"
					class="login-form"
					@submit.prevent="submitLogin"
				>
					<div class="field">
						<label for="login-username">用户名</label>
						<input
							id="login-username"
							v-model="username"
							type="text"
							maxlength="32"
							autocomplete="username"
							placeholder="请输入用户名"
						/>
					</div>
					<div class="field">
						<label for="login-password">密码</label>
						<input
							id="login-password"
							v-model="password"
							type="password"
							autocomplete="current-password"
							placeholder="请输入密码"
						/>
					</div>
					<div class="login-error">{{ error }}</div>
					<button class="login-submit" type="submit" :disabled="busy">
						{{ busy ? "登录中……" : "登录" }}
					</button>
				</form>

				<form
					v-else
					class="login-form"
					@submit.prevent="submitRegister"
				>
					<div class="field">
						<label for="reg-username">用户名</label>
						<input
							id="reg-username"
							v-model="username"
							type="text"
							maxlength="32"
							autocomplete="username"
							placeholder="中英文、数字和 _-.，最多 32 位"
						/>
					</div>
					<div class="field">
						<label for="reg-password">密码</label>
						<input
							id="reg-password"
							v-model="password"
							type="password"
							autocomplete="new-password"
							placeholder="至少 6 位"
						/>
					</div>
					<div class="field">
						<label for="reg-confirm">确认密码</label>
						<input
							id="reg-confirm"
							v-model="confirm"
							type="password"
							autocomplete="new-password"
							placeholder="请再次输入密码"
						/>
					</div>
					<div class="login-error">{{ error }}</div>
					<button class="login-submit" type="submit" :disabled="busy">
						{{ busy ? "注册中……" : "注册并登录" }}
					</button>
				</form>

				<div class="login-foot">
					<button type="button" class="link" @click="continueAsGuest">
						不登录，以游客身份继续 →
					</button>
					<button type="button" class="link" @click="goBack">返回上一页</button>
				</div>
			</template>
		</div>
	</div>
</template>
