import { useState, useEffect } from 'react';
import './Analytics.css';

function Analytics() {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    averagePriority: 0,
    productivityScore: 0
  });

  useEffect(() => {
    // Mock analytics data - in real app, this would come from your backend
    setStats({
      totalTasks: 24,
      completedTasks: 18,
      averagePriority: 6.2,
      productivityScore: 85
    });
  }, []);

  const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks * 100) : 0;

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h2>Task Analytics</h2>
        <p>Insights into your productivity and task completion patterns</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Total Tasks</h3>
            <div className="stat-value">{stats.totalTasks}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Completed</h3>
            <div className="stat-value">{stats.completedTasks}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <h3>Completion Rate</h3>
            <div className="stat-value">{completionRate.toFixed(1)}%</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <h3>Avg Priority</h3>
            <div className="stat-value">{stats.averagePriority}/10</div>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>Productivity Score</h3>
          <div className="productivity-chart">
            <div className="progress-circle">
              <div className="score">{stats.productivityScore}%</div>
            </div>
            <p>Based on task completion and AI ranking efficiency</p>
          </div>
        </div>

        <div className="chart-card">
          <h3>Weekly Trends</h3>
          <div className="trend-chart">
            <div className="trend-bars">
              {[65, 80, 75, 90, 85, 70, 95].map((height, index) => (
                <div key={index} className="trend-bar">
                  <div 
                    className="bar-fill" 
                    style={{ height: `${height}%` }}
                  ></div>
                  <span className="bar-label">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                  </span>
                </div>
              ))}
            </div>
            <p>Task completion percentage by day</p>
          </div>
        </div>
      </div>

      <div className="insights-section">
        <h3>AI Insights</h3>
        <div className="insights-list">
          <div className="insight-item">
            <span className="insight-icon">🔥</span>
            <div className="insight-text">
              <strong>Peak Productivity:</strong> You're most productive on Thursdays and Sundays
            </div>
          </div>
          <div className="insight-item">
            <span className="insight-icon">⏰</span>
            <div className="insight-text">
              <strong>Optimal Time:</strong> Morning tasks (9-11 AM) have 92% completion rate
            </div>
          </div>
          <div className="insight-item">
            <span className="insight-icon">🎯</span>
            <div className="insight-text">
              <strong>Task Focus:</strong> Work-related tasks are prioritized 40% higher by AI
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;