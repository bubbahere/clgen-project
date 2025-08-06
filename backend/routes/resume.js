const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
        }
    }
});

// Initialize database
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

// Create tables if they don't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS resumes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        content TEXT,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Extract text from different file types
async function extractTextFromFile(filePath, fileType) {
    try {
        if (fileType === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            return data.text;
        } else if (fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        }
        return '';
    } catch (error) {
        console.error('Error extracting text from file:', error);
        return '';
    }
}

// Upload resume endpoint
router.post('/upload', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { filename, originalname, path: filePath, size } = req.file;
        
        // Extract text content from the file
        const content = await extractTextFromFile(filePath, req.file.mimetype);
        
        // Store in database
        const stmt = db.prepare(`
            INSERT INTO resumes (filename, original_name, file_path, file_size, content)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.run(filename, originalname, filePath, size, content, function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to save resume to database' });
            }
            
            // Delete any previous resumes (keep only the latest)
            db.run('DELETE FROM resumes WHERE id != ?', [this.lastID], (err) => {
                if (err) {
                    console.error('Error deleting old resumes:', err);
                }
            });
            
            res.json({
                success: true,
                message: 'Resume uploaded successfully',
                data: {
                    id: this.lastID,
                    filename: filename,
                    originalName: originalname,
                    fileSize: size,
                    uploadedAt: new Date().toISOString()
                }
            });
        });
        
        stmt.finalize();
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload resume' });
    }
});

// Get latest resume endpoint
router.get('/latest', (req, res) => {
    db.get('SELECT * FROM resumes ORDER BY uploaded_at DESC LIMIT 1', (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to retrieve resume' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'No resume found' });
        }
        
        res.json({
            success: true,
            data: {
                id: row.id,
                filename: row.filename,
                originalName: row.original_name,
                fileSize: row.file_size,
                content: row.content,
                uploadedAt: row.uploaded_at
            }
        });
    });
});

// Delete resume endpoint
router.delete('/:id', (req, res) => {
    const resumeId = req.params.id;
    
    db.get('SELECT * FROM resumes WHERE id = ?', [resumeId], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to retrieve resume' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Resume not found' });
        }
        
        // Delete file from filesystem
        try {
            if (fs.existsSync(row.file_path)) {
                fs.unlinkSync(row.file_path);
            }
        } catch (fileError) {
            console.error('Error deleting file:', fileError);
        }
        
        // Delete from database
        db.run('DELETE FROM resumes WHERE id = ?', [resumeId], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to delete resume' });
            }
            
            res.json({
                success: true,
                message: 'Resume deleted successfully'
            });
        });
    });
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ error: 'File upload error' });
    }
    
    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({ error: error.message });
    }
    
    next(error);
});

module.exports = router; 