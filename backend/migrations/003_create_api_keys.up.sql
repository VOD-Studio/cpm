CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id),
    name VARCHAR(100) NOT NULL,
    key_encrypted TEXT NOT NULL,
    base_url VARCHAR(500),
    plan_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_tested_at TIMESTAMP WITH TIME ZONE,
    last_status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
