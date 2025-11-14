"""
Wiki.js User Mapping Service
為 Wiki.js 使用者建立與 Dify End User 的穩定 UUID 映射
"""
import hashlib
from typing import Any

from sqlalchemy.orm import Session

from extensions.ext_database import db
from models.model import App, EndUser


class WikiUserMappingService:
    """Wiki.js 使用者 UUID 映射服務"""
    
    @staticmethod
    def generate_stable_uuid_for_wiki_user(wiki_user_id: int, app_id: str) -> str:
        """
        為 Wiki.js 使用者生成穩定的 UUID
        使用 app_id + wiki_user_id 作為種子確保一致性
        
        Args:
            wiki_user_id: Wiki.js 使用者 ID (integer)
            app_id: Dify App ID
            
        Returns:
            str: 穩定的 UUID 字串
        """
        # 使用 app_id 和 wiki_user_id 作為種子
        seed = f"wiki_user_mapping_{app_id}_{wiki_user_id}"
        
        # 生成穩定的 UUID (基於 MD5 hash)
        hash_object = hashlib.md5(seed.encode())
        hash_hex = hash_object.hexdigest()
        
        # 將 32 字符的 hex 轉換為 UUID 格式
        uuid_str = f"{hash_hex[:8]}-{hash_hex[8:12]}-{hash_hex[12:16]}-{hash_hex[16:20]}-{hash_hex[20:32]}"
        
        return uuid_str
    
    @staticmethod
    def create_or_get_end_user_for_wiki_user_id(
        app_id: str, 
        wiki_user_id: int
    ) -> EndUser:
        """
        為 Wiki.js 使用者 ID 建立或獲取對應的 Dify End User (簡化版)
        
        Args:
            app_id: Dify App ID
            wiki_user_id: Wiki.js 使用者 ID
                
        Returns:
            EndUser: Dify End User 物件
        """
        from extensions.ext_database import db
        
        # 生成穩定的 UUID
        service = WikiUserMappingService()
        stable_uuid = service.generate_stable_uuid_for_wiki_user(app_id, wiki_user_id)
        
        # 檢查是否已存在
        existing_user = db.session.query(EndUser).filter(
            EndUser.session_id == stable_uuid
        ).first()
        
        if existing_user:
            return existing_user
        
        # 建立新的 End User
        end_user = EndUser(
            tenant_id=app_id,  # 使用 app_id 作為 tenant_id
            app_id=app_id,
            type='browser',
            session_id=stable_uuid,
            is_anonymous=True
        )
        
        db.session.add(end_user)
        db.session.commit()
        
        return end_user
    
    @staticmethod
    def create_or_get_end_user_for_wiki_user(
        app_model: App, 
        wiki_user_data: dict[str, Any]
    ) -> EndUser:
        """
        為 Wiki.js 使用者建立或獲取對應的 Dify End User
        
        Args:
            app_model: Dify App 模型
            wiki_user_data: Wiki.js 使用者資料
                {
                    'id': int,           # Wiki.js 使用者 ID
                    'email': str,        # 使用者 email
                    'name': str,         # 使用者名稱
                    'groups': List[dict] # 使用者組
                }
                
        Returns:
            EndUser: Dify End User 物件
        """
        wiki_user_id = wiki_user_data.get('id')
        if not wiki_user_id:
            raise ValueError("Wiki user data must contain 'id' field")
            
        # 生成穩定的 UUID
        stable_uuid = WikiUserMappingService.generate_stable_uuid_for_wiki_user(
            wiki_user_id, app_model.id
        )
        
        with Session(db.engine, expire_on_commit=False) as session:
            # 先嘗試根據穩定 UUID 查找
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
            
            if end_user is None:
                # 檢查是否有舊的記錄使用原始 wiki_user_id
                legacy_end_user = (
                    session.query(EndUser)
                    .where(
                        EndUser.tenant_id == app_model.tenant_id,
                        EndUser.app_id == app_model.id,
                        EndUser.session_id == str(wiki_user_id),
                        EndUser.type == "service_api",
                    )
                    .first()
                )
                
                if legacy_end_user:
                    # 更新舊記錄為新的穩定 UUID
                    legacy_end_user.session_id = stable_uuid
                    session.commit()
                    end_user = legacy_end_user
                else:
                    # 建立新的 End User
                    end_user = EndUser(
                        tenant_id=app_model.tenant_id,
                        app_id=app_model.id,
                        type="service_api",
                        is_anonymous=False,
                        session_id=stable_uuid,
                    )
                    session.add(end_user)
                    session.commit()
        
        return end_user
    
    @staticmethod
    def get_wiki_user_uuid(wiki_user_id: int, app_id: str) -> str:
        """
        獲取 Wiki.js 使用者對應的穩定 UUID
        
        Args:
            wiki_user_id: Wiki.js 使用者 ID
            app_id: Dify App ID
            
        Returns:
            str: 穩定的 UUID
        """
        return WikiUserMappingService.generate_stable_uuid_for_wiki_user(
            wiki_user_id, app_id
        )
    
    @staticmethod
    def migrate_existing_wiki_users(app_model: App) -> dict[str, int]:
        """
        遷移現有的 Wiki.js 使用者記錄到新的 UUID 格式
        
        Args:
            app_model: Dify App 模型
            
        Returns:
            Dict[str, int]: 遷移統計
        """
        stats = {
            'migrated': 0,
            'skipped': 0,
            'errors': 0
        }
        
        with Session(db.engine, expire_on_commit=False) as session:
            # 查找所有可能是 Wiki.js 使用者的記錄 (session_id 是數字)
            end_users = (
                session.query(EndUser)
                .where(
                    EndUser.tenant_id == app_model.tenant_id,
                    EndUser.app_id == app_model.id,
                    EndUser.type == "service_api",
                )
                .all()
            )
            
            for end_user in end_users:
                try:
                    session_id = end_user.session_id
                    
                    # 檢查是否為數字 ID (可能是 Wiki.js 使用者)
                    if session_id and session_id.isdigit():
                        wiki_user_id = int(session_id)
                        
                        # 生成新的穩定 UUID
                        new_uuid = WikiUserMappingService.generate_stable_uuid_for_wiki_user(
                            wiki_user_id, app_model.id
                        )
                        
                        # 檢查新 UUID 是否已存在
                        existing = (
                            session.query(EndUser)
                            .where(
                                EndUser.tenant_id == app_model.tenant_id,
                                EndUser.app_id == app_model.id,
                                EndUser.session_id == new_uuid,
                                EndUser.type == "service_api",
                            )
                            .first()
                        )
                        
                        if existing:
                            stats['skipped'] += 1
                            continue
                        
                        # 更新為新的 UUID
                        end_user.session_id = new_uuid
                        stats['migrated'] += 1
                    else:
                        stats['skipped'] += 1
                        
                except Exception as e:
                    print(f"Error migrating end_user {end_user.id}: {e}")
                    stats['errors'] += 1
                    continue
            
            session.commit()
        
        return stats