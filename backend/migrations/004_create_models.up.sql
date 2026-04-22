CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id),
    model_id VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    max_context_tokens INTEGER,
    input_price_per_million DECIMAL(10,6),
    output_price_per_million DECIMAL(10,6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, model_id)
);

INSERT INTO models (provider_id, model_id, display_name, max_context_tokens, input_price_per_million, output_price_per_million) VALUES
    ((SELECT id FROM providers WHERE slug='anthropic'), 'claude-sonnet-4-20250514', 'Claude Sonnet 4', 200000, 3.00, 15.00),
    ((SELECT id FROM providers WHERE slug='anthropic'), 'claude-opus-4-20250514', 'Claude Opus 4', 200000, 15.00, 75.00),
    ((SELECT id FROM providers WHERE slug='anthropic'), 'claude-3.5-haiku-20241022', 'Claude 3.5 Haiku', 200000, 0.80, 4.00),
    ((SELECT id FROM providers WHERE slug='openai'), 'gpt-4o', 'GPT-4o', 128000, 2.50, 10.00),
    ((SELECT id FROM providers WHERE slug='openai'), 'gpt-4o-mini', 'GPT-4o Mini', 128000, 0.15, 0.60),
    ((SELECT id FROM providers WHERE slug='openai'), 'o3', 'OpenAI o3', 200000, 10.00, 40.00),
    ((SELECT id FROM providers WHERE slug='google'), 'gemini-2.5-pro', 'Gemini 2.5 Pro', 1000000, 1.25, 10.00),
    ((SELECT id FROM providers WHERE slug='google'), 'gemini-2.5-flash', 'Gemini 2.5 Flash', 1000000, 0.15, 0.60);
