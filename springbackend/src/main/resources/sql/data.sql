-- EduQuest Initial Data
-- This file populates the database with essential initial data

-- Insert sample roles
INSERT INTO roles (name)
VALUES
    ('ROLE_USER'), ('ROLE_ADMIN'), ('ROLE_TEACHER')
ON CONFLICT (name) DO NOTHING;
;;;

INSERT INTO difficulty_rewards (difficulty, multiplier)
VALUES
    ('EASY', 1), ('MEDIUM', 3), ('HARD', 5)
ON CONFLICT (difficulty) DO UPDATE SET multiplier = EXCLUDED.multiplier;
;;;

-- Insert sample users
-- Password for all these users is "password"
INSERT INTO users (username, email, password)
VALUES
    ('student1', 'student1@eduquest.com', '$2a$10$HyMhvyf0xdf0px.QHjSKG.FOiH.PA5WaNSWBE4YfA3flUArZtvjha'),
    ('student2', 'student2@eduquest.com', '$2a$10$HyMhvyf0xdf0px.QHjSKG.FOiH.PA5WaNSWBE4YfA3flUArZtvjha'),
    ('student3', 'student3@eduquest.com', '$2a$10$HyMhvyf0xdf0px.QHjSKG.FOiH.PA5WaNSWBE4YfA3flUArZtvjha'),
    ('teacher1', 'teacher1@eduquest.com', '$2a$10$HyMhvyf0xdf0px.QHjSKG.FOiH.PA5WaNSWBE4YfA3flUArZtvjha'),
    ('admin', 'admin@eduquest.com', '$2a$10$HyMhvyf0xdf0px.QHjSKG.FOiH.PA5WaNSWBE4YfA3flUArZtvjha')
ON CONFLICT (username) DO NOTHING;
;;;

-- Insert user-role associations by selecting ids
INSERT INTO user_roles (user_id, role_id)
VALUES
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'student3'), (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'teacher1'), (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'teacher1'), (SELECT id FROM roles WHERE name = 'ROLE_TEACHER')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM roles WHERE name = 'ROLE_ADMIN'))
ON CONFLICT (user_id, role_id) DO NOTHING;
;;;

-- Insert comprehensive games
INSERT INTO games (type, name, difficulty, icon, description)
VALUES
    -- Math Games
    ('MATH', 'Speed Calculation', 'EASY', 'Calculator', '快速心算挑戰，提升你的運算速度。'),
    ('MATH', 'AI Math Adventure', 'HARD', 'Robot', '結合人工智慧的高難度數學邏輯冒險。'),

    -- English Games
    ('ENGLISH', 'Listening multiple choice questions', 'MEDIUM', 'Headphones', '聽力多選題測試，增強英文聽解能力。'),
    ('ENGLISH', 'Word matching game', 'EASY', 'ABC', '經典單字配對，幫助記住基礎字彙。'),
    ('ENGLISH', 'Sentence Reordering Game', 'HARD', 'Book', '句子重組挑戰，強化英文語法結構。'),

    -- Science Games
    ('SCIENCE', 'Animal sorting game', 'EASY', 'Leaf', '根據特徵對不同動物進行分類。'),
    ('SCIENCE', 'Human Body Puzzle', 'MEDIUM', 'Brain', '人體器官拼圖，學習解剖學基礎知識。')
ON CONFLICT (name) DO UPDATE SET
                                 type = EXCLUDED.type,
                                 difficulty = EXCLUDED.difficulty,
                                 description = EXCLUDED.description;
;;;
-- Insert comprehensive missions
INSERT INTO missions (type, name, difficulty, icon, description, scores)
VALUES
    -- Daily Missions
    ('ENGLISH', 'Daily Reader', 'EASY', 'Book', 'Read for 15 minutes and complete a comprehension quiz', 10),
    ('MATH', 'Daily Math Practice', 'EASY', 'Calculator', 'Complete 5 math problems of any difficulty', 10),
    ('SCIENCE', 'Science Fact Finder', 'EASY', 'Atom', 'Learn one new science fact and answer a question', 10),
    ('MEMORY', 'Memory Warm-up', 'EASY', 'Brain', 'Complete one memory game to start your day', 10),
    
    -- Weekly Missions
    ('ENGLISH', 'Word Collector', 'MEDIUM', 'Languages', 'Learn 20 new vocabulary words this week', 30),
    ('MATH', 'Math Marathon', 'MEDIUM', 'Calculator', 'Complete 15 math problems across all difficulties', 30),
    ('SCIENCE', 'Science Explorer', 'MEDIUM', 'Atom', 'Complete 5 different science games', 30),
    ('MEMORY', 'Memory Champion', 'MEDIUM', 'Brain', 'Achieve a score of 80% or higher in 3 memory games', 30),
    
    -- Achievement Missions
    ('ENGLISH', 'Grammar Guru', 'HARD', 'Languages', 'Complete all English games with 90% accuracy', 50),
    ('MATH', 'Math Wizard', 'HARD', 'Calculator', 'Master all math difficulty levels', 50),
    ('SCIENCE', 'Science Master', 'HARD', 'Atom', 'Complete every science game at least once', 50),
    ('MEMORY', 'Memory Master', 'HARD', 'Brain', 'Achieve perfect scores in all memory games', 50),
    
    -- Special Missions
    ('MATH', 'Speed Demon', 'HARD', 'Calculator', 'Complete 10 math problems in under 2 minutes', 40),
    ('ENGLISH', 'Storyteller', 'MEDIUM', 'Languages', 'Write a short story using 10 vocabulary words', 35),
    ('SCIENCE', 'Experiment Log', 'MEDIUM', 'Atom', 'Document and explain 3 scientific concepts', 35),
    ('MEMORY', 'Lightning Fast', 'HARD', 'Brain', 'Complete a memory game in record time', 40)
ON CONFLICT (name) DO NOTHING;
;;;

-- Delete only the default user game scores that will be reinserted
DELETE FROM user_game_scores
WHERE user_id IN (SELECT id FROM users WHERE username IN ('student1', 'student2', 'student3', 'teacher1', 'admin'));
;;;
-- Insert sample game scores for leaderboard display
INSERT INTO user_game_scores (user_id, game_id, scores)
VALUES
    -- Speed Calculation (EASY)
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM games WHERE name = 'Speed Calculation'), 95),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM games WHERE name = 'Speed Calculation'), 88),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM games WHERE name = 'Speed Calculation'), 100),

    -- AI Math Adventure (HARD)
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM games WHERE name = 'AI Math Adventure'), 75),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM games WHERE name = 'AI Math Adventure'), 92),

    -- Word matching game (EASY)
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM games WHERE name = 'Word matching game'), 98),
    ((SELECT id FROM users WHERE username = 'student3'), (SELECT id FROM games WHERE name = 'Word matching game'), 70),

    -- Sentence Reordering Game (HARD)
    ((SELECT id FROM users WHERE username = 'teacher1'), (SELECT id FROM games WHERE name = 'Sentence Reordering Game'), 95),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM games WHERE name = 'Sentence Reordering Game'), 88),

    -- Animal sorting game (EASY)
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM games WHERE name = 'Animal sorting game'), 85),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM games WHERE name = 'Animal sorting game'), 92)
ON CONFLICT DO NOTHING;
;;;

-- Delete only the default user missions that will be reinserted
DELETE FROM user_missions
WHERE user_id IN (SELECT id FROM users WHERE username IN ('student1', 'student2', 'student3', 'teacher1', 'admin'));
;;;
-- Sample user mission completions
INSERT INTO user_missions (user_id, mission_id, completed)
VALUES
    -- Student1 completed missions
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM missions WHERE name = 'Daily Reader'), TRUE),
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM missions WHERE name = 'Daily Math Practice'), TRUE),
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM missions WHERE name = 'Memory Warm-up'), TRUE),
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM missions WHERE name = 'Word Collector'), FALSE),
    
    -- Student2 completed missions (more advanced)
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM missions WHERE name = 'Daily Reader'), TRUE),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM missions WHERE name = 'Daily Math Practice'), TRUE),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM missions WHERE name = 'Science Fact Finder'), TRUE),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM missions WHERE name = 'Word Collector'), TRUE),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM missions WHERE name = 'Math Marathon'), TRUE),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM missions WHERE name = 'Memory Champion'), FALSE),
    
    -- Student3 completed missions (beginner)
    ((SELECT id FROM users WHERE username = 'student3'), (SELECT id FROM missions WHERE name = 'Daily Math Practice'), TRUE),
    ((SELECT id FROM users WHERE username = 'student3'), (SELECT id FROM missions WHERE name = 'Memory Warm-up'), TRUE),
    ((SELECT id FROM users WHERE username = 'student3'), (SELECT id FROM missions WHERE name = 'Daily Reader'), FALSE),
    
    -- Teacher1 completed missions (demonstration purposes)
    ((SELECT id FROM users WHERE username = 'teacher1'), (SELECT id FROM missions WHERE name = 'Daily Reader'), TRUE),
    ((SELECT id FROM users WHERE username = 'teacher1'), (SELECT id FROM missions WHERE name = 'Daily Math Practice'), TRUE),
    ((SELECT id FROM users WHERE username = 'teacher1'), (SELECT id FROM missions WHERE name = 'Science Fact Finder'), TRUE),
    ((SELECT id FROM users WHERE username = 'teacher1'), (SELECT id FROM missions WHERE name = 'Word Collector'), TRUE),
    ((SELECT id FROM users WHERE username = 'teacher1'), (SELECT id FROM missions WHERE name = 'Math Marathon'), TRUE),
    ((SELECT id FROM users WHERE username = 'teacher1'), (SELECT id FROM missions WHERE name = 'Science Explorer'), TRUE),
    ((SELECT id FROM users WHERE username = 'teacher1'), (SELECT id FROM missions WHERE name = 'Grammar Guru'), TRUE),
    
    -- Admin completed missions (all missions)
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Daily Reader'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Daily Math Practice'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Science Fact Finder'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Memory Warm-up'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Word Collector'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Math Marathon'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Science Explorer'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Memory Champion'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Grammar Guru'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Math Wizard'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Science Master'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Memory Master'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Speed Demon'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Storyteller'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Experiment Log'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Lightning Fast'), TRUE)
ON CONFLICT DO NOTHING;
;;;

-- Insert sample items for the shop
INSERT INTO items (type, name, icon, description, price)
VALUES
    -- Avatar Items
    ('AVATAR', 'Cool Hat', 'Hat', 'Stylish hat for your avatar', 50),
    ('AVATAR', 'Superhero Cape', 'Cape', 'Fly through challenges with this cape', 100),
    ('AVATAR', 'Science Glasses', 'Glasses', 'Look smart with these glasses', 75),
    ('AVATAR', 'Sports Jersey', 'Jersey', 'Show your team spirit', 60),
    
    -- Background Items
    ('BACKGROUND', 'Space Theme', 'Space', 'Explore the cosmos', 80),
    ('BACKGROUND', 'Ocean View', 'Ocean', 'Relaxing beach background', 70),
    ('BACKGROUND', 'Forest Adventure', 'Forest', 'Nature-inspired learning environment', 65),
    ('BACKGROUND', 'City Skyline', 'City', 'Urban learning backdrop', 85),
    
    -- Power-up Items
    ('POWERUP', 'Double Points', 'Star', 'Get 2x scores for next game', 120),
    ('POWERUP', 'Extra Life', 'Heart', 'Get an extra attempt in missions', 90),
    ('POWERUP', 'Time Freeze', 'Clock', 'Pause timer for 30 seconds', 110),
    ('POWERUP', 'Hint Helper', 'Lightbulb', 'Get hints in difficult games', 80),
    
    -- Badge Items
    ('BADGE', 'Math Champion', 'Trophy', 'Awarded for math excellence', 150),
    ('BADGE', 'Reading Star', 'Book', 'Awarded for reading achievements', 130),
    ('BADGE', 'Science Explorer', 'Microscope', 'Awarded for science curiosity', 140),
    ('BADGE', 'Memory Master', 'Brain', 'Awarded for memory skills', 135)
ON CONFLICT (name) DO NOTHING;
;;;

-- Delete only the default user items that will be reinserted
DELETE FROM user_items
WHERE user_id IN (SELECT id FROM users WHERE username IN ('student1', 'student2', 'student3', 'teacher1', 'admin'));
;;;
-- Insert sample user items
INSERT INTO user_items (user_id, item_id)
VALUES
    -- Student1 items
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM items WHERE name = 'Cool Hat')),
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM items WHERE name = 'Space Theme')),
    
    -- Student2 items
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM items WHERE name = 'Science Glasses')),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM items WHERE name = 'Double Points')),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM items WHERE name = 'Math Champion')),
    
    -- Student3 items
    ((SELECT id FROM users WHERE username = 'student3'), (SELECT id FROM items WHERE name = 'Extra Life')),
    
    -- Teacher1 items
    ((SELECT id FROM users WHERE username = 'teacher1'), (SELECT id FROM items WHERE name = 'Superhero Cape')),
    ((SELECT id FROM users WHERE username = 'teacher1'), (SELECT id FROM items WHERE name = 'Forest Adventure')),
    ((SELECT id FROM users WHERE username = 'teacher1'), (SELECT id FROM items WHERE name = 'Reading Star')),
    
    -- Admin items (all items for demonstration)
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'Cool Hat')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'Superhero Cape')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'Science Glasses')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'Sports Jersey')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'Space Theme')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'Ocean View')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'Forest Adventure')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'City Skyline')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'Double Points')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'Extra Life')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'Time Freeze')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'Hint Helper')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'Math Champion')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'Reading Star')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'Science Explorer')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'Memory Master'))
ON CONFLICT DO NOTHING;
;;;