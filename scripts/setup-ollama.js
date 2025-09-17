const axios = require('axios');
const { spawn } = require('child_process');

const OLLAMA_URL = 'http://localhost:11434';
const REQUIRED_MODELS = ['llama3', 'mxbai-embed-large'];

async function checkOllamaHealth() {
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function getInstalledModels() {
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`);
    return response.data.models?.map(model => model.name) || [];
  } catch (error) {
    console.error('Failed to get installed models:', error.message);
    return [];
  }
}

function pullModel(modelName) {
  return new Promise((resolve, reject) => {
    console.log(`\nPulling ${modelName}... This may take several minutes.`);
    
    const process = spawn('ollama', ['pull', modelName], {
      stdio: 'inherit',
      shell: true
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${modelName} installed successfully`);
        resolve();
      } else {
        reject(new Error(`Failed to install ${modelName}`));
      }
    });
    
    process.on('error', (error) => {
      reject(error);
    });
  });
}

async function setupOllama() {
  console.log('🤖 Setting up Ollama models...\n');
  
  // Check if Ollama is running
  console.log('Checking Ollama connection...');
  const isHealthy = await checkOllamaHealth();
  
  if (!isHealthy) {
    console.error('❌ Ollama is not running or not accessible at http://localhost:11434');
    console.log('\nPlease make sure:');
    console.log('1. Ollama is installed');
    console.log('2. Ollama service is running');
    console.log('3. You can access http://localhost:11434 in your browser');
    process.exit(1);
  }
  
  console.log('✅ Ollama is running\n');
  
  // Get currently installed models
  const installedModels = await getInstalledModels();
  console.log('Currently installed models:', installedModels.length > 0 ? installedModels.join(', ') : 'None');
  
  // Install required models
  for (const model of REQUIRED_MODELS) {
    if (!installedModels.some(installed => installed.startsWith(model))) {
      try {
        await pullModel(model);
      } catch (error) {
        console.error(`❌ Failed to install ${model}:`, error.message);
        process.exit(1);
      }
    } else {
      console.log(`✅ ${model} is already installed`);
    }
  }
  
  console.log('\n🎉 Ollama setup complete!');
  console.log('\nInstalled models:');
  const finalModels = await getInstalledModels();
  finalModels.forEach(model => console.log(`  - ${model}`));
}

setupOllama().catch(error => {
  console.error('Setup failed:', error.message);
  process.exit(1);
});