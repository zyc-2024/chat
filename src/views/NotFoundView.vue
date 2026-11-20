<script setup>
import { useRouter } from "vue-router";
import "../styles/pages.css";

const router = useRouter();

function goBack() {
	if (window.history.length > 1) router.back();
	else router.push({ name: "home" });
}
</script>

<template>
	<div class="not-found">
		<div class="not-found-card">
			<p class="not-found-code">404</p>
			<p>抱歉，您访问的页面不存在。</p>
			<div class="not-found-actions">
				<button
					type="button"
					class="primary-button"
					@click="router.push({ name: 'home' })"
				>
					返回首页
				</button>
				<button type="button" class="ghost-button" @click="goBack">
					返回上一页
				</button>
			</div>
		</div>
	</div>
</template>
