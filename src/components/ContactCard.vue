<script setup>
import { computed, ref } from "vue";
import { t } from "../i18n/index.js";

const props = defineProps({
	card: { type: Object, required: true },
	busy: { type: Boolean, default: false },
	added: { type: Boolean, default: false },
	compact: { type: Boolean, default: false },
});
defineEmits(["open", "add"]);

const avatarFailed = ref(false);

const name = computed(() =>
	String((props.card && props.card.name) || "").trim(),
);
const username = computed(() =>
	String((props.card && props.card.username) || "").trim(),
);
const avatar = computed(() => String((props.card && props.card.avatar) || ""));
const initial = computed(() => (name.value || username.value || "?").charAt(0));
const bio = computed(() => {
	const text = String((props.card && props.card.bio) || "")
		.replace(/\s+/g, " ")
		.trim();
	if (text.length <= 90) return text;
	return `${text.slice(0, 90)}…`;
});
</script>

<template>
	<div class="contact-card" :class="{ compact, added }">
		<img
			v-if="avatar && !avatarFailed"
			class="contact-card-avatar"
			:src="avatar"
			alt=""
			@error="avatarFailed = true"
		/>
		<div v-else class="contact-card-avatar contact-card-avatar-fallback">
			{{ initial }}
		</div>
		<div class="contact-card-main">
			<div class="contact-card-name">{{ name || username }}</div>
			<div class="contact-card-username">@{{ username }}</div>
			<p v-if="bio" class="contact-card-bio">{{ bio }}</p>
			<div class="contact-card-actions">
				<button
					type="button"
					class="ghost-button"
					@click="$emit('open')"
				>
					{{ t("查看主页") }}
				</button>
				<span v-if="added" class="contact-card-status">
					{{ t("已是好友") }}
				</span>
				<button
					v-else
					type="button"
					class="primary-button"
					:disabled="busy"
					@click="$emit('add')"
				>
					{{ busy ? t("发送中…") : t("加好友") }}
				</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
.contact-card {
	display: flex;
	gap: 11px;
	min-width: 0;
	padding: 11px 12px;
	border: 1px solid var(--theme-border);
	border-radius: 11px;
	background: var(--theme-surface);
}

.contact-card.compact {
	gap: 9px;
	padding: 9px 10px;
	border-radius: 9px;
}

.contact-card-avatar {
	flex: 0 0 auto;
	width: 44px;
	height: 44px;
	border-radius: 11px;
	object-fit: cover;
	background: var(--theme-accent-soft);
}

.contact-card.compact .contact-card-avatar {
	width: 36px;
	height: 36px;
	border-radius: 9px;
}

.contact-card-avatar-fallback {
	display: grid;
	place-items: center;
	color: var(--theme-accent);
	font-size: 17px;
	font-weight: 600;
}

.contact-card-main {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.contact-card-name {
	overflow: hidden;
	color: var(--theme-text);
	font-size: 13px;
	font-weight: 600;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.contact-card-username {
	overflow: hidden;
	color: var(--theme-muted);
	font-size: 11px;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.contact-card-bio {
	display: -webkit-box;
	overflow: hidden;
	margin: 3px 0 0;
	color: var(--theme-muted);
	font-size: 12px;
	line-height: 1.5;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
}

.contact-card-actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 6px;
	margin-top: 7px;
}

.contact-card-actions .ghost-button,
.contact-card-actions .primary-button {
	height: 28px;
	padding: 0 10px;
	font-size: 12px;
}

.contact-card-status {
	color: var(--theme-accent);
	font-size: 12px;
}
</style>
