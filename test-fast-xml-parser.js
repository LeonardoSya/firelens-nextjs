// Test to verify fast-xml-parser security fix
// TDD: Red (vulnerable) -> Green (fixed)

const { XMLParser, version } = require('fast-xml-parser');

console.log('Testing fast-xml-parser version:', version);

// Test XML that would be vulnerable to XXE attacks in older versions
const maliciousXML = `<?xml version="1.0"?>
<!DOCTYPE foo [
<!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<foo>&xxe;</foo>`;

const parser = new XMLParser();

try {
  const result = parser.parse(maliciousXML);
  
  // Check if vulnerable - if it processes the external entity, it would show root in result
  const resultStr = JSON.stringify(result);
  if (resultStr.includes('root:') || resultStr.includes('daemon:')) {
    console.log('❌ VULNERABLE: XXE attack succeeded');
    console.log('Result:', resultStr.substring(0, 200));
    process.exit(1);
  } else {
    console.log('✅ SECURE: External entities not processed');
    console.log('Result:', JSON.stringify(result));
    process.exit(0);
  }
} catch (error) {
  console.log('✅ SECURE: Parser rejected malicious XML');
  console.log('Error:', error.message);
  process.exit(0);
}
