// CLGEN Popup JavaScript
class CLGENPopup {
    constructor() {
        this.backendUrl = 'http://localhost:5001'; // Changed from 5000 to 5001
        this.selectedFile = null;
        this.jobInfo = null;
        this.coverLetterData = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadStoredData();
        this.refreshJobInfo();
    }

    initializeElements() {
        // File upload elements
        this.uploadArea = document.getElementById('uploadArea');
        this.resumeFile = document.getElementById('resumeFile');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.uploadStatus = document.getElementById('uploadStatus');

        // Job info elements
        this.jobTitle = document.getElementById('jobTitle');
        this.companyName = document.getElementById('companyName');
        this.jobDescription = document.getElementById('jobDescription');
        this.refreshJobBtn = document.getElementById('refreshJobBtn');

        // Generate elements
        this.generateBtn = document.getElementById('generateBtn');
        this.generateStatus = document.getElementById('generateStatus');

        // Loading and download elements
        this.loading = document.getElementById('loading');
        this.downloadSection = document.getElementById('downloadSection');
        this.downloadBtn = document.getElementById('downloadBtn');
    }

    bindEvents() {
        // File upload events
        this.uploadArea.addEventListener('click', () => this.resumeFile.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        this.resumeFile.addEventListener('change', this.handleFileSelect.bind(this));
        this.uploadBtn.addEventListener('click', this.uploadResume.bind(this));

        // Job info events
        this.refreshJobBtn.addEventListener('click', this.refreshJobInfo.bind(this));

        // Generate events
        this.generateBtn.addEventListener('click', this.generateCoverLetter.bind(this));
        this.downloadBtn.addEventListener('click', this.downloadCoverLetter.bind(this));
    }

    async loadStoredData() {
        try {
            const result = await chrome.storage.local.get(['resumeUploaded', 'jobInfo']);
            if (result.resumeUploaded) {
                this.uploadBtn.disabled = false;
                this.uploadBtn.textContent = 'Resume Uploaded ✓';
                this.uploadBtn.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
            }
            if (result.jobInfo) {
                this.jobInfo = result.jobInfo;
                this.updateJobInfoDisplay();
            }
        } catch (error) {
            console.error('Error loading stored data:', error);
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.resumeFile.files = files;
            this.handleFileSelect();
        }
    }

    handleFileSelect() {
        const file = this.resumeFile.files[0];
        if (file) {
            this.selectedFile = file;
            this.uploadBtn.disabled = false;
            
            // Truncate filename if too long
            const maxLength = 25;
            const displayName = file.name.length > maxLength 
                ? file.name.substring(0, maxLength) + '...' 
                : file.name;
            this.uploadBtn.textContent = `Upload ${displayName}`;
            
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                this.showStatus(this.uploadStatus, 'File size must be less than 5MB', 'error');
                this.uploadBtn.disabled = true;
                return;
            }

            // Validate file type
            const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                this.showStatus(this.uploadStatus, 'Please select a PDF, DOC, or DOCX file', 'error');
                this.uploadBtn.disabled = true;
                return;
            }

            this.showStatus(this.uploadStatus, `Selected: ${displayName}`, 'info');
        }
    }

    async uploadResume() {
        if (!this.selectedFile) {
            this.showStatus(this.uploadStatus, 'Please select a file first', 'error');
            return;
        }

        this.uploadBtn.disabled = true;
        this.uploadBtn.textContent = 'Uploading...';

        try {
            const formData = new FormData();
            formData.append('resume', this.selectedFile);

            const response = await fetch(`${this.backendUrl}/resume/upload`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                this.showStatus(this.uploadStatus, 'Resume uploaded successfully!', 'success');
                this.uploadBtn.textContent = 'Resume Uploaded ✓';
                
                // Store upload status
                await chrome.storage.local.set({ resumeUploaded: true });
                
                // Enable generate button if job info is available
                this.updateGenerateButton();
            } else {
                const error = await response.text();
                this.showStatus(this.uploadStatus, `Upload failed: ${error}`, 'error');
                this.uploadBtn.disabled = false;
                this.uploadBtn.textContent = 'Upload Resume';
            }
        } catch (error) {
            this.showStatus(this.uploadStatus, `Upload failed: ${error.message}`, 'error');
            this.uploadBtn.disabled = false;
            this.uploadBtn.textContent = 'Upload Resume';
        }
    }

    async refreshJobInfo() {
        this.refreshJobBtn.disabled = true;
        this.refreshJobBtn.textContent = 'Refreshing...';

        try {
            // Get current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Execute content script to scrape job info
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: this.scrapeJobInfo
            });

            if (results && results[0] && results[0].result) {
                this.jobInfo = results[0].result;
                this.updateJobInfoDisplay();
                
                // Store job info
                await chrome.storage.local.set({ jobInfo: this.jobInfo });
                
                this.showStatus(this.generateStatus, 'Job information updated!', 'success');
                this.updateGenerateButton();
            } else {
                this.showStatus(this.generateStatus, 'Could not detect job information on this page', 'error');
            }
        } catch (error) {
            this.showStatus(this.generateStatus, `Error refreshing job info: ${error.message}`, 'error');
        } finally {
            this.refreshJobBtn.disabled = false;
            this.refreshJobBtn.textContent = '🔄 Refresh Job Info';
        }
    }

    updateJobInfoDisplay() {
        if (this.jobInfo) {
            this.jobTitle.textContent = this.jobInfo.title || 'Not detected';
            this.companyName.textContent = this.jobInfo.company || 'Not detected';
            this.jobDescription.textContent = this.jobInfo.description ? 
                (this.jobInfo.description.length > 100 ? 
                    this.jobInfo.description.substring(0, 100) + '...' : 
                    this.jobInfo.description) : 
                'Not detected';
        }
    }

    updateGenerateButton() {
        const resumeUploaded = this.uploadBtn.textContent.includes('✓');
        const jobInfoAvailable = this.jobInfo && this.jobInfo.title && this.jobInfo.company;
        
        this.generateBtn.disabled = !(resumeUploaded && jobInfoAvailable);
        
        if (this.generateBtn.disabled) {
            this.generateBtn.textContent = 'Upload resume and detect job info first';
        } else {
            this.generateBtn.textContent = 'Generate Cover Letter';
        }
    }

    async generateCoverLetter() {
        if (!this.jobInfo || !this.jobInfo.title) {
            this.showStatus(this.generateStatus, 'Please refresh job information first', 'error');
            return;
        }

        this.loading.style.display = 'block';
        this.generateBtn.disabled = true;
        this.generateBtn.textContent = 'Generating...';

        try {
            const response = await fetch(`${this.backendUrl}/cover-letter/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jobTitle: this.jobInfo.title,
                    company: this.jobInfo.company,
                    jobDescription: this.jobInfo.description
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.coverLetterData = result;
                
                this.showStatus(this.generateStatus, 'Cover letter generated successfully!', 'success');
                this.downloadSection.style.display = 'block';
                this.downloadBtn.href = `${this.backendUrl}${result.pdfUrl}`;
            } else {
                const error = await response.text();
                this.showStatus(this.generateStatus, `Generation failed: ${error}`, 'error');
            }
        } catch (error) {
            this.showStatus(this.generateStatus, `Generation failed: ${error.message}`, 'error');
        } finally {
            this.loading.style.display = 'none';
            this.generateBtn.disabled = false;
            this.generateBtn.textContent = 'Generate Cover Letter';
        }
    }

    async downloadCoverLetter() {
        if (this.coverLetterData && this.coverLetterData.pdfUrl) {
            const downloadUrl = `${this.backendUrl}${this.coverLetterData.pdfUrl}`;
            
            // Create a temporary link and trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `cover-letter-${this.jobInfo.company}-${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    showStatus(element, message, type) {
        element.innerHTML = `<div class="status ${type}">${message}</div>`;
        setTimeout(() => {
            element.innerHTML = '';
        }, 5000);
    }
}

// Job scraping function (executed in content script context)
function scrapeJobInfo() {
    const jobInfo = {
        title: '',
        company: '',
        description: '',
        url: window.location.href,
        timestamp: new Date().toISOString()
    };

    // Enhanced selectors for better job detection
    const titleSelectors = [
        // LinkedIn
        'h1[class*="job-details-jobs-unified-top-card__job-title"]',
        'h1[class*="job-title"]',
        // Indeed
        'h1[data-testid="jobsearch-JobInfoHeader-title"]',
        'h1[class*="jobsearch-JobInfoHeader-title"]',
        // Glassdoor
        'h1[class*="job-title"]',
        // General
        'h1[class*="title"]',
        'h1[class*="job"]',
        '.job-title',
        '.position-title',
        '[data-testid*="title"]',
        'h1',
        '.title',
        // More specific
        '[class*="job-title"]',
        '[class*="position-title"]',
        '[class*="role-title"]',
        // Additional fallbacks
        '[class*="job"] h1',
        '[class*="position"] h1',
        '[class*="role"] h1',
        // Very generic fallbacks
        'h1',
        'h2',
        '.title',
        '[class*="title"]'
    ];

    const companySelectors = [
        // LinkedIn
        '[class*="job-details-jobs-unified-top-card__company-name"]',
        '[class*="company-name"]',
        // Indeed
        '[data-testid="jobsearch-JobInfoHeader-companyName"]',
        '[class*="jobsearch-JobInfoHeader-companyName"]',
        // Glassdoor
        '[class*="company-name"]',
        // General
        '[class*="company"]',
        '[class*="employer"]',
        '.company-name',
        '.employer-name',
        '[data-testid*="company"]',
        '[data-testid*="employer"]',
        // More specific
        '[class*="employer-name"]',
        '[class*="organization-name"]',
        // Additional fallbacks
        '[class*="company"]',
        '[class*="employer"]',
        '[class*="organization"]'
    ];

    const descriptionSelectors = [
        // LinkedIn
        '[class*="job-details-jobs-unified-top-card__job-description"]',
        '[class*="job-description"]',
        // Indeed
        '[data-testid="jobsearch-JobComponent-description"]',
        '[class*="jobsearch-JobComponent-description"]',
        // Glassdoor
        '[class*="job-description"]',
        // General
        '[class*="description"]',
        '[class*="details"]',
        '.job-description',
        '.position-description',
        '[data-testid*="description"]',
        '.description',
        // More specific
        '[class*="job-details"]',
        '[class*="position-details"]',
        '[class*="role-description"]',
        // Additional fallbacks
        '[class*="description"]',
        '[class*="details"]',
        '[class*="content"]'
    ];

    // Try to find job title
    for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            jobInfo.title = element.textContent.trim();
            console.log('Found job title with selector:', selector, jobInfo.title);
            break;
        }
    }

    // Try to find company name
    for (const selector of companySelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            jobInfo.company = element.textContent.trim();
            console.log('Found company with selector:', selector, jobInfo.company);
            break;
        }
    }

    // Try to find job description
    for (const selector of descriptionSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
            jobInfo.description = element.textContent.trim();
            console.log('Found description with selector:', selector, jobInfo.description.substring(0, 100) + '...');
            break;
        }
    }

    // Fallback: try to extract from page title
    if (!jobInfo.title) {
        const pageTitle = document.title;
        if (pageTitle.includes(' - ')) {
            jobInfo.title = pageTitle.split(' - ')[0];
        } else if (pageTitle.includes(' at ')) {
            const parts = pageTitle.split(' at ');
            jobInfo.title = parts[0];
            if (!jobInfo.company && parts[1]) {
                jobInfo.company = parts[1];
            }
        }
    }

    return jobInfo;
}

// Initialize the popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CLGENPopup();
}); 