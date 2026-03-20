/**
 * Configuration File
 * Contains all environment variables and constants
 */

const CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: process.env.VITE_FRONTEND_FORGE_API_URL || 'https://your-supabase-url.supabase.co',
    SUPABASE_KEY: process.env.VITE_FRONTEND_FORGE_API_KEY || 'your-supabase-key',
    
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

// Validate configuration
function validateConfig() {
    if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL.includes('your-supabase')) {
        console.warn('⚠️ Supabase URL not configured. Please set VITE_FRONTEND_FORGE_API_URL');
    }
    if (!CONFIG.SUPABASE_KEY || CONFIG.SUPABASE_KEY.includes('your-supabase')) {
        console.warn('⚠️ Supabase Key not configured. Please set VITE_FRONTEND_FORGE_API_KEY');
    }
}

// Run validation on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', validateConfig);
} else {
    validateConfig();
}
