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
import LanguageSwitcher from "../components/LanguageSwitcher.vue";
import { t } from "../i18n/index.js";
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
		error.value = t("请输入用户名");
		return;
	}
	if (!password.value) {
		error.value = t("请输入密码");
		return;
	}
	busy.value = true;
	try {
		await authLogin(name, password.value);
		showToast(t("登录成功"), "success");
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
		error.value = t("请输入用户名");
		return;
	}
	if (password.value.length < 6) {
		error.value = t("密码至少需要 6 位");
		return;
	}
	if (password.value !== confirm.value) {
		error.value = t("两次输入的密码不一致");
		return;
	}
	busy.value = true;
	try {
		await authRegister(name, password.value);
		showToast(t("注册成功，已自动登录"), "success");
		router.replace(redirectTarget.value);
	} catch (e) {
		error.value = e && e.message ? e.message : String(e);
	} finally {
		busy.value = false;
	}
}

function doLogout() {
	authLogout();
	showToast(t("已退出登录"), "success");
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
				<div class="login-brand-main">
					<h1>{{ t("zyc2024 的聊天网页") }}</h1>
					<span v-if="!auth.session">{{ t("登录可选") }}</span>
				</div>
				<LanguageSwitcher />
			</div>

			<template v-if="auth.session">
				<p class="login-tip">
					{{
						t(
							"你已登录。账号仅用于保存昵称和个人资料，聊天、创建频道和上传文件无需登录。",
						)
					}}
				</p>
				<div class="account-box">
					<div class="account-row">
						<div class="account-avatar">
							{{ (authDisplayName || "?").charAt(0) }}
						</div>
						<div class="account-meta">
							<div class="account-name">{{ authDisplayName }}</div>
							<div class="account-id">
								{{
									t("账号：{username}", {
										username: auth.session.username,
									})
								}}
							</div>
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
							{{ t("我的主页") }}
						</router-link>
						<router-link
							class="ghost-button"
							:to="{ name: 'edit-profile' }"
						>
							{{ t("编辑资料") }}
						</router-link>
						<router-link
							class="ghost-button"
							:to="{ name: 'settings' }"
						>
							{{ t("个性设置") }}
						</router-link>
						<button type="button" class="danger-button" @click="doLogout">
							{{ t("退出登录") }}
						</button>
					</div>
				</div>
			</template>

			<template v-else>
				<p class="login-tip">
					{{
						t(
							"无需登录即可使用全部功能。系统会自动分配设备游客名 Guest_<HASH>；登录后将使用账号昵称，并在本机记住 7 天。",
						)
					}}
				</p>

				<div class="login-tabs">
					<button
						type="button"
						:class="{ active: mode === 'login' }"
						@click="switchMode('login')"
					>
						{{ t("登录") }}
					</button>
					<button
						type="button"
						:class="{ active: mode === 'register' }"
						@click="switchMode('register')"
					>
							{{ t("注册") }}
					</button>
				</div>

				<form
					v-if="mode === 'login'"
					class="login-form"
					@submit.prevent="submitLogin"
				>
					<div class="field">
						<label for="login-username">{{ t("用户名") }}</label>
						<input
							id="login-username"
							v-model="username"
							type="text"
							maxlength="32"
							autocomplete="username"
							:placeholder="t('请输入用户名')"
						/>
					</div>
					<div class="field">
						<label for="login-password">{{ t("密码") }}</label>
						<input
							id="login-password"
							v-model="password"
							type="password"
							autocomplete="current-password"
							:placeholder="t('请输入密码')"
						/>
					</div>
					<div class="login-error">{{ error }}</div>
					<button class="login-submit" type="submit" :disabled="busy">
						{{ busy ? t("登录中……") : t("登录") }}
					</button>
				</form>

				<form
					v-else
					class="login-form"
					@submit.prevent="submitRegister"
				>
					<div class="field">
						<label for="reg-username">{{ t("用户名") }}</label>
						<input
							id="reg-username"
							v-model="username"
							type="text"
							maxlength="32"
							autocomplete="username"
							:placeholder="t('中英文、数字和 _-.，最多 32 位')"
						/>
					</div>
					<div class="field">
						<label for="reg-password">{{ t("密码") }}</label>
						<input
							id="reg-password"
							v-model="password"
							type="password"
							autocomplete="new-password"
							:placeholder="t('至少 6 位')"
						/>
					</div>
					<div class="field">
						<label for="reg-confirm">{{ t("确认密码") }}</label>
						<input
							id="reg-confirm"
							v-model="confirm"
							type="password"
							autocomplete="new-password"
							:placeholder="t('请再次输入密码')"
						/>
					</div>
					<div class="login-error">{{ error }}</div>
					<button class="login-submit" type="submit" :disabled="busy">
						{{ busy ? t("注册中……") : t("注册并登录") }}
					</button>
				</form>

				<div class="login-foot">
					<button type="button" class="link" @click="continueAsGuest">
						{{ t("不登录，以游客身份继续 →") }}
					</button>
					<button type="button" class="link" @click="goBack">
						{{ t("返回上一页") }}
					</button>
				</div>
			</template>
		</div>
	</div>
</template>
