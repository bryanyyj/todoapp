import { useState } from 'react';
import './Settings.css';

function Settings() {
  const [settings, setSettings] = useState({
    aiModel: 'llama2',
    autoRank: false,
    notifications: true,
    theme: 'light',
    aiPersonality: 'balanced',
    workHours: {
      start: '09:00',
      end: '17:00'
    },
    priorities: {
      work: 8,
      personal: 6,
      health: 9,
      learning: 7
    }
  });

  const handleSettingChange = (category, key, value) => {
    if (category) {
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
    }
  };

  const saveSettings = () => {
    // In a real app, this would save to backend
    alert('Settings saved successfully!');
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>Settings</h2>
        <p>Customize your AI-powered todo experience</p>
      </div>

      <div className="settings-sections">
        <div className="settings-section">
          <h3>🤖 AI Configuration</h3>
          <div className="setting-group">
            <label htmlFor="ai-model">AI Model</label>
            <select 
              id="ai-model"
              value={settings.aiModel}
              onChange={(e) => handleSettingChange(null, 'aiModel', e.target.value)}
            >
              <option value="llama2">Llama 2 (Default)</option>
              <option value="codellama">Code Llama</option>
              <option value="mistral">Mistral 7B</option>
              <option value="neural-chat">Neural Chat</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="ai-personality">AI Personality</label>
            <select 
              id="ai-personality"
              value={settings.aiPersonality}
              onChange={(e) => handleSettingChange(null, 'aiPersonality', e.target.value)}
            >
              <option value="balanced">Balanced - Good for general use</option>
              <option value="aggressive">Aggressive - Pushes high priorities</option>
              <option value="gentle">Gentle - Considers work-life balance</option>
              <option value="productivity">Productivity - Focuses on efficiency</option>
            </select>
          </div>

          <div className="setting-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={settings.autoRank}
                onChange={(e) => handleSettingChange(null, 'autoRank', e.target.checked)}
              />
              Auto-rank new tasks
            </label>
            <span className="setting-description">
              Automatically rank tasks when they're added
            </span>
          </div>
        </div>

        <div className="settings-section">
          <h3>🔔 Preferences</h3>
          <div className="setting-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => handleSettingChange(null, 'notifications', e.target.checked)}
              />
              Enable notifications
            </label>
          </div>

          <div className="setting-group">
            <label htmlFor="theme">Theme</label>
            <select 
              id="theme"
              value={settings.theme}
              onChange={(e) => handleSettingChange(null, 'theme', e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3>⏰ Work Schedule</h3>
          <div className="time-inputs">
            <div className="setting-group">
              <label htmlFor="work-start">Work Start Time</label>
              <input
                type="time"
                id="work-start"
                value={settings.workHours.start}
                onChange={(e) => handleSettingChange('workHours', 'start', e.target.value)}
              />
            </div>
            <div className="setting-group">
              <label htmlFor="work-end">Work End Time</label>
              <input
                type="time"
                id="work-end"
                value={settings.workHours.end}
                onChange={(e) => handleSettingChange('workHours', 'end', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>🎯 Priority Weights</h3>
          <p className="section-description">
            Adjust how the AI weighs different types of tasks (1-10 scale)
          </p>
          <div className="priority-sliders">
            {Object.entries(settings.priorities).map(([key, value]) => (
              <div key={key} className="slider-group">
                <label>{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                <div className="slider-container">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={value}
                    onChange={(e) => handleSettingChange('priorities', key, parseInt(e.target.value))}
                  />
                  <span className="slider-value">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h3>🔗 Ollama Connection</h3>
          <div className="connection-status">
            <div className="status-indicator offline"></div>
            <span>Ollama not connected</span>
          </div>
          <p className="connection-info">
            Make sure Ollama is running on localhost:11434 to enable AI features.
            <br />
            <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer">
              Download Ollama
            </a>
          </p>
        </div>
      </div>

      <div className="settings-actions">
        <button onClick={saveSettings} className="save-btn">
          💾 Save Settings
        </button>
      </div>
    </div>
  );
}

export default Settings;