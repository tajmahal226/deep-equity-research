# Fix for Model Configuration Cache Issues

## Quick Fix Steps

If you're seeing errors about old models (like `gemini-2.0-flash-exp`), follow these steps:

### 1. Clear Browser Storage
```javascript
// Open browser console (F12) and run:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 2. Or Use This Direct Link
Visit: http://localhost:3001/?reset=true

### 3. Manual Reset in Settings
1. Click the gear icon (⚙️) in top-right corner
2. Scroll to bottom
3. Click "Reset to Default Settings"
4. Re-enter your API keys

## Updated Model Configurations

The platform now uses these bleeding-edge models by default:

### OpenAI
- **Thinking**: `gpt-5`
- **Tasks**: `gpt-5-turbo`

### Anthropic
- **Thinking**: `claude-opus-4-1-20250805`
- **Tasks**: `claude-sonnet-4-0-20250805`

### Google
- **Thinking**: `gemini-2.5-flash-thinking`
- **Tasks**: `gemini-2.5-pro`

### xAI
- **Both**: `grok-3`

### DeepSeek
- **Thinking**: `deepseek-reasoner`
- **Tasks**: `deepseek-chat`

### Mistral
- **Thinking**: `mistral-large-2411`
- **Tasks**: `mistral-large-latest`

## Verification

After clearing cache, verify the correct models are being used:

1. Open Settings (gear icon)
2. Check that the model dropdowns show the new models
3. If not, manually select them from the dropdowns
4. Save settings

## Testing

Run this command to verify everything works:
```bash
node test-new-models.js
```

## If Issues Persist

The platform might be loading cached JavaScript. Try:

1. **Hard Refresh**:
   - Windows/Linux: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Incognito/Private Mode**:
   - Test in a private browser window

3. **Developer Tools**:
   - Open DevTools (F12)
   - Right-click refresh button
   - Select "Empty Cache and Hard Reload"

## Note About Model Access

These bleeding-edge models (GPT-5, Claude 4.x, Gemini 2.5, Grok-3) are not publicly available. Your API keys have special access to these models, which is why they work in testing!