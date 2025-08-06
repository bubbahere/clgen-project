// CLGEN Content Script
// This script runs on web pages to scrape job information

(function() {
    'use strict';

    // Listen for messages from the popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'scrapeJobInfo') {
            const jobInfo = scrapeJobInfo();
            sendResponse(jobInfo);
        }
    });

    // Function to scrape job information from the current page
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
                const parts = pageTitle.split(' - ');
                jobInfo.title = parts[0].trim();
                if (!jobInfo.company && parts.length > 1) {
                    jobInfo.company = parts[1].trim();
                }
            } else if (pageTitle.includes(' at ')) {
                const parts = pageTitle.split(' at ');
                jobInfo.title = parts[0].trim();
                if (!jobInfo.company && parts.length > 1) {
                    jobInfo.company = parts[1].trim();
                }
            } else if (pageTitle.includes(' | ')) {
                const parts = pageTitle.split(' | ');
                jobInfo.title = parts[0].trim();
                if (!jobInfo.company && parts.length > 1) {
                    jobInfo.company = parts[1].trim();
                }
            }
        }

        // Additional fallback: try to find company in meta tags
        if (!jobInfo.company) {
            const metaCompany = document.querySelector('meta[property="og:site_name"]');
            if (metaCompany) {
                jobInfo.company = metaCompany.getAttribute('content');
            }
        }

        // Clean up the extracted text
        jobInfo.title = cleanText(jobInfo.title);
        jobInfo.company = cleanText(jobInfo.company);
        jobInfo.description = cleanText(jobInfo.description);

        return jobInfo;
    }

    // Function to clean extracted text
    function cleanText(text) {
        if (!text) return '';
        
        return text
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/\n+/g, ' ') // Replace newlines with spaces
            .replace(/\t+/g, ' ') // Replace tabs with spaces
            .trim();
    }

    // Auto-detect job pages and notify the extension
    function detectJobPage() {
        const jobInfo = scrapeJobInfo();
        
        // If we found meaningful job information, notify the extension
        if (jobInfo.title || jobInfo.company) {
            chrome.runtime.sendMessage({
                action: 'jobPageDetected',
                jobInfo: jobInfo
            });
        }
    }

    // Run detection when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', detectJobPage);
    } else {
        detectJobPage();
    }

    // Also run detection when URL changes (for SPA sites)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(detectJobPage, 1000); // Wait for page to load
        }
    }).observe(document, { subtree: true, childList: true });

})(); 