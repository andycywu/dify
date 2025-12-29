import sys
from flask import Flask, request, jsonify
from datetime import datetime
import subprocess


def is_db_command():
    if len(sys.argv) > 1 and sys.argv[0].endswith("flask") and sys.argv[1] == "db":
        return True
    return False


# create app
if is_db_command():
    from app_factory import create_migrations_app

    app = create_migrations_app()
else:
    # It seems that JetBrains Python debugger does not work well with gevent,
    # so we need to disable gevent in debug mode.
    # If you are using debugpy and set GEVENT_SUPPORT=True, you can debug with gevent.
    # if (flask_debug := os.environ.get("FLASK_DEBUG", "0")) and flask_debug.lower() in {"false", "0", "no"}:
    # from gevent import monkey
    #
    # # gevent
    # monkey.patch_all()
    #
    # from grpc.experimental import gevent as grpc_gevent  # type: ignore
    #
    # # grpc gevent
    # grpc_gevent.init_gevent()

    # import psycogreen.gevent  # type: ignore
    #
    # psycogreen.gevent.patch_psycopg()

    from app_factory import create_app

    app = create_app()
    celery = app.extensions["celery"]

# 手動同步 API
@app.route('/api/admin/sync-wiki', methods=['POST'])
def sync_wiki():
    try:
        # 呼叫同步腳本
        subprocess.run(['bash', 'sync-wiki.sh'], check=True)
        return jsonify({"message": "同步請求已成功發送。"}), 200
    except subprocess.CalledProcessError as e:
        return jsonify({"error": f"同步失敗: {str(e)}"}), 500

# 設置自動同步 API
@app.route('/api/admin/setup-cron', methods=['POST'])
def setup_cron():
    try:
        data = request.get_json()
        cron_time = data.get('cron_time')  # 預期格式: "0 2 * * *" (每天凌晨2點)

        if not cron_time:
            return jsonify({"error": "請提供有效的 cron 時間格式。"}), 400

        # 配置 cron job
        cron_command = f'(crontab -l; echo "{cron_time} bash /path/to/sync-wiki.sh") | crontab -'
        subprocess.run(cron_command, shell=True, check=True)

        return jsonify({"message": "自動同步已成功設置。"}), 200
    except Exception as e:
        return jsonify({"error": f"設置失敗: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
