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
function getarg(){
	let a=window.location.search.substring(1).split("&");
	let c={};
	a.forEach(function (e) {
		let b = e.split("=");
		c[b[0]] = b[1];
	});
	return c;
}