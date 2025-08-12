const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');
const tilDir = path.join(dataDir, 'til');

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Check if repository already exists
if (fs.existsSync(tilDir)) {
  // If it exists, try to pull latest changes
  console.log('📦 Updating existing jbranchaud/til repository...');
  try {
    execSync('git fetch --depth 1 origin master', {
      cwd: tilDir,
      stdio: 'inherit'
    });
    execSync('git reset --hard origin/master', {
      cwd: tilDir,
      stdio: 'inherit'
    });
    console.log('✅ Repository updated successfully!');
  } catch (error) {
    console.log('⚠️  Failed to update, re-cloning repository...');
    // If update fails, remove and re-clone
    fs.rmSync(tilDir, { recursive: true, force: true });
    execSync(`git clone --depth 1 https://github.com/jbranchaud/til.git ${tilDir}`, {
      stdio: 'inherit'
    });
    console.log('✅ Repository cloned successfully!');
  }
} else {
  // Clone the repository for the first time
  console.log('📦 Cloning jbranchaud/til repository for the first time...');
  try {
    execSync(`git clone --depth 1 https://github.com/jbranchaud/til.git ${tilDir}`, {
      stdio: 'inherit'
    });
    console.log('✅ Repository cloned successfully!');
  } catch (error) {
    console.error('❌ Error cloning repository:', error);
    process.exit(1);
  }
}

// Show stats
const dirs = fs.readdirSync(tilDir).filter(item => {
  const fullPath = path.join(tilDir, item);
  return fs.statSync(fullPath).isDirectory() && !item.startsWith('.');
});

let totalFiles = 0;
dirs.forEach(dir => {
  const files = fs.readdirSync(path.join(tilDir, dir)).filter(f => f.endsWith('.md'));
  totalFiles += files.length;
});

console.log(`\n📊 Stats:`);
console.log(`   Categories: ${dirs.length}`);
console.log(`   Total TILs: ${totalFiles}`);
console.log(`\n🚀 Run 'npm run dev' to start the application!`);