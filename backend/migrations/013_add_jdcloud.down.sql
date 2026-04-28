-- 013: 插入京东云 JoyBuilder Coding Plan 平台和模型

INSERT INTO providers (name, slug, description)
VALUES ('京东云 JoyBuilder', 'jdcloud', '京东云 JoyBuilder 大模型开发平台 Coding Plan')
ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description;

-- ===== 第三方合作模型 =====
INSERT INTO models (provider_id, model_id, display_name, description, brand, capabilities, max_context_tokens, max_output_tokens, is_available)
VALUES
    ((SELECT id FROM providers WHERE slug='jdcloud'), 'deepseek-v3.2', 'DeepSeek-V3.2', '深度求索最新模型，平衡推理能力与输出长度', '深度求索', ARRAY['文本生成','深度思考'], 131072, 65536, true),
    ((SELECT id FROM providers WHERE slug='jdcloud'), 'glm-5', 'GLM-5', '智谱新一代旗舰模型', '智谱', ARRAY['文本生成','深度思考'], 204800, 32768, true),
    ((SELECT id FROM providers WHERE slug='jdcloud'), 'glm-4.7', 'GLM-4.7', '智谱 AI 旗舰代码大模型', '智谱', ARRAY['文本生成','深度思考'], 204800, 131072, true),
    ((SELECT id FROM providers WHERE slug='jdcloud'), 'minimax-m2.5', 'MiniMax-M2.5', 'MiniMax 旗舰级开源大模型', 'MiniMax', ARRAY['文本生成','深度思考'], 204800, 131072, true),
    ((SELECT id FROM providers WHERE slug='jdcloud'), 'kimi-k2.5', 'Kimi-K2.5', 'Moonshot AI 编程模型', 'Kimi', ARRAY['文本生成','深度思考'], 262144, 32768, true),
    ((SELECT id FROM providers WHERE slug='jdcloud'), 'kimi-k2-turbo', 'Kimi-K2-Turbo', 'Moonshot AI 快速推理模型', 'Kimi', ARRAY['文本生成','深度思考'], 262144, 32768, true),
    ((SELECT id FROM providers WHERE slug='jdcloud'), 'qwen3-coder', 'Qwen3-Coder', '通义千问代码生成模型', '通义千问', ARRAY['文本生成','代码生成'], 65536, 8192, true)
ON CONFLICT (provider_id, model_id) DO UPDATE SET
    description = EXCLUDED.description,
    capabilities = EXCLUDED.capabilities,
    max_context_tokens = EXCLUDED.max_context_tokens,
    max_output_tokens = EXCLUDED.max_output_tokens;
