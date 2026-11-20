<script setup>
import { computed } from "vue";
import { renderMarkdown } from "../lib/markdown.js";
import { prettyTime } from "../lib/format.js";

const props = defineProps({
	message: { type: Object, required: true },
});

const html = computed(() => renderMarkdown(props.message.content || ""));
const name = computed(() => props.message.name || "Anonymous");
const time = computed(() => prettyTime(props.message.time));
</script>

<template>
	<article class="message-card">
		<header class="message-head">
			<span class="message-name">{{ name }}</span>
			<time class="message-time">{{ time }}</time>
		</header>
		<div class="message-body markdown-body" v-html="html"></div>
	</article>
</template>
