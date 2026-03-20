/**
 * Supabase Client
 * Handles all Supabase database operations
 */

class SupabaseClient {
    constructor() {
        this.client = null;
        this.initialized = false;
        this.subscriptions = [];
        this.initPromise = null;
        this.waitForInit();
    }

    /**
     * Wait for Supabase library to load, then initialize
     */
    waitForInit() {
        if (this.initPromise) return this.initPromise;
        
        this.initPromise = new Promise((resolve) => {
            const checkAndInit = () => {
                if (window.supabase && CONFIG && CONFIG.SUPABASE_URL && CONFIG.SUPABASE_KEY) {
                    this.init();
                    resolve();
                } else {
                    setTimeout(checkAndInit, 100);
                }
            };
            checkAndInit();
        });
        
        return this.initPromise;
    }

    /**
     * Initialize Supabase client
     */
    init() {
        try {
            if (this.initialized && this.client) {
                log('✅ Supabase client already initialized');
                return;
            }

            if (!window.supabase) {
                throw new Error('Supabase library not loaded');
            }

            if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_KEY) {
                throw new Error('Supabase configuration is missing');
            }

            this.client = window.supabase.createClient(
                CONFIG.SUPABASE_URL,
                CONFIG.SUPABASE_KEY
            );
            
            this.initialized = true;
            log('✅ Supabase client initialized successfully');
        } catch (error) {
            log(`❌ Failed to initialize Supabase client: ${error.message}`, 'error');
            this.initialized = false;
            this.client = null;
        }
    }

    /**
     * Ensure client is initialized before operations
     * @returns {Promise<boolean>}
     */
    async ensureInitialized() {
        if (this.isInitialized()) {
            return true;
        }
        
        await this.waitForInit();
        return this.isInitialized();
    }

    /**
     * Check if client is initialized
     * @returns {boolean}
     */
    isInitialized() {
        return this.initialized && this.client !== null;
    }

    /**
     * Fetch emails for a specific email address
     * @param {string} email - Email address to fetch messages for
     * @param {number} limit - Maximum number of emails to fetch
     * @returns {Promise<Array>} Array of emails
     */
    async fetchEmails(email, limit = CONFIG.MAX_EMAILS_DISPLAY) {
        try {
            const initialized = await this.ensureInitialized();
            if (!initialized) {
                throw new Error('Supabase client failed to initialize');
            }

            if (!email) {
                throw new Error('Email address is required');
            }

            const { data, error } = await this.client
                .from(CONFIG.EMAILS_TABLE)
                .select('*')
                .eq('email', email)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                throw new Error(`Database error: ${error.message}`);
            }

            log(`✅ Fetched ${data?.length || 0} emails for ${email}`);
            return data || [];
        } catch (error) {
            log(`❌ Error fetching emails: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Subscribe to real-time email updates
     * @param {string} email - Email address to subscribe to
     * @param {Function} callback - Callback function when emails change
     * @returns {Function} Unsubscribe function
     */
    async subscribeToEmails(email, callback) {
        try {
            const initialized = await this.ensureInitialized();
            if (!initialized) {
                throw new Error('Supabase client failed to initialize');
            }

            if (!email) {
                throw new Error('Email address is required');
            }

            const subscription = this.client
                .channel(`emails:${email}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: CONFIG.EMAILS_TABLE,
                        filter: `email=eq.${email}`
                    },
                    (payload) => {
                        log(`📬 Real-time update received: ${payload.eventType}`);
                        callback(payload);
                    }
                )
                .subscribe((status) => {
                    log(`📡 Subscription status: ${status}`);
                });

            this.subscriptions.push(subscription);
            log(`✅ Subscribed to real-time updates for ${email}`);

            // Return unsubscribe function
            return () => this.unsubscribeFromEmails(subscription);
        } catch (error) {
            log(`❌ Error subscribing to emails: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Unsubscribe from real-time updates
     * @param {object} subscription - Subscription object
     */
    async unsubscribeFromEmails(subscription) {
        try {
            if (!this.isInitialized()) return;

            await this.client.removeChannel(subscription);
            this.subscriptions = this.subscriptions.filter(sub => sub !== subscription);
            log('✅ Unsubscribed from real-time updates');
        } catch (error) {
            log(`❌ Error unsubscribing: ${error.message}`, 'error');
        }
    }

    /**
     * Cleanup all subscriptions
     */
    async cleanup() {
        try {
            for (const subscription of this.subscriptions) {
                await this.unsubscribeFromEmails(subscription);
            }
            this.subscriptions = [];
            log('✅ Cleaned up all subscriptions');
        } catch (error) {
            log(`❌ Error during cleanup: ${error.message}`, 'error');
        }
    }

    /**
     * Test connection to Supabase
     * @returns {Promise<boolean>}
     */
    async testConnection() {
        try {
            const initialized = await this.ensureInitialized();
            if (!initialized) {
                throw new Error('Supabase client failed to initialize');
            }

            const { data, error } = await this.client
                .from(CONFIG.EMAILS_TABLE)
                .select('count()', { count: 'exact', head: true });

            if (error) {
                throw error;
            }

            log('✅ Supabase connection test successful');
            return true;
        } catch (error) {
            log(`❌ Supabase connection test failed: ${error.message}`, 'error');
            return false;
        }
    }
}

// Create global instance
const supabaseClient = new SupabaseClient();

log('✅ SupabaseClient.js loaded successfully');
