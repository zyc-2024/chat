<script setup>
import { computed } from "vue";
import { renderMarkdown } from "../lib/markdown.js";
import { prettyTime } from "../lib/format.js";

const props = defineProps({
	message: { type: Object, required: true },
	canRecall: { type: Boolean, default: false },
	canReedit: { type: Boolean, default: false },
});
defineEmits(["recall", "reedit"]);

const html = computed(() => renderMarkdown(props.message.content || ""));
const name = computed(() => props.message.name || "Anonymous");
const time = computed(() => prettyTime(props.message.time));
const hasProfileLink = computed(() => {
	const user = String(props.message.user || "");
	return !!user && !/^Guest_/i.test(user);
});
</script>

<template>
	<article class="message-card">
		<header class="message-head">
			<router-link
				v-if="hasProfileLink"
				class="message-name message-name-link"
				:to="{ name: 'user', query: { u: message.user } }"
				:title="'查看 ' + message.user + ' 的个人主页'"
			>
				{{ name }}
			</router-link>
			<span v-else class="message-name">{{ name }}</span>
			<time class="message-time">{{ time }}</time>
		</header>
		<div class="message-body">
			<div v-if="message.recalled" class="message-recalled">
				<span>该消息已被撤回</span>
				<button
					v-if="canReedit"
					type="button"
					class="message-reedit"
					@click="$emit('reedit')"
				>
					重新编辑
				</button>
			</div>
			<template v-else>
				<div class="markdown-body" v-html="html"></div>
				<div v-if="canRecall" class="message-actions">
					<button
						type="button"
						class="message-recall"
						title="撤回这条消息"
						@click="$emit('recall')"
					>
						撤回
					</button>
				</div>
			</template>
		</div>
	</article>
</template>
