import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, BookOpen, Brain, MessageCircle, Calendar, Check } from 'lucide-react';

const OnboardingModal = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userInfo, setUserInfo] = useState({
    institution: '',
    course: '',
    year: '',
    studyGoals: [],
    preferredStudyTime: 'evening'
  });

  const studyGoalOptions = [
    'Improve exam performance',
    'Better understand concepts',
    'Create effective study schedules',
    'Generate practice questions',
    'Track learning progress',
    'Organize study materials'
  ];

  const steps = [
    {
      title: 'Welcome to Study Buddy!',
      icon: Brain,
      content: (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Your AI-Powered Study Companion
          </h3>
          <p className="text-muted-foreground mb-6">
            Study Buddy helps polytechnic students like you organize materials, generate quizzes, 
            and track progress - all in one place. Let's get you set up!
          </p>
          <div className="bg-primary/10 p-4 rounded-lg">
            <p className="text-sm text-primary font-medium">
              One Inbox → One Brain → One Plan
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Tell us about yourself',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Which institution do you attend?
            </label>
            <input
              type="text"
              value={userInfo.institution}
              onChange={(e) => setUserInfo({...userInfo, institution: e.target.value})}
              placeholder="e.g., Singapore Polytechnic, Nanyang Polytechnic..."
              className="input w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              What course are you studying?
            </label>
            <input
              type="text"
              value={userInfo.course}
              onChange={(e) => setUserInfo({...userInfo, course: e.target.value})}
              placeholder="e.g., Diploma in Information Technology, Business..."
              className="input w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Current year of study
            </label>
            <select
              value={userInfo.year}
              onChange={(e) => setUserInfo({...userInfo, year: e.target.value})}
              className="input w-full"
            >
              <option value="">Select year</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
            </select>
          </div>
        </div>
      )
    },
    {
      title: 'What are your study goals?',
      icon: MessageCircle,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Select all that apply - this helps us personalize your experience:
          </p>
          <div className="grid grid-cols-1 gap-3">
            {studyGoalOptions.map((goal) => (
              <label key={goal} className="flex items-center space-x-3 p-3 rounded-lg border border-input hover:bg-accent cursor-pointer">
                <input
                  type="checkbox"
                  checked={userInfo.studyGoals.includes(goal)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setUserInfo({
                        ...userInfo,
                        studyGoals: [...userInfo.studyGoals, goal]
                      });
                    } else {
                      setUserInfo({
                        ...userInfo,
                        studyGoals: userInfo.studyGoals.filter(g => g !== goal)
                      });
                    }
                  }}
                  className="rounded border-input"
                />
                <span className="text-sm text-foreground">{goal}</span>
              </label>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'When do you prefer to study?',
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            This helps us suggest optimal study schedules:
          </p>
          <div className="grid grid-cols-1 gap-3">
            {[
              { value: 'morning', label: 'Morning (6AM - 12PM)', desc: 'Fresh mind, fewer distractions' },
              { value: 'afternoon', label: 'Afternoon (12PM - 6PM)', desc: 'Good for review and practice' },
              { value: 'evening', label: 'Evening (6PM - 10PM)', desc: 'Most common study time' },
              { value: 'night', label: 'Night (10PM - 2AM)', desc: 'Quiet environment, deep focus' },
            ].map((time) => (
              <label key={time.value} className="flex items-start space-x-3 p-3 rounded-lg border border-input hover:bg-accent cursor-pointer">
                <input
                  type="radio"
                  name="studyTime"
                  value={time.value}
                  checked={userInfo.preferredStudyTime === time.value}
                  onChange={(e) => setUserInfo({...userInfo, preferredStudyTime: e.target.value})}
                  className="mt-1"
                />
                <div>
                  <span className="text-sm font-medium text-foreground">{time.label}</span>
                  <p className="text-xs text-muted-foreground">{time.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'You\'re all set!',
      icon: Check,
      content: (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Welcome aboard, {userInfo.institution && `${userInfo.institution} `}student!
            </h3>
            <p className="text-muted-foreground">
              Your Study Buddy is ready to help you excel in your studies.
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-foreground">Next steps:</h4>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li>📚 Upload your first study materials in the Library</li>
              <li>💬 Ask questions about your content in Chat</li>
              <li>📝 Generate practice quizzes to test yourself</li>
              <li>📅 Create study schedules in the Planner</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return userInfo.institution && userInfo.course && userInfo.year;
      case 2:
        return userInfo.studyGoals.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      // Save onboarding data to localStorage for now
      localStorage.setItem('userOnboarding', JSON.stringify({
        ...userInfo,
        completedAt: new Date().toISOString()
      }));
      onComplete(userInfo);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const Icon = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{currentStepData.title}</h2>
              <p className="text-sm text-muted-foreground">Step {currentStep + 1} of {steps.length}</p>
            </div>
          </div>
          {!isLastStep && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="px-6 py-2">
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStepData.content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </button>
          
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLastStep ? 'Get Started' : 'Next'}
            {!isLastStep && <ChevronRight className="w-4 h-4 ml-2" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;