<script setup>
import { useToast } from "../lib/toast.js";

const { toasts } = useToast();
</script>

<template>
	<div class="toast-host" aria-live="polite">
		<TransitionGroup name="toast">
			<div
				v-for="toast in toasts"
				:key="toast.id"
				class="toast"
				:class="'toast-' + toast.type"
			>
				{{ toast.message }}
			</div>
		</TransitionGroup>
	</div>
</template>

<style scoped>
.toast-host {
	position: fixed;
	z-index: 9999;
	right: 18px;
	bottom: 18px;
	display: flex;
	flex-direction: column;
	gap: 10px;
	max-width: min(360px, calc(100vw - 36px));
	pointer-events: none;
}

.toast {
	padding: 11px 16px;
	border: 1px solid #ececec;
	border-radius: 10px;
	background: #fff;
	color: #333;
	font-size: 13px;
	line-height: 1.5;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
}

.toast-success {
	border-color: rgba(7, 193, 96, 0.35);
	background: #f2fff7;
	color: #087a40;
}

.toast-error {
	border-color: rgba(211, 47, 47, 0.3);
	background: #fff5f5;
	color: #a82323;
}

.toast-enter-active,
.toast-leave-active {
	transition: all 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
	opacity: 0;
	transform: translateY(8px);
}
</style>
