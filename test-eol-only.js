// Test to verify that we only remove markers at end of lines

const commentMarkerPattern = /<!--\s*line:\d+\s*-->/g;
const commentMarkerEOLPattern = /<!--\s*line:\d+\s*-->$/gm;

// Test case: markers at end of lines (normal case)
const codeWithEOLMarkers = `const x = 1;<!-- line:4 -->
const y = 2;<!-- line:5 -->
function test() {<!-- line:6 -->
  return x + y;<!-- line:7 -->
}<!-- line:8 -->`;

// Test case: hypothetical case with marker in middle (shouldn't happen but let's be safe)
const codeWithMidMarkers = `const x = <!-- line:99 --> 1;
const y = 2;<!-- line:5 -->`;

console.log('=== Testing End-of-Line Only Matching ===\n');

console.log('Test 1: Normal case (markers at end of lines)');
console.log('Original:');
console.log(codeWithEOLMarkers);
console.log('\nAfter replacement with current pattern:');
console.log(codeWithEOLMarkers.replace(commentMarkerPattern, ''));
console.log('\nAfter replacement with EOL pattern:');
console.log(codeWithEOLMarkers.replace(commentMarkerEOLPattern, ''));

console.log('\n' + '='.repeat(60) + '\n');

console.log('Test 2: Edge case (marker in middle of line)');
console.log('Original:');
console.log(codeWithMidMarkers);
console.log('\nAfter replacement with current pattern:');
console.log(codeWithMidMarkers.replace(commentMarkerPattern, ''));
console.log('\nAfter replacement with EOL pattern:');
console.log(codeWithMidMarkers.replace(commentMarkerEOLPattern, ''));

console.log('\n' + '='.repeat(60) + '\n');

console.log('Conclusion:');
console.log('The EOL pattern only removes markers at line ends,');
console.log('which is more precise and matches how markers are added.');
