/**
 * Session Manager
 * Handles session creation, storage, and email generation
 */

class SessionManager {
    constructor() {
        this.sessionId = null;
        this.email = null;
        this.createdAt = null;
        this.load();
    }

    /**
     * Load session from localStorage
     */
    load() {
        try {
            const storedSessionId = getStorageValue(CONFIG.SESSION_STORAGE_KEY);
            
            if (storedSessionId) {
                this.sessionId = storedSessionId;
                this.email = this.generateEmail(storedSessionId);
                this.createdAt = new Date();
                log(`✅ Session loaded from storage: ${this.sessionId}`);
            } else {
                this.create();
            }
        } catch (error) {
            log(`❌ Error loading session: ${error.message}`, 'error');
            this.create();
        }
    }

    /**
     * Create a new session
     */
    create() {
        try {
            this.sessionId = generateUUID();
            this.email = this.generateEmail(this.sessionId);
            this.createdAt = new Date();
            
            // Store in localStorage with expiry
            setStorageValue(
                CONFIG.SESSION_STORAGE_KEY,
                this.sessionId,
                CONFIG.SESSION_EXPIRY_HOURS
            );
            
            log(`✅ New session created: ${this.sessionId}`);
        } catch (error) {
            log(`❌ Error creating session: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Generate email address from session ID
     * @param {string} sessionId - Session ID
     * @returns {string} Generated email address
     */
    generateEmail(sessionId) {
        const shortId = sessionId.substring(0, 8).toUpperCase();
        const [localPart, domain] = CONFIG.GMAIL_BASE_EMAIL.split('@');
        return `${localPart}+${shortId}@${domain}`;
    }

    /**
     * Get current session ID
     * @returns {string} Session ID
     */
    getSessionId() {
        return this.sessionId;
    }

    /**
     * Get current email
     * @returns {string} Email address
     */
    getEmail() {
        return this.email;
    }

    /**
     * Get session creation time
     * @returns {Date} Creation time
     */
    getCreatedAt() {
        return this.createdAt;
    }

    /**
     * Get session age in minutes
     * @returns {number} Age in minutes
     */
    getAgeInMinutes() {
        if (!this.createdAt) return 0;
        return Math.floor((new Date() - this.createdAt) / 60000);
    }

    /**
     * Check if session is expired
     * @returns {boolean} True if expired
     */
    isExpired() {
        return this.getAgeInMinutes() > (CONFIG.SESSION_EXPIRY_HOURS * 60);
    }

    /**
     * Regenerate session (create new one)
     */
    regenerate() {
        try {
            removeStorageValue(CONFIG.SESSION_STORAGE_KEY);
            this.create();
            log('✅ Session regenerated');
        } catch (error) {
            log(`❌ Error regenerating session: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Clear session
     */
    clear() {
        try {
            removeStorageValue(CONFIG.SESSION_STORAGE_KEY);
            this.sessionId = null;
            this.email = null;
            this.createdAt = null;
            log('✅ Session cleared');
        } catch (error) {
            log(`❌ Error clearing session: ${error.message}`, 'error');
        }
    }

    /**
     * Get session info
     * @returns {object} Session information
     */
    getInfo() {
        return {
            sessionId: this.sessionId,
            email: this.email,
            createdAt: this.createdAt,
            ageInMinutes: this.getAgeInMinutes(),
            isExpired: this.isExpired(),
            expiryHours: CONFIG.SESSION_EXPIRY_HOURS
        };
    }
}

// Create global instance
const sessionManager = new SessionManager();
