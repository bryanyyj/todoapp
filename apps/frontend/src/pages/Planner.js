import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { Calendar, Plus, Check, Clock, AlertCircle } from 'lucide-react';
import { format, addDays, startOfWeek } from 'date-fns';

export default function Planner() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    taskType: 'study',
    priority: 1,
    estimatedDuration: 30,
    scheduledTime: ''
  });
  
  const queryClient = useQueryClient();

  const { data: tasks } = useQuery(
    ['planner-tasks', selectedDate],
    () => axios.get(`/api/planner/tasks?date=${format(selectedDate, 'yyyy-MM-dd')}`).then(res => res.data)
  );

  const addTaskMutation = useMutation(
    (task) => axios.post('/api/planner/tasks', {
      ...task,
      scheduledDate: format(selectedDate, 'yyyy-MM-dd')
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['planner-tasks', selectedDate]);
        setShowAddTask(false);
        setNewTask({
          title: '',
          description: '',
          taskType: 'study',
          priority: 1,
          estimatedDuration: 30,
          scheduledTime: ''
        });
      }
    }
  );

  const completeTaskMutation = useMutation(
    (taskId) => axios.patch(`/api/planner/tasks/${taskId}/complete`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['planner-tasks', selectedDate]);
      }
    }
  );

  const deleteTaskMutation = useMutation(
    (taskId) => axios.delete(`/api/planner/tasks/${taskId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['planner-tasks', selectedDate]);
      }
    }
  );

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTask.title.trim()) {
      addTaskMutation.mutate(newTask);
    }
  };

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 5: return 'text-red-600 bg-red-100';
      case 4: return 'text-orange-600 bg-orange-100';
      case 3: return 'text-yellow-600 bg-yellow-100';
      case 2: return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTaskTypeIcon = (type) => {
    switch (type) {
      case 'quiz': return <AlertCircle className="w-4 h-4" />;
      case 'review': return <Clock className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Week View */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Week of {format(startOfWeek(selectedDate), 'MMM d, yyyy')}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -7))}
              className="btn btn-outline text-sm px-3 py-1"
            >
              Previous
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="btn btn-outline text-sm px-3 py-1"
            >
              Today
            </button>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 7))}
              className="btn btn-outline text-sm px-3 py-1"
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {getWeekDays().map((day) => (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`p-3 rounded-md text-center transition-colors ${
                format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                  ? 'bg-blue-500 text-white'
                  : format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="text-xs text-gray-500 uppercase">
                {format(day, 'EEE')}
              </div>
              <div className="text-lg font-semibold">
                {format(day, 'd')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Day Tasks */}
      <div className="card">
        <div className="p-6 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          <button
            onClick={() => setShowAddTask(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Add Task Form */}
        {showAddTask && (
          <div className="p-6 border-b bg-gray-50">
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Task title"
                  className="input"
                  required
                />
                <select
                  value={newTask.taskType}
                  onChange={(e) => setNewTask(prev => ({ ...prev, taskType: e.target.value }))}
                  className="input"
                >
                  <option value="study">Study</option>
                  <option value="review">Review</option>
                  <option value="quiz">Quiz</option>
                  <option value="reading">Reading</option>
                </select>
              </div>

              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description (optional)"
                className="input w-full h-20 resize-none"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                    className="input"
                  >
                    <option value={1}>Low</option>
                    <option value={2}>Normal</option>
                    <option value={3}>Medium</option>
                    <option value={4}>High</option>
                    <option value={5}>Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={newTask.estimatedDuration}
                    onChange={(e) => setNewTask(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) }))}
                    className="input"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={newTask.scheduledTime}
                    onChange={(e) => setNewTask(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={addTaskMutation.isLoading}
                  className="btn btn-primary"
                >
                  Add Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tasks List */}
        <div className="divide-y divide-gray-200">
          {tasks?.map((task) => (
            <div key={task.id} className="p-6 flex items-center space-x-4">
              <button
                onClick={() => completeTaskMutation.mutate(task.id)}
                disabled={!!task.completed_at || completeTaskMutation.isLoading}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  task.completed_at 
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-green-500'
                }`}
              >
                {task.completed_at && <Check className="w-3 h-3" />}
              </button>

              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className={`font-medium ${task.completed_at ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.title}
                  </h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                    Priority {task.priority}
                  </span>
                  <div className="flex items-center space-x-1 text-gray-500">
                    {getTaskTypeIcon(task.task_type)}
                    <span className="text-sm capitalize">{task.task_type}</span>
                  </div>
                </div>
                
                {task.description && (
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                )}
                
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  {task.scheduled_time && (
                    <span>{task.scheduled_time}</span>
                  )}
                  <span>{task.estimated_duration} min</span>
                </div>
              </div>

              <button
                onClick={() => deleteTaskMutation.mutate(task.id)}
                disabled={deleteTaskMutation.isLoading}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            </div>
          ))}

          {(!tasks || tasks.length === 0) && (
            <div className="p-8 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Scheduled</h3>
              <p className="text-gray-600">
                Add your first task for {format(selectedDate, 'MMMM d')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}