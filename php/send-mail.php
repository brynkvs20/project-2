<?php
/**
 * Secure contact form handler for Hostinger (PHP mail).
 * Configure via php/config.php (copy from config.example.php).
 */

header('Content-Type: application/json; charset=utf-8');

$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(503);
    echo json_encode(['success' => false, 'message' => 'Contact form is not configured. Please set up php/config.php.']);
    exit;
}

$config = require $configPath;

/* CORS */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $config['allowed_origins'], true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

/* Rate limiting via session file */
function checkRateLimit($limit) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $file = sys_get_temp_dir() . '/ejt_form_' . md5($ip) . '.json';
    $now = time();
    $data = ['count' => 0, 'reset' => $now + 3600];

    if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true) ?: $data;
        if ($now > ($data['reset'] ?? 0)) {
            $data = ['count' => 0, 'reset' => $now + 3600];
        }
    }

    if ($data['count'] >= $limit) {
        return false;
    }

    $data['count']++;
    file_put_contents($file, json_encode($data));
    return true;
}

if (!checkRateLimit($config['rate_limit_per_hour'])) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Too many submissions. Please try again later.']);
    exit;
}

/* Parse input */
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!is_array($input)) {
    $input = $_POST;
}

/* Honeypot — bots fill hidden fields */
$honeypot = $config['honeypot_field'];
if (!empty($input[$honeypot])) {
    echo json_encode(['success' => true, 'message' => 'Thank you for your message.']);
    exit;
}

/* Sanitize helpers */
function clean($value, $maxLen = 500) {
    $value = trim(strip_tags((string) $value));
    return mb_substr($value, 0, $maxLen);
}

$name    = clean($input['name'] ?? '', 100);
$company = clean($input['company'] ?? '', 150);
$email   = filter_var(trim($input['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$phone   = clean($input['phone'] ?? '', 20);
$subject = clean($input['subject'] ?? '', 200);
$service = clean($input['service'] ?? '', 150);
$message = clean($input['message'] ?? '', 5000);

/* Validation */
$errors = [];
if (strlen($name) < 2) $errors[] = 'Please enter your full name.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Please enter a valid email address.';
if (strlen($phone) < 7) $errors[] = 'Please enter a valid phone number.';
if (strlen($subject) < 3) $errors[] = 'Please enter a subject.';
if (strlen($message) < 10) $errors[] = 'Please enter a message (at least 10 characters).';

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

/* Build email */
$recipient = $config['recipient_email'];
$mailSubject = '[EJT Inquiry] ' . $subject;

$body = "New contact form submission from EJT website\n";
$body .= str_repeat('-', 50) . "\n\n";
$body .= "Name:           {$name}\n";
$body .= "Company:        {$company}\n";
$body .= "Email:          {$email}\n";
$body .= "Phone:          {$phone}\n";
$body .= "Subject:        {$subject}\n";
$body .= "Service Needed: {$service}\n\n";
$body .= "Message:\n{$message}\n\n";
$body .= str_repeat('-', 50) . "\n";
$body .= 'Submitted: ' . date('Y-m-d H:i:s T') . "\n";
$body .= 'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";

$headers = [
    'From: ' . $config['from_name'] . ' <' . $config['from_email'] . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'X-Mailer: PHP/' . phpversion(),
    'Content-Type: text/plain; charset=UTF-8'
];

$sent = @mail($recipient, $mailSubject, $body, implode("\r\n", $headers));

if (!$sent) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to send message. Please call us directly or try again later.']);
    exit;
}

/* Optional customer confirmation */
if (!empty($config['send_customer_confirmation'])) {
    $confirmSubject = 'We received your inquiry — EJT IND\'L PAINTS AND SERVICES CO.';
    $confirmBody = "Dear {$name},\n\n";
    $confirmBody .= "Thank you for contacting EJT IND'L PAINTS AND SERVICES CO.\n";
    $confirmBody .= "We have received your inquiry and will respond within 1–2 business days.\n\n";
    $confirmBody .= "Your submission summary:\n";
    $confirmBody .= "Subject: {$subject}\n";
    $confirmBody .= "Service: {$service}\n\n";
    $confirmBody .= "Best regards,\nEJT IND'L PAINTS AND SERVICES CO.\n";

    $confirmHeaders = [
        'From: ' . $config['from_name'] . ' <' . $config['from_email'] . '>',
        'Content-Type: text/plain; charset=UTF-8'
    ];
    @mail($email, $confirmSubject, $confirmBody, implode("\r\n", $confirmHeaders));
}

echo json_encode([
    'success' => true,
    'message' => 'Thank you! Your message has been sent successfully. We will get back to you soon.'
]);
