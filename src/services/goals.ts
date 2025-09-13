import { supabase } from "@/lib/supabase";

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
  completed_at: string | null;
};

export type Task = {
  id: string;
  user_id: string;
  goal_id: string | null;
  title: string;
  type: "event" | "task" | "goal";
  date: string | null; // YYYY-MM-DD
  start_time: string | null; // HH:MM:SS
  end_time: string | null; // HH:MM:SS
  completed: boolean;
  notes: string | null;
  created_at: string;
};

export async function createGoal(params: {
  title: string;
  description?: string;
  tasks?: Array<{
    title: string;
    type: "event" | "task" | "goal";
    date?: string; // YYYY-MM-DD
    start_time?: string; // HH:MM
    end_time?: string; // HH:MM
    notes?: string;
  }>;
}) {
  const { title, description, tasks = [] } = params;

  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .insert({ title, description: description ?? null })
    .select()
    .single();
  if (goalError) throw goalError;

  if (tasks.length > 0) {
    const mapped = tasks.map((t) => ({
      goal_id: goal.id,
      title: t.title,
      type: t.type,
      date: t.date ?? null,
      start_time: t.start_time ? `${t.start_time}:00` : null,
      end_time: t.end_time ? `${t.end_time}:00` : null,
      notes: t.notes ?? null,
    }));
    const { error: taskError } = await supabase.from("tasks").insert(mapped);
    if (taskError) throw taskError;
  }

  return goal as Goal;
}

export async function listGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Goal[];
}

export async function listGoalsWithTasks(): Promise<Array<Goal & { tasks: Task[] }>> {
  const { data, error } = await supabase
    .from("goals")
    .select("*, tasks(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as any) ?? [];
}

export async function getGoalWithTasks(goalId: string): Promise<{ goal: Goal; tasks: Task[] }> {
  const [{ data: goals, error: gErr }, { data: tasks, error: tErr }] = await Promise.all([
    supabase.from("goals").select("*").eq("id", goalId).maybeSingle(),
    supabase.from("tasks").select("*").eq("goal_id", goalId).order("date", { ascending: true }).order("start_time", { ascending: true }),
  ]);
  if (gErr) throw gErr;
  if (!goals) throw new Error("Goal not found");
  if (tErr) throw tErr;
  return { goal: goals as Goal, tasks: (tasks ?? []) as Task[] };
}

export async function listTodayTasks(): Promise<Task[]> {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const isoDate = `${yyyy}-${mm}-${dd}`;
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("date", isoDate)
    .order("start_time", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function toggleTask(taskId: string, completed: boolean) {
  const { error } = await supabase
    .from("tasks")
    .update({ completed })
    .eq("id", taskId);
  if (error) throw error;
}

export async function updateTaskNotes(taskId: string, notes: string) {
  const { error } = await supabase
    .from("tasks")
    .update({ notes })
    .eq("id", taskId);
  if (error) throw error;
}

export async function addTask(params: {
  goal_id: string;
  title: string;
  type: "event" | "task" | "goal";
  date: string; // YYYY-MM-DD
  start_time?: string; // HH:MM
  end_time?: string; // HH:MM
  notes?: string;
}) {
  const { goal_id, title, type, date, start_time, end_time, notes } = params;
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      goal_id,
      title,
      type,
      date,
      start_time: start_time ? `${start_time}:00` : null,
      end_time: end_time ? `${end_time}:00` : null,
      notes: notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}


