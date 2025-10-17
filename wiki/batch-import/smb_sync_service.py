#!/usr/bin/env python3
"""
SMB 目錄同步服務
監控 SMB 共享目錄並自動導入新文件到 Wiki.js
"""

import os
import sys
import time
import logging
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set, Optional
from dataclasses import dataclass
import json

# 導入批量導入服務的組件
from batch_import_server import DocumentProcessor, WikiJSClient, ImportOptions

import logging
import os
from pathlib import Path

# 確保日誌目錄存在
log_dir = Path('/app/logs')
log_dir.mkdir(parents=True, exist_ok=True)

# 配置日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/app/logs/smb_sync.log')
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class SyncConfig:
    """同步配置"""
    smb_path: str           # SMB 掛載路徑
    wiki_base_path: str     # Wiki.js 基礎路徑
    group_name: str         # 群組名稱
    scan_interval: int      # 掃描間隔（秒）
    file_extensions: List[str]  # 支持的文件擴展名
    exclude_patterns: List[str]  # 排除的文件模式
    
@dataclass
class FileRecord:
    """文件記錄"""
    path: str
    hash: str
    size: int
    modified_time: float
    wiki_page_id: Optional[int] = None
    last_synced: Optional[float] = None
    status: str = 'pending'  # pending, synced, failed

class FileTracker:
    """文件追蹤器 - 記錄已同步的文件"""
    
    def __init__(self, state_file: str = '/app/data/sync_state.json'):
        self.state_file = state_file
        self.records: Dict[str, FileRecord] = {}
        self._load_state()
    
    def _load_state(self):
        """載入同步狀態"""
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for path, record_data in data.items():
                        self.records[path] = FileRecord(**record_data)
                logger.info(f"📂 已載入 {len(self.records)} 個文件記錄")
            except Exception as e:
                logger.error(f"❌ 載入同步狀態失敗: {e}")
    
    def _save_state(self):
        """保存同步狀態"""
        try:
            os.makedirs(os.path.dirname(self.state_file), exist_ok=True)
            with open(self.state_file, 'w', encoding='utf-8') as f:
                data = {path: record.__dict__ for path, record in self.records.items()}
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.debug(f"💾 已保存 {len(self.records)} 個文件記錄")
        except Exception as e:
            logger.error(f"❌ 保存同步狀態失敗: {e}")
    
    def get_file_hash(self, file_path: str) -> str:
        """計算文件 hash"""
        hasher = hashlib.md5()
        try:
            with open(file_path, 'rb') as f:
                for chunk in iter(lambda: f.read(8192), b''):
                    hasher.update(chunk)
            return hasher.hexdigest()
        except Exception as e:
            logger.error(f"❌ 計算文件 hash 失敗 {file_path}: {e}")
            return ""
    
    def is_file_changed(self, file_path: str) -> bool:
        """檢查文件是否變更"""
        if file_path not in self.records:
            return True
        
        current_hash = self.get_file_hash(file_path)
        current_mtime = os.path.getmtime(file_path)
        
        record = self.records[file_path]
        return (current_hash != record.hash or 
                current_mtime != record.modified_time)
    
    def add_record(self, file_path: str, wiki_page_id: int = None, status: str = 'synced'):
        """添加文件記錄"""
        self.records[file_path] = FileRecord(
            path=file_path,
            hash=self.get_file_hash(file_path),
            size=os.path.getsize(file_path),
            modified_time=os.path.getmtime(file_path),
            wiki_page_id=wiki_page_id,
            last_synced=time.time(),
            status=status
        )
        self._save_state()
    
    def update_record(self, file_path: str, **kwargs):
        """更新文件記錄"""
        if file_path in self.records:
            for key, value in kwargs.items():
                setattr(self.records[file_path], key, value)
            self._save_state()

class SMBSyncService:
    """SMB 同步服務"""
    
    def __init__(self, config: SyncConfig):
        self.config = config
        self.tracker = FileTracker()
        self.processor = DocumentProcessor()
        self.wiki_client = WikiJSClient()
        
        # 支持的文件擴展名
        self.supported_extensions = {
            '.pdf', '.docx', '.doc', '.xlsx', '.xls', 
            '.pptx', '.ppt', '.txt', '.md', '.csv'
        }
        
        logger.info(f"🚀 SMB 同步服務初始化完成")
        logger.info(f"📂 監控目錄: {config.smb_path}")
        logger.info(f"🎯 Wiki 基礎路徑: {config.wiki_base_path}")
        logger.info(f"👥 群組: {config.group_name}")
    
    def scan_directory(self, base_path: str) -> List[str]:
        """掃描目錄，返回所有符合條件的文件"""
        files = []
        
        try:
            for root, dirs, filenames in os.walk(base_path):
                # 排除隱藏目錄
                dirs[:] = [d for d in dirs if not d.startswith('.')]
                
                for filename in filenames:
                    # 跳過隱藏文件
                    if filename.startswith('.'):
                        continue
                    
                    # 檢查文件擴展名
                    ext = Path(filename).suffix.lower()
                    if ext not in self.supported_extensions:
                        continue
                    
                    file_path = os.path.join(root, filename)
                    files.append(file_path)
            
            logger.info(f"📊 掃描完成，找到 {len(files)} 個文件")
            return files
            
        except Exception as e:
            logger.error(f"❌ 掃描目錄失敗: {e}")
            return []
    
    def get_wiki_path(self, file_path: str) -> str:
        """根據文件路徑生成 Wiki.js 路徑"""
        # 獲取相對於 SMB 基礎目錄的路徑
        rel_path = os.path.relpath(file_path, self.config.smb_path)
        
        # 移除文件擴展名
        wiki_path = str(Path(rel_path).with_suffix(''))
        
        # 組合完整路徑
        full_path = f"{self.config.wiki_base_path}/{self.config.group_name}/{wiki_path}"
        
        # 標準化路徑（替換反斜線、移除連續斜線）
        full_path = full_path.replace('\\', '/').replace('//', '/')
        
        return full_path
    
    def sync_file(self, file_path: str) -> bool:
        """同步單個文件到 Wiki.js"""
        try:
            logger.info(f"📤 開始同步: {file_path}")
            
            # 生成 Wiki 路徑
            wiki_path = self.get_wiki_path(file_path)
            file_name = Path(file_path).stem
            
            # 處理文件
            options = ImportOptions(
                target_folder=os.path.dirname(wiki_path),
                page_template='standard',
                naming_rule='original',
                extract_images=True,
                preserve_formatting=True,
                create_toc=True
            )
            
            content, metadata = self.processor.process_file(file_path, options)
            
            # 添加文件信息到內容
            file_info = f"""# {file_name}

> **文件信息**
> - 原始路徑: `{file_path}`
> - 群組: {self.config.group_name}
> - 文件類型: {metadata.get('source_type', 'Unknown')}
> - 同步時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
> - 文件大小: {os.path.getsize(file_path) / 1024:.2f} KB

---

{content}
"""
            
            # 創建或更新 Wiki 頁面
            page_id = self.wiki_client.create_page(
                path=wiki_path,
                title=file_name,
                content=file_info,
                metadata=metadata
            )
            
            # 更新追蹤記錄
            self.tracker.add_record(file_path, wiki_page_id=page_id, status='synced')
            
            logger.info(f"✅ 同步成功: {file_name} → Page ID: {page_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ 同步失敗 {file_path}: {e}")
            self.tracker.add_record(file_path, status='failed')
            return False
    
    def sync_all(self):
        """同步所有文件"""
        logger.info("🔄 開始全量同步...")
        
        # 掃描目錄
        files = self.scan_directory(self.config.smb_path)
        
        if not files:
            logger.info("📭 沒有找到需要同步的文件")
            return
        
        # 統計
        success_count = 0
        failed_count = 0
        skipped_count = 0
        
        for file_path in files:
            # 檢查文件是否需要同步
            if not self.tracker.is_file_changed(file_path):
                logger.debug(f"⏭️  跳過未變更的文件: {file_path}")
                skipped_count += 1
                continue
            
            # 同步文件
            if self.sync_file(file_path):
                success_count += 1
            else:
                failed_count += 1
            
            # 避免請求過快
            time.sleep(0.5)
        
        # 輸出統計
        logger.info(f"📊 同步完成:")
        logger.info(f"   ✅ 成功: {success_count}")
        logger.info(f"   ❌ 失敗: {failed_count}")
        logger.info(f"   ⏭️  跳過: {skipped_count}")
        logger.info(f"   📁 總計: {len(files)}")
    
    def run(self):
        """運行同步服務"""
        logger.info("🚀 SMB 同步服務啟動")
        
        try:
            while True:
                try:
                    self.sync_all()
                except Exception as e:
                    logger.error(f"❌ 同步過程出錯: {e}")
                
                # 等待下一次掃描
                logger.info(f"⏰ 等待 {self.config.scan_interval} 秒後進行下一次掃描...")
                time.sleep(self.config.scan_interval)
                
        except KeyboardInterrupt:
            logger.info("🛑 收到停止信號，服務正在關閉...")
        except Exception as e:
            logger.error(f"❌ 服務異常: {e}")

def main():
    """主函數"""
    # 從環境變數讀取配置
    configs = []
    
    # 支持多個群組的配置
    groups = os.getenv('SMB_SYNC_GROUPS', 'Administrators,Guests,EE,ME_LCM,PWR,SW,PJM').split(',')
    base_smb_path = os.getenv('SMB_BASE_PATH', '/mnt/smb')
    wiki_base_path = os.getenv('WIKI_BASE_PATH', '/docs')
    scan_interval = int(os.getenv('SMB_SCAN_INTERVAL', '300'))  # 5 分鐘
    
    for group in groups:
        group = group.strip()
        smb_path = os.path.join(base_smb_path, group)
        
        # 檢查目錄是否存在
        if not os.path.exists(smb_path):
            logger.warning(f"⚠️  群組目錄不存在，跳過: {smb_path}")
            continue
        
        config = SyncConfig(
            smb_path=smb_path,
            wiki_base_path=wiki_base_path,
            group_name=group,
            scan_interval=scan_interval,
            file_extensions=['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt', '.txt', '.md', '.csv'],
            exclude_patterns=['.git', '.svn', '__pycache__']
        )
        configs.append(config)
    
    if not configs:
        logger.error("❌ 沒有有效的同步配置，服務退出")
        return
    
    # 為每個群組創建同步服務實例
    logger.info(f"🎯 將同步 {len(configs)} 個群組")
    
    # 簡化版：順序同步（生產環境可以改為多線程）
    for config in configs:
        service = SMBSyncService(config)
        logger.info(f"▶️  開始同步群組: {config.group_name}")
        service.sync_all()  # 執行一次完整同步
    
    logger.info("✅ 所有群組同步完成")

if __name__ == '__main__':
    main()
