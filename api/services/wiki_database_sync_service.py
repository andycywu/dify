"""
Wiki.js 資料庫直接存取服務
直接從 Wiki.js 資料庫讀取使用者資料並同步到 Dify
"""
import os
from typing import Any, Optional

import psycopg2
from sqlalchemy.orm import Session

from extensions.ext_database import db
from models.model import App, EndUser
from services.wiki_user_mapping_service import WikiUserMappingService


class WikiDatabaseSyncService:
    """Wiki.js 資料庫直接同步服務"""

    def __init__(self, wiki_db_config: Optional[dict[str, str]] = None):
        """
        初始化 Wiki.js 資料庫連接

        Args:
            wiki_db_config: 資料庫連接配置，如果為 None 則使用環境變數
        """
        self.db_config = wiki_db_config or self.get_database_config()

    def get_database_config(self) -> dict:
        """獲取資料庫配置"""
        return {
            'host': os.environ.get('DB_HOST', 'db'),  # Docker 中使用 'db' 作為預設主機名
            'port': int(os.environ.get('DB_PORT', '5432')),
            'database': os.environ.get('DB_DATABASE', 'dify'),
            'user': os.environ.get('DB_USERNAME', 'postgres'),
            'password': os.environ.get('DB_PASSWORD', '')
        }

    def get_wiki_db_connection(self):
        """建立 Wiki.js 資料庫連接"""
        return psycopg2.connect(
            host=self.db_config['host'],
            port=self.db_config['port'],
            database=self.db_config['database'],
            user=self.db_config['user'],
            password=self.db_config['password']
        )

    def get_wiki_user_by_id(self, user_id: int) -> Optional[dict[str, Any]]:
        """
        從 Wiki.js 資料庫獲取使用者資料

        Args:
            user_id: Wiki.js 使用者 ID

        Returns:
            Dict: 使用者資料或 None
        """
        try:
            conn = self.get_wiki_db_connection()
            cur = conn.cursor()

            # 查詢使用者基本資料
            cur.execute("""
                SELECT id, email, name, "isActive", "isVerified", "createdAt", "updatedAt"
                FROM users
                WHERE id = %s
            """, (user_id,))

            user_row = cur.fetchone()
            if not user_row:
                return None

            # 查詢使用者組
            cur.execute("""
                SELECT g.id, g.name
                FROM groups g
                JOIN "userGroups" ug ON g.id = ug."groupId"
                WHERE ug."userId" = %s
            """, (user_id,))

            groups = [{'id': row[0], 'name': row[1]} for row in cur.fetchall()]

            conn.close()

            return {
                'id': user_row[0],
                'email': user_row[1],
                'name': user_row[2],
                'isActive': user_row[3],
                'isVerified': user_row[4],
                'createdAt': user_row[5].isoformat() if user_row[5] else None,
                'updatedAt': user_row[6].isoformat() if user_row[6] else None,
                'groups': groups
            }

        except Exception as e:
            print(f"Error fetching Wiki.js user {user_id}: {e}")
            return None

    def get_all_wiki_users(self, active_only: bool = True) -> list[dict[str, Any]]:
        """
        獲取所有 Wiki.js 使用者

        Args:
            active_only: 只返回活躍使用者

        Returns:
            List[Dict]: 使用者列表
        """
        try:
            conn = self.get_wiki_db_connection()
            cur = conn.cursor()

            # 構建查詢
            query = """
                SELECT id, email, name, "isActive", "isVerified", "createdAt", "updatedAt"
                FROM users
            """

            if active_only:
                query += ' WHERE "isActive" = true'

            query += ' ORDER BY id'

            cur.execute(query)
            users = []

            for user_row in cur.fetchall():
                user_id = user_row[0]

                # 查詢使用者組
                cur.execute("""
                    SELECT g.id, g.name
                    FROM groups g
                    JOIN "userGroups" ug ON g.id = ug."groupId"
                    WHERE ug."userId" = %s
                """, (user_id,))

                groups = [{'id': row[0], 'name': row[1]} for row in cur.fetchall()]

                users.append({
                    'id': user_row[0],
                    'email': user_row[1],
                    'name': user_row[2],
                    'isActive': user_row[3],
                    'isVerified': user_row[4],
                    'createdAt': user_row[5].isoformat() if user_row[5] else None,
                    'updatedAt': user_row[6].isoformat() if user_row[6] else None,
                    'groups': groups
                })

            conn.close()
            return users

        except Exception as e:
            print(f"Error fetching all Wiki.js users: {e}")
            return []

    def sync_wiki_user_to_dify(self, app_model: App, wiki_user_data: dict[str, Any]) -> Optional[EndUser]:
        """
        將 Wiki.js 使用者同步到 Dify End User

        Args:
            app_model: Dify App 模型
            wiki_user_data: Wiki.js 使用者資料

        Returns:
            EndUser: 同步後的 End User 或 None
        """
        if not wiki_user_data or not wiki_user_data.get('id'):
            return None

        try:
            # 使用 Wiki 使用者映射服務建立或更新 End User
            end_user = WikiUserMappingService.create_or_get_end_user_for_wiki_user(
                app_model, wiki_user_data
            )

            print(f"✅ Synced Wiki.js user {wiki_user_data['id']} ({wiki_user_data.get('name', 'Unknown')}) to Dify")
            return end_user

        except Exception as e:
            print(f"❌ Error syncing Wiki.js user {wiki_user_data['id']}: {e}")
            return None

    def sync_all_wiki_users_to_dify(self, app_model: App) -> dict[str, int]:
        """
        同步所有 Wiki.js 使用者到 Dify

        Args:
            app_model: Dify App 模型

        Returns:
            Dict: 同步統計
        """
        stats = {
            'total': 0,
            'synced': 0,
            'skipped': 0,
            'errors': 0
        }

        # 獲取所有 Wiki.js 使用者
        wiki_users = self.get_all_wiki_users()
        stats['total'] = len(wiki_users)

        print(f"🔄 開始同步 {stats['total']} 個 Wiki.js 使用者到 Dify...")

        for wiki_user in wiki_users:
            # 跳過非活躍使用者
            if not wiki_user.get('isActive', True):
                stats['skipped'] += 1
                continue

            result = self.sync_wiki_user_to_dify(app_model, wiki_user)

            if result:
                stats['synced'] += 1
            else:
                stats['errors'] += 1

        print(
            f"✅ 同步完成：總計 {stats['total']}, "
            f"成功 {stats['synced']}, 跳過 {stats['skipped']}, 錯誤 {stats['errors']}"
        )
        return stats

    def sync_single_wiki_user(self, app_model: App, wiki_user_id: int) -> Optional[EndUser]:
        """
        同步單一 Wiki.js 使用者到 Dify

        Args:
            app_model: Dify App 模型
            wiki_user_id: Wiki.js 使用者 ID

        Returns:
            EndUser: 同步後的 End User 或 None
        """
        # 從 Wiki.js 獲取使用者資料
        wiki_user_data = self.get_wiki_user_by_id(wiki_user_id)

        if not wiki_user_data:
            print(f"❌ Wiki.js 使用者 {wiki_user_id} 不存在")
            return None

        # 同步到 Dify
        return self.sync_wiki_user_to_dify(app_model, wiki_user_data)

    def ensure_wiki_user_exists_in_dify(self, app_model: App, wiki_user_id: int) -> EndUser:
        """
        確保 Wiki.js 使用者在 Dify 中存在，如果不存在則自動同步

        Args:
            app_model: Dify App 模型
            wiki_user_id: Wiki.js 使用者 ID

        Returns:
            EndUser: Dify End User
        """
        # 先檢查是否已存在
        stable_uuid = WikiUserMappingService.get_wiki_user_uuid(wiki_user_id, app_model.id)

        with Session(db.engine, expire_on_commit=False) as session:
            existing_end_user = (
                session.query(EndUser)
                .where(
                    EndUser.tenant_id == app_model.tenant_id,
                    EndUser.app_id == app_model.id,
                    EndUser.session_id == stable_uuid,
                    EndUser.type == "service_api",
                )
                .first()
            )

            if existing_end_user:
                return existing_end_user

        # 不存在則自動同步
        print(f"🔄 Wiki.js 使用者 {wiki_user_id} 在 Dify 中不存在，開始同步...")
        synced_end_user = self.sync_single_wiki_user(app_model, wiki_user_id)

        if synced_end_user:
            return synced_end_user

        # 如果同步失敗，使用回退機制
        print(f"⚠️ Wiki.js 使用者 {wiki_user_id} 同步失敗，使用回退機制...")
        wiki_user_data = {
            'id': wiki_user_id,
            'email': f'wiki_user_{wiki_user_id}@local',
            'name': f'Wiki User {wiki_user_id}',
            'groups': []
        }

        return WikiUserMappingService.create_or_get_end_user_for_wiki_user(
            app_model, wiki_user_data
        )

    @staticmethod
    def create_from_env() -> 'WikiDatabaseSyncService':
        """
        從環境變數建立服務實例

        Returns:
            WikiDatabaseSyncService: 服務實例
        """
        wiki_db_config = {
            'host': os.getenv('WIKI_DB_HOST', 'localhost'),
            'port': os.getenv('WIKI_DB_PORT', '5432'),
            'database': os.getenv('WIKI_DB_NAME', 'wiki'),
            'user': os.getenv('WIKI_DB_USER', 'postgres'),
            'password': os.getenv('WIKI_DB_PASSWORD', 'difyai123456')
        }

        return WikiDatabaseSyncService(wiki_db_config)
