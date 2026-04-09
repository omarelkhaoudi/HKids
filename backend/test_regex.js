const testPaths = [
  '/uploads/books/1775483095159-448372705.pdf',
  '/books/1775483095159-448372705.pdf',
  '/uploads/books/1775483095159-448372705.pdf',
];

const pattern = /^\/books\/[^\/]+\.(pdf|png|jpg|jpeg)$/i;

console.log('🔍 Testing URL patterns...');
testPaths.forEach(path => {
  const matches = pattern.test(path);
  console.log(`${path} → ${matches ? '✅ MATCHES' : '❌ NO MATCH'}`);
});

// Test what the actual request path would be
console.log('\n📋 Actual request path analysis:');
const originalPath = '/uploads/books/1775483095159-448372705.pdf';
console.log(`Original path: ${originalPath}`);
console.log(`Pattern test: ${pattern.test(originalPath)}`);

// The issue might be that the pattern expects /books/ but the actual path is /uploads/books/
const correctedPattern = /^\/uploads\/books\/[^\/]+\.(pdf|png|jpg|jpeg)$/i;
console.log(`Corrected pattern test: ${correctedPattern.test(originalPath)}`);
