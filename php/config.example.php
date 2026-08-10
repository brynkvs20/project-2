<?php
/**
 * Copy this file to config.php and update with your Hostinger email settings.
 * NEVER commit config.php with real credentials to public repositories.
 */

return [
    // Recipient email (your Hostinger business email)
    'recipient_email' => 'your-email@yourdomain.com',

    // From address (should be an email on your domain for Hostinger PHP mail)
    'from_email' => 'noreply@yourdomain.com',
    'from_name'  => 'EJT Website Contact Form',

    // Send confirmation email to customer (true/false)
    'send_customer_confirmation' => true,

    // Rate limiting: max submissions per IP per hour
    'rate_limit_per_hour' => 5,

    // Honeypot field name (hidden field bots fill out)
    'honeypot_field' => 'website_url',

    // Allowed origins for CORS (your domain)
    'allowed_origins' => [
        'https://yourdomain.com',
        'https://www.yourdomain.com',
        'http://localhost'
    ]
];
