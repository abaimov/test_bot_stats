const fs = require('fs');

const filePath = 'users.json';

// Очистка файла, перезаписывая его пустым массивом
fs.writeFileSync(filePath, '[]');

console.log(`${filePath} был очищен.`);
