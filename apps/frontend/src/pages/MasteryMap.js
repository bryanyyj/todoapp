import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, Award } from 'lucide-react';

export default function MasteryMap() {
  const { data: masteryData, isLoading } = useQuery('topic-mastery', () =>
    axios.get('/api/topics/mastery').then(res => res.data)
  );

  if (isLoading) {
    return <div className="text-center py-8">Loading mastery data...</div>;
  }

  const getMasteryLevel = (level) => {
    if (level >= 0.8) return { label: 'Mastered', color: 'green', bg: 'bg-green-100' };
    if (level >= 0.6) return { label: 'Proficient', color: 'blue', bg: 'bg-blue-100' };
    if (level >= 0.4) return { label: 'Developing', color: 'yellow', bg: 'bg-yellow-100' };
    return { label: 'Needs Work', color: 'red', bg: 'bg-red-100' };
  };

  const chartData = masteryData?.map(item => ({
    topic: item.topic,
    mastery: (item.mastery_level * 100).toFixed(0),
    confidence: (item.confidence_score * 100).toFixed(0)
  })) || [];

  const averageMastery = masteryData?.length > 0 
    ? masteryData.reduce((acc, item) => acc + item.mastery_level, 0) / masteryData.length
    : 0;

  const topicsByLevel = {
    mastered: masteryData?.filter(item => item.mastery_level >= 0.8) || [],
    proficient: masteryData?.filter(item => item.mastery_level >= 0.6 && item.mastery_level < 0.8) || [],
    developing: masteryData?.filter(item => item.mastery_level >= 0.4 && item.mastery_level < 0.6) || [],
    needsWork: masteryData?.filter(item => item.mastery_level < 0.4) || []
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overall Mastery</p>
              <p className="text-3xl font-bold text-gray-900">
                {(averageMastery * 100).toFixed(0)}%
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Topics Mastered</p>
              <p className="text-3xl font-bold text-gray-900">
                {topicsByLevel.mastered.length}
              </p>
            </div>
            <Award className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Need Focus</p>
              <p className="text-3xl font-bold text-gray-900">
                {topicsByLevel.needsWork.length}
              </p>
            </div>
            <Target className="w-10 h-10 text-red-500" />
          </div>
        </div>
      </div>

      {/* Mastery Chart */}
      {chartData.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Topic Mastery Overview</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="topic" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value, name) => [`${value}%`, name === 'mastery' ? 'Mastery' : 'Confidence']}
                />
                <Bar dataKey="mastery" fill="#3B82F6" name="mastery" />
                <Bar dataKey="confidence" fill="#10B981" name="confidence" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Topic Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mastered Topics */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            Mastered Topics ({topicsByLevel.mastered.length})
          </h3>
          <div className="space-y-3">
            {topicsByLevel.mastered.map((topic, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-md">
                <span className="font-medium text-gray-900">{topic.topic}</span>
                <span className="text-green-700 font-semibold">
                  {(topic.mastery_level * 100).toFixed(0)}%
                </span>
              </div>
            ))}
            {topicsByLevel.mastered.length === 0 && (
              <p className="text-gray-500 text-center py-4">No mastered topics yet</p>
            )}
          </div>
        </div>

        {/* Need Work Topics */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            Need Focus ({topicsByLevel.needsWork.length})
          </h3>
          <div className="space-y-3">
            {topicsByLevel.needsWork.map((topic, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-md">
                <span className="font-medium text-gray-900">{topic.topic}</span>
                <span className="text-red-700 font-semibold">
                  {(topic.mastery_level * 100).toFixed(0)}%
                </span>
              </div>
            ))}
            {topicsByLevel.needsWork.length === 0 && (
              <p className="text-gray-500 text-center py-4">Great! No topics need immediate focus</p>
            )}
          </div>
        </div>
      </div>

      {/* No Data State */}
      {(!masteryData || masteryData.length === 0) && (
        <div className="card p-12 text-center">
          <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Mastery Data Yet</h3>
          <p className="text-gray-600 mb-6">
            Take some quizzes to start tracking your progress and see your mastery map
          </p>
          <a href="/quiz" className="btn btn-primary">
            Take Your First Quiz
          </a>
        </div>
      )}
    </div>
  );
}