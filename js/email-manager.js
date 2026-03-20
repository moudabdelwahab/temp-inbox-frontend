/**
 * Email Manager
 * Handles email fetching, caching, and real-time updates
 */

class EmailManager {
    constructor() {
        this.emails = [];
        this.selectedEmailId = null;
        this.isLoading = false;
        this.error = null;
        this.pollingInterval = null;
        this.unsubscribe = null;
        this.lastFetchTime = null;
        this.cacheTimeout = 2000; // 2 seconds
    }

    /**
     * Initialize email manager
     * @param {Function} onEmailsUpdate - Callback when emails update
     * @param {Function} onError - Callback on error
     */
    async initialize(onEmailsUpdate, onError) {
        try {
            log('🚀 Initializing email manager...');
            
            // First, try to fetch emails
            await this.fetchEmails(onEmailsUpdate);
            
            // Then, setup real-time subscription if available
            this.setupRealtimeSubscription(onEmailsUpdate, onError);
            
            // Fallback to polling if real-time fails
            this.setupPolling(onEmailsUpdate, onError);
            
            log('✅ Email manager initialized');
        } catch (error) {
            log(`❌ Error initializing email manager: ${error.message}`, 'error');
            if (onError) onError(error);
        }
    }

    /**
     * Fetch emails from Supabase
     * @param {Function} onSuccess - Callback on success
     * @returns {Promise<Array>} Array of emails
     */
    async fetchEmails(onSuccess) {
        try {
            // Prevent rapid consecutive fetches
            if (this.lastFetchTime && (Date.now() - this.lastFetchTime) < this.cacheTimeout) {
                return this.emails;
            }

            this.isLoading = true;
            this.error = null;
            this.lastFetchTime = Date.now();

            const email = sessionManager.getEmail();
            if (!email) {
                throw new Error('No active session - please select a username');
            }

            // Ensure Supabase is initialized
            const initialized = await supabaseClient.ensureInitialized();
            if (!initialized) {
                throw new Error('Supabase client failed to initialize');
            }

            const emails = await supabaseClient.fetchEmails(email);
            this.emails = emails;
            this.isLoading = false;

            if (onSuccess) {
                onSuccess(this.emails);
            }

            return this.emails;
        } catch (error) {
            this.isLoading = false;
            this.error = error;
            log(`❌ Error fetching emails: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Setup real-time subscription
     * @param {Function} onUpdate - Callback on update
     * @param {Function} onError - Callback on error
     */
    async setupRealtimeSubscription(onUpdate, onError) {
        try {
            const initialized = await supabaseClient.ensureInitialized();
            if (!initialized) {
                log('⚠️ Supabase not initialized, skipping real-time subscription');
                return;
            }

            const email = sessionManager.getEmail();
            if (!email) {
                log('⚠️ No active session, skipping real-time subscription');
                return;
            }
            
            this.unsubscribe = await supabaseClient.subscribeToEmails(
                email,
                (payload) => {
                    log(`📬 Real-time update: ${payload.eventType}`);
                    this.fetchEmails(onUpdate);
                }
            );

            log('✅ Real-time subscription setup');
        } catch (error) {
            log(`⚠️ Real-time subscription failed: ${error.message}`, 'warn');
            // Continue with polling as fallback
        }
    }

    /**
     * Setup polling for email updates
     * @param {Function} onUpdate - Callback on update
     * @param {Function} onError - Callback on error
     */
    setupPolling(onUpdate, onError) {
        try {
            // Clear existing polling
            if (this.pollingInterval) {
                clearInterval(this.pollingInterval);
            }

            let pollCount = 0;
            const maxPollsWithoutChange = 12; // Stop polling after 1 minute of no changes

            this.pollingInterval = setInterval(async () => {
                try {
                    const oldEmailCount = this.emails.length;
                    await this.fetchEmails(onUpdate);
                    
                    if (this.emails.length > oldEmailCount) {
                        pollCount = 0; // Reset counter on new emails
                    } else {
                        pollCount++;
                    }

                    // Adaptive polling: slow down if no new emails
                    if (pollCount > maxPollsWithoutChange) {
                        log('⏸️ Pausing polling - no new emails');
                        this.pausePolling();
                    }
                } catch (error) {
                    log(`❌ Polling error: ${error.message}`, 'error');
                    if (onError) onError(error);
                }
            }, CONFIG.POLLING_INTERVAL);

            log(`✅ Polling setup (interval: ${CONFIG.POLLING_INTERVAL}ms)`);
        } catch (error) {
            log(`❌ Error setting up polling: ${error.message}`, 'error');
            if (onError) onError(error);
        }
    }

    /**
     * Pause polling
     */
    pausePolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            log('⏸️ Polling paused');
        }
    }

    /**
     * Resume polling
     * @param {Function} onUpdate - Callback on update
     * @param {Function} onError - Callback on error
     */
    resumePolling(onUpdate, onError) {
        if (!this.pollingInterval) {
            this.setupPolling(onUpdate, onError);
            log('▶️ Polling resumed');
        }
    }

    /**
     * Get all emails
     * @returns {Array} Array of emails
     */
    getEmails() {
        return this.emails;
    }

    /**
     * Get email by ID
     * @param {string} emailId - Email ID
     * @returns {object} Email object or null
     */
    getEmailById(emailId) {
        return this.emails.find(email => email.id === emailId) || null;
    }

    /**
     * Select an email
     * @param {string} emailId - Email ID
     */
    selectEmail(emailId) {
        this.selectedEmailId = emailId;
        log(`✅ Email selected: ${emailId}`);
    }

    /**
     * Get selected email
     * @returns {object} Selected email or null
     */
    getSelectedEmail() {
        if (!this.selectedEmailId) return null;
        return this.getEmailById(this.selectedEmailId);
    }

    /**
     * Clear selected email
     */
    clearSelection() {
        this.selectedEmailId = null;
    }

    /**
     * Check if loading
     * @returns {boolean}
     */
    isLoadingEmails() {
        return this.isLoading;
    }

    /**
     * Get error
     * @returns {Error|null}
     */
    getError() {
        return this.error;
    }

    /**
     * Clear error
     */
    clearError() {
        this.error = null;
    }

    /**
     * Get stats
     * @returns {object} Email manager stats
     */
    getStats() {
        return {
            totalEmails: this.emails.length,
            isLoading: this.isLoading,
            hasError: this.error !== null,
            selectedEmailId: this.selectedEmailId
        };
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            this.pausePolling();
            if (this.unsubscribe) {
                this.unsubscribe();
            }
            this.emails = [];
            this.selectedEmailId = null;
            log('✅ Email manager cleaned up');
        } catch (error) {
            log(`❌ Error during cleanup: ${error.message}`, 'error');
        }
    }
}

// Create global instance
const emailManager = new EmailManager();

log('✅ EmailManager.js loaded successfully');
