

CREATE SCHEMA data;

SET search_path TO data;

CREATE TABLE app_user (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    avatar_url VARCHAR(255),
    provider VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    frequency VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    date_until TIMESTAMP,
    progress DOUBLE PRECISION,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    days_in_span INTEGER,
    amount_did INTEGER,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    duration_minutes INTEGER DEFAULT 60,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES data.app_user(id)
);
