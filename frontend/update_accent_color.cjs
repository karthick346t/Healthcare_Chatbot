const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  // Backgrounds
  { regex: /bg-cyan-500/g, replacement: 'bg-themeAccent-500' },
  { regex: /bg-teal-500/g, replacement: 'bg-themeAccent-500' },
  { regex: /bg-cyan-600/g, replacement: 'bg-themeAccent-600' },
  { regex: /bg-teal-600/g, replacement: 'bg-themeAccent-600' },
  { regex: /bg-cyan-50(?!0)/g, replacement: 'bg-themeAccent-50' },
  { regex: /bg-teal-50(?!0)/g, replacement: 'bg-themeAccent-50' },
  { regex: /bg-cyan-100/g, replacement: 'bg-themeAccent-100' },
  { regex: /bg-teal-100/g, replacement: 'bg-themeAccent-100' },
  
  // Texts
  { regex: /text-cyan-400/g, replacement: 'text-themeAccent-400' },
  { regex: /text-teal-400/g, replacement: 'text-themeAccent-400' },
  { regex: /text-cyan-500/g, replacement: 'text-themeAccent-500' },
  { regex: /text-teal-500/g, replacement: 'text-themeAccent-500' },
  { regex: /text-cyan-600/g, replacement: 'text-themeAccent-600' },
  { regex: /text-teal-600/g, replacement: 'text-themeAccent-600' },
  { regex: /text-cyan-700/g, replacement: 'text-themeAccent-700' },
  { regex: /text-teal-700/g, replacement: 'text-themeAccent-700' },
  
  // Borders
  { regex: /border-cyan-500/g, replacement: 'border-themeAccent-500' },
  { regex: /border-teal-500/g, replacement: 'border-themeAccent-500' },
  { regex: /border-cyan-100/g, replacement: 'border-themeAccent-100' },
  { regex: /border-teal-100/g, replacement: 'border-themeAccent-100' },

  // Rings
  { regex: /ring-cyan-500/g, replacement: 'ring-themeAccent-500' },
  { regex: /ring-teal-500/g, replacement: 'ring-themeAccent-500' },
  { regex: /ring-cyan-400/g, replacement: 'ring-themeAccent-400' },
  { regex: /ring-teal-400/g, replacement: 'ring-themeAccent-400' },
  { regex: /ring-cyan-600/g, replacement: 'ring-themeAccent-600' },
  { regex: /ring-teal-600/g, replacement: 'ring-themeAccent-600' },
  
  // Gradients
  { regex: /from-cyan-400/g, replacement: 'from-themeAccent-400' },
  { regex: /from-teal-400/g, replacement: 'from-themeAccent-400' },
  { regex: /from-cyan-500/g, replacement: 'from-themeAccent-500' },
  { regex: /from-teal-500/g, replacement: 'from-themeAccent-500' },
  { regex: /from-cyan-600/g, replacement: 'from-themeAccent-600' },
  { regex: /from-teal-600/g, replacement: 'from-themeAccent-600' },
  { regex: /to-teal-300/g, replacement: 'to-themeAccent-300' },
  { regex: /to-cyan-300/g, replacement: 'to-themeAccent-300' },
  { regex: /to-teal-500/g, replacement: 'to-themeAccent-500' },
  { regex: /to-cyan-500/g, replacement: 'to-themeAccent-500' },

  // Shadows
  { regex: /shadow-cyan-500/g, replacement: 'shadow-themeAccent-500' },
  { regex: /shadow-teal-500/g, replacement: 'shadow-themeAccent-500' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    // EXCLUDE Settings.tsx because the map needs literal string classnames 'bg-cyan-500' not to be replaced to themeAccent!
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if ((fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) && file !== 'Settings.tsx') {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { regex, replacement } of replacements) {
        content = content.replace(regex, replacement);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

try {
  processDirectory(srcDir);
  console.log("Accent colors mapped successfully.");
} catch(err) {
  console.error(err);
}
