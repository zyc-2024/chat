function read(f) {
	return $.ajax({
		url:
			"https://gitee.com/api/v5/repos/zyc-2024/chat/raw/" +
			f +
			"?access_token=19f7b43872c256d52d1bc71cbd2d0ffa",
		crossDomain: true,
		contentType: "application/json;charset=UTF-8",
	}).then(function (response) {
		// console.log(response);
		return JSON.parse(response);
	});
}
function write(f, d) {
	return $.ajax({
		url:
			"https://gitee.com/api/v5/repos/zyc-2024/chat/contents/" +
			encodeURIComponent(f),
		type: "PUT",
		data: JSON.stringify({
			access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
			message: "update",
			content: Base64.encode(JSON.stringify(d)),
			sha: d.sha,
		}),
		crossDomain: true,
		contentType: "application/json;charset=UTF-8",
	}).then(function (response) {
		// console.log(response);
		return response;
	});
}
function getarg() {
	let a = window.location.search.substring(1).split("&");
	let c = {};
	a.forEach(function (e) {
		let b = e.split("=");
		c[b[0]] = b[1];
	});
	return c;
}

function getid() {
	var id = 0;
	$.ajax({
		url: "https://gitee.com/api/v5/repos/zyc-2024/chat/contents/private%2Fid.json",
		data: {
			access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
		},
		async: false,
		success: function (response) {
			id = parseInt(Base64.decode(response.content));
		},
	});
	return id;
}
function addid() {
	$.get(
		"https://gitee.com/api/v5/repos/zyc-2024/chat/contents/private%2Fid.json",
		{
			access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
		}
	).done(function (response) {
		console.log(response);
		var sha = response.sha;
		var id = parseInt(Base64.decode(response.content));
		console.log(id);
		$.ajax({
			url: "https://gitee.com/api/v5/repos/zyc-2024/chat/contents/private%2Fid.json",
			crossDomain: true,
			method: "PUT",
			contentType: "application/json;charset=UTF-8",
			data: JSON.stringify({
				access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
				content: Base64.encode(String(getid() + 1)),
				sha: sha,
				message: "id add 1",
			}),
		}).done(function (response) {
			return;
		});
	});
}
function gettime(time = +new Date()) {
	var date = new Date(time + 8 * 3600 * 1000);
	return date.toJSON().substr(0, 19).replace("T", " ").replaceAll("-", "");
}
function getname() {
	if (document.cookie === "") {
		document.cookie =
			"n=" +
			prompt("请输入你的名字") +
			";path=/;expires=Fri, 31 Dec 9999 23:59:59 GMT;max-age=2147483647";
	}
	return document.cookie.split("=")[1].split(";")[0];
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
setTimeout(() => {
	fetch("version.txt")
		.then((response) => response.text())
		.then((version) => {
			document.getElementById("titlee").innerText =
				"zyc2024的聊天网页Ver" + version;
		})
		.catch(() => {
			document.getElementById("titlee").innerText =
				"zyc2024的聊天网页Ver¯\\_(ツ)_/¯";
		});
}, 500);
if (
	window.location.pathname != "/chat/" &&
	window.location.pathname != "/chat/index.html"
) {
	showname();
}
