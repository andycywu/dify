#!/usr/bin/env python3
"""
測試批量導入服務的基本文件處理功能
不依賴數據庫連接
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from batch_import_server import DocumentProcessor

def test_document_processor():
    """測試文檔處理器"""
    print("🔬 測試文檔處理器...")

    processor = DocumentProcessor()

    # 測試支持的格式
    print("📚 支持的格式:", list(processor.supported_formats.keys()))

    # 測試 Markdown 文件處理
    test_file = "/Users/andycyw/dify/wiki/batch-import/uploads/test-document.md"
    if os.path.exists(test_file):
        print(f"📄 處理測試文件: {test_file}")
        try:
            content = processor.process_markdown(test_file)
            print("✅ Markdown 處理成功")
            print("📝 處理後的內容預覽:")
            print(content[:200] + "..." if len(content) > 200 else content)
        except Exception as e:
            print(f"❌ Markdown 處理失敗: {e}")

    # 測試 CSV 處理
    print("\n📊 測試 CSV 處理...")
    try:
        # 創建測試 CSV
        csv_content = "姓名,部門,職位\n張三,技術部,工程師\n李四,市場部,專員\n王五,人事部,經理"
        csv_file = "/tmp/test.csv"
        with open(csv_file, 'w', encoding='utf-8') as f:
            f.write(csv_content)

        markdown_content = processor.process_csv(csv_file)
        print("✅ CSV 處理成功")
        print("📝 轉換後的 Markdown:")
        print(markdown_content)

        # 清理測試文件
        os.remove(csv_file)
    except Exception as e:
        print(f"❌ CSV 處理失敗: {e}")

def test_file_validation():
    """測試文件驗證"""
    print("\n🔍 測試文件驗證...")

    processor = DocumentProcessor()

    # 測試支持的文件
    test_files = [
        ("test.pdf", True),
        ("test.docx", True),
        ("test.xlsx", True),
        ("test.txt", True),
        ("test.md", True),
        ("test.exe", False),
        ("test.jpg", False),
    ]

    for filename, expected in test_files:
        is_supported = processor.is_supported_file(filename)
        status = "✅" if is_supported == expected else "❌"
        print(f"{status} {filename}: {'支持' if is_supported else '不支持'}")

if __name__ == "__main__":
    print("🚀 開始批量導入服務基本功能測試\n")

    try:
        test_document_processor()
        test_file_validation()
        print("\n🎉 所有基本功能測試完成！")
    except Exception as e:
        print(f"\n💥 測試過程中發生錯誤: {e}")
        sys.exit(1)
