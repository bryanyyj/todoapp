import { useState } from 'react';
import axios from 'axios';
import './Tasks.css';

function Tasks() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Learn React', completed: false, priority: 0 },
    { id: 2, text: 'Build todo app', completed: false, priority: 0 },
    { id: 3, text: 'Add AI ranking', completed: false, priority: 0 }
  ]);
  const [newTask, setNewTask] = useState('');
  const [isRanking, setIsRanking] = useState(false);

  const addTask = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      setTasks([...tasks, {
        id: Date.now(),
        text: newTask,
        completed: false,
        priority: 0
      }]);
      setNewTask('');
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const rankWithAI = async () => {
    setIsRanking(true);
    try {
      const response = await axios.post('http://localhost:3001/api/rank-tasks', {
        tasks: tasks.filter(task => !task.completed),
        userContext: {
          timeOfDay: new Date().getHours(),
          preferences: 'productivity'
        }
      });
      
      const rankedTasks = response.data.rankedTasks;
      
      // Update tasks with AI rankings
      setTasks(prevTasks => {
        const updatedTasks = [...prevTasks];
        rankedTasks.forEach(rankedTask => {
          const index = updatedTasks.findIndex(t => t.id === rankedTask.id);
          if (index !== -1) {
            updatedTasks[index] = rankedTask;
          }
        });
        return updatedTasks.sort((a, b) => b.priority - a.priority);
      });
      
    } catch (error) {
      console.error('Error ranking tasks:', error);
      alert('Failed to rank tasks. Make sure the backend is running.');
    } finally {
      setIsRanking(false);
    }
  };

  const incompleteTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <h2>Your Tasks</h2>
        <p>Manage your daily tasks and let AI help prioritize them</p>
      </div>
      
      <form onSubmit={addTask} className="add-task-form">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          className="task-input"
        />
        <button type="submit" className="add-btn">Add Task</button>
      </form>

      <div className="ai-controls">
        <button 
          onClick={rankWithAI} 
          className="ai-rank-btn"
          disabled={isRanking || incompleteTasks.length === 0}
        >
          {isRanking ? '🔄 Ranking...' : '🤖 Rank Tasks with AI'}
        </button>
      </div>

      <div className="task-sections">
        {incompleteTasks.length > 0 && (
          <div className="task-section">
            <h3>Active Tasks ({incompleteTasks.length})</h3>
            <div className="task-list">
              {incompleteTasks.map(task => (
                <div key={task.id} className="task">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                  />
                  <div className="task-content">
                    <span className="task-text">{task.text}</span>
                    {task.priority > 0 && (
                      <div className="task-meta">
                        <span className="priority">Priority: {task.priority}/10</span>
                        {task.aiReason && <span className="ai-reason">{task.aiReason}</span>}
                      </div>
                    )}
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="delete-btn">
                    ❌
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {completedTasks.length > 0 && (
          <div className="task-section">
            <h3>Completed ({completedTasks.length})</h3>
            <div className="task-list">
              {completedTasks.map(task => (
                <div key={task.id} className="task completed">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span className="task-text">{task.text}</span>
                  <button onClick={() => deleteTask(task.id)} className="delete-btn">
                    ❌
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tasks;