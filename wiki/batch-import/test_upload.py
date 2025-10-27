#!/usr/bin/env python3
"""
測試批量導入服務的文件上傳功能
"""

import requests
import json
import os

def test_upload_file():
    """測試文件上傳功能"""
    print("🧪 測試文件上傳功能...")

    # 服務 URL
    url = "http://localhost:5050/api/wiki/batch-import"

    # 測試文件
    test_file = "/Users/andycyw/dify/wiki/batch-import/uploads/demo-test.md"

    if not os.path.exists(test_file):
        print(f"❌ 測試文件不存在: {test_file}")
        return False

    # 準備文件上傳
    files = {
        'file': ('demo-test.md', open(test_file, 'rb'), 'text/markdown')
    }

    # 準備表單數據
    data = {
        'targetFolder': '/imported-docs',
        'pageTemplate': 'standard',
        'namingRule': 'original',
        'extractImages': 'true',
        'preserveFormatting': 'true',
        'createToc': 'false'
    }

    try:
        print(f"📤 上傳文件: {test_file}")
        print(f"🎯 目標文件夾: {data['targetFolder']}")

        # 發送 POST 請求
        response = requests.post(url, files=files, data=data, timeout=30)

        # 關閉文件
        files['file'][1].close()

        print(f"📊 響應狀態碼: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ 文件上傳成功！")
                print(f"📄 頁面 ID: {result.get('page_id')}")
                print(f"🔗 Wiki URL: {result.get('wiki_url')}")
                print(f"📝 頁面標題: {result.get('title')}")
                print(f"📊 元數據: {json.dumps(result.get('metadata', {}), indent=2, ensure_ascii=False)}")
                return True
            else:
                print(f"❌ 上傳失敗: {result.get('error', '未知錯誤')}")
                return False
        else:
            print(f"❌ HTTP 錯誤: {response.status_code}")
            try:
                error_info = response.json()
                print(f"錯誤詳情: {json.dumps(error_info, indent=2, ensure_ascii=False)}")
            except:
                print(f"響應內容: {response.text}")
            return False

    except requests.exceptions.ConnectionError:
        print("❌ 無法連接到服務，請確保服務正在運行")
        return False
    except requests.exceptions.Timeout:
        print("❌ 請求超時")
        return False
    except Exception as e:
        print(f"❌ 發生錯誤: {e}")
        return False

def test_supported_formats():
    """測試支持格式 API"""
    print("\n🔍 測試支持格式 API...")

    url = "http://localhost:5050/api/wiki/supported-formats"

    try:
        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            result = response.json()
            print("✅ 支持格式 API 響應正常")
            print(f"📚 支持的格式: {result.get('formats', [])}")
            print(f"📖 格式描述:")
            for fmt, desc in result.get('descriptions', {}).items():
                print(f"  - {fmt}: {desc}")
            return True
        else:
            print(f"❌ API 錯誤: {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ 發生錯誤: {e}")
        return False

def main():
    """主測試函數"""
    print("🚀 開始批量導入服務完整功能測試\n")

    success_count = 0
    total_tests = 2

    # 測試支持格式 API
    if test_supported_formats():
        success_count += 1

    # 測試文件上傳
    if test_upload_file():
        success_count += 1

    print(f"\n📈 測試結果: {success_count}/{total_tests} 通過")

    if success_count == total_tests:
        print("🎉 所有測試都通過了！")
        return 0
    else:
        print("⚠️  部分測試失敗，請檢查服務狀態")
        return 1

if __name__ == "__main__":
    exit(main())
