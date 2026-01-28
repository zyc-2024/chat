function getname() {
	if (document.cookie === "") {
		document.cookie =
			"n=" +
			prompt("请输入你的名字") +
			";path=/;expires=Fri, 31 Dec 9999 23:59:59 GMT;max-age=2147483647";
	}
	return document.cookie.split("=")[1].split(";")[0];
}
var oricontent = {};
let namee = (name0 = "Anonymous");

namee = name0 = getname();

var eee;
// message cache and pagination
var messagesCache = [];
var loadedStart = 0; // index of first displayed message in messagesCache
var loadedEnd = 0; // index after last displayed message
var pageSize = 20;
var loadingMore = false;
function gettime(time = +new Date()) {
	var date = new Date(time + 8 * 3600 * 1000);
	return date.toJSON().substr(0, 19).replace("T", " ").replaceAll("-", "");
}
// function
function cname() {
	let a;
	a = prompt("请输入你的新名字");
	document.getElementById("nname").innerText = "现在的用户名：" + a;
	document.cookie =
		"n=" +
		a +
		";path=/;expires=Fri, 31 Dec 9999 23:59:59 GMT;max-age=2147483647";
	namee = a;
}
function getch() {
	return getarg().ch || "main";
}
if (namee === "" || namee === null) {
	namee = name0 = "Anonymous";
}
var ch = getch();

function upload() {
	let c = document.getElementById("editor").value;
	document.getElementById("button").disabled = true;
	setTimeout(function () {
		document.getElementById("button").disabled = false;
	}, 5000);

	var sha;
	get("public/msg/" + ch + ".json", function (response,sha) {
		let r = JSON.parse(response);
		// sha = r.sha;
		console.log(r);
		if (!r.msg) r.msg = [];
		r.msg[r.msg.length] = {
			name: namee,
			time: gettime(),
			ts: Date.now(),
			content: c,
		};
		put(
			"public/msg/" + ch + ".json",
			namee + " @ " + Date.now(),
			JSON.stringify(r), // ensure data is JSON stringified
			sha,
			function () {
				// after successful put, reload messages
				reload();
			},
		);
	});
	// editor
	reload();
	window.scroll({
			top: document.body.scrollHeight,
			behavior: "smooth",
		});
	document.getElementsByClassName("editor").innerHTML = "";
	// document.getElementsByClassName("content").innerText = "";
	
}
var rrrr;
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

const md = window
	.markdownit({ html: true })
	// .use(window.markdownitEmoji)
	.use(window.markdownitTaskLists)
	.use(window.markdownitMultimdTable);
function diff(a, b) {
	a.forEach((c) => {
		if (b.includes(c)) {
			b.pop(c);
		}
	});
	return b;
}

function reload() {
	get("public/msg/" + ch + ".json", function (response,sha) {
		let content;
		try {
			if (typeof response === "string") {
				content = JSON.parse(response);
			} else {
				content = response;
			}
		} catch (e) {
			console.error("Failed to parse response as JSON", e, response);
			return;
		}
		const msg = content.msg || [];
		// first time load
		if (messagesCache.length === 0) {
			messagesCache = msg.slice();
			const total = msg.length;
			loadedEnd = total;
			loadedStart = Math.max(0, total - pageSize);
			ensureLoadMoreButton();
			for (let i = loadedStart; i < loadedEnd; i++) {
				render(msg[i]);
			}
			// scroll to bottom after initial render
			window.scrollTo(0, document.body.scrollHeight);
		} else {
			// append only new messages
			if (msg.length > messagesCache.length) {
				for (let i = messagesCache.length; i < msg.length; i++) {
					render(msg[i]);
				}
			}
			messagesCache = msg.slice();
			loadedEnd = msg.length;
		}
	});
}

// create or ensure the "加载更多" button is present
function ensureLoadMoreButton() {
	if (document.getElementById("load-more")) return;
	const chat = document.getElementById("chat");
	const btn = document.createElement("button");
	btn.id = "load-more";
	btn.innerText = "加载更多历史消息";
	btn.style.display = "block";
	btn.style.margin = "10px auto";
	btn.onclick = function () {
		loadMoreMessages();
	};
	chat.parentNode.insertBefore(btn, chat);
}

function loadMoreMessages() {
	if (loadingMore) return;
	if (loadedStart <= 0) return;
	loadingMore = true;
	const oldHeight = document.body.scrollHeight;
	const newStart = Math.max(0, loadedStart - pageSize);
	for (let i = newStart; i < loadedStart; i++) {
		render(messagesCache[i], "prepend");
	}
	loadedStart = newStart;
	if (loadedStart === 0) {
		const btn = document.getElementById("load-more");
		if (btn) btn.style.display = "none";
	}
	const newHeight = document.body.scrollHeight;
	// keep view stable after prepending
	window.scrollBy(0, newHeight - oldHeight);
	loadingMore = false;
}

// infinite scroll: load more when scrolling near top
window.addEventListener(
	"scroll",
	function () {
		if (window.scrollY <= 120 && loadedStart > 0 && !loadingMore) {
			loadMoreMessages();
		}
	},
	{ passive: true }
);

setTimeout(reload, 200);

function cch(event, m = 0) {
	if (event) event.preventDefault();
	let v = m ? "main" : document.getElementById("ch").value;
	document.location.href = document.location.href.split("?")[0] + "?ch=" + v;
}
rtime = 5000;
function tick() {
	reload();
	setTimeout(tick, rtime);
}
tick();
function crt() {
	let t = prompt("请输入新的刷新时间（单位：秒）");
	if (t === null || t === "" || isNaN(t) || !isFinite(t)) {
		return;
	}
	rtime = t * 1000;
	document.getElementById("refreshtime").innerText = t;
}
