// AI Service for ranking tasks using Ollama
// This will integrate with Hugging Face models via Ollama

export async function rankTasks(tasks, userContext = {}) {
  try {
    // For now, we'll simulate AI ranking
    // TODO: Replace with actual Ollama API call
    
    console.log('Ranking tasks with AI...', { tasks, userContext });
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple mock ranking based on task length and keywords
    const rankedTasks = tasks.map((task, index) => ({
      ...task,
      priority: calculateMockPriority(task, userContext),
      aiReason: generateMockReason(task)
    })).sort((a, b) => b.priority - a.priority);
    
    return rankedTasks;
  } catch (error) {
    console.error('Error in AI ranking service:', error);
    throw error;
  }
}

function calculateMockPriority(task, userContext) {
  let priority = 5; // Base priority
  
  // Boost priority for urgent keywords
  const urgentKeywords = ['urgent', 'important', 'deadline', 'meeting', 'call'];
  const taskLower = task.text.toLowerCase();
  
  urgentKeywords.forEach(keyword => {
    if (taskLower.includes(keyword)) {
      priority += 3;
    }
  });
  
  // Consider task length (shorter tasks might be quicker wins)
  if (task.text.length < 20) {
    priority += 1;
  }
  
  // Work-related tasks get higher priority during work hours
  const workKeywords = ['work', 'project', 'code', 'meeting', 'email'];
  const currentHour = new Date().getHours();
  
  if (currentHour >= 9 && currentHour <= 17) {
    workKeywords.forEach(keyword => {
      if (taskLower.includes(keyword)) {
        priority += 2;
      }
    });
  }
  
  return Math.min(priority, 10); // Cap at 10
}

function generateMockReason(task) {
  const reasons = [
    "High impact on productivity",
    "Time-sensitive deadline",
    "Dependencies on other tasks",
    "Quick win for momentum",
    "Important for long-term goals"
  ];
  
  return reasons[Math.floor(Math.random() * reasons.length)];
}

// Future: Actual Ollama integration
export async function callOllamaAPI(prompt, model = 'llama2') {
  // TODO: Implement actual Ollama API call
  // const response = await fetch('http://localhost:11434/api/generate', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     model: model,
  //     prompt: prompt,
  //     stream: false
  //   })
  // });
  // return response.json();
  
  throw new Error('Ollama integration not yet implemented');
}