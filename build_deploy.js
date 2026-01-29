const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🚀 Starting Deployment Build Process...");

const rootDir = __dirname;
const frontendDir = path.join(rootDir, 'frontend');
const backendDir = path.join(rootDir, 'backend');
const backendPublicDir = path.join(backendDir, 'public');

// Helper to run commands
function run(command, cwd) {
    console.log(`\n> Running: ${command} in ${cwd}`);
    try {
        execSync(command, { cwd, stdio: 'inherit', shell: true });
    } catch (e) {
        console.error(`❌ Request failed: ${command}`);
        process.exit(1);
    }
}

// 1. Install & Build Frontend
console.log("\n📦 --- Setting up Frontend ---");
run('npm install', frontendDir);
run('npm run build', frontendDir);

// 2. Prepare Backend Public Directory
console.log("\n📂 --- Moving Files to Backend ---");
if (fs.existsSync(backendPublicDir)) {
    console.log("   Cleaning old assets...");
    fs.rmSync(backendPublicDir, { recursive: true, force: true });
}
fs.mkdirSync(backendPublicDir);

// 3. Move Dist to backend/public
const distDir = path.join(frontendDir, 'dist');
if (!fs.existsSync(distDir)) {
    console.error("❌ Frontend build failed! dist folder not found.");
    process.exit(1);
}

// Recursive copy function
function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    let entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        let srcPath = path.join(src, entry.name);
        let destPath = path.join(dest, entry.name);

        entry.isDirectory() ? copyDir(srcPath, destPath) : fs.copyFileSync(srcPath, destPath);
    }
}
copyDir(distDir, backendPublicDir);
console.log("✅ Frontend assets moved to backend/public");

// 4. Install Backend Deps
console.log("\n📦 --- Setting up Backend ---");
run('npm install', backendDir);
run('npm run build', backendDir); // Assuming backend has a build script or is TS

console.log("\n✅ BUILD COMPLETE!");
console.log("   To start the app, go to /backend and run: npm start");
