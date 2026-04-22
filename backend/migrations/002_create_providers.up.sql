CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO providers (name, slug, description) VALUES
    ('Anthropic', 'anthropic', 'Claude AI by Anthropic'),
    ('OpenAI', 'openai', 'GPT models by OpenAI'),
    ('Google', 'google', 'Gemini models by Google');
