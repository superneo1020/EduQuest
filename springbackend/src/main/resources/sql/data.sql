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
ON CONFLICT (school_id, grade, suffix, academic_year) DO UPDATE SET
    grade = EXCLUDED.grade,
    suffix = EXCLUDED.suffix,
    academic_year = EXCLUDED.academic_year;
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
    ('tech_teacher1', 'tech_teacher1@techinstitute.edu', '$2a$10$HyMhvyf0xdf0px.QHjSKG.FOiH.PA5WaNSWBE4YfA3flUArZtvjha', (SELECT id FROM schools WHERE name = 'Tech Institute'), 'APPROVED'),
    ('admin', 'admin@sciencehigh.edu', '$2a$10$HyMhvyf0xdf0px.QHjSKG.FOiH.PA5WaNSWBE4YfA3flUArZtvjha', (SELECT id FROM schools WHERE name = 'Science High School'), 'ADMIN'),
    ('edu_teacher1', 'tech_teacher1@eduquestacademy.edu', '$2a$10$HyMhvyf0xdf0px.QHjSKG.FOiH.PA5WaNSWBE4YfA3flUArZtvjha', (SELECT id FROM schools WHERE name = 'EduQuest Academy'), 'APPROVED'),
    ('edu_teacher2', 'teacher2@eduquestacademy.edu', '$2a$10$HyMhvyf0xdf0px.QHjSKG.FOiH.PA5WaNSWBE4YfA3flUArZtvjha', (SELECT id FROM schools WHERE name = 'EduQuest Academy'), 'APPROVED')
ON CONFLICT (username) DO NOTHING;
;;;

-- Insert user-role associations by selecting ids
INSERT INTO user_roles (user_id, role_id)
VALUES
    ((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'student3'), (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'tech_teacher1'), (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'tech_teacher1'), (SELECT id FROM roles WHERE name = 'ROLE_EDUCATOR')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM roles WHERE name = 'ROLE_EDUCATOR')),
    ((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM roles WHERE name = 'ROLE_ADMIN')),
    ((SELECT id FROM users WHERE username = 'edu_teacher1'), (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'edu_teacher1'), (SELECT id FROM roles WHERE name = 'ROLE_EDUCATOR')),
    ((SELECT id FROM users WHERE username = 'edu_teacher2'), (SELECT id FROM roles WHERE name = 'ROLE_USER')),
    ((SELECT id FROM users WHERE username = 'edu_teacher2'), (SELECT id FROM roles WHERE name = 'ROLE_EDUCATOR'))
ON CONFLICT (user_id, role_id) DO NOTHING;
;;;

-- Insert class memberships using new class structure
INSERT INTO class_members (class_id, user_id, role_in_class)
VALUES
    -- EduQuest Academy - Grade 10A
    ((SELECT id FROM classes WHERE grade = 'G10' AND suffix = 'A'), (SELECT id FROM users WHERE username = 'student1'), 'STUDENT'),
    ((SELECT id FROM classes WHERE grade = 'G10' AND suffix = 'A'), (SELECT id FROM users WHERE username = 'student2'), 'STUDENT'),
    ((SELECT id FROM classes WHERE grade = 'G10' AND suffix = 'A'), (SELECT id FROM users WHERE username = 'edu_teacher1'), 'HEAD_TEACHER'),
    ((SELECT id FROM classes WHERE grade = 'G10' AND suffix = 'A'), (SELECT id FROM users WHERE username = 'edu_teacher2'), 'ASSISTANT'),

    -- EduQuest Academy - Grade 10B
    ((SELECT id FROM classes WHERE grade = 'G10' AND suffix = 'B'), (SELECT id FROM users WHERE username = 'student3'), 'STUDENT'),
    ((SELECT id FROM classes WHERE grade = 'G10' AND suffix = 'B'), (SELECT id FROM users WHERE username = 'edu_teacher1'), 'HEAD_TEACHER'),
    ((SELECT id FROM classes WHERE grade = 'G10' AND suffix = 'B'), (SELECT id FROM users WHERE username = 'edu_teacher2'), 'TEACHER'),

    -- EduQuest Academy - Grade 11A
    ((SELECT id FROM classes WHERE grade = 'G11' AND suffix = 'A'), (SELECT id FROM users WHERE username = 'edu_teacher1'), 'HEAD_TEACHER'),
    ((SELECT id FROM classes WHERE grade = 'G11' AND suffix = 'A'), (SELECT id FROM users WHERE username = 'edu_teacher2'), 'ASSISTANT'),

    -- EduQuest Academy - Grade 12A
    ((SELECT id FROM classes WHERE grade = 'G12' AND suffix = 'A'), (SELECT id FROM users WHERE username = 'edu_teacher1'), 'HEAD_TEACHER'),
    ((SELECT id FROM classes WHERE grade = 'G12' AND suffix = 'A'), (SELECT id FROM users WHERE username = 'edu_teacher2'), 'TEACHER'),

    -- Tech Institute - Year 4C
    ((SELECT id FROM classes WHERE grade = 'Y4' AND suffix = 'C'), (SELECT id FROM users WHERE username = 'tech_teacher1'), 'HEAD_TEACHER'),

    -- Tech Institute - Year 5A
    ((SELECT id FROM classes WHERE grade = 'Y5' AND suffix = 'A'), (SELECT id FROM users WHERE username = 'tech_teacher1'), 'HEAD_TEACHER'),

    -- Science High School - Level 9A
    ((SELECT id FROM classes WHERE grade = 'L9' AND suffix = 'A'), (SELECT id FROM users WHERE username = 'admin'), 'HEAD_TEACHER')
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
ON CONFLICT (name) DO UPDATE SET
     type = EXCLUDED.type,
     difficulty = EXCLUDED.difficulty,
     description = EXCLUDED.description;
;;;

-- Delete only the default user game scores that will be reinserted
DELETE FROM user_game_scores
WHERE user_id IN (SELECT id FROM users WHERE username IN ('student1', 'student2', 'student3', 'tech_teacher1', 'admin', 'edu_teacher1', 'edu_teacher2'));
;;;

-- Insert comprehensive missions
INSERT INTO missions (type, name, difficulty, icon, description, scores)
VALUES
    -- Daily Missions
    ('ENGLISH', 'Daily Reader', 'EASY', 'Book', 'Read for 15 minutes and complete a comprehension quiz', 10),
    ('MATH', 'Daily Math Practice', 'EASY', 'Calculator', 'Complete 5 math problems of any difficulty', 10),
    ('SCIENCE', 'Science Fact Finder', 'EASY', 'Atom', 'Learn one new science fact and answer a question', 10),
    ('CHINESE', 'Memory Warm-up', 'EASY', 'Brain', 'Complete one memory game to start your day', 10),

    -- Weekly Missions
    ('ENGLISH', 'Word Collector', 'MEDIUM', 'Languages', 'Learn 20 new vocabulary words this week', 30),
    ('MATH', 'Math Marathon', 'MEDIUM', 'Calculator', 'Complete 15 math problems across all difficulties', 30),
    ('SCIENCE', 'Science Explorer', 'MEDIUM', 'Atom', 'Complete 5 different science games', 30),
    ('CHINESE', 'Memory Champion', 'MEDIUM', 'Brain', 'Achieve a score of 80% or higher in 3 memory games', 30),

    -- Achievement Missions
    ('ENGLISH', 'Grammar Guru', 'HARD', 'Languages', 'Complete all English games with 90% accuracy', 50),
    ('MATH', 'Math Wizard', 'HARD', 'Calculator', 'Master all math difficulty levels', 50),
    ('SCIENCE', 'Science Master', 'HARD', 'Atom', 'Complete every science game at least once', 50),
    ('CHINESE', 'Memory Master', 'HARD', 'Brain', 'Achieve perfect scores in all memory games', 50),

    -- Special Missions
    ('MATH', 'Speed Demon', 'HARD', 'Calculator', 'Complete 10 math problems in under 2 minutes', 40),
    ('ENGLISH', 'Storyteller', 'MEDIUM', 'Languages', 'Write a short story using 10 vocabulary words', 35),
    ('SCIENCE', 'Experiment Log', 'MEDIUM', 'Atom', 'Document and explain 3 scientific concepts', 35),
    ('CHINESE', 'Lightning Fast', 'HARD', 'Brain', 'Complete a memory game in record time', 40)
ON CONFLICT (name) DO NOTHING;
;;;

-- Delete only the default user missions that will be reinserted
DELETE FROM user_missions
WHERE user_id IN (SELECT id FROM users WHERE username IN ('student1', 'student2', 'student3', 'tech_teacher1', 'admin', 'edu_teacher1', 'edu_teacher2'));
;;;

-- Insert sample items for the shop (AVATAR, BACKGROUND, BADGE only - no POWERUP)
INSERT INTO items (type, name, icon, description, price)
VALUES
    -- Avatar Items
    ('AVATAR', 'Default', 'default', 'Default avatar icon', 100),
    ('AVATAR', 'Happy Cat', 'happy_cat', 'Cute and friendly cat avatar', 100),
    ('AVATAR', 'Cool Dog', 'cool_dog', 'Playful dog with cool style', 100),
    ('AVATAR', 'Smart Owl', 'smart_owl', 'Wise owl with glasses', 100),
    ('AVATAR', 'Sporty Rabbit', 'sporty_rabbit', 'Athletic rabbit ready for action', 100),
    ('AVATAR', 'Artistic Butterfly', 'artistic_butterfly', 'Creative butterfly with colorful wings', 100),
    ('AVATAR', 'Bookworm Bear', 'bookworm_bear', 'Studious bear who loves reading', 100),
    ('AVATAR', 'Explorer Monkey', 'explorer_monkey', 'Adventurous monkey ready to explore', 100),
    ('AVATAR', 'Star Student', 'star_student', 'Excellent student with star achievements', 100),
    ('AVATAR', 'Rainbow Unicorn', 'rainbow_unicorn', 'Magical unicorn with rainbow colors', 100),
    ('AVATAR', 'Rocket Raccoon', 'rocket_raccoon', 'Space raccoon with rocket power', 100),
    ('AVATAR', 'Heart Panda', 'heart_panda', 'Lovely panda with heart patterns', 100),
    ('AVATAR', 'Sunshine Bee', 'sunshine_bee', 'Bright bee spreading sunshine', 100),
    ('AVATAR', 'Moon Turtle', 'moon_turtle', 'Mystical turtle under moonlight', 100),
    ('AVATAR', 'Flower Ladybug', 'flower_ladybug', 'Cute ladybug with flower patterns', 100),
    ('AVATAR', 'Rainbow Frog', 'rainbow_frog', 'Colorful frog with rainbow stripes', 100),
    ('AVATAR', 'Cloud Sheep', 'cloud_sheep', 'Fluffy sheep floating on clouds', 100),
    ('AVATAR', 'Apple Teacher', 'apple_teacher', 'Dedicated teacher with apple', 100),
    ('AVATAR', 'Pencil Wizard', 'pencil_wizard', 'Magical wizard with pencil powers', 100),
    ('AVATAR', 'Crayon Dragon', 'crayon_dragon', 'Creative dragon with crayon colors', 100),
    ('AVATAR', 'Cool Hat', 'Hat', 'Stylish hat for your avatar', 50),
    ('AVATAR', 'Superhero Cape', 'Cape', 'Fly through challenges with this cape', 100),
    ('AVATAR', 'Science Glasses', 'Glasses', 'Look smart with these glasses', 75),
    ('AVATAR', 'Sports Jersey', 'Jersey', 'Show your team spirit', 60),

    -- Background Items
    ('BACKGROUND', 'Space Theme', 'Space', 'Explore the cosmos', 80),
    ('BACKGROUND', 'Ocean View', 'Ocean', 'Relaxing beach background', 70),
    ('BACKGROUND', 'Forest Adventure', 'Forest', 'Nature-inspired learning environment', 65),
    ('BACKGROUND', 'City Skyline', 'City', 'Urban learning backdrop', 85),

    -- Badge Items
    ('BADGE', 'Math Champion', 'Trophy', 'Awarded for math excellence', 150),
    ('BADGE', 'Reading Star', 'Book', 'Awarded for reading achievements', 130),
    ('BADGE', 'Science Explorer', 'Microscope', 'Awarded for science curiosity', 140),
    ('BADGE', 'Memory Master', 'Brain', 'Awarded for memory skills', 135)
ON CONFLICT (name) DO NOTHING;
;;;

-- Delete only the default user items that will be reinserted
DELETE FROM user_items
WHERE user_id IN (SELECT id FROM users WHERE username IN ('student1', 'student2', 'student3', 'tech_teacher1', 'admin', 'edu_teacher1', 'edu_teacher2'));
;;;
