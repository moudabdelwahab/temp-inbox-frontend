/**
 * Email Parser
 * Extracts structured data from raw email content (MIME format)
 */

class EmailParser {
    /**
     * Extract subject from email body (MIME headers)
     * @param {string} emailBody - Raw email content
     * @returns {string} Subject line or fallback text
     */
    static extractSubject(emailBody) {
        if (!emailBody) return '(No Subject)';
        
        try {
            // Try to find Subject: header
            const subjectMatch = emailBody.match(/Subject:\s*([^\r\n]+)/i);
            if (subjectMatch && subjectMatch[1]) {
                let subject = subjectMatch[1].trim();
                
                // Decode encoded subject if needed (e.g., =?UTF-8?B?...?=)
                subject = this.decodeEncodedWords(subject);
                
                // Limit to 50 characters
                if (subject.length > 50) {
                    subject = subject.substring(0, 47) + '...';
                }
                
                return subject;
            }
            
            // Fallback: extract first 50 characters from body
            const bodyText = this.extractPlainText(emailBody);
            if (bodyText) {
                return bodyText.substring(0, 50);
            }
            
            return '(No Subject)';
        } catch (error) {
            console.error('Error extracting subject:', error);
            return '(No Subject)';
        }
    }
    
    /**
     * Decode RFC 2047 encoded words (e.g., =?UTF-8?B?...?=)
     * @param {string} encodedText - Encoded text
     * @returns {string} Decoded text
     */
    static decodeEncodedWords(encodedText) {
        try {
            // Pattern for encoded words: =?charset?encoding?encoded-text?=
            const pattern = /=\?([^?]+)\?([^?]+)\?([^?]+)\?=/g;
            
            return encodedText.replace(pattern, (match, charset, encoding, text) => {
                try {
                    if (encoding.toUpperCase() === 'B') {
                        // Base64 decoding
                        const decoded = atob(text);
                        return decodeURIComponent(escape(decoded));
                    } else if (encoding.toUpperCase() === 'Q') {
                        // Quoted-printable decoding
                        return text.replace(/=([0-9A-F]{2})/g, (m, hex) => {
                            return String.fromCharCode(parseInt(hex, 16));
                        });
                    }
                } catch (e) {
                    console.warn('Failed to decode encoded word:', match);
                }
                return match;
            });
        } catch (error) {
            console.error('Error decoding encoded words:', error);
            return encodedText;
        }
    }
    
    /**
     * Extract plain text from email body
     * @param {string} emailBody - Raw email content
     * @returns {string} Plain text content
     */
    static extractPlainText(emailBody) {
        if (!emailBody) return '';
        
        try {
            // Remove MIME headers and structure
            let text = emailBody;
            
            // Remove base64 encoded content markers
            text = text.replace(/Content-Transfer-Encoding: base64\r?\n/gi, '');
            text = text.replace(/--[0-9a-f]+--\r?\n/gi, '');
            
            // Remove other MIME headers
            text = text.split(/\r?\n\r?\n/).pop() || text;
            
            // Try to decode base64 if it looks like base64
            if (/^[A-Za-z0-9+/=\r\n]+$/.test(text.trim())) {
                try {
                    const decoded = atob(text.replace(/\s/g, ''));
                    text = decoded;
                } catch (e) {
                    // Not base64, continue with original
                }
            }
            
            // Remove non-printable characters
            text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
            
            // Trim and clean up
            text = text.trim();
            
            return text;
        } catch (error) {
            console.error('Error extracting plain text:', error);
            return '';
        }
    }
    
    /**
     * Extract sender from email body (MIME headers)
     * @param {string} emailBody - Raw email content
     * @param {string} fallbackSender - Fallback sender from database
     * @returns {string} Sender email or name
     */
    static extractSender(emailBody, fallbackSender) {
        if (!emailBody) return fallbackSender || 'Unknown';
        
        try {
            // Try to find From: header
            const fromMatch = emailBody.match(/From:\s*([^\r\n]+)/i);
            if (fromMatch && fromMatch[1]) {
                let from = fromMatch[1].trim();
                
                // Decode encoded sender if needed
                from = this.decodeEncodedWords(from);
                
                // Extract email address if format is "Name <email@domain.com>"
                const emailMatch = from.match(/<([^>]+)>/);
                if (emailMatch && emailMatch[1]) {
                    return emailMatch[1];
                }
                
                // Return as-is if it's already an email
                if (from.includes('@')) {
                    return from;
                }
                
                // Return the name
                return from;
            }
            
            // Fallback to database sender
            return fallbackSender || 'Unknown';
        } catch (error) {
            console.error('Error extracting sender:', error);
            return fallbackSender || 'Unknown';
        }
    }
    
    /**
     * Parse email and return structured data
     * @param {object} rawEmail - Raw email from database
     * @returns {object} Parsed email with extracted fields
     */
    static parseEmail(rawEmail) {
        if (!rawEmail) return null;
        
        return {
            id: rawEmail.id,
            email: rawEmail.email,
            sender: this.extractSender(rawEmail.body, rawEmail.sender),
            subject: this.extractSubject(rawEmail.body),
            body: rawEmail.body,
            created_at: rawEmail.created_at,
            // Additional fields for display
            preview: this.extractPlainText(rawEmail.body).substring(0, 100)
        };
    }
    
    /**
     * Parse multiple emails
     * @param {Array} rawEmails - Array of raw emails from database
     * @returns {Array} Array of parsed emails
     */
    static parseEmails(rawEmails) {
        if (!Array.isArray(rawEmails)) return [];
        return rawEmails.map(email => this.parseEmail(email));
    }
}

log('✅ EmailParser.js loaded successfully');
