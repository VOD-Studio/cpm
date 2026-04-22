-- 006: 添加 base_urls（多协议 URL）和品牌/能力字段

-- api_keys 表增加 base_urls JSONB 字段（支持多个 Base URL）
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS base_urls JSONB DEFAULT '[]';

-- models 表增加品牌和能力字段
ALTER TABLE models ADD COLUMN IF NOT EXISTS brand VARCHAR(100) DEFAULT '';
ALTER TABLE models ADD COLUMN IF NOT EXISTS capabilities TEXT[] DEFAULT '{}';

-- ===== 阿里云 Coding Plan 平台和模型 =====
INSERT INTO providers (name, slug, description) VALUES ('阿里云', 'ali', '阿里云百炼 Coding Plan');

INSERT INTO models (provider_id, model_id, display_name, brand, capabilities, max_context_tokens, is_available)
VALUES
    ((SELECT id FROM providers WHERE slug='ali'), 'qwen3.6-plus', 'Qwen3.6 Plus', '千问', ARRAY['文本生成','深度思考','视觉理解'], 131072, true),
    ((SELECT id FROM providers WHERE slug='ali'), 'qwen3.5-plus', 'Qwen3.5 Plus', '千问', ARRAY['文本生成','深度思考','视觉理解'], 131072, true),
    ((SELECT id FROM providers WHERE slug='ali'), 'qwen3-max-2026-01-23', 'Qwen3 Max', '千问', ARRAY['文本生成','深度思考'], 32768, true),
    ((SELECT id FROM providers WHERE slug='ali'), 'qwen3-coder-next', 'Qwen3 Coder Next', '千问', ARRAY['文本生成'], 131072, true),
    ((SELECT id FROM providers WHERE slug='ali'), 'qwen3-coder-plus', 'Qwen3 Coder Plus', '千问', ARRAY['文本生成'], 131072, true),
    ((SELECT id FROM providers WHERE slug='ali'), 'glm-5', 'GLM-5', '智谱', ARRAY['文本生成','深度思考'], 128000, true),
    ((SELECT id FROM providers WHERE slug='ali'), 'glm-4.7', 'GLM-4.7', '智谱', ARRAY['文本生成','深度思考'], 128000, true),
    ((SELECT id FROM providers WHERE slug='ali'), 'kimi-k2.5', 'Kimi K2.5', 'Kimi', ARRAY['文本生成','深度思考','视觉理解'], 131072, true),
    ((SELECT id FROM providers WHERE slug='ali'), 'MiniMax-M2.5', 'MiniMax M2.5', 'MiniMax', ARRAY['文本生成','深度思考'], 131072, true);

-- ===== 火山引擎 Coding Plan =====
INSERT INTO providers (name, slug, description) VALUES ('火山引擎', 'volcengine', '火山引擎 Coding Plan（豆包）');

-- ===== 智谱 GLM Coding Plan =====
INSERT INTO providers (name, slug, description) VALUES ('智谱', 'zhipu', '智谱 GLM Coding Plan');
