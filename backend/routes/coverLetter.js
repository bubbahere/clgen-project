const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize database
const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

// Create cover letters table
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS cover_letters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_title TEXT NOT NULL,
        company TEXT NOT NULL,
        job_description TEXT,
        cover_letter_text TEXT NOT NULL,
        pdf_filename TEXT NOT NULL,
        pdf_path TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Generate cover letter using Gemini AI
async function generateCoverLetterWithAI(resumeContent, jobTitle, company, jobDescription) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
You are an expert cover letter writer. Generate a professional, ATS-friendly cover letter based on the following information:

RESUME CONTENT:
${resumeContent}

JOB INFORMATION:
- Job Title: ${jobTitle}
- Company: ${company}
- Job Description: ${jobDescription}

INSTRUCTIONS:
1. Create a compelling cover letter that highlights relevant skills and experiences from the resume
2. Make it specific to the job title and company
3. Use professional language and tone
4. Keep it concise (300-400 words)
5. Include a clear opening, body paragraphs, and closing
6. Make it ATS-friendly with standard formatting
7. Address the hiring manager professionally
8. Show enthusiasm for the role and company

FORMAT:
- Use proper business letter format
- Include date, recipient address, salutation, body, and closing
- Make it ready for immediate use

Generate a professional cover letter that will help the candidate stand out for this specific position.
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini AI Error:', error);
        throw new Error('Failed to generate cover letter with AI');
    }
}

// Generate PDF from cover letter text
function generatePDF(coverLetterText, jobTitle, company) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: {
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50
                }
            });

            const filename = `cover-letter-${company.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.pdf`;
            const pdfPath = path.join(__dirname, '../../uploads', filename);
            const stream = fs.createWriteStream(pdfPath);

            doc.pipe(stream);

            // Add header
            doc.fontSize(16)
               .font('Helvetica-Bold')
               .text('COVER LETTER', { align: 'center' })
               .moveDown(0.5);

            // Add date
            const currentDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            doc.fontSize(12)
               .font('Helvetica')
               .text(currentDate)
               .moveDown(1);

            // Add recipient info
            doc.fontSize(12)
               .font('Helvetica')
               .text('Hiring Manager')
               .text(company)
               .moveDown(1);

            // Add salutation
            doc.fontSize(12)
               .font('Helvetica')
               .text('Dear Hiring Manager,')
               .moveDown(0.5);

            // Add cover letter content
            const paragraphs = coverLetterText.split('\n\n').filter(p => p.trim());
            
            paragraphs.forEach((paragraph, index) => {
                if (index === 0) {
                    // First paragraph (after salutation)
                    doc.fontSize(12)
                       .font('Helvetica')
                       .text(paragraph.trim(), {
                           align: 'justify',
                           lineGap: 2
                       })
                       .moveDown(0.5);
                } else {
                    doc.fontSize(12)
                       .font('Helvetica')
                       .text(paragraph.trim(), {
                           align: 'justify',
                           lineGap: 2
                       })
                       .moveDown(0.5);
                }
            });

            // Add closing
            doc.moveDown(0.5)
               .fontSize(12)
               .font('Helvetica')
               .text('Sincerely,')
               .moveDown(1)
               .text('[Your Name]')
               .moveDown(0.5)
               .text('[Your Email]')
               .text('[Your Phone]');

            doc.end();

            stream.on('finish', () => {
                resolve({ filename, pdfPath });
            });

            stream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
}

// Generate cover letter endpoint
router.post('/generate', async (req, res) => {
    try {
        const { jobTitle, company, jobDescription } = req.body;

        // Validate required fields
        if (!jobTitle || !company) {
            return res.status(400).json({
                error: 'Job title and company are required'
            });
        }

        // Get the latest resume from database
        db.get('SELECT * FROM resumes ORDER BY uploaded_at DESC LIMIT 1', async (err, resume) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to retrieve resume' });
            }

            if (!resume) {
                return res.status(404).json({ error: 'No resume found. Please upload a resume first.' });
            }

            try {
                // Generate cover letter with AI
                console.log('Generating cover letter with AI...');
                const coverLetterText = await generateCoverLetterWithAI(
                    resume.content,
                    jobTitle,
                    company,
                    jobDescription || ''
                );

                // Generate PDF
                console.log('Generating PDF...');
                const { filename, pdfPath } = await generatePDF(coverLetterText, jobTitle, company);

                // Save to database
                const stmt = db.prepare(`
                    INSERT INTO cover_letters (job_title, company, job_description, cover_letter_text, pdf_filename, pdf_path)
                    VALUES (?, ?, ?, ?, ?, ?)
                `);

                stmt.run(jobTitle, company, jobDescription || '', coverLetterText, filename, pdfPath, function(err) {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({ error: 'Failed to save cover letter to database' });
                    }

                    res.json({
                        success: true,
                        message: 'Cover letter generated successfully',
                        data: {
                            id: this.lastID,
                            coverLetter: coverLetterText,
                            pdfUrl: `/uploads/${filename}`,
                            jobTitle,
                            company,
                            createdAt: new Date().toISOString()
                        }
                    });
                });

                stmt.finalize();

            } catch (aiError) {
                console.error('AI generation error:', aiError);
                res.status(500).json({ error: 'Failed to generate cover letter' });
            }
        });

    } catch (error) {
        console.error('Cover letter generation error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get cover letter history
router.get('/history', (req, res) => {
    db.all('SELECT * FROM cover_letters ORDER BY created_at DESC LIMIT 10', (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to retrieve cover letter history' });
        }

        res.json({
            success: true,
            data: rows.map(row => ({
                id: row.id,
                jobTitle: row.job_title,
                company: row.company,
                pdfUrl: `/uploads/${row.pdf_filename}`,
                createdAt: row.created_at
            }))
        });
    });
});

// Get specific cover letter
router.get('/:id', (req, res) => {
    const coverLetterId = req.params.id;

    db.get('SELECT * FROM cover_letters WHERE id = ?', [coverLetterId], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to retrieve cover letter' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Cover letter not found' });
        }

        res.json({
            success: true,
            data: {
                id: row.id,
                jobTitle: row.job_title,
                company: row.company,
                jobDescription: row.job_description,
                coverLetter: row.cover_letter_text,
                pdfUrl: `/uploads/${row.pdf_filename}`,
                createdAt: row.created_at
            }
        });
    });
});

// Delete cover letter
router.delete('/:id', (req, res) => {
    const coverLetterId = req.params.id;

    db.get('SELECT * FROM cover_letters WHERE id = ?', [coverLetterId], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to retrieve cover letter' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Cover letter not found' });
        }

        // Delete PDF file
        try {
            if (fs.existsSync(row.pdf_path)) {
                fs.unlinkSync(row.pdf_path);
            }
        } catch (fileError) {
            console.error('Error deleting PDF file:', fileError);
        }

        // Delete from database
        db.run('DELETE FROM cover_letters WHERE id = ?', [coverLetterId], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to delete cover letter' });
            }

            res.json({
                success: true,
                message: 'Cover letter deleted successfully'
            });
        });
    });
});

module.exports = router; 