-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'guest' CHECK (role IN ('admin', 'developer', 'guest')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建模型表
CREATE TABLE IF NOT EXISTS models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    publisher VARCHAR(100),
    model_type VARCHAR(50) CHECK (model_type IN ('text', 'audio', 'multimodal', 'text2image', 'embedding')),
    access_url TEXT,
    access_key TEXT,
    input_format TEXT,
    output_format TEXT,
    example TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建数据集表
CREATE TABLE IF NOT EXISTS datasets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    publisher VARCHAR(100),
    storage_path TEXT,
    data_type VARCHAR(50) CHECK (data_type IN ('dialogue', 'classification', 'generation', 'autonomous_driving', 'speech')),
    access_path TEXT,
    example TEXT,
    data_count INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建Flow表
CREATE TABLE IF NOT EXISTS flows (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    publisher VARCHAR(100),
    flow_type VARCHAR(20) CHECK (flow_type IN ('workflow', 'chatflow')),
    access_url TEXT,
    input_format TEXT,
    output_format TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建Agent表
CREATE TABLE IF NOT EXISTS agents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    publisher VARCHAR(100),
    agent_type VARCHAR(50),
    access_url TEXT,
    input_format TEXT,
    output_format TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建榜单表
CREATE TABLE IF NOT EXISTS leaderboards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    publisher VARCHAR(100),
    dataset_ids INTEGER[],
    model_ids INTEGER[],
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建榜单结果表
CREATE TABLE IF NOT EXISTS leaderboard_results (
    id SERIAL PRIMARY KEY,
    leaderboard_id INTEGER REFERENCES leaderboards(id) ON DELETE CASCADE,
    model_id INTEGER REFERENCES models(id),
    dataset_id INTEGER REFERENCES datasets(id),
    score DECIMAL(5,2),
    metrics JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建默认管理员用户
INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '$2b$10$dqkA1WxlrLb.FOjrGqE8l.NvXNbtPZpvFzFKFgPJpLkz4hGmKvWOq', 'admin') 
ON CONFLICT (username) DO NOTHING;
-- 默认密码是 'admin123'