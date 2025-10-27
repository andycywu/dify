#!/usr/bin/env python3
"""
批量導入服務基本功能測試腳本 (修正版)
測試 DocumentProcessor 的核心功能，不依賴數據庫連接
"""

import os
import sys
from pathlib import Path

# 添加當前目錄到 Python 路徑
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from batch_import_server import DocumentProcessor, ImportOptions
except ImportError as e:
    print(f"❌ 導入失敗: {e}")
    sys.exit(1)

def test_document_processor():
    """測試文檔處理器基本功能"""
    print("🔬 測試文檔處理器...")

    processor = DocumentProcessor()

    # 測試支持的格式
    supported_formats = list(processor.supported_formats.keys())
    print(f"📚 支持的格式: {supported_formats}")

    # 測試處理 Markdown 文件 (使用正確的私有方法名)
    test_file = "/Users/andycyw/dify/wiki/batch-import/uploads/test-document.md"
    if os.path.exists(test_file):
        print(f"📄 處理測試文件: {test_file}")
        try:
            options = ImportOptions()
            content, metadata = processor._process_markdown(test_file, options)
            print(f"✅ Markdown 處理成功，內容長度: {len(content)} 字符")
            print(f"📊 元數據: {metadata}")
        except Exception as e:
            print(f"❌ Markdown 處理失敗: {e}")
    else:
        print(f"⚠️  測試文件不存在: {test_file}")

    # 測試 CSV 處理 (創建一個簡單的 CSV)
    print("\n📊 測試 CSV 處理...")
    csv_content = "名稱,年齡,城市\n張三,25,台北\n李四,30,高雄\n王五,35,台中"
    csv_file = "/Users/andycyw/dify/wiki/batch-import/uploads/test.csv"

    try:
        with open(csv_file, 'w', encoding='utf-8') as f:
            f.write(csv_content)

        options = ImportOptions()
        content, metadata = processor._process_csv(csv_file, options)
        print(f"✅ CSV 處理成功，內容長度: {len(content)} 字符")
        print(f"📊 元數據: {metadata}")
        print(f"📝 轉換後的內容預覽:\n{content[:200]}...")

        # 清理測試文件
        os.remove(csv_file)
    except Exception as e:
        print(f"❌ CSV 處理失敗: {e}")

def test_file_processing():
    """測試通用文件處理方法"""
    print("\n🔄 測試通用文件處理...")

    processor = DocumentProcessor()

    # 測試 Markdown 文件處理
    test_file = "/Users/andycyw/dify/wiki/batch-import/uploads/test-document.md"
    if os.path.exists(test_file):
        try:
            options = ImportOptions()
            content, metadata = processor.process_file(test_file, options)
            print(f"✅ 通用處理成功，內容長度: {len(content)} 字符")
            print(f"📊 元數據: {metadata}")
        except Exception as e:
            print(f"❌ 通用處理失敗: {e}")

def test_file_validation():
    """測試文件驗證功能"""
    print("\n🔍 測試文件驗證...")

    processor = DocumentProcessor()

    # 測試支持的文件類型
    test_files = [
        "test.pdf",
        "test.docx",
        "test.xlsx",
        "test.txt",
        "test.md",
        "test.csv",
        "test.unknown"  # 不支持的格式
    ]

    for filename in test_files:
        try:
            file_ext = Path(filename).suffix.lower().lstrip('.')
            is_supported = file_ext in processor.supported_formats
            status = "✅ 支持" if is_supported else "❌ 不支持"
            print(f"📁 {filename}: {status}")
        except Exception as e:
            print(f"❌ 檢查文件 {filename} 時出錯: {e}")

def test_txt_processing():
    """測試 TXT 文件處理"""
    print("\n📝 測試 TXT 文件處理...")

    processor = DocumentProcessor()

    # 創建一個測試 TXT 文件
    txt_content = """這是一個測試文字文件

包含多行內容：
- 項目 1
- 項目 2
- 項目 3

結束。"""

    txt_file = "/Users/andycyw/dify/wiki/batch-import/uploads/test.txt"

    try:
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write(txt_content)

        options = ImportOptions()
        content, metadata = processor._process_txt(txt_file, options)
        print(f"✅ TXT 處理成功，內容長度: {len(content)} 字符")
        print(f"📊 元數據: {metadata}")
        print(f"📝 內容預覽:\n{content[:100]}...")

        # 清理測試文件
        os.remove(txt_file)
    except Exception as e:
        print(f"❌ TXT 處理失敗: {e}")

def main():
    """主測試函數"""
    print("🚀 開始批量導入服務基本功能測試 (修正版)\n")

    try:
        test_document_processor()
        test_file_processing()
        test_txt_processing()
        test_file_validation()
        print("\n✅ 所有測試完成！")
    except Exception as e:
        print(f"\n💥 測試過程中發生錯誤: {e}")
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())
