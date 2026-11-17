// import hljs from "highlight.js";
(function () {
	function init() {
		const md = window
			.markdownit({ html: true })
			// .use(window.markdownitEmoji)
			.use(window.markdownitTaskLists)
			.use(window.markdownitMultimdTable);
		function preRenderTex(source) {
			source = source.replace(/\$\$([\s\S]+?)\$\$/g, (m, tex) =>
				katex.renderToString(tex, {
					displayMode: true,
					throwOnError: false,
					output: "html",
				}),
			);
			source = source.replace(
				/(^|[^$])\$([^\n$][^$]*?)\$([^$]|$)/gm,
				(m, p1, tex, p3) =>
					p1 +
					katex.renderToString(tex, {
						displayMode: false,
						throwOnError: false,
						output: "html",
					}) +
					p3,
			);
			return source;
		}
		//小小压力了一下GPT
		function renderMarkdown(source) {
			const preProcessed = preRenderTex(source);
			const dirty = md.render(preProcessed);
			return DOMPurify.sanitize(dirty, {
				ADD_TAGS: ["span"],
				ADD_ATTR: ["class", "style"],
			});
		}
		window.renderMarkdown = renderMarkdown;
		function renderEditorPreview() {
			const editor = document.getElementById("editor");
			const preview = document.getElementById("preview");
			if (!editor || !preview) return;
			function render() {
				//这块真的要InnerHTML啊……过滤过的
				preview.innerHTML = renderMarkdown(editor.value);

				hljs.highlightAll();
			}

			editor.addEventListener("input", render);
			render();
		}

		renderEditorPreview();
	}

	if (window.markdownit && window.katex && window.DOMPurify) {
		init();
	} else {
		document.addEventListener("allScriptsLoaded", init, { once: true });
	}
})();
