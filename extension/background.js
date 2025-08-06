// CLGEN Background Service Worker
// This script runs in the background and handles extension-wide functionality

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('CLGEN extension installed successfully!');
        
        // Set default storage values
        chrome.storage.local.set({
            resumeUploaded: false,
            jobInfo: null,
            extensionInstalled: true
        });
    }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'jobPageDetected':
            handleJobPageDetected(request.jobInfo, sender.tab);
            break;
        case 'getJobInfo':
            handleGetJobInfo(sendResponse);
            break;
        case 'clearData':
            handleClearData(sendResponse);
            break;
        default:
            console.log('Unknown message action:', request.action);
    }
    
    // Return true to indicate we will send a response asynchronously
    return true;
});

// Handle job page detection
function handleJobPageDetected(jobInfo, tab) {
    console.log('Job page detected:', jobInfo);
    
    // Store the job information
    chrome.storage.local.set({ jobInfo: jobInfo });
    
    // Update the extension badge to show job detected
    if (tab && tab.id) {
        chrome.action.setBadgeText({
            text: 'JOB',
            tabId: tab.id
        });
        chrome.action.setBadgeBackgroundColor({
            color: '#4CAF50',
            tabId: tab.id
        });
    }
}

// Handle get job info request
async function handleGetJobInfo(sendResponse) {
    try {
        const result = await chrome.storage.local.get(['jobInfo']);
        sendResponse({ success: true, jobInfo: result.jobInfo });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

// Handle clear data request
async function handleClearData(sendResponse) {
    try {
        await chrome.storage.local.clear();
        sendResponse({ success: true });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

// Listen for tab updates to clear badges when leaving job pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Check if the current page is a job page
        const isJobPage = isJobListingPage(tab.url);
        
        if (!isJobPage) {
            // Clear the badge if not on a job page
            chrome.action.setBadgeText({
                text: '',
                tabId: tabId
            });
        }
    }
});

// Function to determine if a URL is likely a job listing page
function isJobListingPage(url) {
    const jobKeywords = [
        'job', 'career', 'position', 'opening', 'opportunity',
        'employment', 'work', 'hire', 'recruit', 'apply'
    ];
    
    const urlLower = url.toLowerCase();
    
    // Check for job-related keywords in the URL
    return jobKeywords.some(keyword => urlLower.includes(keyword));
}

// Handle extension icon click (optional - for future features)
chrome.action.onClicked.addListener((tab) => {
    // This will only trigger if there's no popup defined in manifest
    // For now, we're using a popup, so this won't be called
    console.log('Extension icon clicked on tab:', tab.id);
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        console.log('Storage changed:', changes);
        
        // Handle resume upload status changes
        if (changes.resumeUploaded) {
            console.log('Resume upload status:', changes.resumeUploaded.newValue);
        }
        
        // Handle job info changes
        if (changes.jobInfo) {
            console.log('Job info updated:', changes.jobInfo.newValue);
        }
    }
});

// Handle errors
chrome.runtime.onSuspend.addListener(() => {
    console.log('CLGEN extension is being suspended');
}); 