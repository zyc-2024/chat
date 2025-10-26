function getname() {
	if (document.cookie === "") {
		document.cookie =
			"n=" +
			prompt("请输入你的名字") +
			";path=/;expires=Fri, 31 Dec 9999 23:59:59 GMT;max-age=2147483647";
	}
	return document.cookie.split("=")[1].split(";")[0];
}

let namee = (name0 = "Anonymous");

namee = name0 = getname();

var eee;
function gettime(time = +new Date()) {
	var date = new Date(time + 8 * 3600 * 1000);
	return date.toJSON().substr(0, 19).replace("T", " ").replaceAll("-", "");
}

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
	$.ajax({
		url:
			"https://gitee.com/api/v5/repos/zyc-2024/chat/raw/public/msg/" +
			ch +
			".json",
		crossDomain: true,
		contentType: "application/json;charset=UTF-8",
		data: {
			access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
		},
	}).done(function (response) {
		// if (document.getElementById("f").files.length !== 0) {
		// 	console.log(c);
		// 	c = "发送了一个文件：<a href='https://gitee.com/api/v5/repos/zyc-2024/chat/raw/f%2F" + m5 + "%2F" + na + "?access_token=19f7b43872c256d52d1bc71cbd2d0ffa'>" + na + "</a>";
		// }
		r = JSON.parse(response);
		r.msg[r.msg.length] = {
			name: namee,
			time: gettime(),
			content: c,
		};
		$.get(
			"https://gitee.com/api/v5/repos/zyc-2024/chat/contents/public%2Fmsg%2F" +
				ch +
				".json",
			{
				access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
			}
		).done(function (response) {
			eee = response.sha;
			sha = response.sha;
			var t = new Date();
			$.ajax({
				url:
					"https://gitee.com/api/v5/repos/zyc-2024/chat/contents/public%2Fmsg%2F" +
					ch +
					".json",
				crossDomain: true,
				method: "PUT",
				contentType: "application/json;charset=UTF-8",
				data: JSON.stringify({
					access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
					content: Base64.encode(JSON.stringify(r)),
					sha: sha,
					message: namee + " @ " + t.getTime(),
				}),
			}).done(function (response) {
				location.reload();
				reload();
			});
		});
	});
	document.getElementsByClassName("content").innerText = "";
}
var rrrr;
function preRenderTex(source) {
	// 块级公式
	source = source.replace(/\$\$([\s\S]+?)\$\$/g, (m, tex) =>
		katex.renderToString(tex, {
			displayMode: true,
			throwOnError: false,
			output: "html",
		})
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
			p3
	);
	return source;
}

const md = window
	.markdownit({ html: true })
	// .use(window.markdownitEmoji)
	.use(window.markdownitTaskLists)
	.use(window.markdownitMultimdTable);

function reload() {
	var content;
	$.ajax({
		url:
			"https://gitee.com/api/v5/repos/zyc-2024/chat/raw/public/msg/" +
			ch +
			".json",
		crossDomain: true,
		contentType: "application/json;charset=UTF-8",
		data: {
			access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
		},
	}).done(function (response) {
		content = rrrr = JSON.parse(response);
		document.getElementById("chat").innerHTML = "";
		if (content.msg) {
			var msg = content.msg;
		} else {
			console.error("response 中没有 msg 属性");
			var msg = [];
		}
		// document.getElementById("chat").innerHTML +=
		// 	"<table><tr><th>用户名</th><th>时间</th><th>内容</th></tr>";
		for (let i in msg) {
			let raw = msg[i].content || "";

			// 先用 KaTeX 预处理，再用 markdown-it 渲染
			const preProcessed = preRenderTex(raw);
			const dirty = md.render(preProcessed);

			// 清理 XSS，同时保留 KaTeX 生成的 span/class
			const clean = DOMPurify.sanitize(dirty, {
				ADD_TAGS: ["span"],
				ADD_ATTR: ["class", "style"],
			});

			// 对用户名和时间也进行简单清理
			const safeName = DOMPurify.sanitize(msg[i].name || "Anonymous", {
				ALLOWED_TAGS: [],
				ALLOWED_ATTR: [],
			});
			const safeTime = DOMPurify.sanitize(msg[i].time || "", {
				ALLOWED_TAGS: [],
				ALLOWED_ATTR: [],
			});

			document.getElementById("chat").innerHTML +=
				"<br><div class='crow'><span class='call'><div class='cname'>" +
				safeName +
				"</div><div class='ctime'>" +
				safeTime +
				"</div></span><div class='ccontent'>" +
				clean +
				"</div></div>";
				
			hljs.highlightAll();
		}
		// document.getElementById("chat").innerHTML += "</table>";
	});
}
setTimeout(reload(), 200);
$.ajax({
	url:
		"https://gitee.com/api/v5/repos/zyc-2024/chat/contents/public%2Fmsg%2F" +
		ch +
		".json",
	crossDomain: true,
	data: {
		access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
	},
	contentType: "application/json;charset=UTF-8",
})
	.done(function (response) {
		window.scroll({
			top: document.body.scrollHeight,
			behavior: "smooth",
		});
	})
	.fail(function (response) {
		window.location.href = "404.html?ch=" + getch();
	});
//chatkey 19f7b43872c256d52d1bc71cbd2d0ffa
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
