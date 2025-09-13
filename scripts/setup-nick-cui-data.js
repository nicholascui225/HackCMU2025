// One-time setup script for nick cui's data
// This can be run in the browser console when logged in as nick cui
// Or integrated into the app for initial setup

import { supabase } from '../src/lib/supabase.js';

export async function setupNickCuiData() {
  try {
    console.log('Setting up data for nick cui...');

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('No authenticated user found. Please log in first.');
      return;
    }

    console.log(`Setting up data for user: ${user.email} (${user.id})`);

    // Clear existing data
    console.log('Clearing existing data...');
    await supabase.from('tasks').delete().eq('user_id', user.id);
    await supabase.from('goals').delete().eq('user_id', user.id);

    // Create the 3 goals
    const goals = [
      {
        title: "Work Project",
        description: "Professional development and work-related objectives"
      },
      {
        title: "Personal Goals", 
        description: "Personal growth and life objectives"
      },
      {
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
        goal_id: createdGoals[0].id,
        title: "Lunch Break",
        type: "eat",
        date: "2024-01-15",
        start_time: "12:00:00",
        end_time: "13:00:00",
        completed: false
      },
      {
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
        goal_id: createdGoals[1].id,
        title: "Dinner",
        type: "eat",
        date: "2024-01-15",
        start_time: "19:30:00",
        end_time: "20:30:00",
        completed: false
      },
      {
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
        goal_id: null,
        title: "Wake Up",
        type: "task",
        date: "2024-01-15",
        start_time: "07:00:00",
        end_time: "07:15:00",
        completed: false
      },
      {
        goal_id: null,
        title: "Breakfast",
        type: "eat",
        date: "2024-01-15",
        start_time: "08:00:00",
        end_time: "08:30:00",
        completed: false
      },
      {
        goal_id: null,
        title: "Work Meeting",
        type: "event",
        date: "2024-01-15",
        start_time: "09:00:00",
        end_time: "10:00:00",
        completed: false
      },
      {
        goal_id: null,
        title: "Lunch",
        type: "eat",
        date: "2024-01-15",
        start_time: "12:00:00",
        end_time: "13:00:00",
        completed: false
      },
      {
        goal_id: null,
        title: "Afternoon Work",
        type: "task",
        date: "2024-01-15",
        start_time: "13:00:00",
        end_time: "17:00:00",
        completed: false
      },
      {
        goal_id: null,
        title: "Dinner",
        type: "eat",
        date: "2024-01-15",
        start_time: "19:00:00",
        end_time: "20:00:00",
        completed: false
      },
      {
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

    console.log('\n✅ Successfully set up user data!');
    console.log(`- Created ${createdGoals.length} goals`);
    console.log(`- Created ${createdTasks.length} goal-linked tasks`);
    console.log(`- Created ${createdCurrentDayTasks.length} standalone tasks`);
    console.log(`- Total tasks: ${createdTasks.length + createdCurrentDayTasks.length}`);

    return {
      goals: createdGoals,
      tasks: createdTasks,
      currentDayTasks: createdCurrentDayTasks
    };

  } catch (error) {
    console.error('Error setting up user data:', error);
    throw error;
  }
}

// Export for use in components
export default setupNickCuiData;
