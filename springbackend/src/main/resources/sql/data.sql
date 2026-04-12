-- EduQuest Initial Data
-- This file populates the database with essential initial data
-- Based on updated schema.sql with generated columns and improved field sizes

-- Insert sample schools
INSERT INTO schools (name, address, phone, email)
VALUES
    ('EduQuest Academy', '123 Learning Street, Knowledge City, KC 12345', '+14159990123', 'info@eduquestacademy.edu'),
    ('Tech Institute', '456 Innovation Avenue, Silicon Valley, SV 67890', '+85212345678', 'admissions@techinstitute.edu'),
    ('Science High School', '789 Discovery Road, Research Town, RT 13579', '+44202012345678', 'admin@sciencehigh.edu')
ON CONFLICT (name) DO NOTHING;
;;;

-- Insert sample classes (using new schema with grade, suffix, and generated full_name)
INSERT INTO classes (school_id, grade, suffix, academic_year)
VALUES
    -- EduQuest Academy classes
    ((SELECT id FROM schools WHERE name = 'EduQuest Academy'), 'G10', 'A', '2024-2025'),
    ((SELECT id FROM schools WHERE name = 'EduQuest Academy'), 'G10', 'B', '2024-2025'),
    ((SELECT id FROM schools WHERE name = 'EduQuest Academy'), 'G11', 'A', '2024-2025'),
    ((SELECT id FROM schools WHERE name = 'EduQuest Academy'), 'G12', 'A', '2024-2025'),

    -- Tech Institute classes
    ((SELECT id FROM schools WHERE name = 'Tech Institute'), 'Y4', 'C', '2024-2025'),
    ((SELECT id FROM schools WHERE name = 'Tech Institute'), 'Y5', 'A', '2024-2025'),
    ((SELECT id FROM schools WHERE name = 'Tech Institute'), 'Y6', 'A', '2024-2025'),

    -- Science High School classes
    ((SELECT id FROM schools WHERE name = 'Science High School'), 'L9', 'A', '2024-2025'),
    ((SELECT id FROM schools WHERE name = 'Science High School'), 'L10', 'A', '2024-2025'),
    ((SELECT id FROM schools WHERE name = 'Science High School'), 'L11', 'D', '2024-2025')
ON CONFLICT (school_id, grade, suffix, academic_year) DO NOTHING;
;;;

-- Insert sample roles
INSERT INTO roles (name)
VALUES
    ('ROLE_USER'), ('ROLE_ADMIN'), ('ROLE_EDUCATOR')
ON CONFLICT (name) DO NOTHING;
;;;

INSERT INTO difficulty_rewards (difficulty, multiplier)
VALUES
    ('EASY', 1), ('MEDIUM', 3), ('HARD', 5)
ON CONFLICT (difficulty) DO UPDATE SET multiplier = EXCLUDED.multiplier;
;;;

-- Insert sample users with school assignments
-- Password for all these users is "password"
INSERT INTO users (username, email, password, school_id, educator_status)
VALUES
    ('student1', 'student1@eduquestacademy.edu', '$2a$10$HyMhvyf0xdf0px.QHjSKG.FOiH.PA5WaNSWBE4YfA3flUArZtvjha', (SELECT id FROM schools WHERE name = 'EduQuest Academy'), 'NONE'),
    ('student2', 'student2@eduquestacademy.edu', '$2a$10$HyMhvyf0xdf0px.QHjSKG.FOiH.PA5WaNSWBE4YfA3flUArZtvjha', (SELECT id FROM schools WHERE name = 'EduQuest Academy'), 'NONE'),
    ('student3', 'student3@eduquestacademy.edu', '$2a$10$HyMhvyf0xdf0px.QHjSKG.FOiH.PA5WaNSWBE4YfA3flUArZtvjha', (SELECT id FROM schools WHERE name = 'EduQuest Academy'), 'NONE'),
    ('teacher1', 'teacher1@techinstitute.edu', '$2a$10$HyMhvyf0xdf0px.QHjSKG.FOiH.PA5WaNSWBE4YfA3flUArZtvjha', (SELECT id FROM schools WHERE name = 'Tech Institute'), 'APPROVED'),
    ('admin', 'admin@sciencehigh.edu', '$2a$10$HyMhvyf0xdf0px.QHjSKG.FOiH.PA5WaNSWBE4YfA3flUArZtvjha', (SELECT id FROM schools WHERE name = 'Science High School'), 'ADMIN')
ON CONFLICT (username) DO NOTHING;
;;;

-- Insert user-role associations by selecting ids
INSERT INTO user_roles (user_id, role_id)
VALUES
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'student3'), (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'teacher1'), (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'teacher1'), (SELECT id FROM roles WHERE name = 'ROLE_EDUCATOR')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM roles WHERE name = 'ROLE_EDUCATOR')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM roles WHERE name = 'ROLE_ADMIN'))
ON CONFLICT (user_id, role_id) DO NOTHING;
;;;

-- Insert class memberships using new class structure
INSERT INTO class_members (class_id, user_id, role_in_class)
VALUES
    -- EduQuest Academy - Grade 10A
    ((SELECT id FROM classes WHERE grade = 'G10' AND suffix = 'A'), (SELECT id FROM users WHERE username = 'student1'), 'STUDENT'),
    ((SELECT id FROM classes WHERE grade = 'G10' AND suffix = 'A'), (SELECT id FROM users WHERE username = 'student2'), 'STUDENT'),

    -- EduQuest Academy - Grade 10B
    ((SELECT id FROM classes WHERE grade = 'G10' AND suffix = 'B'), (SELECT id FROM users WHERE username = 'student3'), 'STUDENT'),

    -- EduQuest Academy - Grade 11A
    ((SELECT id FROM classes WHERE grade = 'G11' AND suffix = 'A'), (SELECT id FROM users WHERE username = 'teacher1'), 'TEACHER'),

    -- EduQuest Academy - Grade 12A
    ((SELECT id FROM classes WHERE grade = 'G12' AND suffix = 'A'), (SELECT id FROM users WHERE username = 'admin'), 'ASSISTANT'),

    -- Tech Institute - Year 4A
    ((SELECT id FROM classes WHERE grade = 'Y4' AND suffix = 'C'), (SELECT id FROM users WHERE username = 'teacher1'), 'TEACHER'),

    -- Tech Institute - Year 5A
    ((SELECT id FROM classes WHERE grade = 'Y5' AND suffix = 'A'), (SELECT id FROM users WHERE username = 'teacher1'), 'TEACHER'),

    -- Science High School - Level 9A
    ((SELECT id FROM classes WHERE grade = 'L9' AND suffix = 'A'), (SELECT id FROM users WHERE username = 'admin'), 'ASSISTANT')
ON CONFLICT (class_id, user_id) DO NOTHING;
;;;

-- Insert comprehensive games
INSERT INTO games (type, name, difficulty, icon, description)
VALUES
    -- Math Games
    ('MATH', 'Speed Calculation', 'EASY', 'Calculator', '快速心算挑戰，提升你的運算速度。'),
    ('MATH', 'AI Math Adventure', 'HARD', 'Robot', '結合人工智慧的高難度數學邏輯冒險。'),

    -- English Games
    ('ENGLISH', 'Listening Game', 'MEDIUM', 'Headphones', '聽力多選題測試，增強英文聽解能力。'),
    ('ENGLISH', 'Writing Game', 'EASY', 'ABC', '經典單字配對，幫助記住基礎字彙。'),
    ('ENGLISH', 'Sentence Reorder', 'HARD', 'Book', '句子重組挑戰，強化英文語法結構。'),

    -- Science Games
    ('SCIENCE', 'Animal Catcher', 'EASY', 'Leaf', '根據特徵對不同動物進行分類。'),
    ('SCIENCE', 'Animal Classification', 'MEDIUM', 'Brain', '人體器官拼圖，學習解剖學基礎知識。'),
    ('SCIENCE', 'Body Parts Matching', 'MEDIUM', 'Body', '人體系統遊戲索引，探索人體各個系統。'),
    ('SCIENCE', 'Human organs', 'EASY', 'Paw', '動物遊戲索引，學習各種動物知識。'),

    -- Chinese Games
    ('CHINESE', 'ChineseGame', 'MEDIUM', 'Character', '中文學習遊戲，提升中文能力。'),
    ('CHINESE', 'ChineseSentenceGame', 'HARD', 'Scroll', '中文句子遊戲，學習中文句型結構。')

    -- General/Misc Games

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
    ('CHINESE', 'Daily Chinese Practice', 'EASY', 'Character', 'Practice Chinese characters for 15 minutes', 10),

    -- Weekly Missions
    ('ENGLISH', 'Word Collector', 'MEDIUM', 'Languages', 'Learn 20 new vocabulary words this week', 30),
    ('MATH', 'Math Marathon', 'MEDIUM', 'Calculator', 'Complete 15 math problems across all difficulties', 30),
    ('SCIENCE', 'Science Explorer', 'MEDIUM', 'Atom', 'Complete 5 different science games', 30),
    ('CHINESE', 'Chinese Character Master', 'MEDIUM', 'Character', 'Learn 15 new Chinese characters this week', 30),

    -- Achievement Missions
    ('ENGLISH', 'Grammar Guru', 'HARD', 'Languages', 'Complete all English games with 90% accuracy', 50),
    ('MATH', 'Math Wizard', 'HARD', 'Calculator', 'Master all math difficulty levels', 50),
    ('SCIENCE', 'Science Master', 'HARD', 'Atom', 'Complete every science game at least once', 50),
    ('CHINESE', 'Chinese Language Expert', 'HARD', 'Scroll', 'Complete all Chinese games with 90% accuracy', 50),

    -- Special Missions
    ('MATH', 'Speed Demon', 'HARD', 'Calculator', 'Complete 10 math problems in under 2 minutes', 40),
    ('ENGLISH', 'Storyteller', 'MEDIUM', 'Languages', 'Write a short story using 10 vocabulary words', 35),
    ('SCIENCE', 'Experiment Log', 'MEDIUM', 'Atom', 'Document and explain 3 scientific concepts', 35),
    ('CHINESE', 'Chinese Speed Writing', 'HARD', 'Scroll', 'Write 20 Chinese characters in under 3 minutes', 40)
ON CONFLICT (name) DO NOTHING;
;;;

-- Insert sample activities using new schema
INSERT INTO activities (creator_id, name, start_date, end_date, score, icon, description)
VALUES
    -- Teacher1 activities
    ((SELECT id FROM users WHERE username = 'teacher1'), 'Math Challenge Week', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 50, 'Calculator', 'Complete math problems and earn points!'),
    ((SELECT id FROM users WHERE username = 'teacher1'), 'Science Fair Project', CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '14 days', 100, 'Microscope', 'Create and present a science project'),

    -- Admin activities
    ((SELECT id FROM users WHERE username = 'admin'), 'Reading Marathon', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 75, 'Book', 'Read books and complete comprehension quizzes'),
    ((SELECT id FROM users WHERE username = 'admin'), 'Coding Competition', CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '10 days', 150, 'Code', 'Solve programming challenges and win prizes')
ON CONFLICT (creator_id, name) DO NOTHING;
;;;

-- Insert user activity participation
INSERT INTO user_activities (activity_id, user_id, role_in_group, completed)
VALUES
    -- Math Challenge Week participants
    ((SELECT id FROM activities WHERE name = 'Math Challenge Week'), (SELECT id FROM users WHERE username = 'student1'), 'participant', FALSE),
    ((SELECT id FROM activities WHERE name = 'Math Challenge Week'), (SELECT id FROM users WHERE username = 'student2'), 'participant', TRUE),
    ((SELECT id FROM activities WHERE name = 'Math Challenge Week'), (SELECT id FROM users WHERE username = 'student3'), 'participant', FALSE),

    -- Science Fair Project participants
    ((SELECT id FROM activities WHERE name = 'Science Fair Project'), (SELECT id FROM users WHERE username = 'student1'), 'researcher', FALSE),
    ((SELECT id FROM activities WHERE name = 'Science Fair Project'), (SELECT id FROM users WHERE username = 'student3'), 'presenter', TRUE),

    -- Reading Marathon participants
    ((SELECT id FROM activities WHERE name = 'Reading Marathon'), (SELECT id FROM users WHERE username = 'student2'), 'reader', TRUE),
    ((SELECT id FROM activities WHERE name = 'Reading Marathon'), (SELECT id FROM users WHERE username = 'admin'), 'organizer', TRUE),

    -- Coding Competition participants
    ((SELECT id FROM activities WHERE name = 'Coding Competition'), (SELECT id FROM users WHERE username = 'student1'), 'coder', FALSE),
    ((SELECT id FROM activities WHERE name = 'Coding Competition'), (SELECT id FROM users WHERE username = 'teacher1'), 'mentor', TRUE)
ON CONFLICT (activity_id, user_id) DO NOTHING;
;;;

-- Delete only the default user game scores that will be reinserted
DELETE FROM user_game_scores
WHERE user_id IN (SELECT id FROM users WHERE username IN ('student1', 'student2', 'student3', 'teacher1', 'admin'));
;;;
-- Insert sample game scores for leaderboard display
INSERT INTO user_game_scores (user_id, game_id, scores)
VALUES
    -- Speed Calculation (EASY) - 名稱正確
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM games WHERE name = 'Speed Calculation'), 95),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM games WHERE name = 'Speed Calculation'), 88),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM games WHERE name = 'Speed Calculation'), 100),

    -- AI Math Adventure (HARD) - 名稱正確
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM games WHERE name = 'AI Math Adventure'), 75),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM games WHERE name = 'AI Math Adventure'), 92),

    -- 修正：'Word matching game' 改為 'Writing Game'
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM games WHERE name = 'Writing Game'), 98),
    ((SELECT id FROM users WHERE username = 'student3'), (SELECT id FROM games WHERE name = 'Writing Game'), 70),

    -- 修正：'Sentence Reordering Game' 改為 'Sentence Reorder'
    ((SELECT id FROM users WHERE username = 'teacher1'), (SELECT id FROM games WHERE name = 'Sentence Reorder'), 95),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM games WHERE name = 'Sentence Reorder'), 88),

    -- 修正：'Animal sorting game' 改為 'Animal Catcher'
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM games WHERE name = 'Animal Catcher'), 85),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM games WHERE name = 'Animal Catcher'), 92),

    -- Listening Game (MEDIUM)
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM games WHERE name = 'Listening Game'), 78),
    ((SELECT id FROM users WHERE username = 'student3'), (SELECT id FROM games WHERE name = 'Listening Game'), 82),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM games WHERE name = 'Listening Game'), 90),

    -- Human organs (EASY)
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM games WHERE name = 'Human organs'), 88),
    ((SELECT id FROM users WHERE username = 'student3'), (SELECT id FROM games WHERE name = 'Human organs'), 75),

    -- Animal Classification (MEDIUM)
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM games WHERE name = 'Animal Classification'), 92),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM games WHERE name = 'Animal Classification'), 85),

    -- Body Parts Matching (MEDIUM)
    ((SELECT id FROM users WHERE username = 'student3'), (SELECT id FROM games WHERE name = 'Body Parts Matching'), 80),
    ((SELECT id FROM users WHERE username = 'teacher1'), (SELECT id FROM games WHERE name = 'Body Parts Matching'), 77),

    -- ChineseGame (MEDIUM)
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM games WHERE name = 'ChineseGame'), 85),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM games WHERE name = 'ChineseGame'), 90),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM games WHERE name = 'ChineseGame'), 88),

    -- ChineseSentenceGame (HARD)
    ((SELECT id FROM users WHERE username = 'student3'), (SELECT id FROM games WHERE name = 'ChineseSentenceGame'), 70),
    ((SELECT id FROM users WHERE username = 'teacher1'), (SELECT id FROM games WHERE name = 'ChineseSentenceGame'), 82)
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
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM missions WHERE name = 'Daily Chinese Practice'), TRUE),
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM missions WHERE name = 'Word Collector'), FALSE),

    -- Student2 completed missions (more advanced)
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM missions WHERE name = 'Daily Reader'), TRUE),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM missions WHERE name = 'Daily Math Practice'), TRUE),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM missions WHERE name = 'Science Fact Finder'), TRUE),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM missions WHERE name = 'Word Collector'), TRUE),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM missions WHERE name = 'Math Marathon'), TRUE),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM missions WHERE name = 'Chinese Character Master'), FALSE),

    -- Student3 completed missions (beginner)
    ((SELECT id FROM users WHERE username = 'student3'), (SELECT id FROM missions WHERE name = 'Daily Math Practice'), TRUE),
    ((SELECT id FROM users WHERE username = 'student3'), (SELECT id FROM missions WHERE name = 'Daily Chinese Practice'), TRUE),
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
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Daily Chinese Practice'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Word Collector'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Math Marathon'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Science Explorer'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Chinese Character Master'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Grammar Guru'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Math Wizard'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Science Master'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Chinese Language Expert'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Speed Demon'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Storyteller'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Experiment Log'), TRUE),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM missions WHERE name = 'Chinese Speed Writing'), TRUE)
ON CONFLICT DO NOTHING;
;;;

-- Insert sample items for the shop (AVATAR, BACKGROUND, BADGE only - no POWERUP)
INSERT INTO items (type, name, icon, description, price)
VALUES
    -- Avatar Items (from AvatarIcons.tsx)
    ('AVATAR', 'Default', 'default', 'Simple and classic avatar design', 0),
    ('AVATAR', 'Happy Cat', 'happy_cat', 'Cheerful feline friend with whiskers', 50),
    ('AVATAR', 'Cool Dog', 'cool_dog', 'Trendy canine with sunglasses attitude', 75),
    ('AVATAR', 'Smart Owl', 'smart_owl', 'Wise nocturnal scholar with glasses', 100),
    ('AVATAR', 'Sporty Rabbit', 'sporty_rabbit', 'Athletic bunny ready for action', 60),
    ('AVATAR', 'Artistic Butterfly', 'artistic_butterfly', 'Creative and colorful winged artist', 80),
    ('AVATAR', 'Bookworm Bear', 'bookworm_bear', 'Studious bear with a love for reading', 90),
    ('AVATAR', 'Explorer Monkey', 'explorer_monkey', 'Adventurous primate ready to discover', 70),
    ('AVATAR', 'Star Student', 'star_student', 'Shining academic achiever', 120),
    ('AVATAR', 'Rainbow Unicorn', 'rainbow_unicorn', 'Magical creature with colorful mane', 150),
    ('AVATAR', 'Rocket Raccoon', 'rocket_raccoon', 'Space-faring masked adventurer', 110),
    ('AVATAR', 'Heart Panda', 'heart_panda', 'Loving bear with heart-shaped ears', 95),
    ('AVATAR', 'Sunshine Bee', 'sunshine_bee', 'Bright and busy pollinator friend', 65),
    ('AVATAR', 'Moon Turtle', 'moon_turtle', 'Gentle reptile under moonlight', 85),
    ('AVATAR', 'Flower Ladybug', 'flower_ladybug', 'Garden-dwelling spotted beauty', 55),
    ('AVATAR', 'Rainbow Frog', 'rainbow_frog', 'Colorful amphibian with vibrant colors', 75),
    ('AVATAR', 'Cloud Sheep', 'cloud_sheep', 'Fluffy woolly cloud-like creature', 80),
    ('AVATAR', 'Apple Teacher', 'apple_teacher', 'Educational fruit-inspired mentor', 100),
    ('AVATAR', 'Pencil Wizard', 'pencil_wizard', 'Magical drawing tool master', 130),
    ('AVATAR', 'Crayon Dragon', 'crayon_dragon', 'Colorful artistic fire-breather', 140),
    ('AVATAR', 'Cool Hat', 'Hat', 'Stylish wizard hat with golden star', 160),
    ('AVATAR', 'Superhero Cape', 'Cape', 'Heroic red cape with golden accents', 180),

    -- Background Items
    ('BACKGROUND', 'Space Theme', 'Space', 'Explore the cosmos', 80),
    ('BACKGROUND', 'Ocean View', 'Ocean', 'Relaxing beach background', 70),
    ('BACKGROUND', 'Forest Adventure', 'Forest', 'Nature-inspired learning environment', 65),
    ('BACKGROUND', 'City Skyline', 'City', 'Urban learning backdrop', 85),

    -- Badge Items
    ('BADGE', 'Math Champion', 'Trophy', 'Awarded for math excellence', 150),
    ('BADGE', 'Reading Star', 'Book', 'Awarded for reading achievements', 130),
    ('BADGE', 'Science Explorer', 'science_glasses.png', 'Awarded for science curiosity', 140),
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
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM items WHERE name = 'Happy Face')),
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM items WHERE name = 'Space Theme')),

    -- Student2 items
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM items WHERE name = 'Smart Student')),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM items WHERE name = 'Math Champion')),

    -- Student3 items
    -- No items for student3 (beginner user)

    -- Teacher1 items
    ((SELECT id FROM users WHERE username = 'teacher1'), (SELECT id FROM items WHERE name = 'Cool Kid')),
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
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'Math Champion')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'Reading Star')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'Science Explorer')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM items WHERE name = 'Memory Master'))
ON CONFLICT DO NOTHING;
;;;

-- Insert user profiles with proper JSONB structure
INSERT INTO user_profiles (user_id, nickname, equipped_items, preferences, privacy_settings)
VALUES
    ((SELECT id FROM users WHERE username = 'student1'), 'MathWhiz',
     '{"AVATAR": null, "BADGE": null, "BACKGROUND": null}',
     '{"theme": "DARK", "sound": true, "notifications": false}',
     '{"show_email": false, "show_school": true, "show_class": true}'),

    ((SELECT id FROM users WHERE username = 'student2'), 'ScienceStar',
     '{"AVATAR": 3, "BADGE": 9, "BACKGROUND": null}',
     '{"theme": "LIGHT", "sound": true, "notifications": true}',
     '{"show_email": false, "show_school": true, "show_class": false}'),

    ((SELECT id FROM users WHERE username = 'student3'), 'Bookworm',
     '{"AVATAR": null, "BADGE": null, "BACKGROUND": null}',
     '{"theme": "DARK", "sound": false, "notifications": true}',
     '{"show_email": true, "show_school": false, "show_class": true}'),

    ((SELECT id FROM users WHERE username = 'teacher1'), 'ProfTech',
     '{"AVATAR": 2, "BADGE": 10, "BACKGROUND": 7}',
     '{"theme": "LIGHT", "sound": true, "notifications": true}',
     '{"show_email": true, "show_school": true, "show_class": true}'),

    ((SELECT id FROM users WHERE username = 'admin'), 'SuperAdmin',
     '{"AVATAR": 3, "BADGE": null, "BACKGROUND": 5}',
     '{"theme": "DARK", "sound": false, "notifications": false}',
     '{"show_email": false, "show_school": false, "show_class": false}')
ON CONFLICT (user_id) DO UPDATE SET
                                    nickname = EXCLUDED.nickname,
                                    equipped_items = EXCLUDED.equipped_items,
                                    preferences = EXCLUDED.preferences,
                                    privacy_settings = EXCLUDED.privacy_settings;
;;;
