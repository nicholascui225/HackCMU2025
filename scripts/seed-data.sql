-- SQL script to seed data for user "nick cui"
-- Run this in Supabase SQL editor (Project → SQL)

-- First, let's find the user ID for "nick cui"
-- You'll need to replace 'nick-cui-user-id' with the actual user ID from auth.users table
-- You can find this by running: SELECT id, email FROM auth.users WHERE email LIKE '%nick%';

-- For now, we'll use a placeholder that you need to replace
-- Replace 'YOUR_USER_ID_HERE' with the actual user ID from auth.users

-- Clear existing data for this user (uncomment when ready to run)
-- DELETE FROM public.tasks WHERE user_id = 'YOUR_USER_ID_HERE';
-- DELETE FROM public.goals WHERE user_id = 'YOUR_USER_ID_HERE';

-- Insert the 3 goals
INSERT INTO public.goals (user_id, title, description) VALUES
('YOUR_USER_ID_HERE', 'Work Project', 'Professional development and work-related objectives'),
('YOUR_USER_ID_HERE', 'Personal Goals', 'Personal growth and life objectives'),
('YOUR_USER_ID_HERE', 'Health & Wellness', 'Physical and mental health objectives');

-- Get the goal IDs (you'll need to run this separately and use the returned IDs)
-- SELECT id, title FROM public.goals WHERE user_id = 'YOUR_USER_ID_HERE';

-- Insert tasks for Work Project (replace 'WORK_PROJECT_GOAL_ID' with actual goal ID)
INSERT INTO public.tasks (user_id, goal_id, title, type, date, start_time, end_time, completed, notes) VALUES
('YOUR_USER_ID_HERE', 'WORK_PROJECT_GOAL_ID', 'Morning Standup', 'event', '2024-01-15', '09:00:00', '09:30:00', false, 'Daily team sync'),
('YOUR_USER_ID_HERE', 'WORK_PROJECT_GOAL_ID', 'Code Review', 'task', '2024-01-15', '10:30:00', '11:30:00', false, 'Review pull requests'),
('YOUR_USER_ID_HERE', 'WORK_PROJECT_GOAL_ID', 'Lunch Break', 'eat', '2024-01-15', '12:00:00', '13:00:00', false, NULL),
('YOUR_USER_ID_HERE', 'WORK_PROJECT_GOAL_ID', 'Feature Development', 'task', '2024-01-15', '14:00:00', '17:00:00', false, 'Work on new dashboard feature');

-- Insert tasks for Personal Goals (replace 'PERSONAL_GOALS_GOAL_ID' with actual goal ID)
INSERT INTO public.tasks (user_id, goal_id, title, type, date, start_time, end_time, completed, notes) VALUES
('YOUR_USER_ID_HERE', 'PERSONAL_GOALS_GOAL_ID', 'Gym Session', 'task', '2024-01-15', '18:00:00', '19:00:00', false, 'Strength training'),
('YOUR_USER_ID_HERE', 'PERSONAL_GOALS_GOAL_ID', 'Dinner', 'eat', '2024-01-15', '19:30:00', '20:30:00', false, NULL),
('YOUR_USER_ID_HERE', 'PERSONAL_GOALS_GOAL_ID', 'Reading Time', 'task', '2024-01-15', '20:30:00', '21:30:00', false, 'Read for 1 hour');

-- Insert tasks for Health & Wellness (replace 'HEALTH_WELLNESS_GOAL_ID' with actual goal ID)
INSERT INTO public.tasks (user_id, goal_id, title, type, date, start_time, end_time, completed, notes) VALUES
('YOUR_USER_ID_HERE', 'HEALTH_WELLNESS_GOAL_ID', 'Morning Run', 'task', '2024-01-15', '07:00:00', '07:30:00', false, '30-minute jog'),
('YOUR_USER_ID_HERE', 'HEALTH_WELLNESS_GOAL_ID', 'Meditation', 'selfcare', '2024-01-15', '07:30:00', '08:00:00', false, 'Mindfulness practice'),
('YOUR_USER_ID_HERE', 'HEALTH_WELLNESS_GOAL_ID', 'Sleep', 'sleep', '2024-01-15', '22:00:00', '07:00:00', false, 'Get 9 hours of sleep');

-- Insert standalone current day tasks (not linked to goals)
INSERT INTO public.tasks (user_id, goal_id, title, type, date, start_time, end_time, completed, notes) VALUES
('YOUR_USER_ID_HERE', NULL, 'Wake Up', 'task', '2024-01-15', '07:00:00', '07:15:00', false, NULL),
('YOUR_USER_ID_HERE', NULL, 'Breakfast', 'eat', '2024-01-15', '08:00:00', '08:30:00', false, NULL),
('YOUR_USER_ID_HERE', NULL, 'Work Meeting', 'event', '2024-01-15', '09:00:00', '10:00:00', false, NULL),
('YOUR_USER_ID_HERE', NULL, 'Lunch', 'eat', '2024-01-15', '12:00:00', '13:00:00', false, NULL),
('YOUR_USER_ID_HERE', NULL, 'Afternoon Work', 'task', '2024-01-15', '13:00:00', '17:00:00', false, NULL),
('YOUR_USER_ID_HERE', NULL, 'Dinner', 'eat', '2024-01-15', '19:00:00', '20:00:00', false, NULL),
('YOUR_USER_ID_HERE', NULL, 'Sleep', 'sleep', '2024-01-15', '22:00:00', '07:00:00', false, NULL);
