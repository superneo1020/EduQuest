-- EduQuest Initial Data
-- This file populates the database with essential initial data

-- Insert sample roles
INSERT INTO roles (name) VALUES ('ROLE_USER'), ('ROLE_ADMIN') ON CONFLICT (name) DO NOTHING;

-- Insert sample users
-- Password for all these users is "password"
INSERT INTO users (username, email, password) VALUES
    ('john_doe', 'john.doe@example.com', '$2a$10$HyMhvyf0xdf0px.QHjSKG.FOiH.PA5WaNSWBE4YfA3flUArZtvjha'),
    ('jane_smith', 'jane.smith@example.com', '$2a$10$HyMhvyf0xdf0px.QHjSKG.FOiH.PA5WaNSWBE4YfA3flUArZtvjha'),
    ('mike_wilson', 'mike.wilson@example.com', '$2a$10$HyMhvyf0xdf0px.QHjSKG.FOiH.PA5WaNSWBE4YfA3flUArZtvjha'),
    ('sarah_jones', 'sarah.jones@example.com', '$2a$10$HyMhvyf0xdf0px.QHjSKG.FOiH.PA5WaNSWBE4YfA3flUArZtvjha'),
    ('admin_user', 'admin@example.com', '$2a$10$HyMhvyf0xdf0px.QHjSKG.FOiH.PA5WaNSWBE4YfA3flUArZtvjha')
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