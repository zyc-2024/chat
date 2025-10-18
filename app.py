from flask import Flask, send_from_directory
import os, webbrowser, threading

app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/favicon.bmp')
def favicon():
    return send_from_directory('.', 'favicon.bmp', mimetype='image/bmp')

@app.errorhandler(404)
def not_found(e):
    if os.path.exists('404.html'):
        return app.send_static_file('404.html'), 404
    return '404 Not Found', 404

def open_browser():
    webbrowser.open('http://127.0.0.1:5000')

if __name__ == '__main__':
    # 启动时打开默认浏览器
    threading.Timer(0.8, open_browser).start()
    # 生产模式运行：关闭调试日志与自动重载
    import logging
    log = logging.getLogger('werkzeug')
    log.setLevel(logging.ERROR)  # 禁止请求日志
    app.run(host='127.0.0.1', port=5000, debug=False, use_reloader=False)
