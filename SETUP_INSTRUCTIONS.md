# Setting Up User Data for Nick Cui

## Overview
I've updated your application to store user goals and tasks in the Supabase database instead of using mock data. The Dashboard now loads real data from the database and includes a setup button to create the initial sample data.

## What's Been Added

### 1. Database Structure
- **Goals Table**: Stores user goals with title, description, and completion status
- **Tasks Table**: Stores individual tasks linked to goals, with timing, type, and completion status
- **Row Level Security**: Ensures users can only access their own data

### 2. Updated Dashboard
- Now loads real data from Supabase instead of mock data
- Includes a "Set Up Sample Data" button when no goals are found
- Automatically creates the 3 goals: "Work Project", "Personal Goals", and "Health & Wellness"
- Includes sample tasks for each goal matching the original mock data

### 3. Setup Scripts
- `scripts/seed-user-data.js` - Node.js script for server-side setup
- `scripts/seed-data.sql` - SQL script for manual database setup
- `scripts/setup-nick-cui-data.js` - Browser-compatible setup function

## How to Set Up the Data

### Option 1: Use the Dashboard (Recommended)
1. Make sure you're logged in as the user "nick cui"
2. Navigate to the Dashboard
3. If no goals are found, you'll see a "Set Up Sample Data" button
4. Click the button to automatically create all the sample data

### Option 2: Manual SQL Setup
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Find the user ID for "nick cui" by running:
   ```sql
   SELECT id, email FROM auth.users WHERE email LIKE '%nick%';
   ```
4. Replace `YOUR_USER_ID_HERE` in `scripts/seed-data.sql` with the actual user ID
5. Run the SQL script in the Supabase SQL Editor

### Option 3: Browser Console Setup
1. Log in as "nick cui" in your application
2. Open browser developer tools (F12)
3. Go to the Console tab
4. Import and run the setup function:
   ```javascript
   import('./scripts/setup-nick-cui-data.js').then(module => {
     module.setupNickCuiData();
   });
   ```

## Data Structure Created

### Goals
1. **Work Project** - Professional development and work-related objectives
2. **Personal Goals** - Personal growth and life objectives  
3. **Health & Wellness** - Physical and mental health objectives

### Sample Tasks
Each goal includes relevant sample tasks with proper timing, types, and notes:
- Work tasks: Standup, Code Review, Lunch, Feature Development
- Personal tasks: Gym, Dinner, Reading
- Health tasks: Morning Run, Meditation, Sleep
- Daily tasks: Wake Up, Breakfast, Work Meeting, etc.

## Next Steps
Once the data is set up, the Dashboard will automatically load and display the real data from your Supabase database. Users can then:
- View their goals and tasks
- Mark tasks as complete
- Add new goals and tasks
- Track their progress

The application now has a complete data persistence layer with proper user isolation and security.
