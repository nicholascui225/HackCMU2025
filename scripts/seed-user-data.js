// Script to seed user data for nick cui
// Run this with: node scripts/seed-user-data.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need this for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedUserData() {
  try {
    console.log('Starting to seed user data for nick cui...');

    // First, we need to find or create the user "nick cui"
    // Since we can't create users directly, we'll assume the user exists
    // and we'll need to get their user_id from the auth.users table
    
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return;
    }

    // Find user with email containing "nick" or similar
    const nickUser = users.users.find(user => 
      user.email?.toLowerCase().includes('nick') || 
      user.user_metadata?.full_name?.toLowerCase().includes('nick') ||
      user.user_metadata?.name?.toLowerCase().includes('nick')
    );

    if (!nickUser) {
      console.log('No user found with "nick" in email or metadata. Available users:');
      users.users.forEach(user => {
        console.log(`- ${user.email} (${user.user_metadata?.full_name || user.user_metadata?.name || 'No name'})`);
      });
      console.log('\nPlease create a user account for "nick cui" first, or modify this script to use an existing user ID.');
      return;
    }

    const userId = nickUser.id;
    console.log(`Found user: ${nickUser.email} (ID: ${userId})`);

    // Clear existing goals and tasks for this user
    console.log('Clearing existing data...');
    await supabase.from('tasks').delete().eq('user_id', userId);
    await supabase.from('goals').delete().eq('user_id', userId);

    // Create the 3 goals
    const goals = [
      {
        user_id: userId,
        title: "Work Project",
        description: "Professional development and work-related objectives"
      },
      {
        user_id: userId,
        title: "Personal Goals", 
        description: "Personal growth and life objectives"
      },
      {
        user_id: userId,
        title: "Health & Wellness",
        description: "Physical and mental health objectives"
      }
    ];

    console.log('Creating goals...');
    const { data: createdGoals, error: goalsError } = await supabase
      .from('goals')
      .insert(goals)
      .select();

    if (goalsError) {
      console.error('Error creating goals:', goalsError);
      return;
    }

    console.log(`Created ${createdGoals.length} goals`);

    // Create tasks for each goal
    const tasks = [
      // Work Project tasks
      {
        user_id: userId,
        goal_id: createdGoals[0].id,
        title: "Morning Standup",
        type: "event",
        date: "2024-01-15",
        start_time: "09:00:00",
        end_time: "09:30:00",
        completed: false,
        notes: "Daily team sync"
      },
      {
        user_id: userId,
        goal_id: createdGoals[0].id,
        title: "Code Review",
        type: "task",
        date: "2024-01-15",
        start_time: "10:30:00",
        end_time: "11:30:00",
        completed: false,
        notes: "Review pull requests"
      },
      {
        user_id: userId,
        goal_id: createdGoals[0].id,
        title: "Lunch Break",
        type: "eat",
        date: "2024-01-15",
        start_time: "12:00:00",
        end_time: "13:00:00",
        completed: false
      },
      {
        user_id: userId,
        goal_id: createdGoals[0].id,
        title: "Feature Development",
        type: "task",
        date: "2024-01-15",
        start_time: "14:00:00",
        end_time: "17:00:00",
        completed: false,
        notes: "Work on new dashboard feature"
      },

      // Personal Goals tasks
      {
        user_id: userId,
        goal_id: createdGoals[1].id,
        title: "Gym Session",
        type: "task",
        date: "2024-01-15",
        start_time: "18:00:00",
        end_time: "19:00:00",
        completed: false,
        notes: "Strength training"
      },
      {
        user_id: userId,
        goal_id: createdGoals[1].id,
        title: "Dinner",
        type: "eat",
        date: "2024-01-15",
        start_time: "19:30:00",
        end_time: "20:30:00",
        completed: false
      },
      {
        user_id: userId,
        goal_id: createdGoals[1].id,
        title: "Reading Time",
        type: "task",
        date: "2024-01-15",
        start_time: "20:30:00",
        end_time: "21:30:00",
        completed: false,
        notes: "Read for 1 hour"
      },

      // Health & Wellness tasks
      {
        user_id: userId,
        goal_id: createdGoals[2].id,
        title: "Morning Run",
        type: "task",
        date: "2024-01-15",
        start_time: "07:00:00",
        end_time: "07:30:00",
        completed: false,
        notes: "30-minute jog"
      },
      {
        user_id: userId,
        goal_id: createdGoals[2].id,
        title: "Meditation",
        type: "selfcare",
        date: "2024-01-15",
        start_time: "07:30:00",
        end_time: "08:00:00",
        completed: false,
        notes: "Mindfulness practice"
      },
      {
        user_id: userId,
        goal_id: createdGoals[2].id,
        title: "Sleep",
        type: "sleep",
        date: "2024-01-15",
        start_time: "22:00:00",
        end_time: "07:00:00",
        completed: false,
        notes: "Get 9 hours of sleep"
      }
    ];

    console.log('Creating tasks...');
    const { data: createdTasks, error: tasksError } = await supabase
      .from('tasks')
      .insert(tasks)
      .select();

    if (tasksError) {
      console.error('Error creating tasks:', tasksError);
      return;
    }

    console.log(`Created ${createdTasks.length} tasks`);

    // Also create some standalone current day tasks (not linked to goals)
    const currentDayTasks = [
      {
        user_id: userId,
        goal_id: null,
        title: "Wake Up",
        type: "task",
        date: "2024-01-15",
        start_time: "07:00:00",
        end_time: "07:15:00",
        completed: false
      },
      {
        user_id: userId,
        goal_id: null,
        title: "Breakfast",
        type: "eat",
        date: "2024-01-15",
        start_time: "08:00:00",
        end_time: "08:30:00",
        completed: false
      },
      {
        user_id: userId,
        goal_id: null,
        title: "Work Meeting",
        type: "event",
        date: "2024-01-15",
        start_time: "09:00:00",
        end_time: "10:00:00",
        completed: false
      },
      {
        user_id: userId,
        goal_id: null,
        title: "Lunch",
        type: "eat",
        date: "2024-01-15",
        start_time: "12:00:00",
        end_time: "13:00:00",
        completed: false
      },
      {
        user_id: userId,
        goal_id: null,
        title: "Afternoon Work",
        type: "task",
        date: "2024-01-15",
        start_time: "13:00:00",
        end_time: "17:00:00",
        completed: false
      },
      {
        user_id: userId,
        goal_id: null,
        title: "Dinner",
        type: "eat",
        date: "2024-01-15",
        start_time: "19:00:00",
        end_time: "20:00:00",
        completed: false
      },
      {
        user_id: userId,
        goal_id: null,
        title: "Sleep",
        type: "sleep",
        date: "2024-01-15",
        start_time: "22:00:00",
        end_time: "07:00:00",
        completed: false
      }
    ];

    console.log('Creating current day tasks...');
    const { data: createdCurrentDayTasks, error: currentDayTasksError } = await supabase
      .from('tasks')
      .insert(currentDayTasks)
      .select();

    if (currentDayTasksError) {
      console.error('Error creating current day tasks:', currentDayTasksError);
      return;
    }

    console.log(`Created ${createdCurrentDayTasks.length} current day tasks`);

    console.log('\n✅ Successfully seeded user data!');
    console.log(`- Created ${createdGoals.length} goals`);
    console.log(`- Created ${createdTasks.length} goal-linked tasks`);
    console.log(`- Created ${createdCurrentDayTasks.length} standalone tasks`);
    console.log(`- Total tasks: ${createdTasks.length + createdCurrentDayTasks.length}`);

  } catch (error) {
    console.error('Error seeding user data:', error);
  }
}

// Run the script
seedUserData();
