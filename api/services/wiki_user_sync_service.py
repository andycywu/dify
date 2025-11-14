"""
Wiki.js 使用者同步服務
提供 Wiki.js 與 Dify End User 的主動同步功能
"""
from typing import Any, Optional

import requests
from sqlalchemy.orm import Session

from extensions.ext_database import db
from models.model import App, EndUser
from services.wiki_user_mapping_service import WikiUserMappingService


class WikiUserSyncService:
    """Wiki.js 使用者同步服務"""
    
    def __init__(self, wiki_graphql_url: str, wiki_api_key: str):
        """
        初始化 Wiki.js 同步服務
        
        Args:
            wiki_graphql_url: Wiki.js GraphQL API URL
            wiki_api_key: Wiki.js API Key
        """
        self.wiki_graphql_url = wiki_graphql_url
        self.wiki_api_key = wiki_api_key
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {wiki_api_key}',
            'Content-Type': 'application/json'
        })
    
    def get_wiki_user_by_id(self, user_id: int) -> Optional[dict[str, Any]]:
        """
        從 Wiki.js 獲取使用者資料
        
        Args:
            user_id: Wiki.js 使用者 ID
            
        Returns:
            Dict: 使用者資料或 None
        """
        query = """
        query GetUser($id: Int!) {
          authGetUser(id: $id) {
            id
            email
            name
            isActive
            groups {
              id
              name
            }
            createdAt
            updatedAt
          }
        }
        """
        
        variables = {"id": user_id}
        
        try:
            response = self.session.post(
                self.wiki_graphql_url,
                json={
                    'query': query,
                    'variables': variables
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'data' in data and 'authGetUser' in data['data']:
                    return data['data']['authGetUser']
            
            return None
            
        except Exception as e:
            print(f"Error fetching Wiki.js user {user_id}: {e}")
            return None
    
    def get_all_wiki_users(self) -> list[dict[str, Any]]:
        """
        獲取所有 Wiki.js 使用者
        
        Returns:
            List[Dict]: 使用者列表
        """
        query = """
        query GetAllUsers {
          authGetAllUsers {
            id
            email
            name
            isActive
            groups {
              id
              name
            }
            createdAt
            updatedAt
          }
        }
        """
        
        try:
            response = self.session.post(
                self.wiki_graphql_url,
                json={'query': query}
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'data' in data and 'authGetAllUsers' in data['data']:
                    return data['data']['authGetAllUsers']
            
            return []
            
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
            print(f"❌ Wiki.js 使用者 {wiki_user_id} 不存在或無法存取")
            return None
        
        # 同步到 Dify
        return self.sync_wiki_user_to_dify(app_model, wiki_user_data)
    
    def get_dify_end_user_for_wiki_user(self, app_model: App, wiki_user_id: int) -> Optional[EndUser]:
        """
        獲取 Wiki.js 使用者對應的 Dify End User
        
        Args:
            app_model: Dify App 模型
            wiki_user_id: Wiki.js 使用者 ID
            
        Returns:
            EndUser: 對應的 End User 或 None
        """
        # 生成穩定的 UUID
        stable_uuid = WikiUserMappingService.get_wiki_user_uuid(wiki_user_id, app_model.id)
        
        with Session(db.engine, expire_on_commit=False) as session:
            end_user = (
                session.query(EndUser)
                .where(
                    EndUser.tenant_id == app_model.tenant_id,
                    EndUser.app_id == app_model.id,
                    EndUser.session_id == stable_uuid,
                    EndUser.type == "service_api",
                )
                .first()
            )
            
            return end_user
    
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
        existing_end_user = self.get_dify_end_user_for_wiki_user(app_model, wiki_user_id)
        
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