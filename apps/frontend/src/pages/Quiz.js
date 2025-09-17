import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { Brain, Play, Award, Clock } from 'lucide-react';

export default function Quiz() {
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const queryClient = useQueryClient();

  const { data: quizBlueprints } = useQuery('quiz-blueprints', () =>
    axios.get('/api/quiz/blueprints').then(res => res.data)
  );

  const { data: questions } = useQuery(
    ['quiz-questions', selectedQuiz?.id],
    () => selectedQuiz ? 
      axios.get(`/api/quiz/blueprints/${selectedQuiz.id}/questions`).then(res => res.data) : 
      Promise.resolve([]),
    { enabled: !!selectedQuiz }
  );

  const generateQuizMutation = useMutation(
    (options) => axios.post('/api/quiz/generate', options),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('quiz-blueprints');
      }
    }
  );

  const submitAnswersMutation = useMutation(
    ({ quizId, answers, timeTaken }) => 
      axios.post(`/api/quiz/blueprints/${quizId}/attempt`, { answers, timeTaken }),
    {
      onSuccess: (response) => {
        setQuizResults(response.data);
        setShowResults(true);
      }
    }
  );

  const handleGenerateQuiz = () => {
    generateQuizMutation.mutate({
      title: `Quiz ${new Date().toLocaleDateString()}`,
      difficulty: 'medium',
      topicCount: 5
    });
  };

  const handleStartQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setQuizResults(null);
  };

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitQuiz = () => {
    submitAnswersMutation.mutate({
      quizId: selectedQuiz.id,
      answers,
      timeTaken: 0 // You could implement actual timing
    });
  };

  if (showResults && quizResults) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card p-8 text-center">
          <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
          <div className="text-3xl font-bold text-blue-600 mb-4">
            {quizResults.score}%
          </div>
          <p className="text-gray-600 mb-6">
            You answered {quizResults.correctCount} out of {quizResults.totalQuestions} questions correctly
          </p>
          <button
            onClick={() => {
              setSelectedQuiz(null);
              setShowResults(false);
              setQuizResults(null);
            }}
            className="btn btn-primary"
          >
            Take Another Quiz
          </button>
        </div>
      </div>
    );
  }

  if (selectedQuiz && questions) {
    const question = questions[currentQuestion];
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">{selectedQuiz.title}</h2>
          <span className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {questions.length}
          </span>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {question.question}
          </h3>

          <div className="space-y-3">
            {question.question_type === 'multiple_choice' && question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 p-3 rounded-md border hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-gray-900">{option}</span>
              </label>
            ))}

            {question.question_type === 'true_false' && ['True', 'False'].map((option) => (
              <label key={option} className="flex items-center space-x-3 p-3 rounded-md border hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-gray-900">{option}</span>
              </label>
            ))}

            {question.question_type === 'short_answer' && (
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                className="input w-full h-24 resize-none"
                placeholder="Type your answer here..."
              />
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="btn btn-outline"
          >
            Previous
          </button>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmitQuiz}
              disabled={!answers[question.id] || submitAnswersMutation.isLoading}
              className="btn btn-primary"
            >
              {submitAnswersMutation.isLoading ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              disabled={!answers[question.id]}
              className="btn btn-primary"
            >
              Next
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generate New Quiz */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New Quiz</h2>
        <p className="text-gray-600 mb-4">
          Create a quiz from your uploaded study materials
        </p>
        <button
          onClick={handleGenerateQuiz}
          disabled={generateQuizMutation.isLoading}
          className="btn btn-primary"
        >
          {generateQuizMutation.isLoading ? 'Generating...' : 'Generate Quiz'}
        </button>
      </div>

      {/* Available Quizzes */}
      <div className="card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Available Quizzes</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {quizBlueprints?.map((quiz) => (
            <div key={quiz.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Brain className="w-8 h-8 text-purple-500" />
                <div>
                  <h3 className="font-medium text-gray-900">{quiz.title}</h3>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <span>{quiz.question_count} questions</span>
                    <span>•</span>
                    <span className="capitalize">{quiz.difficulty}</span>
                    <span>•</span>
                    <span>{new Date(quiz.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartQuiz(quiz)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>Start Quiz</span>
              </button>
            </div>
          ))}

          {(!quizBlueprints || quizBlueprints.length === 0) && (
            <div className="p-8 text-center">
              <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Quizzes Available</h3>
              <p className="text-gray-600">
                Generate your first quiz from your uploaded study materials
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}