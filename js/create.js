function getkey() {
	return SparkMD5.hash(String(getid()) + String(getarg().key));
}

function a1() {
	$("#hyw").text("加载中...(90%)");
	$.ajax({
		url:
			"https://gitee.com/api/v5/repos/zyc-2024/chat/contents/public%2Fmsg%2F" +
			getarg().ch +
			".json",
		crossDomain: true,
		method: "post",
		contentType: "application/json;charset=UTF-8",
		data: JSON.stringify({
			access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
			content: Base64.encode(
				JSON.stringify({
					msg: [
						{
							name: getname(),
							user: getCookie("uname"),
							time: gettime(),
							content:
								'Created channel "' +
								decodeURIComponent(getarg().ch) +
								'"',
						},
					],
				}),
			),
			message: "initial public[" + getarg().ch + "]",
		}),
	})
		.done(function (response) {
			$("#hyw").text("加载中...(100%)");
			window.location.href = "core.html?type=u&ch=" + getarg().ch;
		})
		.fail(function (response) {
			$("#hyw").text("加载中...(100%)");
			window.location.href = "core.html?type=u&ch=" + getarg().ch;
		});
}
function a2() {
	$("#hyw").text("加载中...(60%)");
	$.get(
		"https://gitee.com/api/v5/repos/zyc-2024/chat/contents/public/index.json?access_token=19f7b43872c256d52d1bc71cbd2d0ffa",
	).done(function (response) {
		console.log(response);
		let itssha = response.sha;
		$.ajax({
			url: "https://gitee.com/api/v5/repos/zyc-2024/chat/contents/public%2Findex.json",
			crossDomain: true,
			method: "PUT",
			contentType: "application/json;charset=UTF-8",
			data: JSON.stringify({
				access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
				content: Base64.encode(JSON.stringify(r)),
				sha: itssha,
				message: "update index",
			}),
		}).done(function (response) {
			$("#hyw").text("加载中...(85%)");
			a1();
		});
	});
}
function a3() {
	$("#hyw").text("加载中...(80%)");
	$.ajax({
		url:
			"https://gitee.com/api/v5/repos/zyc-2024/chat/contents/public%2Fmsg%2F" +
			getarg().ch +
			".json",
		crossDomain: true,
		method: "post",
		contentType: "application/json;charset=UTF-8",
		data: JSON.stringify({
			access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
			content: Base64.encode(
				JSON.stringify({
					msg: [
						{
							name: getname(),
							time: gettime(),
							content:
								'Created channel "' +
								decodeURIComponent(getarg().ch) +
								'"',
						},
					],
				}),
			),
			message: "initial public[" + getarg().ch + "]",
		}),
	})
		.done(function (response) {
			$("#hyw").text("加载中...(100%)");
			window.location.href = "core.html?type=u&ch=" + getarg().ch;
		})
		.fail(function (response) {
			$("#hyw").text("加载中...(100%)");
			window.location.href = "core.html?type=u&ch=" + getarg().ch;
		});
}
function a4() {
	$("#hyw").text("加载中...(10%)");
	$.ajax({
		url: "https://gitee.com/api/v5/repos/zyc-2024/chat/raw/public/index.json",
		crossDomain: true,
		contentType: "application/json;charset=UTF-8",
		data: { access_token: "19f7b43872c256d52d1bc71cbd2d0ffa" },
	}).done(function (response) {
		$("#hyw").text("加载中...(25%)");
		r = JSON.parse(response);
		shaa = r.sha;
		$.get(
			"https://gitee.com/api/v5/repos/zyc-2024/chat/contents/public%2Fmsg%2F" +
				getarg().ch +
				".json",
			{ access_token: "19f7b43872c256d52d1bc71cbd2d0ffa" },
		).done(function (response) {
			$("#hyw").text("加载中...(40%)");
			if (!r.ch.includes(getarg().ch)) {
				r.ch[r.ch.length] = getarg().ch;
				$("#hyw").text("加载中...(45%)");
				a2();
			} else {
				$("#hyw").text("加载中...(45%)");
				a3();
			}
		});
	});
}
function b1() {
	$("#hyw").text("加载中...(75%)");
	$.ajax({
		url:
			"https://gitee.com/api/v5/repos/zyc-2024/chat/contents/private%2Fmsg%2F" +
			getid() +
			"_" +
			SparkMD5.hash(getarg().key) +
			".json",
		crossDomain: true,
		method: "post",
		contentType: "application/json;charset=UTF-8",
		data: JSON.stringify({
			access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
			content: b2(),
			message:
				"initial private[" +
				getid() +
				"]+[" +
				SparkMD5.hash(getarg().key) +
				"]",
		}),
	}).done(function (response) {
		$("#hyw").text("加载中...(100%)");
		window.location.href =
			"core.html?type=r&id=" + getid() + "&key=" + getarg().key;
	});
}
function b2() {
	$("#hyw").text("加载中...(90%)");
	let msgs = [
		{
			name: getname(),
			user: getCookie("uname"),
			time: gettime(),
			content: "This private channel has just been created!",
		},
		{
			name: getname(),
			user: getCookie("uname"),
			time: gettime(),
			content: "Id:" + getid() + "\nKey:" + getarg().key,
		},
		{
			name: getname(),
			user: getCookie("uname"),
			time: gettime(),
			content: "Please remember them!",
		},
	];
	$("#hyw").text("加载中...(95%)");
	return Base64.encode(
		JSON.stringify(
			_encrypt(
				{
					msg: msgs,
				},
				getarg().key,
			),
		),
	);
}
function b3() {
	$("#hyw").text("加载中...(20%)");
	$.get(
		"https://gitee.com/api/v5/repos/zyc-2024/chat/contents/private%2Fid.json?access_token=19f7b43872c256d52d1bc71cbd2d0ffa",
	).done(function (response) {
		console.log(response);
		var sha = response.sha;
		var id = parseInt(Base64.decode(response.content));
		console.log(id);
		$("#hyw").text("加载中...(45%)");
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
			$("#hyw").text("加载中...(70%)");
			b1();
		});
	});
}
$("#hyw").text("加载中...(5%)");
if (
	(getarg().type != "r" && getarg().type != "u") ||
	(getarg().type == "r" && !getarg().key) ||
	(getarg().type == "u" && !getarg().ch)
) {
	$("#hyw").text("Error! 你确定这不是你输错了？");
} else if (getarg().type == "u") {
	a4();
} else {
	b3();
}
