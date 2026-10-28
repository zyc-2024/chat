var ch = decodeURIComponent(getch());
var enc = getarg().type != "u";
var passwd = getarg().key;
let md5 = enc ? "private/msg/" + getarg().id + "_" + SparkMD5.hash(getarg().key) + ".json" : "public/msg/" + ch + ".json";

function decryptPrivateData(record) {
	//md s* gitee
	if (record && record.version === undefined && Array.isArray(record.msg)) {
		return record;
	}
	return _decrypt(record, passwd);
}
function getname() {
	let n = getCookie("n");
	if (!n) {
		n = prompt("请输入你的名字") || "Anonymous";
		setCookie("n", n);
	}
	return n;
}
var oricontent = {};
let namee = (name0 = "Anonymous");

const iframe = document.getElementById("msg");

iframe.onload = function () {
	Array.from(document.getElementsByTagName("pre")).forEach(function (r) {
		r.tagName = "div";
	});
	const doc = iframe.contentDocument || iframe.contentWindow.document;
	iframe.style.height = doc.body.scrollHeight + "px";
	iframe.style.width = doc.body.scrollWidth + "px";
};
namee = name0 = getname();

var eee;
var messagesCache = [];
var loadedStart = 0;
var loadedEnd = 0;
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
	if (a === null || a === "") return;
	document.getElementById("nname").innerText = "现在聊天用的的用户名：" + a;
	setCookie("n", a);
	namee = a;
}
function getch() {
	return getarg().ch || "main";
}
if (namee === "" || namee === null) {
	namee = name0 = "Anonymous";
}
var ch = decodeURIComponent(getch());

function upload(msg = null) {
	let c;
	if (msg) {
		c = msg;
	} else {
		c = document.getElementById("editor").value;
	}
	var aa = document.getElementById("button");
	aa.disabled = true;
	aa.innerText = "发送中……";
	aa.style.background = "#4a4a4a";
	reload();
	// setTimeout(function () {
	// 	document.getElementById("button").disabled = false;
	// }, 5000);

	var sha;
	get(md5, function (response, sha) {
		let r;
		try {
			r = enc ? decryptPrivateData(response) : response;
		} catch (e) {
			console.error("Failed to decrypt private channel data", e);
			aa.disabled = false;
			aa.innerText = "发送";
			aa.style.background = "#4f8cff";
			return;
		}
		// console.log(r);
		if (!r.msg) r.msg = [];
		r.msg[r.msg.length] = {
			name: namee,
			user: getCookie("uname"),
			time: gettime(),
			ts: Date.now(),
			content: c,
		};
		put(md5, namee + " @ " + Date.now(), enc ? _encrypt(r, passwd) : r, sha, function () {
			// reload();
			iframe.contentWindow.postMessage("reload");
			// window.reload();
		});
	});
	reload(true);
	window.scroll({
		top: document.body.scrollHeight,
		behavior: "smooth",
	});
	document.getElementById("editor").value = "";
	document.getElementById("preview").innerHTML = "";
}
window.addEventListener("message", function (event) {
	if (event.data == "reload") {
		reload(true);
		window.parent.postMessage("ok");
	}
	if (event.data == "ok") {
		var aa = document.getElementById("button");
		aa.disabled = false;
		aa.innerText = "发送";
		aa.style.background = "#4f8cff";
		// this.window.location.reload();
	}
});
var rrrr;
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

const md = window.markdownit({ html: true }).use(window.markdownitTaskLists).use(window.markdownitMultimdTable);
function diff(a, b) {
	a.forEach((c) => {
		if (b.includes(c)) {
			b.pop(c);
		}
	});
	return b;
}

function reload(scroll = false) {
	if (!window.location.href.match("show")) {
		return;
	}
	get(md5, function (response, sha) {
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
		if (enc) {
			try {
				content = decryptPrivateData(content);
			} catch (e) {
				console.error("Failed to decrypt private channel data", e);
				return;
			}
		}
		const msg = content.msg || [];
		$("#nomsg").hide();
		if (messagesCache.length === 0) {
			messagesCache = msg.slice();
			const total = msg.length;
			loadedEnd = total;
			loadedStart = Math.max(0, total - pageSize);
			// ensureLoadMoreButton();
			for (let i = loadedStart; i < loadedEnd; i++) {
				// console.log(render);
				render(msg[i]);
			}
			window.scrollTo(0, document.body.scrollHeight);
		} else {
			if (msg.length > messagesCache.length) {
				for (let i = messagesCache.length; i < msg.length; i++) {
					render(msg[i]);
				}
			}
			messagesCache = msg.slice();
			loadedEnd = msg.length;
		}
		if (scroll) {
			window.scroll({
				top: document.body.scrollHeight,
				behavior: "smooth",
			});
		}
	});
}

// function ensureLoadMoreButton() {
// 	if (document.getElementById("load-more")) return;
// 	const chat = document.getElementById("chat");
// 	const btn = document.createElement("button");
// 	btn.id = "load-more";
// 	btn.innerText = "加载更多历史消息";
// 	btn.style.display = "block";
// 	btn.style.margin = "10px auto";
// 	btn.onclick = function () {
// 		loadMoreMessages();
// 	};
// 	chat.parentNode.insertBefore(btn, chat);
// }

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
	{ passive: true },
);

setTimeout(reload, 200);

function cch(event, m = 0) {
	if (event) event.preventDefault();
	let v = m ? "main" : document.getElementById("ch").value;
	document.location.href = document.location.href.split("?")[0] + "?ch=" + v;
}
rtime = 5000;
function tickreload() {
	reload();
	setTimeout(tickreload, rtime);
}
if (window.location.href.match("show")) {
	tickreload();
}
function tick1() {
	// func();\
	resizemsg();
	setTimeout(tick1, 50);
}
function resizemsg() {
	document.getElementById("msg").style.height =
		window.innerHeight / document.body.style.zoom -
		document.getElementById("toolbox").clientHeight -
		2 * document.getElementById("titlee").clientHeight -
		30 +
		"px";
}
tick1();

function crt() {
	let t = prompt("请输入新的刷新时间（单位：秒）");
	if (t === null || t === "" || isNaN(t) || !isFinite(t)) {
		return;
	}
	rtime = t * 1000;
	document.getElementById("refreshtime").innerText = t;
}

function showname() {
	document.getElementById("nname").innerText = "现在聊天用的用户名：" + getname();
}
showname();
if (getarg().type != "u") {
	document.getElementById("changechannel").style.display = "none";
}

console.nolog = function (...args) {
	return;
};
