-- 010: 根据官方配置更新阿里云 Coding Plan 模型的 token 限制

-- 千问系列
UPDATE models SET max_context_tokens = 1000000, max_output_tokens = 65536
WHERE provider_id = (SELECT id FROM providers WHERE slug='ali') AND model_id = 'qwen3.6-plus';

UPDATE models SET max_context_tokens = 1000000, max_output_tokens = 65536
WHERE provider_id = (SELECT id FROM providers WHERE slug='ali') AND model_id = 'qwen3.5-plus';

UPDATE models SET max_context_tokens = 262144, max_output_tokens = 32768
WHERE provider_id = (SELECT id FROM providers WHERE slug='ali') AND model_id = 'qwen3-max-2026-01-23';

UPDATE models SET max_context_tokens = 262144, max_output_tokens = 65536
WHERE provider_id = (SELECT id FROM providers WHERE slug='ali') AND model_id = 'qwen3-coder-next';

UPDATE models SET max_context_tokens = 1000000, max_output_tokens = 65536
WHERE provider_id = (SELECT id FROM providers WHERE slug='ali') AND model_id = 'qwen3-coder-plus';

-- 第三方模型
UPDATE models SET max_context_tokens = 196608, max_output_tokens = 24576
WHERE provider_id = (SELECT id FROM providers WHERE slug='ali') AND model_id = 'MiniMax-M2.5';

UPDATE models SET max_context_tokens = 202752, max_output_tokens = 16384
WHERE provider_id = (SELECT id FROM providers WHERE slug='ali') AND model_id = 'glm-5';

UPDATE models SET max_context_tokens = 202752, max_output_tokens = 16384
WHERE provider_id = (SELECT id FROM providers WHERE slug='ali') AND model_id = 'glm-4.7';

UPDATE models SET max_context_tokens = 262144, max_output_tokens = 32768
WHERE provider_id = (SELECT id FROM providers WHERE slug='ali') AND model_id = 'kimi-k2.5';
