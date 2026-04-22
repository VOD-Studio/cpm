-- 回滚 006: 移除 base_urls 和品牌/能力字段

-- 删除新增的模型和平台数据（按依赖顺序）
DELETE FROM models WHERE provider_id IN (SELECT id FROM providers WHERE slug IN ('ali', 'volcengine', 'zhipu'));
DELETE FROM providers WHERE slug IN ('ali', 'volcengine', 'zhipu');

-- 移除新增列
ALTER TABLE models DROP COLUMN IF EXISTS capabilities;
ALTER TABLE models DROP COLUMN IF EXISTS brand;
ALTER TABLE api_keys DROP COLUMN IF EXISTS base_urls;
