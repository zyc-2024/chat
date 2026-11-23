<script setup>
import { onMounted } from "vue";
import ToastHost from "./components/ToastHost.vue";
import { refreshAdmin } from "./services/auth.js";

onMounted(() => {
	refreshAdmin();
});
</script>

<template>
	<router-view />
	<ToastHost />
</template>
