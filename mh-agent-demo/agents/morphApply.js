// agents/morphApply.js
// For the demo this will simply append a comment to the prompt file to simulate an edit
const fs = require('fs');
const path = require('path');

function applyMockEdit(promptName, editSnippet){
  const filePath = path.join(__dirname, '..', 'prompts', promptName + '.json');
  if(!fs.existsSync(filePath)) {
    console.warn('[morphApply] prompt file not found, creating new one.');
    fs.writeFileSync(filePath, JSON.stringify({name: promptName, content: editSnippet}, null, 2));
    return { merged: editSnippet, version: 'v0.1-mock' };
  }
  const content = fs.readFileSync(filePath, 'utf8');
  let json = JSON.parse(content);
  // naive append
  json.content = json.content + "\n\n// Morph-mock-edit:\n" + editSnippet;
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
  return { merged: json.content, version: 'v0.1-mock' };
}

module.exports = { applyMockEdit };