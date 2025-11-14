#!/bin/bash
# Wiki.js 用戶 UUID 遷移腳本
# 將數字格式的 session_id 轉換為穩定的 UUID

echo "🔍 檢查目前 end_users 表狀態..."

# 顯示目前狀態
docker exec -it docker-db-1 psql -U postgres -d dify -c "
SELECT 
  'UUID格式' as type, COUNT(*) as count
FROM end_users 
WHERE session_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
UNION ALL
SELECT 
  '數字格式' as type, COUNT(*) as count
FROM end_users 
WHERE session_id ~ '^[0-9]+$'
UNION ALL
SELECT 
  'DEFAULT-USER' as type, COUNT(*) as count
FROM end_users 
WHERE session_id = 'DEFAULT-USER'
UNION ALL
SELECT 
  'JSON格式' as type, COUNT(*) as count
FROM end_users 
WHERE session_id LIKE '{%'
UNION ALL
SELECT 
  '總計' as type, COUNT(*) as count
FROM end_users;
"

echo ""
echo "📋 數字格式的 session_id (需要遷移的記錄):"
docker exec -it docker-db-1 psql -U postgres -d dify -c "
SELECT id, session_id, app_id, created_at 
FROM end_users 
WHERE session_id ~ '^[0-9]+$'
ORDER BY created_at;
"

echo ""
read -p "⚠️  是否要執行遷移？這將修改數據庫記錄 (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 開始遷移..."
    
    # 使用 Python 生成 UUID 映射並更新資料庫
    docker exec -it docker-db-1 psql -U postgres -d dify -c "
    -- 創建臨時函數來生成穩定的 UUID
    CREATE OR REPLACE FUNCTION generate_wiki_uuid(wiki_user_id TEXT, app_id UUID) 
    RETURNS UUID AS \$\$
    DECLARE
        seed TEXT;
        hash TEXT;
        uuid_str TEXT;
    BEGIN
        -- 建立種子字串
        seed := 'wiki_user_mapping_' || app_id::text || '_' || wiki_user_id;
        
        -- 生成 MD5 hash
        hash := md5(seed);
        
        -- 格式化為 UUID 字串
        uuid_str := SUBSTRING(hash FROM 1 FOR 8) || '-' || 
                   SUBSTRING(hash FROM 9 FOR 4) || '-' || 
                   SUBSTRING(hash FROM 13 FOR 4) || '-' || 
                   SUBSTRING(hash FROM 17 FOR 4) || '-' || 
                   SUBSTRING(hash FROM 21 FOR 12);
        
        RETURN uuid_str::UUID;
    END;
    \$\$ LANGUAGE plpgsql;
    "
    
    echo "✅ 建立 UUID 生成函數"
    
    # 更新數字格式的 session_id
    docker exec -it docker-db-1 psql -U postgres -d dify -c "
    UPDATE end_users 
    SET session_id = generate_wiki_uuid(session_id, app_id)::text
    WHERE session_id ~ '^[0-9]+$';
    "
    
    echo "✅ 更新完成"
    
    # 清理臨時函數
    docker exec -it docker-db-1 psql -U postgres -d dify -c "
    DROP FUNCTION IF EXISTS generate_wiki_uuid(TEXT, UUID);
    "
    
    echo "✅ 清理臨時函數"
    
    echo ""
    echo "🎉 遷移完成！檢查結果..."
    
    # 顯示遷移後狀態
    docker exec -it docker-db-1 psql -U postgres -d dify -c "
    SELECT 
      'UUID格式' as type, COUNT(*) as count
    FROM end_users 
    WHERE session_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    UNION ALL
    SELECT 
      '數字格式' as type, COUNT(*) as count
    FROM end_users 
    WHERE session_id ~ '^[0-9]+$'
    UNION ALL
    SELECT 
      'DEFAULT-USER' as type, COUNT(*) as count
    FROM end_users 
    WHERE session_id = 'DEFAULT-USER'
    UNION ALL
    SELECT 
      'JSON格式' as type, COUNT(*) as count
    FROM end_users 
    WHERE session_id LIKE '{%'
    UNION ALL
    SELECT 
      '總計' as type, COUNT(*) as count
    FROM end_users;
    "
    
    echo ""
    echo "📋 遷移後的記錄:"
    docker exec -it docker-db-1 psql -U postgres -d dify -c "
    SELECT id, LEFT(session_id, 40) || '...' as session_id_preview, app_id, created_at 
    FROM end_users 
    ORDER BY created_at;
    "
    
else
    echo "❌ 取消遷移"
fi