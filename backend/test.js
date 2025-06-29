const path = require('path');
const fs = require('fs');

const dbPath = '/certificates/sertifikat_Dhiya_Gustita_Aqila_1751116131019.docx';
console.log('DB Path length:', dbPath.length);
console.log('DB Path bytes:', Buffer.from(dbPath, 'utf8'));

// List all files di certificates folder
const certificatesDir = path.join(__dirname, 'certificates');
const files = fs.readdirSync(certificatesDir);
console.log('\nFiles in certificates:');
files.forEach((file, index) => {
    console.log(`${index + 1}. "${file}" (length: ${file.length})`);
    if (file.includes('Dhiya_Gustita_Aqila_1751116131019')) {
        console.log('   FOUND MATCH!');
        console.log('   File bytes:', Buffer.from(file, 'utf8'));
    }
});

// Test direct file access
const expectedFile = 'sertifikat_Dhiya_Gustita_Aqila_1751116131019.docx';
const directPath = path.join(certificatesDir, expectedFile);
console.log('\nDirect test:');
console.log('Expected file:', expectedFile);
console.log('Direct path:', directPath);
console.log('Direct exists:', fs.existsSync(directPath));