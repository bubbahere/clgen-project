# CLGEN Usage Guide

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 16+ installed
- Chrome browser
- Google Gemini API key

### Step 1: Setup Backend

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure API Key**
   - Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Edit `backend/.env` file and replace `your_gemini_api_key_here` with your actual API key

3. **Start Server**
   ```bash
   npm start
   ```
   The server will run on `http://localhost:5000`

### Step 2: Install Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. The CLGEN extension should now appear in your extensions list

### Step 3: Generate Your First Cover Letter

1. **Upload Resume**
   - Click the CLGEN extension icon
   - Click "Upload Resume" and select your resume file (PDF, DOC, or DOCX)
   - Wait for upload confirmation

2. **Browse Job Listings**
   - Navigate to any job listing page (LinkedIn, Indeed, Glassdoor, etc.)
   - The extension will automatically detect job information

3. **Generate Cover Letter**
   - Click the CLGEN extension icon again
   - Click "Generate Cover Letter"
   - Wait for AI generation (usually 10-30 seconds)
   - Download your personalized PDF cover letter

## 🎯 Supported Job Sites

The extension works with most job listing websites including:

- **LinkedIn Jobs**
- **Indeed**
- **Glassdoor**
- **ZipRecruiter**
- **Monster**
- **CareerBuilder**
- **Company career pages**

## 📄 File Requirements

### Resume Upload
- **Formats**: PDF, DOC, DOCX
- **Size Limit**: 5MB maximum
- **Content**: Should be text-based (not image-only PDFs)

### Cover Letter Output
- **Format**: Professional PDF
- **Content**: ATS-optimized, 300-400 words
- **Style**: Business letter format

## 🔧 Troubleshooting

### Common Issues

#### "No resume found" Error
- **Solution**: Upload a resume first before generating cover letters
- **Check**: Ensure file is PDF, DOC, or DOCX format

#### "Failed to generate cover letter" Error
- **Solution**: Verify your Gemini API key is correct in `.env` file
- **Check**: Ensure backend server is running on port 5000

#### Extension Not Detecting Job Info
- **Solution**: Click "Refresh Job Info" button in extension
- **Alternative**: Manually refresh the job page

#### CORS Errors
- **Solution**: Ensure backend is running on localhost:5000
- **Check**: Verify CORS configuration in server.js

#### File Upload Fails
- **Solution**: Check file size (must be under 5MB)
- **Check**: Ensure file format is supported

### Debug Mode

To debug the extension:
1. Go to `chrome://extensions/`
2. Find CLGEN extension
3. Click "Details"
4. Click "Inspect views: popup"

To debug the backend:
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

## 📊 API Endpoints

### Health Check
```bash
curl http://localhost:5000/health
```

### Upload Resume
```bash
curl -X POST -F "resume=@your-resume.pdf" http://localhost:5000/resume/upload
```

### Generate Cover Letter
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"jobTitle":"Software Engineer","company":"Tech Corp","jobDescription":"..."}' \
  http://localhost:5000/cover-letter/generate
```

## 🎨 Customization

### Modify AI Prompt
Edit the prompt in `backend/routes/coverLetter.js`:
```javascript
const prompt = `
Your custom prompt here...
`;
```

### Change PDF Styling
Modify PDF generation in `backend/routes/coverLetter.js`:
```javascript
// Customize fonts, colors, layout
doc.fontSize(14)
   .font('Helvetica-Bold')
   .text('Custom Header');
```

### Extension UI
Modify styles in `extension/popup.html`:
```css
/* Custom colors, fonts, layout */
body {
    background: linear-gradient(135deg, #your-colors);
}
```

## 🔒 Security Notes

- **Local Storage**: All files are stored locally on your server
- **API Key**: Keep your Gemini API key secure and never commit it to version control
- **CORS**: Configured to only allow requests from Chrome extensions
- **File Validation**: All uploaded files are validated for type and size

## 📈 Performance Tips

- **Resume Size**: Keep resume files under 2MB for faster processing
- **Job Description**: Shorter job descriptions (under 2000 words) work better
- **Server Resources**: Ensure adequate RAM for PDF generation
- **Network**: Stable internet connection for AI API calls

## 🆘 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify backend server is running
3. Check API key configuration
4. Review file format requirements
5. Ensure proper CORS setup

## 🔄 Updates

To update the project:
1. Pull latest changes from repository
2. Run `npm install` in backend directory
3. Restart the backend server
4. Reload the Chrome extension

---

**Happy Cover Letter Generating! 🚀** 