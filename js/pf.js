/*
let me think...
the file is /private/id_{md5 of the key}.json?
then if it doesnt exist throw 404
*/

let namee = (name0 = "Anonymous");

namee = name0 = getname();
//md stands for message directory
let md5 =
	"private/msg/" + getarg().id + "_" + SparkMD5.hash(getarg().key) + ".json";
var eee;

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
		url: "https://gitee.com/api/v5/repos/zyc-2024/chat/raw/" + md5,
		crossDomain: true,
		contentType: "application/json;charset=UTF-8",
		data: {
			access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
		},
	}).done(function (response) {
		r = JSON.parse(response);
		r.msg[r.msg.length] = {
			name: namee,
			time: gettime(),
			content: c,
		};
		$.get(
			"https://gitee.com/api/v5/repos/zyc-2024/chat/contents/" +
				encodeURIComponent(md5),
			{
				access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
			}
		).done(function (response) {
			eee = response.sha;
			sha = response.sha;
			var t = new Date();
			$.ajax({
				url:
					"https://gitee.com/api/v5/repos/zyc-2024/chat/contents/" +
					encodeURIComponent(md5),
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
function reload() {
	var content;
	$.ajax({
		url: "https://gitee.com/api/v5/repos/zyc-2024/chat/raw/" + md5,
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
			document.getElementById("chat").innerHTML +=
				"<br><div class='crow'><span class='call'><div class='cname'>" +
				msg[i].name +
				"</div><div class='ctime'>" +
				msg[i].time +
				"</div></span><div class='ccontent'><p>" +
				msg[i].content +
				"</p></div></div>";
		}
		// document.getElementById("chat").innerHTML += "</table>";
	});
}
setTimeout(reload(), 200);
$.ajax({
	url:
		"https://gitee.com/api/v5/repos/zyc-2024/chat/contents/" +
		encodeURIComponent(md5),
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
