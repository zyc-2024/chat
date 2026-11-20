(function () {
	var script =
		document.currentScript ||
		document.querySelector("script[data-route]");
	if (!script) return;
	var route = script.dataset.route || "/";
	var query = window.location.search || "";
	if (script.dataset.mode) {
		query += (query ? "&" : "?") + "mode=" + encodeURIComponent(script.dataset.mode);
	}
	var base = window.location.pathname.replace(/[^/]*$/, "");
	window.location.replace(base + "#" + route + query);
})();
