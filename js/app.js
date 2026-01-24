/**
 * Main Application
 * Orchestrates all components and handles initialization
 */

class App {
    constructor() {
        this.initialized = false;
        this.running = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            log('🚀 Starting Temp Inbox application...');

            // Step 1: Initialize session
            this.initializeSession();

            // Step 2: Update UI with session info
            uiManager.updateEmailDisplay();

            // Step 3: Initialize email manager
            await this.initializeEmailManager();

            // Step 4: Setup auto-refresh
            this.setupAutoRefresh();

            this.initialized = true;
            this.running = true;

            log('✅ Application initialized successfully');
            uiManager.showToast('مرحبًا بك في Temp Inbox! 👋', 'success');
        } catch (error) {
            log(`❌ Application initialization failed: ${error.message}`, 'error');
            uiManager.showErrorState(error);
            uiManager.showToast('فشل تحميل التطبيق ❌', 'error');
        }
    }

    /**
     * Initialize session
     */
    initializeSession() {
        try {
            const sessionId = sessionManager.getSessionId();
            const email = sessionManager.getEmail();

            if (!sessionId || !email) {
                throw new Error('Failed to initialize session');
            }

            log(`✅ Session initialized: ${sessionId}`);
        } catch (error) {
            log(`❌ Session initialization failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Initialize email manager
     */
    async initializeEmailManager() {
        try {
            // Test Supabase connection first
            const isConnected = await supabaseClient.testConnection();
            
            if (!isConnected) {
                log('⚠️ Supabase connection failed, but continuing with limited functionality');
            }

            // Initialize email manager with callbacks
            await emailManager.initialize(
                (emails) => this.handleEmailsUpdate(emails),
                (error) => this.handleEmailsError(error)
            );

            log('✅ Email manager initialized');
        } catch (error) {
            log(`❌ Email manager initialization failed: ${error.message}`, 'error');
            // Don't throw - allow app to continue with limited functionality
        }
    }

    /**
     * Handle emails update
     * @param {Array} emails - Updated emails
     */
    handleEmailsUpdate(emails) {
        try {
            uiManager.updateEmailsList(emails);
            emailManager.clearError();
        } catch (error) {
            log(`❌ Error handling emails update: ${error.message}`, 'error');
        }
    }

    /**
     * Handle emails error
     * @param {Error} error - Error object
     */
    handleEmailsError(error) {
        try {
            log(`❌ Email manager error: ${error.message}`, 'error');
            uiManager.showErrorState(error);
        } catch (err) {
            log(`❌ Error handling email error: ${err.message}`, 'error');
        }
    }

    /**
     * Setup auto-refresh
     */
    setupAutoRefresh() {
        try {
            // Update session info every minute
            setInterval(() => {
                uiManager.updateEmailDisplay();
            }, 60000);

            log('✅ Auto-refresh setup complete');
        } catch (error) {
            log(`❌ Error setting up auto-refresh: ${error.message}`, 'error');
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            log('🧹 Cleaning up resources...');

            this.running = false;

            // Cleanup email manager
            await emailManager.cleanup();

            // Clear session if needed
            // sessionManager.clear();

            log('✅ Cleanup complete');
        } catch (error) {
            log(`❌ Error during cleanup: ${error.message}`, 'error');
        }
    }

    /**
     * Get app status
     * @returns {object} App status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            running: this.running,
            session: sessionManager.getInfo(),
            emails: emailManager.getStats()
        };
    }
}

// Create global app instance
const app = new App();

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app.init();
    });
} else {
    app.init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', async () => {
    await app.cleanup();
});

// Expose app for debugging
window.TempInboxApp = {
    app,
    sessionManager,
    emailManager,
    supabaseClient,
    uiManager,
    getStatus: () => app.getStatus(),
    getEmails: () => emailManager.getEmails(),
    getSession: () => sessionManager.getInfo(),
    copyEmail: () => uiManager.handleCopyEmail(),
    refreshSession: () => uiManager.handleRefreshSession(),
    refreshInbox: () => uiManager.handleRefreshInbox(),
    log: (msg) => log(msg)
};

log('✅ App.js loaded successfully');
