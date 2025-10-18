from flask import Flask, send_from_directory
import os

# 创建 Flask 应用，static_folder 指向当前目录
app = Flask(__name__, static_folder='.', static_url_path='')

# 主页与静态文件直接由 Flask 提供
@app.route('/')
def index():
    return app.send_static_file('index.html')

# favicon 路由（可选，兼容旧浏览器）
@app.route('/favicon.bmp')
def favicon():
    return send_from_directory('.', 'favicon.bmp', mimetype='image/bmp')

# 如果访问不存在的路径，返回 404.html
@app.errorhandler(404)
def not_found(e):
    if os.path.exists('404.html'):
        return app.send_static_file('404.html'), 404
    return '404 Not Found', 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
