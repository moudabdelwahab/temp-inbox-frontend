/**
 * UI Manager
 * Handles all DOM updates and user interactions
 */

class UIManager {
    constructor() {
        this.elements = this.cacheElements();
        this.attachEventListeners();
    }

    /**
     * Cache DOM elements for performance
     * @returns {object} Cached elements
     */
    cacheElements() {
        return {
            // Email display
            emailInput: document.getElementById('emailInput'),
            selectBtn: document.getElementById('selectBtn'),
            copyBtn: document.getElementById('copyBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            sessionInfo: document.getElementById('sessionInfo'),
            
            // Inbox
            refreshInboxBtn: document.getElementById('refreshInboxBtn'),
            emailsList: document.getElementById('emailsList'),
            
            // States
            loadingState: document.getElementById('loadingState'),
            emptyState: document.getElementById('emptyState'),
            errorState: document.getElementById('errorState'),
            errorDetails: document.getElementById('errorDetails'),
            retryBtn: document.getElementById('retryBtn'),
            
            // Viewer
            viewerEmpty: document.getElementById('viewerEmpty'),
            viewerContent: document.getElementById('viewerContent'),
            closeViewerBtn: document.getElementById('closeViewerBtn'),
            viewerFrom: document.getElementById('viewerFrom'),
            viewerTo: document.getElementById('viewerTo'),
            viewerSubject: document.getElementById('viewerSubject'),
            viewerTime: document.getElementById('viewerTime'),
            viewerBody: document.getElementById('viewerBody'),
            
            // Toast
            toast: document.getElementById('toast')
        };
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Email display buttons
        this.elements.selectBtn.addEventListener('click', () => this.handleSelectUsername());
        this.elements.copyBtn.addEventListener('click', () => this.handleCopyEmail());
        this.elements.refreshBtn.addEventListener('click', () => this.handleRefreshSession());
        this.elements.refreshInboxBtn.addEventListener('click', () => this.handleRefreshInbox());
        this.elements.retryBtn.addEventListener('click', () => this.handleRetry());
        this.elements.closeViewerBtn.addEventListener('click', () => this.handleCloseViewer());
        
        // Email input - allow editing
        this.elements.emailInput.addEventListener('focus', () => this.handleEmailInputFocus());
        this.elements.emailInput.addEventListener('keypress', (e) => this.handleEmailInputKeypress(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        log('✅ Event listeners attached');
    }

    /**
     * Handle email input focus - make it editable
     */
    handleEmailInputFocus() {
        this.elements.emailInput.select();
    }

    /**
     * Handle email input keypress
     */
    handleEmailInputKeypress(e) {
        if (e.key === 'Enter') {
            this.handleSelectUsername();
        } else if (e.key === 'Escape') {
            this.elements.emailInput.blur();
        }
    }

    /**
     * Handle select username button click - validate and set username
     */
    async handleSelectUsername() {
        try {
            const input = this.elements.emailInput.value.trim();
            
            if (!input) {
                this.showToast('يرجى إدخال اسم مستخدم ❌', 'error');
                this.elements.emailInput.focus();
                return;
            }

            // Extract username from email if full email was entered
            let username = input;
            if (input.includes('@')) {
                username = input.split('@')[0];
            }

            // Validate and set username
            sessionManager.setUsername(username);
            this.updateEmailDisplay();
            this.showToast('تم اختيار اسم المستخدم بنجاح! ✅', 'success');
            
            // Initialize email manager after setting username
            if (app && app.initializeEmailManager) {
                await app.initializeEmailManager();
            }
            
            log(`✅ Username selected: ${username}`);
        } catch (error) {
            this.showToast(`خطأ: ${error.message} ❌`, 'error');
            log(`❌ Error setting username: ${error.message}`, 'error');
        }
    }

    /**
     * Handle copy email button click
     */
    async handleCopyEmail() {
        try {
            const email = sessionManager.getEmail();
            if (!email) {
                this.showToast('يرجى اختيار اسم مستخدم أولاً ❌', 'error');
                return;
            }
            
            await copyToClipboard(email);
            this.showToast('تم نسخ الإيميل بنجاح! ✅', 'success');
            log('✅ Email copied to clipboard');
        } catch (error) {
            this.showToast('فشل نسخ الإيميل ❌', 'error');
            log(`❌ Error copying email: ${error.message}`, 'error');
        }
    }

    /**
     * Handle refresh session button click - clear username and start fresh
     */
    handleRefreshSession() {
        try {
            sessionManager.clear();
            emailManager.emails = [];
            this.updateEmailDisplay();
            this.clearEmailViewer();
            this.showEmptyState();
            this.showToast('تم مسح اسم المستخدم. اختر اسماً جديداً! 🔄', 'success');
            this.elements.emailInput.focus();
            log('✅ Session cleared');
        } catch (error) {
            this.showToast('فشل مسح الجلسة ❌', 'error');
            log(`❌ Error clearing session: ${error.message}`, 'error');
        }
    }

    /**
     * Handle refresh inbox button click
     */
    async handleRefreshInbox() {
        try {
            const email = sessionManager.getEmail();
            if (!email) {
                this.showToast('يرجى اختيار اسم مستخدم أولاً ❌', 'error');
                return;
            }
            
            this.showLoadingState();
            await emailManager.fetchEmails((emails) => {
                this.updateEmailsList(emails);
            });
            this.showToast('تم تحديث صندوق الوارد ✅', 'success');
        } catch (error) {
            this.showErrorState(error);
            this.showToast('فشل تحديث صندوق الوارد ❌', 'error');
        }
    }

    /**
     * Handle retry button click
     */
    handleRetry() {
        this.handleRefreshInbox();
    }

    /**
     * Handle close viewer button click
     */
    handleCloseViewer() {
        this.clearEmailViewer();
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + C: Copy email (only if not in input)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && document.activeElement !== this.elements.emailInput) {
            e.preventDefault();
            this.handleCopyEmail();
        }

        // Ctrl/Cmd + R: Refresh inbox
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            this.handleRefreshInbox();
        }

        // Escape: Close viewer
        if (e.key === 'Escape') {
            this.handleCloseViewer();
        }
    }

    /**
     * Update email display
     */
    updateEmailDisplay() {
        try {
            const email = sessionManager.getEmail();
            const info = sessionManager.getInfo();

            if (email) {
                this.elements.emailInput.value = email.split('@')[0];
                this.elements.sessionInfo.textContent = `البريد الإلكتروني: ${email}`;
            } else {
                this.elements.emailInput.value = '';
                this.elements.emailInput.placeholder = 'اكتب اسم مستخدم...';
                this.elements.sessionInfo.textContent = 'لم يتم اختيار اسم مستخدم بعد';
            }

            log('✅ Email display updated');
        } catch (error) {
            log(`❌ Error updating email display: ${error.message}`, 'error');
        }
    }

    /**
     * Update emails list
     * @param {Array} emails - Array of emails
     */
    updateEmailsList(emails) {
        try {
            if (!emails || emails.length === 0) {
                this.showEmptyState();
                return;
            }

            this.elements.emailsList.innerHTML = '';

            emails.forEach(email => {
                const emailItem = this.createEmailItem(email);
                this.elements.emailsList.appendChild(emailItem);
            });

            this.showEmailsList();
            log(`✅ Updated emails list with ${emails.length} emails`);
        } catch (error) {
            log(`❌ Error updating emails list: ${error.message}`, 'error');
            this.showErrorState(error);
        }
    }

    /**
     * Create email item element
     * @param {object} email - Email object
     * @returns {HTMLElement} Email item element
     */
    createEmailItem(email) {
        const item = document.createElement('div');
        item.className = 'email-item';
        item.dataset.emailId = email.id;

        const from = escapeHTML(email.sender || 'Unknown');
        const subject = escapeHTML(email.body ? email.body.substring(0, 50) : '(No Subject)');
        const time = formatDateTime(email.created_at);

        item.innerHTML = `
            <div class="email-from">${from}</div>
            <div class="email-subject">${subject}</div>
            <div class="email-time">${time}</div>
        `;

        item.addEventListener('click', () => this.handleSelectEmail(email));

        return item;
    }

    /**
     * Handle select email
     * @param {object} email - Email object
     */
    handleSelectEmail(email) {
        try {
            // Update active state
            document.querySelectorAll('.email-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[data-email-id="${email.id}"]`).classList.add('active');

            // Update manager
            emailManager.selectEmail(email.id);

            // Display email content
            this.displayEmailContent(email);

            log(`✅ Email selected: ${email.id}`);
        } catch (error) {
            log(`❌ Error selecting email: ${error.message}`, 'error');
        }
    }

    /**
     * Display email content
     * @param {object} email - Email object
     */
    displayEmailContent(email) {
        try {
            // Update viewer content
            this.elements.viewerFrom.textContent = escapeHTML(email.sender || 'Unknown');
            this.elements.viewerTo.textContent = escapeHTML(sessionManager.getEmail() || 'Unknown');
            this.elements.viewerSubject.textContent = escapeHTML(email.subject || '(No Subject)');
            this.elements.viewerTime.textContent = formatDateTime(email.created_at);
            
            // Sanitize and display body
            const sanitizedBody = sanitizeHTML(email.body || '');
            this.elements.viewerBody.innerHTML = sanitizedBody;

            // Show viewer content, hide empty state
            this.elements.viewerEmpty.style.display = 'none';
            this.elements.viewerContent.style.display = 'flex';
            this.elements.closeViewerBtn.style.display = 'flex';

            log('✅ Email content displayed');
        } catch (error) {
            log(`❌ Error displaying email content: ${error.message}`, 'error');
            this.showToast('فشل عرض محتوى الإيميل ❌', 'error');
        }
    }

    /**
     * Clear email viewer
     */
    clearEmailViewer() {
        try {
            this.elements.viewerEmpty.style.display = 'flex';
            this.elements.viewerContent.style.display = 'none';
            this.elements.closeViewerBtn.style.display = 'none';
            
            document.querySelectorAll('.email-item').forEach(item => {
                item.classList.remove('active');
            });

            log('✅ Email viewer cleared');
        } catch (error) {
            log(`❌ Error clearing email viewer: ${error.message}`, 'error');
        }
    }

    /**
     * Show emails list
     */
    showEmailsList() {
        try {
            this.elements.loadingState.style.display = 'none';
            this.elements.emptyState.style.display = 'none';
            this.elements.errorState.style.display = 'none';
            this.elements.emailsList.style.display = 'flex';
            log('✅ Emails list shown');
        } catch (error) {
            log(`❌ Error showing emails list: ${error.message}`, 'error');
        }
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        try {
            this.elements.loadingState.style.display = 'none';
            this.elements.emailsList.style.display = 'none';
            this.elements.errorState.style.display = 'none';
            this.elements.emptyState.style.display = 'flex';
            log('✅ Empty state shown');
        } catch (error) {
            log(`❌ Error showing empty state: ${error.message}`, 'error');
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        try {
            this.elements.emailsList.style.display = 'none';
            this.elements.emptyState.style.display = 'none';
            this.elements.errorState.style.display = 'none';
            this.elements.loadingState.style.display = 'flex';
            log('✅ Loading state shown');
        } catch (error) {
            log(`❌ Error showing loading state: ${error.message}`, 'error');
        }
    }

    /**
     * Show error state
     * @param {Error} error - Error object
     */
    showErrorState(error) {
        try {
            this.elements.loadingState.style.display = 'none';
            this.elements.emailsList.style.display = 'none';
            this.elements.emptyState.style.display = 'none';
            this.elements.errorState.style.display = 'flex';
            this.elements.errorDetails.textContent = error.message || 'حدث خطأ غير معروف';
            log('✅ Error state shown');
        } catch (error) {
            log(`❌ Error showing error state: ${error.message}`, 'error');
        }
    }

    /**
     * Show toast notification
     * @param {string} message - Toast message
     * @param {string} type - Toast type (success, error, warning)
     */
    showToast(message, type = 'info') {
        try {
            this.elements.toast.textContent = message;
            this.elements.toast.className = `toast show ${type}`;

            setTimeout(() => {
                this.elements.toast.classList.remove('show');
            }, CONFIG.TOAST_DURATION);

            log(`✅ Toast shown: ${message}`);
        } catch (error) {
            log(`❌ Error showing toast: ${error.message}`, 'error');
        }
    }
}

// Create global instance
const uiManager = new UIManager();

log('✅ UIManager.js loaded successfully');
