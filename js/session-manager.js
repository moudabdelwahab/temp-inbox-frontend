/**
 * Session Manager
 * Handles username selection, storage, and email generation
 */

class SessionManager {
    constructor() {
        this.username = null;
        this.email = null;
        this.createdAt = null;
        this.load();
    }

    /**
     * Load session from localStorage
     */
    load() {
        try {
            const storedUsername = getStorageValue(CONFIG.USERNAME_STORAGE_KEY);
            
            if (storedUsername) {
                this.username = storedUsername;
                this.email = this.generateEmail(storedUsername);
                this.createdAt = new Date();
                log(`✅ Session loaded from storage: ${this.username}`);
            } else {
                log('⚠️ No saved username found');
            }
        } catch (error) {
            log(`❌ Error loading session: ${error.message}`, 'error');
        }
    }

    /**
     * Validate username format
     * @param {string} username - Username to validate
     * @returns {object} Validation result {valid: boolean, message: string}
     */
    validateUsername(username) {
        if (!username || typeof username !== 'string') {
            return { valid: false, message: 'اسم المستخدم مطلوب' };
        }

        const trimmed = username.trim();
        
        if (trimmed.length < CONFIG.USERNAME_MIN_LENGTH) {
            return { valid: false, message: `اسم المستخدم يجب أن يكون ${CONFIG.USERNAME_MIN_LENGTH} أحرف على الأقل` };
        }

        if (trimmed.length > CONFIG.USERNAME_MAX_LENGTH) {
            return { valid: false, message: `اسم المستخدم يجب ألا يتجاوز ${CONFIG.USERNAME_MAX_LENGTH} حرف` };
        }

        if (!CONFIG.USERNAME_REGEX.test(trimmed)) {
            return { valid: false, message: 'اسم المستخدم يمكن أن يحتوي على أحرف وأرقام والنقاط والشرطات فقط' };
        }

        return { valid: true, message: 'اسم المستخدم صحيح' };
    }

    /**
     * Set username and create session
     * @param {string} username - Username to set
     * @returns {boolean} Success status
     */
    setUsername(username) {
        try {
            const validation = this.validateUsername(username);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            const trimmed = username.trim().toLowerCase();
            this.username = trimmed;
            this.email = this.generateEmail(trimmed);
            this.createdAt = new Date();
            
            // Store in localStorage
            setStorageValue(
                CONFIG.USERNAME_STORAGE_KEY,
                trimmed,
                CONFIG.SESSION_EXPIRY_HOURS
            );
            
            log(`✅ Username set: ${trimmed}`);
            return true;
        } catch (error) {
            log(`❌ Error setting username: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Generate email address from username
     * @param {string} username - Username
     * @returns {string} Generated email address
     */
    generateEmail(username) {
        return `${username}@${CONFIG.DOMAIN}`;
    }

    /**
     * Get current username
     * @returns {string} Username or null
     */
    getUsername() {
        return this.username;
    }

    /**
     * Get current email
     * @returns {string} Email address or null
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
     * Check if session is active
     * @returns {boolean} True if username is set
     */
    isActive() {
        return this.username !== null && this.email !== null;
    }

    /**
     * Clear session
     */
    clear() {
        try {
            removeStorageValue(CONFIG.USERNAME_STORAGE_KEY);
            this.username = null;
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
            username: this.username,
            email: this.email,
            createdAt: this.createdAt,
            ageInMinutes: this.getAgeInMinutes(),
            isExpired: this.isExpired(),
            isActive: this.isActive(),
            expiryHours: CONFIG.SESSION_EXPIRY_HOURS
        };
    }
}

// Create global instance
const sessionManager = new SessionManager();
