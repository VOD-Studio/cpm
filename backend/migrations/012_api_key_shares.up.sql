-- API Key 共享表（Key 拥有者可将 Key 共享给指定用户）
CREATE TABLE IF NOT EXISTS api_key_shares (
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (api_key_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_api_key_shares_user_id ON api_key_shares(user_id);
