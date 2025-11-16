function sc(s) {
	if (s < 1024) {
		return s + "B";
	} else if (s < 1048576) {
		return (s / 1024).toFixed(2) + "KB";
	} else {
		return (s / 1048576).toFixed(2) + "MB";
	}
}
function fb64(buffer) {
	let binary = "";
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}
async function fmd5(arrayBuffer) {
	return SparkMD5.ArrayBuffer.hash(arrayBuffer);
}

let f = document.getElementById("i");
let s = document.getElementById("s");
let l = document.getElementById("l");
let m = document.getElementById("l2");
function udf() {
	let file = f.files[0];
	if (file) {
		// fmd5(file).then((md5) => {
		s.innerHTML =
			"选择了：" +
			file.name +
			"<br>大小：" +
			sc(file.size) /* + "<br>MD5：" + md5*/;
		// });
	} else {
		s.innerHTML = "你选了个寂寞a";
	}
}
function upf() {
	let file = f.files[0];
	if (!file) {
		alert("没文件你传什么传？");
		return;
	}
	if (file.size >= 104857600) {
		// 100MB
		alert("文件太大了，不能超过100MB！");
	}
	if (m) {
		m.innerText = "已经开始上传了，请勿重复点击！";
	}
	document.getElementById("p1b").innerText = "读取中……";
	var fr = new FileReader();
	fr.readAsArrayBuffer(file);
	document.getElementById("p1b").innerText = "读取完成！";
	fr.onload = function () {
		var b64ab = fb64(fr.result);
		fmd5(fr.result).then((md5) => {
			const data = JSON.stringify({
				message:
					"api-u-n[" +
					file.name +
					"]-s[" +
					file.size +
					"]-md5[" +
					md5 +
					"]",
				committer: {
					name: "zyc-2024",
					email: "61992011@qq.com",
				},
				content: b64ab,
			});

			const GITHUB_TOKEN = "YOUR_GITHUB_TOKEN"; // ← 请自己填，别写在网页源码里
			const RELEASE_ID = "262674636"; // 你刚创建的 release id

			function uploadToGithubRelease(file, md5) {
				const url =
					"https://uploads.github.com/repos/zyc-2024/chat-file/releases/" +
					RELEASE_ID +
					"/assets?name=" +
					encodeURIComponent(md5 + "_" + file.name);

				let xhr = new XMLHttpRequest();
				xhr.open("POST", url, true);

				xhr.setRequestHeader("Authorization", "Bearer " + GITHUB_TOKEN);
				xhr.setRequestHeader(
					"Content-Type",
					"application/octet-stream"
				);

				// 上传进度条
				xhr.upload.onprogress = function (e) {
					if (e.lengthComputable) {
						let percent = e.loaded / e.total;
						document.getElementById("p2a").value = percent;
						document.getElementById("p2b").innerText =
							sc(e.loaded) + " / " + sc(e.total);
					}
				};

				xhr.onreadystatechange = function () {
					if (xhr.readyState === 4) {
						let l = document.getElementById("output"); // 你原来的 l 变量

						if (xhr.status === 201) {
							const json = JSON.parse(xhr.responseText);

							l.innerHTML =
								"上传成功！这是下载链接：<br><code class='l'>" +
								json.browser_download_url +
								"</code><br><br>" +
								l.innerHTML;
						} else {
							console.error(
								"上传失败：",
								xhr.status,
								xhr.responseText
							);

							l.innerHTML =
								"<b>上传失败！</b><br>status: " +
								xhr.status +
								"<br>response:<br><code>" +
								xhr.responseText +
								"</code><br><br>" +
								l.innerHTML;
						}
					}
				};

				// 文件内容直接发，不要 Base64，不要 formdata
				xhr.send(file);
			}
		});
	};

	document.getElementById("p1b").innerText = "";
}
