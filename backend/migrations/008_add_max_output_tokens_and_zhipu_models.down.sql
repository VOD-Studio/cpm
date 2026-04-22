-- 008 回滚：删除智谱模型，移除 max_output_tokens 列

DELETE FROM models WHERE provider_id = (SELECT id FROM providers WHERE slug='zhipu');
ALTER TABLE models DROP COLUMN IF EXISTS max_output_tokens;
