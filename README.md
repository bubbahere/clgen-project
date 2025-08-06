# CLGEN - AI Cover Letter Generator

A Chrome browser extension that generates tailored cover letters using Google Gemini AI based on your resume and job descriptions.

## 🚀 Features

- **Resume Upload**: Upload your resume once (PDF, DOC, DOCX)
- **Job Scraping**: Automatically detects job information from job listing pages
- **AI Generation**: Uses Google Gemini to create personalized cover letters
- **PDF Export**: Downloads professional PDF cover letters
- **ATS-Friendly**: Optimized for Applicant Tracking Systems

## 🛠️ Tech Stack

### Frontend (Chrome Extension)
- **Manifest V3**: Modern Chrome extension architecture
- **HTML/CSS/JavaScript**: Clean, modern UI with gradient design
- **Content Scripts**: Job information scraping from web pages
- **Background Service Worker**: Extension-wide functionality

### Backend (Node.js)
- **Express.js**: RESTful API server
- **SQLite**: Lightweight database for resume and cover letter storage
- **Multer**: File upload handling
- **PDFKit**: PDF generation
- **Google Gemini AI**: AI-powered cover letter generation

## 📁 Project Structure

```
clgen-project/
├── extension/                 # Chrome extension files
│   ├── manifest.json         # Extension configuration
│   ├── popup.html           # Extension popup UI
│   ├── popup.js             # Popup functionality
│   ├── content.js           # Content script for job scraping
│   ├── background.js        # Background service worker
│   └── icons/               # Extension icons
├── backend/                  # Node.js backend
│   ├── server.js            # Main server file
│   ├── routes/              # API routes
│   │   ├── resume.js        # Resume upload endpoints
│   │   └── coverLetter.js   # Cover letter generation
│   ├── package.json         # Backend dependencies
│   └── database.sqlite      # SQLite database (auto-created)
├── uploads/                  # File storage
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Chrome browser
- Google Gemini API key

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start the server
npm start
```

### 2. Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

### 3. Chrome Extension Setup

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. The CLGEN extension should now appear in your extensions list

### 4. Usage

1. **Upload Resume**: Click the CLGEN extension icon and upload your resume
2. **Browse Job Listings**: Navigate to any job listing page (LinkedIn, Indeed, etc.)
3. **Generate Cover Letter**: Click the extension icon and click "Generate Cover Letter"
4. **Download**: Your AI-generated cover letter will be available for download as PDF

## 🔧 API Endpoints

### Resume Management
- `POST /resume/upload` - Upload resume file
- `GET /resume/latest` - Get latest uploaded resume
- `DELETE /resume/:id` - Delete specific resume

### Cover Letter Generation
- `POST /cover-letter/generate` - Generate AI cover letter
- `GET /cover-letter/history` - Get cover letter history
- `GET /cover-letter/:id` - Get specific cover letter
- `DELETE /cover-letter/:id` - Delete specific cover letter

### Health Check
- `GET /health` - Server health status

## 🎨 Extension Features

### Job Scraping
The extension automatically detects job information from:
- LinkedIn job pages
- Indeed job listings
- Glassdoor job postings
- General job sites with common selectors

### File Support
- **Resume Formats**: PDF, DOC, DOCX (up to 5MB)
- **Output**: Professional PDF cover letters

### UI Features
- Modern gradient design
- Drag & drop file upload
- Real-time status updates
- Loading animations
- Error handling

## 🔒 Security & Privacy

- Files are stored locally on your server
- No data is sent to third parties except Google Gemini API
- CORS configured for Chrome extension only
- File size limits enforced

## 🚀 Deployment

### Local Development
```bash
# Backend
cd backend
npm run dev  # Uses nodemon for auto-restart

# Extension
# Load in Chrome as described above
```

### Production Deployment
1. **Backend**: Deploy to Vercel, Render, or any Node.js hosting
2. **Extension**: Package and publish to Chrome Web Store

## 🐛 Troubleshooting

### Common Issues

1. **"No resume found" error**
   - Make sure you've uploaded a resume first
   - Check that the file is PDF, DOC, or DOCX format

2. **"Failed to generate cover letter" error**
   - Verify your Gemini API key is correct
   - Check that the API key has proper permissions

3. **Extension not detecting job info**
   - Try refreshing the job page
   - Click "Refresh Job Info" button in the extension

4. **CORS errors**
   - Ensure backend is running on localhost:5000
   - Check that CORS is properly configured

### Debug Mode

Enable Chrome DevTools for the extension:
1. Go to `chrome://extensions/`
2. Find CLGEN extension
3. Click "Details"
4. Click "Inspect views: popup"

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Google Gemini AI for cover letter generation
- Chrome Extension Manifest V3
- Express.js community
- PDFKit for PDF generation

---

**Note**: This is a development version. For production use, ensure proper security measures and API key management. 