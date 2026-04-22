-- 010 回滚：恢复阿里云模型为原始 token 限制（不精确值）

UPDATE models SET max_context_tokens = 131072, max_output_tokens = 0
WHERE provider_id = (SELECT id FROM providers WHERE slug='ali') AND model_id = 'qwen3.6-plus';

UPDATE models SET max_context_tokens = 131072, max_output_tokens = 0
WHERE provider_id = (SELECT id FROM providers WHERE slug='ali') AND model_id = 'qwen3.5-plus';

UPDATE models SET max_context_tokens = 32768, max_output_tokens = 0
WHERE provider_id = (SELECT id FROM providers WHERE slug='ali') AND model_id = 'qwen3-max-2026-01-23';

UPDATE models SET max_context_tokens = 131072, max_output_tokens = 0
WHERE provider_id = (SELECT id FROM providers WHERE slug='ali') AND model_id = 'qwen3-coder-next';

UPDATE models SET max_context_tokens = 131072, max_output_tokens = 0
WHERE provider_id = (SELECT id FROM providers WHERE slug='ali') AND model_id = 'qwen3-coder-plus';

UPDATE models SET max_context_tokens = 131072, max_output_tokens = 0
WHERE provider_id = (SELECT id FROM providers WHERE slug='ali') AND model_id = 'MiniMax-M2.5';

UPDATE models SET max_context_tokens = 128000, max_output_tokens = 0
WHERE provider_id = (SELECT id FROM providers WHERE slug='ali') AND model_id = 'glm-5';

UPDATE models SET max_context_tokens = 128000, max_output_tokens = 0
WHERE provider_id = (SELECT id FROM providers WHERE slug='ali') AND model_id = 'glm-4.7';

UPDATE models SET max_context_tokens = 131072, max_output_tokens = 0
WHERE provider_id = (SELECT id FROM providers WHERE slug='ali') AND model_id = 'kimi-k2.5';
