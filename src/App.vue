<script setup>
import { onMounted, watch } from "vue";
import ToastHost from "./components/ToastHost.vue";
import { refreshAdmin } from "./services/auth.js";
import { applyTheme, currentTheme } from "./services/theme.js";

onMounted(() => {
	refreshAdmin();
	applyTheme(currentTheme.value);
});

watch(currentTheme, (theme) => applyTheme(theme));
</script>

<template>
	<router-view />
	<ToastHost />
</template>
