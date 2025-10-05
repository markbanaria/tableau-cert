const fs = require('fs');
const path = require('path');

const QUESTION_BANKS_DIR = path.join(__dirname, '../public/question-banks');
const OUTPUT_FILE = path.join(__dirname, '../public/question-banks-bundle.json');

console.log('📦 Bundling question banks...');

try {
  const files = fs.readdirSync(QUESTION_BANKS_DIR)
    .filter(file => file.endsWith('.json') && file !== 'question-banks-bundle.json');
  
  const bundle = {
    version: Date.now().toString(),
    generatedAt: new Date().toISOString(),
    questionBanks: {}
  };

  let totalQuestions = 0;
  
  files.forEach(file => {
    const fileName = path.basename(file, '.json');
    const filePath = path.join(QUESTION_BANKS_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    bundle.questionBanks[fileName] = content;
    totalQuestions += (content.questions || []).length;
    
    console.log(`  ✓ ${fileName}: ${(content.questions || []).length} questions`);
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(bundle));
  
  const stats = fs.statSync(OUTPUT_FILE);
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  console.log('\n✅ Bundle created successfully!');
  console.log(`   Files bundled: ${files.length}`);
  console.log(`   Total questions: ${totalQuestions}`);
  console.log(`   Bundle size: ${sizeInMB} MB`);
  console.log(`   Output: ${OUTPUT_FILE}`);
  console.log(`   Version: ${bundle.version}`);
  
} catch (error) {
  console.error('❌ Error bundling question banks:', error);
  process.exit(1);
}
