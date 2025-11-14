#!/usr/bin/env python3
"""
Wiki.js 使用者同步管理工具
確保新的 Wiki.js 帳戶自動獲得穩定的 UUID
"""

import argparse
import os
import sys

# 確保能載入 app_factory
if __name__ == "__main__":
    # 在 Docker 環境中的正確路徑設定
    current_dir = os.path.dirname(os.path.abspath(__file__))
    if '/app' in current_dir:
        # 在 Docker 容器中
        sys.path.insert(0, '/app/api')
    else:
        # 在本地開發環境中
        api_dir = os.path.join(os.path.dirname(__file__))
        sys.path.insert(0, api_dir)


from app_factory import create_app
from services.wiki_database_sync_service import WikiDatabaseSyncService


def list_apps():
    """列出所有 Dify 應用程式"""
    app = create_app()
    
    with app.app_context():
        with Session(db.engine) as session:
            apps = session.query(App).all()
            
            print("📱 Dify 應用程式列表:")
            print("-" * 80)
            print(f"{'ID':<38} {'名稱':<20} {'狀態':<10} {'API啟用'}")
            print("-" * 80)
            
            for app_model in apps:
                print(f"{app_model.id} {app_model.name:<20} {app_model.status:<10} {app_model.enable_api}")


def sync_single_user(app_identifier: str, wiki_user_id: int):
    """同步單一 Wiki.js 使用者"""
    
    try:
        app_model = get_app_by_name_or_id(app_identifier)
        print(f"📱 Dify 應用程式: {app_model.name} ({app_model.id})")
        
        # 建立資料庫同步服務
        db_sync_service = WikiDatabaseSyncService.create_from_env()
        
        # 同步使用者
        print(f"🔄 開始同步 Wiki.js 使用者 {wiki_user_id}...")
        result = db_sync_service.sync_single_wiki_user(app_model, wiki_user_id)
        
        if result:
            print(f"✅ 同步成功！Dify End User ID: {result.id}")
            print(f"📋 Session ID: {result.session_id}")
        else:
            print("❌ 同步失敗")
            
    except Exception as e:
        print(f"❌ 錯誤: {e}")


def sync_all_users(app_identifier: str):
    """同步所有 Wiki.js 使用者"""
    
    try:
        app_model = get_app_by_name_or_id(app_identifier)
        print(f"📱 Dify 應用程式: {app_model.name} ({app_model.id})")
        
        # 建立資料庫同步服務
        db_sync_service = WikiDatabaseSyncService.create_from_env()
        
        # 同步所有使用者
        stats = db_sync_service.sync_all_wiki_users_to_dify(app_model)
        
        print("\n📊 同步結果:")
        print(f"  總計: {stats['total']}")
        print(f"  成功: {stats['synced']}")
        print(f"  跳過: {stats['skipped']}")
        print(f"  錯誤: {stats['errors']}")
        
    except Exception as e:
        print(f"❌ 錯誤: {e}")


def test_wiki_connection():
    """測試 Wiki.js 連接"""
    
    print("🔄 測試 Wiki.js 資料庫直接連接...")
    
    try:
        # 建立資料庫同步服務 (使用預設的環境變數配置)
        db_sync_service = WikiDatabaseSyncService()
        
        # 獲取所有使用者
        users = db_sync_service.get_all_wiki_users(active_only=False)
        
        print(f"✅ 連接成功！找到 {len(users)} 個使用者:")
        print("-" * 80)
        print(f"{'ID':<5} {'Email':<25} {'名稱':<15} {'狀態':<10} {'組數'}")
        print("-" * 80)
        
        for user in users:
            status = "✅ 活躍" if user.get('isActive', True) else "❌ 停用"
            groups_count = len(user.get('groups', []))
            user_id = user.get('id', 'N/A')
            user_email = user.get('email', 'N/A')
            user_name = user.get('name', 'N/A')
            print(f"{user_id:<5} {user_email:<25} {user_name:<15} {status:<10} {groups_count}")
            
            # 顯示使用者組
            if user.get('groups'):
                for group in user.get('groups', []):
                    print(f"      └─ 組: {group['name']} (ID: {group['id']})")
            
    except Exception as e:
        print(f"❌ 連接失敗: {e}")
        
    # 也測試 GraphQL 方式作為備份
    print("\n" + "="*60)
    print("🔄 測試 Wiki.js GraphQL API 連接...")
    
    # 獲取環境變數
    wiki_graphql_url = os.getenv('WIKI_GRAPHQL_URL', 'http://localhost:3002/graphql')
    wiki_api_key = os.getenv('WIKI_API_KEY')
    
    if not wiki_api_key:
        print("❌ 錯誤: 未設置 WIKI_API_KEY 環境變數")
        return
    
    print(f"🔗 Wiki.js GraphQL URL: {wiki_graphql_url}")
    print(f"🔑 Wiki.js API Key: {wiki_api_key[:10]}...")
    
    try:
        # 建立同步服務
        sync_service = WikiUserSyncService(wiki_graphql_url, wiki_api_key)
        
        # 獲取所有使用者
        users = sync_service.get_all_wiki_users()
        
        print(f"✅ GraphQL 連接成功！找到 {len(users)} 個使用者:")
        if len(users) == 0:
            print("⚠️ GraphQL API 返回 0 個使用者，可能是認證模組未正確載入")
            
    except Exception as e:
        print(f"❌ GraphQL 連接失敗: {e}")


def main():
    parser = argparse.ArgumentParser(description='Wiki.js 使用者同步管理工具')
    subparsers = parser.add_subparsers(dest='command', help='可用命令')
    
    # 列出應用程式
    subparsers.add_parser('list-apps', help='列出所有 Dify 應用程式')
    
    # 測試連接
    subparsers.add_parser('test-connection', help='測試 Wiki.js 連接')
    
    # 同步單一使用者
    sync_user_parser = subparsers.add_parser('sync-user', help='同步單一 Wiki.js 使用者')
    sync_user_parser.add_argument('app', help='Dify 應用程式 ID 或名稱')
    sync_user_parser.add_argument('user_id', type=int, help='Wiki.js 使用者 ID')
    
    # 同步所有使用者
    sync_all_parser = subparsers.add_parser('sync-all', help='同步所有 Wiki.js 使用者')
    sync_all_parser.add_argument('app', help='Dify 應用程式 ID 或名稱')
    
    args = parser.parse_args()
    
    if args.command == 'list-apps':
        list_apps()
    elif args.command == 'test-connection':
        test_wiki_connection()
    elif args.command == 'sync-user':
        sync_single_user(args.app, args.user_id)
    elif args.command == 'sync-all':
        sync_all_users(args.app)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()