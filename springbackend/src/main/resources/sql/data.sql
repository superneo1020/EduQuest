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

INSERT INTO games (name, icon, description) VALUES
    ('Math Challenge', 'Calculator', 'A high-speed arithmetic challenge where students solve addition, subtraction, multiplication, and division to earn XP.'),
    ('Word Matching Game', 'Languages', 'An interactive vocabulary builder where students connect English terms with corresponding images or definitions.'),
    ('Listening multiple choice questions', 'Languages', 'An auditory comprehension test where students listen to native pronunciations and select the correct answer.'),
    ('Sentence Reordering Game', 'Languages', 'A grammar puzzle where students rearrange scrambled words into syntactically correct sentences.'),
    ('Animal Classification Game', 'Atom', 'A biology-themed sorting game where students categorize animals into groups like mammals, reptiles, or birds.'),
    ('Human Body Puzzle', 'Brain', 'An anatomical discovery game where students identify and place vital organs into their correct positions on a human model.')
ON CONFLICT (name) DO NOTHING;

-- 5. 插入任務 (Missions)
INSERT INTO missions (mission, mission_icon, description, points_reward) VALUES
    ('Daily Login', '', 'Log in daily to learn and receive rewards', 10),
    ('Mathematical beginner', '', 'Complete 1 games of the Math Challenge', 10),
    ('Mathematical Master', '', 'Complete 3 games of the Math Challenge', 30)

ON CONFLICT DO NOTHING;



-- 7. 插入模擬遊戲分數 (用於排行榜展示)
INSERT INTO user_game_scores (user_id, game_id, scores)
VALUES
    ((SELECT id FROM users WHERE username = 'john_doe'), (SELECT id FROM games WHERE name = 'Math Challenge'), 90),
    ((SELECT id FROM users WHERE username = 'mike_wilson'), (SELECT id FROM games WHERE name = 'Math Challenge'), 80),
    ((SELECT id FROM users WHERE username = 'admin_user'), (SELECT id FROM games WHERE name = 'Math Challenge'), 120)
ON CONFLICT DO NOTHING;

-- 8. 模擬用戶任務完成情況
INSERT INTO user_missions (user_id, mission_id, completed)
VALUES
    ((SELECT id FROM users WHERE username = 'mike_wilson'), (SELECT id FROM missions WHERE mission = 'Daily Login'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin_user'), (SELECT id FROM missions WHERE mission = 'Daily Login'), TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO point_history (user_id, amount, source_type, source_id)
VALUES
    ((SELECT id FROM users WHERE username = 'admin_user'), 100, 'GAME', (SELECT id FROM games WHERE name = 'Math Challenge')),
    ((SELECT id FROM users WHERE username = 'admin_user'), 50, 'MISSION', (SELECT id FROM missions WHERE mission = 'Daily Login')),
    ((SELECT id FROM users WHERE username = 'john_doe'), 120, 'GAME', (SELECT id FROM games WHERE name = 'Math Challenge'))
ON CONFLICT DO NOTHING;

INSERT INTO game_play_history (user_id, game_id, scores, points_earned)
VALUES
    ((SELECT id FROM users WHERE username = 'admin_user'), (SELECT id FROM games WHERE name = 'Math Challenge'), 150, 100),
    ((SELECT id FROM users WHERE username = 'john_doe'), (SELECT id FROM games WHERE name = 'Math Challenge'), 120, 80)
ON CONFLICT DO NOTHING;

UPDATE users SET points = 150 WHERE username = 'admin_user';

