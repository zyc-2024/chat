<script setup>
import { onBeforeUnmount, watch } from "vue";
import { t } from "../i18n/index.js";

const props = defineProps({
	open: { type: Boolean, default: false },
	title: { type: String, default: "" },
	width: { type: String, default: "420px" },
});
const emit = defineEmits(["close"]);

function close() {
	emit("close");
}

function onKeydown(event) {
	if (event.key === "Escape" && props.open) close();
}

watch(
	() => props.open,
	(open) => {
		if (open) {
			window.addEventListener("keydown", onKeydown);
		} else {
			window.removeEventListener("keydown", onKeydown);
		}
	},
);

onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
	<Teleport to="body">
		<Transition name="modal">
			<div v-if="open" class="modal-mask" @click.self="close">
				<div class="modal-card" :style="{ width }">
					<header class="modal-head">
						<h2>{{ title }}</h2>
						<button
							type="button"
							class="modal-close"
							:aria-label="t('关闭')"
							@click="close"
						>
							×
						</button>
					</header>
					<div class="modal-body">
						<slot />
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<style scoped>
.modal-mask {
	position: fixed;
	inset: 0;
	z-index: 5000;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 18px;
	background: rgba(13, 20, 16, 0.48);
	backdrop-filter: blur(2px);
}

.modal-card {
	max-width: 100%;
	max-height: min(86vh, 620px);
	overflow: auto;
	border-radius: 14px;
	background: var(--theme-surface);
	color: var(--theme-text);
	box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
}

.modal-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 18px 20px 12px;
	border-bottom: 1px solid var(--theme-border);
}

.modal-head h2 {
	margin: 0;
	font-size: 16px;
	font-weight: 600;
}

.modal-close {
	width: 30px;
	height: 30px;
	padding: 0;
	border: 0;
	border-radius: 8px;
	background: transparent;
	color: var(--theme-muted);
	font-size: 22px;
	line-height: 1;
	cursor: pointer;
}

.modal-close:hover {
	background: var(--theme-accent-soft);
	color: var(--theme-accent);
}

.modal-body {
	padding: 20px;
}

.modal-enter-active,
.modal-leave-active {
	transition: opacity 0.17s ease;
}

.modal-enter-from,
.modal-leave-to {
	opacity: 0;
}

@media (max-width: 520px) {
	.modal-mask {
		align-items: flex-end;
		padding: 8px;
	}

	.modal-card {
		width: 100% !important;
		max-height: 88vh;
		max-height: 88dvh;
		border-radius: 14px 14px 10px 10px;
	}

	.modal-head {
		padding: 15px 16px 10px;
	}

	.modal-body {
		padding: 16px;
	}
}
</style>
