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
function put(
	path,
	messages,
	data,
	sha,
	nextfunc = function (response) {
		return response;
	},
	failfunc = function (error) {
		console.error("Error fetching " + path + ": ", error);
	},
) {
	return $.ajax({
		url:
			"https://gitee.com/api/v5/repos/zyc-2024/chat/contents/" +
			encodeURIComponent(path),
		type: "PUT",
		data: JSON.stringify({
			access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
			message: messages,
			content: Base64.encode(JSON.stringify(data)),
			sha: sha,
		}),
		crossDomain: true,
		contentType: "application/json;charset=UTF-8",
	})
		.done(function (response) {
			// console.log(response);
			return nextfunc(JSON.parse(response));
		})
		.fail(function (error) {
			return failfunc(error);
		});
}
function get(
	path,
	nextfunc = function (response) {
		return response;
	},
	failfunc = function (error) {
		console.error("Error fetching " + path + ": ", error);
	},
) {
	return $.ajax({
		url:
			"https://gitee.com/api/v5/repos/zyc-2024/chat/contents/" +
			encodeURIComponent(path),
		data: {
			access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
		},
		crossDomain: true,
		contentType: "application/json;charset=UTF-8",
	})
		.then(function (response) {
			return nextfunc(
				JSON.parse(Base64.decode(response.content)),
				response.sha,
			);
		})
		.fail(function (error) {
			return failfunc(error);
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
//chatkey 19f7b43872c256d52d1bc71cbd2d0ffa
function renderMessageHTML(msg) {
	const preProcessed = preRenderTex(msg.content || "");
	const dirty = md.render(preProcessed);
	const clean = DOMPurify.sanitize(dirty, {
		ADD_TAGS: ["span"],
		ADD_ATTR: ["class", "style"],
	});
	const safeName = DOMPurify.sanitize(msg.name || "Anonymous", {
		ALLOWED_TAGS: [],
		ALLOWED_ATTR: [],
	});
	const safeTime = DOMPurify.sanitize(msg.time || "", {
		ALLOWED_TAGS: [],
		ALLOWED_ATTR: [],
	});
	return (
		"<br><div class='crow'><span class='call'><div class='cname'>" +
		safeName +
		"</div><div class='ctime'>" +
		safeTime +
		"</div></span><div class='ccontent'>" +
		clean +
		"</div></div>"
	);
}

function render(msg, mode = "append") {
	const chat = document.getElementById("chat");
	const html = renderMessageHTML(msg);
	if (mode === "prepend") {
		chat.innerHTML = html + chat.innerHTML;
	} else {
		chat.innerHTML += html;
	}
	try {
		hljs.highlightAll();
	} catch (e) {}
}
function getid() {
	var id = 0;
	$.ajax({
		url: "https://gitee.com/api/v5/repos/zyc-2024/chat/contents/private%2Fid.json?access_token=19f7b43872c256d52d1bc71cbd2d0ffa",
		async: false,
		success: function (response) {
			id = parseInt(Base64.decode(response.content));
		},
	});
	return id;
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
