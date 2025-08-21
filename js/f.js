function getname() {
	if (document.cookie === "") {
		document.cookie =
			"n=" +
			prompt("请输入你的名字") +
			";path=/;expires=Fri, 31 Dec 9999 23:59:59 GMT;max-age=2147483647";
	}
	return document.cookie.split("=")[1].split(";")[0];
}

var eee;
function gettime(time = +new Date()) {
	var date = new Date(time + 8 * 3600 * 1000);
	return date.toJSON().substr(0, 19).replace("T", " ").replaceAll("-", "");
}

function cname() {
	let a;
	a = prompt("请输入你的新名字");
	document.getElementById("nname").innerText = "现在的用户名：" + a;
	localStorage.setItem("n", a);
	document.cookie =
		"n=" +
		a +
		";path=/;expires=Fri, 31 Dec 9999 23:59:59 GMT;max-age=2147483647";
	namee = a;
}
function getch() {
	return getarg().ch || "main";
}
let namee = (name0 = "Anonymous");
if (namee === "" || namee === null) {
	namee = name0 = "Anonymous";
}
var ch = getch();

function upload() {
	document.getElementById("button").disabled = true;
	setTimeout(function () {
		document.getElementById("button").disabled = false;
	}, 5000);

	var sha;
	$.ajax({
		url: "https://gitee.com/api/v5/repos/zyc-2024/chat/raw/" + ch + ".json",
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
			"https://gitee.com/api/v5/repos/zyc-2024/chat/contents/" +
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
					"https://gitee.com/api/v5/repos/zyc-2024/chat/contents/" +
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
function reload() {
	var content;
	$.ajax({
		url: "https://gitee.com/api/v5/repos/zyc-2024/chat/raw/" + ch + ".json",
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
		"https://gitee.com/api/v5/repos/zyc-2024/chat/contents/" + ch + ".json",
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
	.error(function (response) {
		window.location.href = "404.html?ch=" + getch();
	});
//chatkey 19f7b43872c256d52d1bc71cbd2d0ffa
/*$.ajax({
	url: 'https://gitee.com/api/v5/repos/zyc-2024/chat/contents/xxx.json',
	crossDomain: true,access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
	method: 'post',
	contentType: 'application/json;charset=UTF-8',
	data: JSON.stringify({
		'content': 'xxx',
		'message': 'xxx'
	})
}).done(function(response) {
	console.log(response);
});*/
/*$.ajax({
	url: 'https://gitee.com/api/v5/repos/zyc-2024/chat/contents/xxx.json',
	crossDomain: true,access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
	contentType: 'application/json;charset=UTF-8'
}).done(function(response) {
	console.log(response);
});*/
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
