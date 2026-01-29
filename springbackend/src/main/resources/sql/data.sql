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

INSERT INTO games (type, name, difficulty, icon, description) VALUES
    ('MATH', 'Math Challenge', 'MEDIUM', 'Calculator', 'A high-speed arithmetic challenge where students solve addition, subtraction, multiplication, and division to earn XP.'),
    ('ENGLISH', 'Word Matching Game', 'EASY', 'Languages', 'An interactive vocabulary builder where students connect English terms with corresponding images or definitions.'),
    ('ENGLISH', 'Listening multiple choice questions', 'MEDIUM', 'Languages', 'An auditory comprehension test where students listen to native pronunciations and select the correct answer.'),
    ('ENGLISH', 'Sentence Reordering Game', 'HARD', 'Languages', 'A grammar puzzle where students rearrange scrambled words into syntactically correct sentences.'),
    ('SCIENCE', 'Animal Classification Game', 'EASY', 'Atom', 'A biology-themed sorting game where students categorize animals into groups like mammals, reptiles, or birds.'),
    ('SCIENCE', 'Human Body Puzzle', 'MEDIUM', 'Brain', 'An anatomical discovery game where students identify and place vital organs into their correct positions on a human model.')
ON CONFLICT (name) DO NOTHING;

-- 5. Insert Missions
INSERT INTO missions (name, icon, description, points) VALUES
    ('Daily Login', '', 'Log in daily to learn and receive rewards', 10),
    ('Mathematical beginner', '', 'Complete 1 games of the Math Challenge', 10),
    ('Mathematical Master', '', 'Complete 3 games of the Math Challenge', 30)
ON CONFLICT (name) DO NOTHING;

-- 7. Insert sample game scores (for leaderboard display)
INSERT INTO user_game_scores (user_id, game_id, scores, points)
VALUES
    ((SELECT id FROM users WHERE username = 'john_doe'), (SELECT id FROM games WHERE name = 'Math Challenge'), 90, 90),
    ((SELECT id FROM users WHERE username = 'mike_wilson'), (SELECT id FROM games WHERE name = 'Math Challenge'), 80, 80),
    ((SELECT id FROM users WHERE username = 'admin_user'), (SELECT id FROM games WHERE name = 'Math Challenge'), 120, 120)
ON CONFLICT DO NOTHING;

-- 8. Sample user mission completion
INSERT INTO user_missions (user_id, mission_id, completed)
VALUES
    ((SELECT id FROM users WHERE username = 'mike_wilson'), (SELECT id FROM missions WHERE name = 'Daily Login'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin_user'), (SELECT id FROM missions WHERE name = 'Daily Login'), TRUE)
ON CONFLICT (user_id, mission_id) DO NOTHING;

UPDATE users SET points = 150 WHERE username = 'admin_user';

