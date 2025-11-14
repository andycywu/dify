#!/usr/bin/env python3
"""
Wiki.js 使用者 UUID 遷移腳本
將現有的數字 session_id 轉換為穩定的 UUID
"""

import sys

# 添加 api 目錄到 Python 路徑
sys.path.append('/Users/andycyw/dify/api')

from sqlalchemy.orm import Session

from app_factory import create_app
from extensions.ext_database import db
from models.model import App, EndUser
from services.wiki_user_mapping_service import WikiUserMappingService


def migrate_wiki_users():
    """遷移 Wiki.js 使用者記錄"""
    
    app = create_app()
    
    with app.app_context():
        # 獲取所有 Dify Apps
        with Session(db.engine) as session:
            apps = session.query(App).all()
            
            print(f"找到 {len(apps)} 個 Dify 應用程式")
            
            total_stats = {
                'migrated': 0,
                'skipped': 0,
                'errors': 0
            }
            
            for app_model in apps:
                print(f"\n處理應用程式: {app_model.name} (ID: {app_model.id})")
                
                # 遷移此應用程式的 Wiki.js 使用者
                stats = WikiUserMappingService.migrate_existing_wiki_users(app_model)
                
                print(f"  遷移: {stats['migrated']}")
                print(f"  跳過: {stats['skipped']}")
                print(f"  錯誤: {stats['errors']}")
                
                # 累計統計
                total_stats['migrated'] += stats['migrated']
                total_stats['skipped'] += stats['skipped']
                total_stats['errors'] += stats['errors']
            
            print("\n=== 總計 ===")
            print(f"總遷移: {total_stats['migrated']}")
            print(f"總跳過: {total_stats['skipped']}")
            print(f"總錯誤: {total_stats['errors']}")


def show_current_status():
    """顯示目前的 end_users 狀態"""
    
    app = create_app()
    
    with app.app_context():
        with Session(db.engine) as session:
            # 查詢所有 end_users
            end_users = session.query(EndUser).all()
            
            print("=== 目前 End Users 狀態 ===")
            print(f"總記錄數: {len(end_users)}")
            
            # 分析 session_id 格式
            uuid_format = 0
            digit_format = 0
            json_format = 0
            default_user = 0
            other_format = 0
            
            for user in end_users:
                session_id = user.session_id
                
                if session_id == "DEFAULT-USER":
                    default_user += 1
                elif session_id and session_id.isdigit():
                    digit_format += 1
                elif session_id and len(session_id) == 36 and session_id.count('-') == 4:
                    uuid_format += 1
                elif session_id and session_id.startswith('{'):
                    json_format += 1
                else:
                    other_format += 1
            
            print(f"UUID 格式: {uuid_format}")
            print(f"數字格式: {digit_format}")
            print(f"JSON 格式: {json_format}")
            print(f"DEFAULT-USER: {default_user}")
            print(f"其他格式: {other_format}")
            
            # 顯示前 10 個記錄作為範例
            print("\n=== 前 10 個記錄範例 ===")
            for i, user in enumerate(end_users[:10]):
                print(f"{i+1}. ID: {user.id}, Session ID: {user.session_id[:50]}...")


def test_uuid_generation():
    """測試 UUID 生成功能"""
    
    print("=== 測試 UUID 生成 ===")
    
    # 測試數據
    test_cases = [
        (1, "test-app-id"),
        (2, "test-app-id"),
        (1, "another-app-id"),
        (999, "test-app-id"),
    ]
    
    for wiki_user_id, app_id in test_cases:
        uuid_result = WikiUserMappingService.generate_stable_uuid_for_wiki_user(
            wiki_user_id, app_id
        )
        print(f"Wiki User {wiki_user_id} + App '{app_id}' -> {uuid_result}")
    
    # 測試一致性
    print("\n=== 一致性測試 ===")
    uuid1 = WikiUserMappingService.generate_stable_uuid_for_wiki_user(1, "test-app")
    uuid2 = WikiUserMappingService.generate_stable_uuid_for_wiki_user(1, "test-app")
    print(f"兩次生成相同參數: {uuid1 == uuid2}")
    print(f"UUID 1: {uuid1}")
    print(f"UUID 2: {uuid2}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法:")
        print("  python migrate_wiki_users.py status    # 顯示目前狀態")
        print("  python migrate_wiki_users.py test      # 測試 UUID 生成")
        print("  python migrate_wiki_users.py migrate   # 執行遷移")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "status":
        show_current_status()
    elif command == "test":
        test_uuid_generation()
    elif command == "migrate":
        print("⚠️  即將開始遷移 Wiki.js 使用者記錄")
        print("這將修改數據庫中的 end_users 表")
        
        confirm = input("確定要繼續嗎? (y/N): ")
        if confirm.lower() == 'y':
            migrate_wiki_users()
        else:
            print("取消遷移")
    else:
        print(f"未知命令: {command}")
        sys.exit(1)