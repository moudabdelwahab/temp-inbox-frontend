/**
 * Utility Functions
 * Helper functions for common operations
 */

/**
 * Generate a random UUID v4
 * @returns {string} UUID v4 string
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Generate a random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
function generateRandomString(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<void>}
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
        return Promise.resolve();
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return Promise.reject(error);
    }
}

/**
 * Format date and time
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date and time
 */
function formatDateTime(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'الآن';
        } else if (diffMins < 60) {
            return `قبل ${diffMins} دقيقة`;
        } else if (diffHours < 24) {
            return `قبل ${diffHours} ساعة`;
        } else if (diffDays < 7) {
            return `قبل ${diffDays} يوم`;
        } else {
            return date.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'وقت غير معروف';
    }
}

/**
 * Sanitize HTML content using DOMPurify
 * @param {string} htmlContent - HTML content to sanitize
 * @returns {string} Sanitized HTML
 */
function sanitizeHTML(htmlContent) {
    if (!window.DOMPurify) {
        console.warn('DOMPurify not loaded, returning text content');
        return escapeHTML(htmlContent);
    }
    
    const config = {
        ALLOWED_TAGS: [
            'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
            'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'div', 'span',
            'hr', 'section', 'article', 'header', 'footer', 'nav'
        ],
        ALLOWED_ATTR: [
            'href', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height',
            'class', 'id', 'style', 'data-*'
        ],
        KEEP_CONTENT: true,
        FORCE_BODY: false,
    };
    
    return DOMPurify.sanitize(htmlContent, config);
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHTML(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 50) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Check if email is valid
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Get stored value from localStorage with expiry check
 * @param {string} key - Storage key
 * @returns {any} Stored value or null
 */
function getStorageValue(key) {
    try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        
        const data = JSON.parse(item);
        if (data.expiry && new Date(data.expiry) < new Date()) {
            localStorage.removeItem(key);
            return null;
        }
        
        return data.value;
    } catch (error) {
        console.error(`Error reading from localStorage (${key}):`, error);
        return null;
    }
}

/**
 * Set value in localStorage with optional expiry
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @param {number} expiryHours - Optional expiry time in hours
 */
function setStorageValue(key, value, expiryHours = null) {
    try {
        const data = { value };
        if (expiryHours) {
            const expiry = new Date();
            expiry.setHours(expiry.getHours() + expiryHours);
            data.expiry = expiry.toISOString();
        }
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error(`Error writing to localStorage (${key}):`, error);
    }
}

/**
 * Remove value from localStorage
 * @param {string} key - Storage key
 */
function removeStorageValue(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing from localStorage (${key}):`, error);
    }
}

/**
 * Log with timestamp
 * @param {string} message - Message to log
 * @param {string} level - Log level (info, warn, error)
 */
function log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString('ar-SA');
    const prefix = `[${timestamp}]`;
    
    switch (level) {
        case 'warn':
            console.warn(prefix, '⚠️', message);
            break;
        case 'error':
            console.error(prefix, '❌', message);
            break;
        default:
            console.log(prefix, 'ℹ️', message);
    }
}
