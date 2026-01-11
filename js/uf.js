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
		fmd5(fr.result).then((md5) => {
			const url =
				"https://api.61992011.workers.dev/?md5=" +
				md5 +
				"&fname=" +
				encodeURIComponent(file.name);
			let xhr = new XMLHttpRequest();
			xhr.open("POST", url);
			xhr.upload.onprogress = function (e) {
				if (e.lengthComputable) {
					document.getElementById("p2a").value = e.loaded / e.total;
					document.getElementById("p2b").innerText =
						(e.loaded / 1024).toFixed(2) +
						" KB / " +
						(e.total / 1024).toFixed(2) +
						" KB";
				}
			};
			xhr.onreadystatechange = function () {
				let l = document.getElementById("l");
				if (xhr.readyState === 4) {
					if (xhr.status === 201) {
						const json = JSON.parse(xhr.responseText);
						l.innerHTML =
							"上传成功！下载链接：<br><code>" +
							json.browser_download_url +
							"</code><br><br>" +
							l.innerHTML;
					} else {
						l.innerHTML =
							"<b>上传失败：</b><br><code>" +
							xhr.responseText +
							"</code><br><br>" +
							l.innerHTML;
					}
				}
			};
			xhr.send(file);
		});
	};
	document.getElementById("p1b").innerText = "";
}
