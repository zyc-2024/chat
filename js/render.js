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

			const clean = DOMPurify.sanitize(dirty, {
				ADD_TAGS: ["span"],
				ADD_ATTR: ["class", "style"],
			});
			//这块真的要InnerHTML啊……过滤过的
			document.getElementById("preview").innerHTML = clean;

			hljs.highlightAll();
		}

		document.getElementById("editor").addEventListener("input", render);
		render();
	}

	if (window.markdownit && window.katex && window.DOMPurify) {
		init();
	} else {
		document.addEventListener("allScriptsLoaded", init, { once: true });
	}
})();
