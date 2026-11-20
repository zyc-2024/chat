import MarkdownIt from "markdown-it";
import taskLists from "markdown-it-task-lists";
import multimdTable from "markdown-it-multimd-table";
import katex from "katex";
import DOMPurify from "dompurify";
import hljs from "highlight.js";

function highlightCode(code, language) {
	if (language && hljs.getLanguage(language)) {
		try {
			const highlighted = hljs.highlight(code, {
				language,
				ignoreIllegals: true,
			}).value;
			return `<pre class="hljs"><code class="language-${language}">${highlighted}</code></pre>`;
		} catch (e) {
			// fall through to escaped code
		}
	}
	return `<pre class="hljs"><code>${md.utils.escapeHtml(code)}</code></pre>`;
}

const md = new MarkdownIt({
	html: true,
	linkify: true,
	breaks: true,
	highlight: highlightCode,
})
	.use(taskLists)
	.use(multimdTable);

/** 先把 $...$ / $$...$$ 转成 KaTeX，再交给 markdown-it。 */
export function preRenderTex(source) {
	let result = String(source || "");
	result = result.replace(/\$\$([\s\S]+?)\$\$/g, (match, tex) =>
		katex.renderToString(tex, {
			displayMode: true,
			throwOnError: false,
			output: "html",
		}),
	);
	result = result.replace(
		/(^|[^$])\$([^\n$][^$]*?)\$([^$]|$)/g,
		(match, before, tex, after) =>
			before +
			katex.renderToString(tex, {
				displayMode: false,
				throwOnError: false,
				output: "html",
			}) +
			after,
	);
	return result;
}

/** 将 Markdown 转成已经过 DOMPurify 清洗的 HTML。 */
export function renderMarkdown(source) {
	const dirty = md.render(preRenderTex(source));
	return DOMPurify.sanitize(dirty, {
		ADD_TAGS: ["span"],
		ADD_ATTR: ["class", "style"],
	});
}
