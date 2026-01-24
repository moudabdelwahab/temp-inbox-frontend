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
        this.elements.copyBtn.addEventListener('click', () => this.handleCopyEmail());
        this.elements.refreshBtn.addEventListener('click', () => this.handleRefreshSession());
        this.elements.refreshInboxBtn.addEventListener('click', () => this.handleRefreshInbox());
        this.elements.retryBtn.addEventListener('click', () => this.handleRetry());
        this.elements.closeViewerBtn.addEventListener('click', () => this.handleCloseViewer());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        log('✅ Event listeners attached');
    }

    /**
     * Handle copy email button click
     */
    async handleCopyEmail() {
        try {
            const email = sessionManager.getEmail();
            await copyToClipboard(email);
            this.showToast('تم نسخ الإيميل بنجاح! ✅', 'success');
            log('✅ Email copied to clipboard');
        } catch (error) {
            this.showToast('فشل نسخ الإيميل ❌', 'error');
            log(`❌ Error copying email: ${error.message}`, 'error');
        }
    }

    /**
     * Handle refresh session button click
     */
    handleRefreshSession() {
        try {
            sessionManager.regenerate();
            this.updateEmailDisplay();
            this.clearEmailViewer();
            this.showToast('تم توليد إيميل جديد! 🔄', 'success');
            log('✅ Session refreshed');
        } catch (error) {
            this.showToast('فشل توليد إيميل جديد ❌', 'error');
            log(`❌ Error refreshing session: ${error.message}`, 'error');
        }
    }

    /**
     * Handle refresh inbox button click
     */
    async handleRefreshInbox() {
        try {
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
        // Ctrl/Cmd + C: Copy email
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && document.activeElement === this.elements.emailInput) {
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

            this.elements.emailInput.value = email;
            
            const ageText = info.ageInMinutes > 0 
                ? `قبل ${info.ageInMinutes} دقيقة`
                : 'الآن';
            
            this.elements.sessionInfo.textContent = `معرّف الجلسة: ${info.sessionId.substring(0, 8)}... | العمر: ${ageText}`;

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

        const from = escapeHTML(email.from_email || 'Unknown');
        const subject = escapeHTML(email.subject || '(No Subject)');
        const time = formatDateTime(email.received_at);

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
            this.elements.viewerFrom.textContent = escapeHTML(email.from_email || 'Unknown');
            this.elements.viewerTo.textContent = escapeHTML(email.to_email || 'Unknown');
            this.elements.viewerSubject.textContent = escapeHTML(email.subject || '(No Subject)');
            this.elements.viewerTime.textContent = formatDateTime(email.received_at);

            // Display body content
            let bodyContent = '';
            if (email.body_html) {
                bodyContent = sanitizeHTML(email.body_html);
            } else if (email.body_text) {
                bodyContent = `<pre>${escapeHTML(email.body_text)}</pre>`;
            } else {
                bodyContent = '<p>No content available</p>';
            }

            this.elements.viewerBody.innerHTML = bodyContent;

            // Show viewer
            this.elements.viewerEmpty.style.display = 'none';
            this.elements.viewerContent.style.display = 'flex';
            this.elements.closeViewerBtn.style.display = 'block';

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
            document.querySelectorAll('.email-item').forEach(item => {
                item.classList.remove('active');
            });

            emailManager.clearSelection();
            this.elements.viewerEmpty.style.display = 'flex';
            this.elements.viewerContent.style.display = 'none';
            this.elements.closeViewerBtn.style.display = 'none';

            log('✅ Email viewer cleared');
        } catch (error) {
            log(`❌ Error clearing viewer: ${error.message}`, 'error');
        }
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        this.elements.loadingState.style.display = 'flex';
        this.elements.emptyState.style.display = 'none';
        this.elements.errorState.style.display = 'none';
        this.elements.emailsList.style.display = 'none';
    }

    /**
     * Show empty state
     */
    showEmptyState() {
        this.elements.loadingState.style.display = 'none';
        this.elements.emptyState.style.display = 'flex';
        this.elements.errorState.style.display = 'none';
        this.elements.emailsList.style.display = 'none';
    }

    /**
     * Show error state
     * @param {Error} error - Error object
     */
    showErrorState(error) {
        this.elements.loadingState.style.display = 'none';
        this.elements.emptyState.style.display = 'none';
        this.elements.errorState.style.display = 'flex';
        this.elements.emailsList.style.display = 'none';
        this.elements.errorDetails.textContent = error.message || 'حدث خطأ غير معروف';
    }

    /**
     * Show emails list
     */
    showEmailsList() {
        this.elements.loadingState.style.display = 'none';
        this.elements.emptyState.style.display = 'none';
        this.elements.errorState.style.display = 'none';
        this.elements.emailsList.style.display = 'flex';
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Toast type (success, error, warning)
     */
    showToast(message, type = 'info') {
        try {
            this.elements.toast.textContent = message;
            this.elements.toast.className = `toast show ${type}`;

            setTimeout(() => {
                this.elements.toast.classList.remove('show');
            }, CONFIG.TOAST_DURATION);
        } catch (error) {
            log(`❌ Error showing toast: ${error.message}`, 'error');
        }
    }

    /**
     * Disable buttons
     */
    disableButtons() {
        this.elements.copyBtn.disabled = true;
        this.elements.refreshBtn.disabled = true;
        this.elements.refreshInboxBtn.disabled = true;
    }

    /**
     * Enable buttons
     */
    enableButtons() {
        this.elements.copyBtn.disabled = false;
        this.elements.refreshBtn.disabled = false;
        this.elements.refreshInboxBtn.disabled = false;
    }
}

// Create global instance
const uiManager = new UIManager();
