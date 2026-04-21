const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  // Backgrounds
  { regex: /bg-\[#eef2f5\]/g, replacement: 'bg-neu dark:bg-neu-dark' },
  
  // Outer Shadows
  { regex: /shadow-\[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff\]/g, replacement: 'shadow-neu-out dark:shadow-neu-out-dark' },
  { regex: /shadow-\[8px_8px_16px_#c8d0e7,-8px_-8px_16px_#ffffff\]/g, replacement: 'shadow-neu-out-lg dark:shadow-neu-out-lg-dark' },
  { regex: /shadow-\[20px_20px_60px_#c8d0e7,-20px_-20px_60px_#ffffff\]/g, replacement: 'shadow-neu-out-xl dark:shadow-neu-out-xl-dark' },
  { regex: /shadow-\[4px_4px_8px_#c8d0e7,-4px_-4px_8px_#ffffff\]/g, replacement: 'shadow-neu-out dark:shadow-neu-out-dark' }, // Fallback mapping

  // Inner Shadows
  { regex: /shadow-\[inset_4px_4px_8px_#c8d0e7,inset_-4px_-4px_8px_#ffffff\]/g, replacement: 'shadow-neu-in dark:shadow-neu-in-dark' },
  { regex: /shadow-\[inset_6px_6px_12px_#c8d0e7,inset_-6px_-6px_12px_#ffffff\]/g, replacement: 'shadow-neu-in-lg dark:shadow-neu-in-lg-dark' },
  { regex: /shadow-\[inset_2px_2px_4px_#c8d0e7,inset_-2px_-2px_4px_#ffffff\]/g, replacement: 'shadow-neu-in-sm dark:shadow-neu-in-sm-dark' },
  { regex: /shadow-\[inset_3px_3px_6px_#c8d0e7,inset_-3px_-3px_6px_#ffffff\]/g, replacement: 'shadow-neu-in-sm dark:shadow-neu-in-sm-dark' }, // Fallback mapping

  // Text Colors
  { regex: /text-neutral-800(?! dark:)/g, replacement: 'text-neutral-800 dark:text-neutral-100' },
  { regex: /text-neutral-700(?! dark:)/g, replacement: 'text-neutral-700 dark:text-neutral-200' },
  { regex: /text-neutral-600(?! dark:)/g, replacement: 'text-neutral-600 dark:text-neutral-300' },
  { regex: /text-neutral-500(?! dark:)/g, replacement: 'text-neutral-500 dark:text-neutral-400' },

  // Background Whites and Borders (often used in neu context)
  { regex: /bg-white(?! dark:)/g, replacement: 'bg-white dark:bg-[#1f232b]' },
  { regex: /border-white\/80/g, replacement: 'border-white/80 dark:border-white/5' },
  { regex: /border-white\/50/g, replacement: 'border-white/50 dark:border-white/5' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
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

// Ensure tailwind.config.js variables are also correctly mapped in main.css just in case
let mainCssPath = path.join(srcDir, 'main.css');
if (fs.existsSync(mainCssPath)) {
    let css = fs.readFileSync(mainCssPath, 'utf8');
    // Map existing variable uses to adapt well.
    if (!css.includes('.dark body')) {
        css += `\n
/* DARK MODE OVERRIDES */
.dark body {
  background-color: #1a1d24;
  color: #e5e5e5;
}
.dark .neu-card {
  background: #1a1d24;
  box-shadow: 6px 6px 12px #111318, -6px -6px 12px #232730;
  border: 1px solid rgba(255,255,255,0.05);
}
.dark .neu-btn {
  background: #1a1d24;
  box-shadow: 6px 6px 12px #111318, -6px -6px 12px #232730;
  color: #e5e5e5;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.dark .neu-btn:hover {
  box-shadow: 8px 8px 16px #111318, -8px -8px 16px #232730;
}
.dark .neu-btn:active, .dark .neu-btn.active {
  box-shadow: inset 4px 4px 8px #111318, inset -4px -4px 8px #232730;
}
.dark .neu-input {
  background: #1a1d24;
  box-shadow: inset 4px 4px 8px #111318, inset -4px -4px 8px #232730;
  color: #e5e5e5;
}
.dark .neu-input:focus {
  box-shadow: inset 6px 6px 12px #111318, inset -6px -6px 12px #232730, 0 0 0 2px var(--primary);
}
.dark .neu-icon-btn {
  background: #1a1d24;
  box-shadow: 6px 6px 12px #111318, -6px -6px 12px #232730;
  color: #9ca3af;
}
.dark .neu-icon-btn:active {
  box-shadow: inset 4px 4px 8px #111318, inset -4px -4px 8px #232730;
}
`;
        fs.writeFileSync(mainCssPath, css, 'utf8');
        console.log(`Updated CSS: ${mainCssPath}`);
    }
}

try {
  processDirectory(srcDir);
  console.log("Dark mode variables mapped successfully.");
} catch(err) {
  console.error(err);
}
