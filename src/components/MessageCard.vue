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
		<div class="message-body markdown-body" v-html="html"></div>
	</article>
</template>
