/**
 * Configuration File
 * Contains all environment variables and constants
 */

const CONFIG = {
    // Supabase Configuration
    // Use window.location.hostname to detect if we are in a production environment or local
    SUPABASE_URL: 'https://nfpwuxjstawbctjzwrpv.supabase.co',
    SUPABASE_KEY: '', // Should be filled with the actual key or handled via env
    
    // Domain Configuration
    DOMAIN: 'mad3oom.online',
    
    // Polling Configuration
    POLLING_INTERVAL: 5000, // 5 seconds
    MAX_POLLING_INTERVAL: 30000, // 30 seconds
    
    // Session Configuration
    SESSION_STORAGE_KEY: 'temp_inbox_session_id',
    SESSION_EXPIRY_HOURS: 24,
    
    // UI Configuration
    TOAST_DURATION: 3000, // 3 seconds
    
    // Database Configuration
    EMAILS_TABLE: 'messages',
    
    // Username Configuration
    USERNAME_STORAGE_KEY: 'temp_inbox_username',
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 30,
    USERNAME_REGEX: /^[a-zA-Z0-9._-]+$/,
    
    // Limits
    MAX_EMAILS_DISPLAY: 50,
    EMAIL_BODY_MAX_LENGTH: 50000,
};

// Try to load from environment if available (for build tools like Vite)
if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_SUPABASE_URL) CONFIG.SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    if (process.env.VITE_SUPABASE_ANON_KEY) CONFIG.SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
}

// Validate configuration
function validateConfig() {
    if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL.includes('your-supabase')) {
        console.warn('⚠️ Supabase URL not configured.');
    }
    if (!CONFIG.SUPABASE_KEY || CONFIG.SUPABASE_KEY === '') {
        console.warn('⚠️ Supabase Key is empty. Realtime and fetching might fail.');
    }
}

// Run validation on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', validateConfig);
} else {
    validateConfig();
}
