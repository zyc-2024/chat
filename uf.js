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
		s.innerHTML = "选择了：" + file.name + "<br>大小：" + sc(file.size) /* + "<br>MD5：" + md5*/;
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
			let xhr = new XMLHttpRequest();
			xhr.open("POST", "https://gitee.com/api/v5/repos/zyc-2024/chat/contents/f%2F" + md5.slice(0, 6) + "%2F" + encodeURIComponent(file.name), true);
			xhr.setRequestHeader("Content-Type", "application/json");
			xhr.upload.onprogress = function (e) {
				if (e.lengthComputable) {
					let percent = e.loaded / e.total;
					document.getElementById("p2a").value = percent;
					document.getElementById("p2b").innerText = sc(e.loaded) + " / " + sc(e.total);
				}
			};
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					if ((xhr.status >= 200 && xhr.status < 300) or xhr.responseText==={"message":"文件名已存在"}) {
						l.innerHTML = "上传成功！要引用这个文件，复制下面的代码到聊天框：<br><code class='l'>[" + file.name + "](https://gitee.com/api/v5/repos/zyc-2024/chat/raw/f%2F" + md5.slice(0, 6) + "%2F" + encodeURIComponent(file.name) + "?access_token=19f7b43872c256d52d1bc71cbd2d0ffa)</code><br><br>或者直接点击下面的链接：<a href='https://gitee.com/api/v5/repos/zyc-2024/chat/raw/f%2F" + md5.slice(0, 6) + "%2F" + encodeURIComponent(file.name) + "?access_token=19f7b43872c256d52d1bc71cbd2d0ffa' target='_blank'>下载文件</a>";
					} else {
						console.error("上传失败：", xhr.status, xhr.statusText);
						l.innerHTML = "上传失败！你再试试？<br>错误信息：" + xhr.responseText;
					}
				}
			};
			xhr.send(
				JSON.stringify({
					access_token: "19f7b43872c256d52d1bc71cbd2d0ffa",
					content: b64ab,
					message: "u[" + file.name + "]s[" + sc(file.size) + "]m[" + md5 + "]",
				})
			);
		});
	};

	document.getElementById("p1b").innerText = "";
}
