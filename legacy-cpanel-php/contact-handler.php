<?php
/**
 * Movement Mechanics - contact form handler.
 * Works on any standard cPanel / shared PHP hosting (no external dependencies).
 * Sends the enquiry to the address below and redirects back to the contact
 * page with a success or error flag.
 */

// ---- CONFIG ----
$to_email   = "movementmechanics.sa@gmail.com";
$site_name  = "Movement Mechanics";
$redirect_ok    = "contact.html?sent=1";
$redirect_fail  = "contact.html?error=1";

// Only accept POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: contact.html");
    exit;
}

// Honeypot spam trap - if filled in, silently pretend success and bail
if (!empty($_POST["website"])) {
    header("Location: " . $redirect_ok);
    exit;
}

function clean($v) {
    return htmlspecialchars(trim($v ?? ""), ENT_QUOTES, "UTF-8");
}

$name     = clean($_POST["name"] ?? "");
$email    = clean($_POST["email"] ?? "");
$phone    = clean($_POST["phone"] ?? "");
$service  = clean($_POST["service"] ?? "");
$athletes = clean($_POST["athletes"] ?? "");
$dates    = clean($_POST["dates"] ?? "");
$venue    = clean($_POST["venue"] ?? "");
$message  = clean($_POST["message"] ?? "");

// Basic validation
if ($name === "" || $email === "" || $service === "" || $message === "" ||
    !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header("Location: " . $redirect_fail);
    exit;
}

$subject = "New enquiry from $site_name website - $service";

$body = "New website enquiry\n";
$body .= "----------------------------------------\n";
$body .= "Name: $name\n";
$body .= "Email: $email\n";
$body .= "Phone: $phone\n";
$body .= "Service Interest: $service\n";
$body .= "Number of Athletes: $athletes\n";
$body .= "Preferred Date(s): $dates\n";
$body .= "Preferred Testing Location: $venue\n";
$body .= "----------------------------------------\n";
$body .= "Message:\n$message\n";
$body .= "----------------------------------------\n";
$body .= "Submitted: " . date("Y-m-d H:i:s") . "\n";

$headers   = [];
$headers[] = "MIME-Version: 1.0";
$headers[] = "Content-type: text/plain; charset=UTF-8";
$headers[] = "From: {$site_name} Website <no-reply@movementmechanics.co.za>";
$headers[] = "Reply-To: $name <$email>";

$sent = @mail($to_email, $subject, $body, implode("\r\n", $headers));

header("Location: " . ($sent ? $redirect_ok : $redirect_fail));
exit;
