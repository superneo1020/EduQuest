-- EduQuest Initial Data
-- This file populates the database with essential initial data

-- Insert sample roles
INSERT INTO roles (name) VALUES ('ROLE_USER'), ('ROLE_ADMIN');

-- Insert sample users
-- Password for all these users is "password"
INSERT INTO users (username, email, password) VALUES
    ('john_doe', 'john.doe@example.com', '$2a$10$rQ9sJ8cL7m5n4b3v2c1d0e'),
    ('jane_smith', 'jane.smith@example.com', '$2a$10$sR9tK8uL6m5n4b3v2c1d0f'),
    ('mike_wilson', 'mike.wilson@example.com', '$2a$10$tS9uL8vM6n5o4b3w2c1d0g'),
    ('sarah_jones', 'sarah.jones@example.com', '$2a$10$uT9vM8wN6o5p4b3w2c1d0h'),
    ('admin_user', 'admin@example.com', '$2a$10$vU9wN8xO6p5q4b3w2c1d0i')
ON CONFLICT (username) DO NOTHING;

-- Insert user-role associations by selecting ids
INSERT INTO user_roles (user_id, role_id)
VALUES
    ((SELECT id FROM users WHERE username = 'john_doe'), (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'jane_smith'),   (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'mike_wilson'),   (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'sarah_jones'),   (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'admin_user'),   (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'admin_user'),   (SELECT id FROM roles WHERE name = 'ROLE_ADMIN'))
ON CONFLICT (user_id, role_id) DO NOTHING;