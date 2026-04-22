CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES models(id),
    request_count INTEGER NOT NULL DEFAULT 0,
    input_tokens BIGINT NOT NULL DEFAULT 0,
    output_tokens BIGINT NOT NULL DEFAULT 0,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    cost DECIMAL(12,6) NOT NULL DEFAULT 0,
    avg_response_time_ms INTEGER,
    error_count INTEGER NOT NULL DEFAULT 0,
    period_type VARCHAR(20) NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usage_api_key ON usage_records(api_key_id);
CREATE INDEX idx_usage_model ON usage_records(model_id);
CREATE INDEX idx_usage_period ON usage_records(period_start, period_end);
