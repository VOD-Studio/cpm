-- 008: 添加 max_output_tokens 字段，插入智谱模型

ALTER TABLE models ADD COLUMN IF NOT EXISTS max_output_tokens INTEGER DEFAULT 0;

-- ===== 智谱文本模型 =====
INSERT INTO models (provider_id, model_id, display_name, description, brand, capabilities, max_context_tokens, max_output_tokens, is_available)
VALUES
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-5.1', 'GLM-5.1', '最新旗舰模型，全能最强', '智谱', ARRAY['文本生成','深度思考'], 200000, 131072, true),
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-5', 'GLM-5', '高智能基座模型', '智谱', ARRAY['文本生成','深度思考'], 200000, 131072, true),
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-5-turbo', 'GLM-5-Turbo', '高性能模型，速度快', '智谱', ARRAY['文本生成'], 200000, 131072, true),
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-4.7', 'GLM-4.7', '高智能基座模型', '智谱', ARRAY['文本生成','深度思考'], 200000, 131072, true),
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-4.7-flashx', 'GLM-4.7-FlashX', '高性价比模型', '智谱', ARRAY['文本生成'], 200000, 131072, true),
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-4.6', 'GLM-4.6', '高智能基座模型', '智谱', ARRAY['文本生成','深度思考'], 200000, 131072, true),
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-4.5-air', 'GLM-4.5-Air', '高性价比模型', '智谱', ARRAY['文本生成'], 131072, 98304, true),
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-4.5-airx', 'GLM-4.5-AirX', '高性价比模型', '智谱', ARRAY['文本生成'], 131072, 98304, true),
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-4-long', 'GLM-4-Long', '超长上下文模型', '智谱', ARRAY['文本生成'], 1048576, 4096, true),
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-4-flashx-250414', 'GLM-4-FlashX', '标准模型', '智谱', ARRAY['文本生成'], 131072, 16384, true),
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-4.7-flash', 'GLM-4.7-Flash', '免费模型', '智谱', ARRAY['文本生成'], 200000, 131072, true),
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-4-flash-250414', 'GLM-4-Flash', '免费模型', '智谱', ARRAY['文本生成'], 131072, 16384, true),
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-4.5-flash', 'GLM-4.5-Flash', '免费模型', '智谱', ARRAY['文本生成'], 131072, 16384, true)
ON CONFLICT (provider_id, model_id) DO NOTHING;

-- ===== 智谱视觉模型 =====
INSERT INTO models (provider_id, model_id, display_name, description, brand, capabilities, max_context_tokens, max_output_tokens, is_available)
VALUES
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-5v-turbo', 'GLM-5V-Turbo', '高性能视觉理解模型', '智谱', ARRAY['文本生成','视觉理解'], 200000, 131072, true),
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-4.6v', 'GLM-4.6V', '视觉理解模型', '智谱', ARRAY['文本生成','视觉理解'], 131072, 32768, true),
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-ocr', 'GLM-OCR', 'OCR 专用模型', '智谱', ARRAY['视觉理解'], 131072, 4096, true),
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-4.1v-thinking-flashx', 'GLM-4.1V-Thinking-FlashX', '免费视觉思考模型', '智谱', ARRAY['深度思考','视觉理解'], 65536, 16384, true),
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-4.6v-flash', 'GLM-4.6V-Flash', '免费视觉理解模型', '智谱', ARRAY['文本生成','视觉理解'], 131072, 32768, true),
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-4.1v-thinking-flash', 'GLM-4.1V-Thinking-Flash', '免费视觉思考模型', '智谱', ARRAY['深度思考','视觉理解'], 65536, 16384, true),
    ((SELECT id FROM providers WHERE slug='zhipu'), 'glm-4v-flash', 'GLM-4V-Flash', '免费视觉理解模型', '智谱', ARRAY['视觉理解'], 16384, 1024, true)
ON CONFLICT (provider_id, model_id) DO NOTHING;
