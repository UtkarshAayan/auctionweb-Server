// middleware/upload.js
const multer = require('multer');

const storage = multer.memoryStorage(); // Store files in memory as Buffer

// Configure multer to handle multiple fields
const upload = multer({
    storage: storage,
}).fields([
    { name: 'uploadDocuments', maxCount: 3 }, // Up to 3 files for uploadDocuments
    { name: 'essentialDocs', maxCount: 3 },
    { name: 'categoryImage', maxCount: 1 },     // For category image
    { name: 'subcategoryImage', maxCount: 5 },    // Up to 3 files for essentialDocs
]);

module.exports = upload;
