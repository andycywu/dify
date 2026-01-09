#!/bin/bash
# 檢查不同時間段的 messages token 數據

echo "======================================"
echo "檢查 messages 的 token 數據分布"
echo "======================================"
echo ""

echo "1. 檢查最近 10 條消息的模型和 token 信息:"
docker exec docker-db-1 psql -U postgres -d dify -c "SELECT
  DATE(created_at) as date,
  model_provider,
  model_id,
  answer_tokens,
  message_tokens,
  total_price,
  from_end_user_id
FROM messages
WHERE from_end_user_id IN (
  SELECT id FROM end_users WHERE session_id = '1'
)
ORDER BY created_at DESC
LIMIT 10;"

echo ""
echo "2. 按模型提供者統計 token 使用情況:"
docker exec docker-db-1 psql -U postgres -d dify -c "SELECT
  model_provider,
  COUNT(*) as message_count,
  SUM(answer_tokens) as total_answer_tokens,
  SUM(message_tokens) as total_message_tokens,
  SUM(total_price) as total_cost
FROM messages
WHERE from_end_user_id IN (
  SELECT id FROM end_users WHERE session_id = '1'
)
GROUP BY model_provider
ORDER BY message_count DESC;"

echo ""
echo "3. 檢查有 token 數據的舊消息:"
docker exec docker-db-1 psql -U postgres -d dify -c "SELECT
  DATE(created_at) as date,
  model_provider,
  COUNT(*) as count,
  SUM(answer_tokens) as answer_tokens,
  SUM(message_tokens) as message_tokens,
  SUM(total_price) as total_cost
FROM messages
WHERE from_end_user_id IN (
  SELECT id FROM end_users WHERE session_id = '1'
)
  AND (answer_tokens > 0 OR message_tokens > 0)
GROUP BY DATE(created_at), model_provider
ORDER BY date DESC;"
