#!/bin/bash
# 檢查 messages 表的結構和實際數據

echo "======================================"
echo "檢查 messages 表結構和數據"
echo "======================================"
echo ""

echo "1. messages 表結構:"
docker exec docker-db-1 psql -U postgres -d dify -c "\d messages"

echo ""
echo "2. 檢查最近 5 條 messages 的 token 相關欄位:"
docker exec docker-db-1 psql -U postgres -d dify -c "SELECT id, answer_tokens, message_tokens, message_unit_price, answer_unit_price, total_price, provider_response_latency, created_at FROM messages ORDER BY created_at DESC LIMIT 5;"

echo ""
echo "3. 檢查 messages 表中有值的欄位統計:"
docker exec docker-db-1 psql -U postgres -d dify -c "SELECT
  COUNT(*) as total_messages,
  COUNT(answer_tokens) as has_answer_tokens,
  COUNT(message_tokens) as has_message_tokens,
  COUNT(total_price) as has_total_price,
  SUM(answer_tokens) as sum_answer_tokens,
  SUM(message_tokens) as sum_message_tokens,
  SUM(total_price) as sum_total_price
FROM messages;"

echo ""
echo "4. 檢查是否有其他 token 相關欄位:"
docker exec docker-db-1 psql -U postgres -d dify -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages' AND (column_name LIKE '%token%' OR column_name LIKE '%price%' OR column_name LIKE '%cost%');"
