import sys
from flask import Flask, request, jsonify
from datetime import datetime
import subprocess
import os


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

# 模擬部門同步狀態資料
sync_status = {
    "HR": {"totalPages": 100, "syncedPages": 50, "status": "in-progress", "lastSyncTime": "2025-12-29T00:00:00Z"},
    "Finance": {"totalPages": 80, "syncedPages": 80, "status": "success", "lastSyncTime": "2025-12-28T23:00:00Z"},
    # ...其他部門
}

LOG_FILE_PATH = "/var/log/dify-wiki-sync/sync.log"

@app.route('/api/admin/sync-status', methods=['GET'])
def get_sync_status():
    return jsonify(sync_status)

@app.route('/api/admin/sync-department', methods=['POST'])
def sync_department():
    data = request.json
    department = data.get('department')
    if department not in sync_status:
        return jsonify({"error": "Department not found"}), 404

    # 模擬同步邏輯
    sync_status[department]["syncedPages"] = sync_status[department]["totalPages"]
    sync_status[department]["status"] = "success"
    sync_status[department]["lastSyncTime"] = "2025-12-29T01:00:00Z"

    return jsonify({"message": f"Department {department} synced successfully"})

@app.route('/api/admin/setup-cron', methods=['POST'])
def setup_cron():
    data = request.json
    time = data.get('time', '00:00')

    # 模擬設定自動同步時間
    return jsonify({"message": f"Auto sync time set to {time}"})

@app.route('/api/admin/sync-log', methods=['GET'])
def get_sync_log():
    try:
        if not os.path.exists(LOG_FILE_PATH):
            return jsonify({"error": "Log file not found"}), 404

        with open(LOG_FILE_PATH, 'r') as log_file:
            lines = log_file.readlines()
            return jsonify({"log": lines[-100:]})  # 返回最後 100 行日誌
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
