// import hljs from "highlight.js";
(function () {
	function init() {
		// 初始化 markdown-it
		const md = window
			.markdownit({ html: true })
			// .use(window.markdownitEmoji)
			.use(window.markdownitTaskLists)
			.use(window.markdownitMultimdTable);

		// KaTeX 预处理
		function preRenderTex(source) {
			// 块级公式
			source = source.replace(/\$\$([\s\S]+?)\$\$/g, (m, tex) =>
				katex.renderToString(tex, {
					displayMode: true,
					throwOnError: false,
					output: "html",
				}),
			);
			// 行内公式
			source = source.replace(
				/(^|[^$])\$([^\n$][^$]*?)\$([^$]|$)/g,
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

		function render() {
			const src = document.getElementById("editor").value;
			const preProcessed = preRenderTex(src);
			const dirty = md.render(preProcessed);

			// 清理 XSS，同时保留 KaTeX 生成的 span/class
			const clean = DOMPurify.sanitize(dirty, {
				ADD_TAGS: ["span"],
				ADD_ATTR: ["class", "style"],
			});

			document.getElementById("preview").innerHTML = clean;

			hljs.highlightAll();
		}

		document.getElementById("editor").addEventListener("input", render);
		render();
		// hljs.initHighlightingOnLoad();
		// hljs.initLineNumbersOnLoad();
	}

	// 如果依赖脚本已经就绪立即执行，否则等待 allScriptsLoaded 事件
	if (window.markdownit && window.katex && window.DOMPurify) {
		init();
	} else {
		document.addEventListener("allScriptsLoaded", init, { once: true });
	}
})();
