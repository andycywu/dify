#!/usr/bin/env python3
"""
批量導入功能驗證測試腳本
測試文檔上傳、轉換和 Wiki.js 頁面創建
"""

import os
import sys
import json
import time
import requests
from datetime import datetime

# 配置
API_BASE_URL = "http://localhost:5050"
WIKI_BASE_URL = "http://localhost:3002"
TEST_FILES_DIR = "/tmp/wiki_test_files"

# 顏色輸出
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.RESET}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.RESET}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.RESET}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠️  {msg}{Colors.RESET}")

def create_test_files():
    """創建測試文件"""
    print_info("創建測試文件...")
    os.makedirs(TEST_FILES_DIR, exist_ok=True)

    test_files = {}

    # 1. Markdown 文件
    md_content = f"""# 測試文檔 - Markdown

## 簡介
這是一個用於測試批量導入功能的 Markdown 文檔。

## 功能列表
- 文檔上傳
- 格式轉換
- Wiki.js 整合

## 測試資訊
- 測試時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- 測試類型: Markdown 文件

## 代碼示例
```python
def hello_world():
    print("Hello from Wiki.js!")
```

## 表格示例
| 功能 | 狀態 | 備註 |
|------|------|------|
| 上傳 | ✅ | 正常 |
| 轉換 | ✅ | 正常 |
| 顯示 | 🔍 | 測試中 |
"""
    md_file = os.path.join(TEST_FILES_DIR, "test_markdown.md")
    with open(md_file, 'w', encoding='utf-8') as f:
        f.write(md_content)
    test_files['markdown'] = md_file
    print_success(f"創建 Markdown 文件: {md_file}")

    # 2. 純文字文件
    txt_content = f"""測試文檔 - 純文字

這是一個純文字文件測試。

測試時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

重要功能：
1. 文檔上傳功能
2. 自動格式轉換
3. 頁面創建驗證

結論：
本測試用於驗證系統是否能正確處理純文字文件。
"""
    txt_file = os.path.join(TEST_FILES_DIR, "test_text.txt")
    with open(txt_file, 'w', encoding='utf-8') as f:
        f.write(txt_content)
    test_files['text'] = txt_file
    print_success(f"創建純文字文件: {txt_file}")

    return test_files

def test_api_connection():
    """測試 API 連接"""
    print_info("\n測試 API 連接...")
    try:
        response = requests.get(f"{API_BASE_URL}/api/wiki/supported-formats", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success(f"API 連接正常")
            print_info(f"支援格式: {', '.join(data['formats'])}")
            return True
        else:
            print_error(f"API 返回錯誤狀態: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"API 連接失敗: {str(e)}")
        return False

def upload_file(file_path, target_folder="/imported/test"):
    """上傳文件並返回結果"""
    file_name = os.path.basename(file_path)
    print_info(f"\n上傳文件: {file_name}")

    try:
        with open(file_path, 'rb') as f:
            files = {'file': (file_name, f)}
            data = {
                'target_folder': target_folder,
                'page_template': 'standard'
            }

            response = requests.post(
                f"{API_BASE_URL}/api/wiki/batch-import",
                files=files,
                data=data,
                timeout=30
            )

        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print_success(f"上傳成功!")
                print_info(f"  頁面 ID: {result.get('page_id')}")
                print_info(f"  標題: {result.get('title')}")
                print_info(f"  路徑: {result.get('wiki_url')}")
                print_info(f"  處理時間: {result.get('metadata', {}).get('processed_at')}")
                return result
            else:
                print_error(f"上傳失敗: {result.get('error', 'Unknown error')}")
                return None
        else:
            print_error(f"HTTP 錯誤: {response.status_code}")
            print_error(f"響應: {response.text}")
            return None

    except Exception as e:
        print_error(f"上傳異常: {str(e)}")
        return None

def verify_database_entry(page_id):
    """驗證數據庫中的頁面記錄"""
    print_info(f"\n驗證數據庫記錄 (Page ID: {page_id})...")

    try:
        import subprocess
        cmd = [
            'docker', 'exec', 'docker-db-1',
            'psql', '-U', 'wiki_app', '-d', 'wiki',
            '-c', f"SELECT id, path, title, \"isPublished\", \"contentType\", \"createdAt\" FROM pages WHERE id = {page_id};"
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)

        if result.returncode == 0:
            output = result.stdout
            if "1 row" in output or f" {page_id} " in output:
                print_success("數據庫記錄驗證成功")
                print(output)
                return True
            else:
                print_warning("未找到數據庫記錄")
                print(output)
                return False
        else:
            print_error(f"數據庫查詢失敗: {result.stderr}")
            return False

    except Exception as e:
        print_error(f"數據庫驗證異常: {str(e)}")
        return False

def verify_content_conversion(page_id):
    """驗證內容轉換質量"""
    print_info(f"\n驗證內容轉換 (Page ID: {page_id})...")

    try:
        import subprocess
        cmd = [
            'docker', 'exec', 'docker-db-1',
            'psql', '-U', 'wiki_app', '-d', 'wiki', '-t',
            '-c', f"SELECT content FROM pages WHERE id = {page_id};"
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)

        if result.returncode == 0:
            content = result.stdout.strip()
            if content:
                print_success("內容轉換成功")
                print_info(f"內容長度: {len(content)} 字元")
                print_info("內容預覽:")
                print("─" * 60)
                print(content[:500] + ("..." if len(content) > 500 else ""))
                print("─" * 60)
                return True
            else:
                print_warning("內容為空")
                return False
        else:
            print_error(f"內容查詢失敗: {result.stderr}")
            return False

    except Exception as e:
        print_error(f"內容驗證異常: {str(e)}")
        return False

def check_wiki_accessibility(wiki_url):
    """檢查 Wiki.js 頁面是否可訪問"""
    print_info(f"\n檢查 Wiki.js 頁面可訪問性...")
    print_info(f"URL: {WIKI_BASE_URL}{wiki_url}")

    try:
        # Wiki.js 可能需要認證，先檢查頁面是否存在（即使返回 401/403 也表示頁面存在）
        response = requests.get(f"{WIKI_BASE_URL}{wiki_url}", timeout=10, allow_redirects=True)

        if response.status_code in [200, 401, 403]:
            print_success(f"Wiki.js 頁面可訪問 (狀態碼: {response.status_code})")
            if response.status_code == 401 or response.status_code == 403:
                print_warning("頁面需要認證，請在瀏覽器中登入後查看")
            return True
        elif response.status_code == 404:
            print_error("頁面不存在 (404)")
            return False
        else:
            print_warning(f"頁面狀態: {response.status_code}")
            return False

    except Exception as e:
        print_error(f"頁面訪問異常: {str(e)}")
        return False

def run_full_test():
    """運行完整測試流程"""
    print("\n" + "=" * 70)
    print("🧪 Wiki.js 批量導入功能完整驗證測試")
    print("=" * 70)

    # 統計
    total_tests = 0
    passed_tests = 0

    # 1. 測試 API 連接
    total_tests += 1
    if test_api_connection():
        passed_tests += 1
    else:
        print_error("\n❌ API 連接失敗，終止測試")
        return

    # 2. 創建測試文件
    test_files = create_test_files()

    # 3. 測試每個文件
    test_results = []

    for file_type, file_path in test_files.items():
        print("\n" + "─" * 70)
        print(f"📄 測試 {file_type.upper()} 文件")
        print("─" * 70)

        total_tests += 1
        result = upload_file(file_path, target_folder=f"/imported/test/{file_type}")

        if result:
            passed_tests += 1
            page_id = result.get('page_id')
            wiki_url = result.get('wiki_url')

            # 驗證數據庫
            total_tests += 1
            if verify_database_entry(page_id):
                passed_tests += 1

            # 驗證內容轉換
            total_tests += 1
            if verify_content_conversion(page_id):
                passed_tests += 1

            # 檢查 Wiki.js 可訪問性
            total_tests += 1
            if check_wiki_accessibility(wiki_url):
                passed_tests += 1

            test_results.append({
                'type': file_type,
                'success': True,
                'page_id': page_id,
                'wiki_url': wiki_url
            })
        else:
            test_results.append({
                'type': file_type,
                'success': False
            })

    # 4. 測試總結
    print("\n" + "=" * 70)
    print("📊 測試總結")
    print("=" * 70)

    print(f"\n總測試數: {total_tests}")
    print(f"通過測試: {passed_tests}")
    print(f"失敗測試: {total_tests - passed_tests}")
    print(f"成功率: {(passed_tests/total_tests*100):.1f}%")

    print("\n📄 文件測試結果:")
    for result in test_results:
        if result['success']:
            print_success(f"{result['type']}: Page ID {result['page_id']} - {result['wiki_url']}")
        else:
            print_error(f"{result['type']}: 測試失敗")

    print("\n🔍 手動驗證步驟:")
    print_info("1. 在瀏覽器中打開 Wiki.js:")
    print(f"   {WIKI_BASE_URL}")
    print_info("2. 登入後查看以下頁面:")
    for result in test_results:
        if result['success']:
            print(f"   • {WIKI_BASE_URL}{result['wiki_url']}")
    print_info("3. 檢查頁面內容是否正確顯示")
    print_info("4. 驗證格式、圖片、表格等元素")

    print("\n" + "=" * 70)

    if passed_tests == total_tests:
        print_success("🎉 所有測試通過！")
    elif passed_tests > total_tests * 0.7:
        print_warning("⚠️  部分測試通過，請檢查失敗項目")
    else:
        print_error("❌ 多數測試失敗，請檢查系統配置")

    print("=" * 70 + "\n")

if __name__ == "__main__":
    try:
        run_full_test()
    except KeyboardInterrupt:
        print_error("\n\n測試被用戶中斷")
        sys.exit(1)
    except Exception as e:
        print_error(f"\n\n測試執行異常: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
