-- 009: 插入火山引擎 Coding Plan 模型

-- ===== 豆包系列模型 =====
INSERT INTO models (provider_id, model_id, display_name, description, brand, capabilities, max_context_tokens, max_output_tokens, is_available)
VALUES
    ((SELECT id FROM providers WHERE slug='volcengine'), 'doubao-seed-2.0-pro', 'Doubao-Seed-2.0-Pro', '旗舰级全能通用模型，适合复杂推理与长链路任务执行场景，强调多模态理解、长上下文推理、结构化生成与工具增强执行', '豆包', ARRAY['文本生成','深度思考','视觉理解'], 262144, 131072, true),
    ((SELECT id FROM providers WHERE slug='volcengine'), 'doubao-seed-2.0-lite', 'Doubao-Seed-2.0-Lite', '兼顾生成质量与响应速度，适合作为通用生产级模型，胜任非结构化信息处理、内容创作、搜索推荐、数据分析等生产型工作', '豆包', ARRAY['文本生成','深度思考','视觉理解'], 262144, 131072, true),
    ((SELECT id FROM providers WHERE slug='volcengine'), 'doubao-seed-2.0-code', 'Doubao-Seed-2.0-Code', '依托 Seed 2.0 Agent 与视觉理解能力，强化代码能力：前端出众，多语言适配', '豆包', ARRAY['文本生成','代码生成','视觉理解'], 262144, 131072, true),
    ((SELECT id FROM providers WHERE slug='volcengine'), 'doubao-seed-code', 'Doubao-Seed-Code', '豆包编程模型，具备精准的代码生成、任务调度与逻辑协同能力', '豆包', ARRAY['文本生成','代码生成','视觉理解'], 131072, 16384, true)
ON CONFLICT (provider_id, model_id) DO UPDATE SET
    description = EXCLUDED.description,
    capabilities = EXCLUDED.capabilities,
    max_context_tokens = EXCLUDED.max_context_tokens,
    max_output_tokens = EXCLUDED.max_output_tokens;

-- ===== 第三方合作模型 =====
INSERT INTO models (provider_id, model_id, display_name, description, brand, capabilities, max_context_tokens, max_output_tokens, is_available)
VALUES
    ((SELECT id FROM providers WHERE slug='volcengine'), 'deepseek-v3.2', 'DeepSeek-V3.2', '深度求索推理模型，平衡推理能力与输出长度，在通用问答、日常 Agent 任务、轻量级代码开发场景中稳定高效', '深度求索', ARRAY['文本生成','深度思考','代码生成'], 131072, 16384, true),
    ((SELECT id FROM providers WHERE slug='volcengine'), 'kimi-k2.6', 'Kimi-K2.6', '具备强思考能力，支持多步工具调用和推理，擅长解决复杂问题，如复杂的逻辑推理、数学问题、代码编写等', 'Kimi', ARRAY['文本生成','深度思考','视觉理解'], 262144, 32768, true),
    ((SELECT id FROM providers WHERE slug='volcengine'), 'kimi-k2.5', 'Kimi-K2.5', 'Moonshot AI 最新编程模型，强化了前端代码质量与设计表现力', 'Kimi', ARRAY['文本生成','深度思考','视觉理解'], 262144, 32768, true),
    ((SELECT id FROM providers WHERE slug='volcengine'), 'glm-5.1', 'GLM-5.1', '智谱新一代旗舰模型，在代码生成、长程自主执行、复杂工程优化与真实开发场景中表现优异', '智谱', ARRAY['文本生成','深度思考'], 204800, 131072, true),
    ((SELECT id FROM providers WHERE slug='volcengine'), 'glm-4.7', 'GLM-4.7', '智谱 AI 旗舰代码大模型，在代码生成、调试、全链路理解场景中表现优异', '智谱', ARRAY['文本生成','深度思考'], 131072, 131072, true),
    ((SELECT id FROM providers WHERE slug='volcengine'), 'minimax-m2.7', 'MiniMax-M2.7', '能够自行构建复杂 Agent Harness，并基于 Agent Teams、复杂 Skills、Tool 等能力，完成高度复杂的生产力任务', 'MiniMax', ARRAY['文本生成','深度思考'], 204800, 131072, true),
    ((SELECT id FROM providers WHERE slug='volcengine'), 'minimax-m2.5', 'MiniMax-M2.5', 'MiniMax 旗舰级开源大模型，在编程、工具调用和搜索、办公等生产力场景都达到或者刷新了行业的 SOTA', 'MiniMax', ARRAY['文本生成','深度思考'], 204800, 131072, true)
ON CONFLICT (provider_id, model_id) DO UPDATE SET
    description = EXCLUDED.description,
    capabilities = EXCLUDED.capabilities,
    max_context_tokens = EXCLUDED.max_context_tokens,
    max_output_tokens = EXCLUDED.max_output_tokens;
