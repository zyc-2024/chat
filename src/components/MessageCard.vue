<script setup>
import { computed } from "vue";
import { renderMarkdown } from "../lib/markdown.js";
import { prettyTime } from "../lib/format.js";

const props = defineProps({
	message: { type: Object, required: true },
	canReedit: { type: Boolean, default: false },
	quoted: { type: Object, default: null },
});
defineEmits(["reedit", "jump-quote", "menu"]);

const html = computed(() => renderMarkdown(props.message.content || ""));
const name = computed(() => props.message.name || "Anonymous");
const time = computed(() => prettyTime(props.message.time));
const hasProfileLink = computed(() => {
	const user = String(props.message.user || "");
	return !!user && !/^Guest_/i.test(user);
});
const quoteText = computed(() => {
	const quoted = props.quoted;
	if (!quoted) return "";
	if (quoted.missing) return "引用的消息不在当前记录中";
	if (quoted.recalled) return "该消息已被撤回";
	const text = String(quoted.content || "")
		.replace(/\s+/g, " ")
		.trim();
	if (!text) return "[空消息]";
	return text.length > 80 ? `${text.slice(0, 80)}…` : text;
});
</script>

<template>
	<article class="message-card" :data-message-hash="message.hash">
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
			<div class="message-head-tools">
				<time class="message-time">{{ time }}</time>
				<button
					v-if="!message.recalled"
					type="button"
					class="message-menu-button"
					title="复制、引用或撤回"
					aria-label="消息操作"
					@click.stop="$emit('menu', $event)"
				>
					⋯
				</button>
			</div>
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
				<button
					v-if="quoted"
					type="button"
					class="message-quote"
					title="跳到被引用的消息"
					@click="$emit('jump-quote', quoted.hash)"
				>
					<span class="message-quote-name">
						{{ quoted.name || "Anonymous" }}
					</span>
					<span class="message-quote-text">{{ quoteText }}</span>
				</button>
				<div class="markdown-body" v-html="html"></div>
			</template>
		</div>
	</article>
</template>
