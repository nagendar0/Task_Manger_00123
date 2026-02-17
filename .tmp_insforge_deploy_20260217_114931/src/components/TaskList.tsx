import { useTaskStore } from '@/store/taskStore';
import { TaskItem } from './TaskItem';

export function TaskList() {
  const { tasks, filter, toggleTask, deleteTask } = useTaskStore();

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  if (filteredTasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {filter === 'all' && 'No tasks yet. Add your first task!'}
        {filter === 'active' && 'No active tasks. Great job!'}
        {filter === 'completed' && 'No completed tasks yet.'}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredTasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />
      ))}
    </div>
  );
}
