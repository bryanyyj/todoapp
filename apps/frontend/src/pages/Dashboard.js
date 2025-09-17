import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, MessageCircle, Brain, TrendingUp, Calendar, FileText } from 'lucide-react';
import OnboardingModal from '../components/onboarding/OnboardingModal';

export default function Dashboard() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: documents } = useQuery('documents', () =>
    axios.get('/api/documents').then(res => res.data)
  );

  const { data: quizAttempts } = useQuery('quiz-attempts', () =>
    axios.get('/api/quiz/attempts').then(res => res.data)
  );

  const { data: topicMastery } = useQuery('topic-mastery', () =>
    axios.get('/api/topics/mastery').then(res => res.data)
  );

  const { data: plannerTasks } = useQuery('planner-tasks-today', () =>
    axios.get(`/api/planner/tasks?date=${new Date().toISOString().split('T')[0]}`).then(res => res.data)
  );

  // Check if user has completed onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('userOnboarding');
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = (userInfo) => {
    setShowOnboarding(false);
    // You could send this data to your backend if needed
    console.log('Onboarding completed:', userInfo);
  };

  const stats = {
    documents: documents?.length || 0,
    quizzes: quizAttempts?.length || 0,
    avgScore: quizAttempts?.length > 0 
      ? Math.round(quizAttempts.reduce((acc, attempt) => acc + attempt.score, 0) / quizAttempts.length)
      : 0,
    todayTasks: plannerTasks?.length || 0
  };

  return (
    <>
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
      
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to Study Buddy</h1>
        <p className="text-blue-100 text-lg">Your AI-powered study companion</p>
        <div className="mt-4 text-sm text-blue-100">
          One Inbox → One Brain → One Plan
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Documents</p>
              <p className="text-3xl font-bold text-foreground">{stats.documents}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Quizzes Taken</p>
              <p className="text-3xl font-bold text-foreground">{stats.quizzes}</p>
            </div>
            <Brain className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Score</p>
              <p className="text-3xl font-bold text-foreground">{stats.avgScore}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Today's Tasks</p>
              <p className="text-3xl font-bold text-foreground">{stats.todayTasks}</p>
            </div>
            <Calendar className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link to="/chat" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Ask Questions</h3>
              <p className="text-sm text-muted-foreground">Chat with your study materials</p>
            </div>
          </div>
        </Link>

        <Link to="/library" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Upload Materials</h3>
              <p className="text-sm text-muted-foreground">Add your lecture notes and slides</p>
            </div>
          </div>
        </Link>

        <Link to="/quiz" className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Take a Quiz</h3>
              <p className="text-sm text-muted-foreground">Test your knowledge</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Documents</h3>
          <div className="space-y-3">
            {documents?.slice(0, 5).map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <div>
                  <p className="font-medium text-foreground">{doc.original_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(doc.upload_date).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  doc.processing_status === 'completed' 
                    ? 'bg-green-100 text-green-800'
                    : doc.processing_status === 'processing'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {doc.processing_status}
                </span>
              </div>
            ))}
            {(!documents || documents.length === 0) && (
              <p className="text-muted-foreground text-center py-4">No documents uploaded yet</p>
            )}
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Today's Tasks</h3>
          <div className="space-y-3">
            {plannerTasks?.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  checked={!!task.completed_at}
                  className="rounded border-gray-300"
                  readOnly
                />
                <div className="flex-1">
                  <p className={`font-medium ${task.completed_at ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </p>
                  {task.scheduled_time && (
                    <p className="text-sm text-muted-foreground">{task.scheduled_time}</p>
                  )}
                </div>
              </div>
            ))}
            {(!plannerTasks || plannerTasks.length === 0) && (
              <p className="text-muted-foreground text-center py-4">No tasks scheduled for today</p>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}