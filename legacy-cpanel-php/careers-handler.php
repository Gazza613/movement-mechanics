<?php
/**
 * Movement Mechanics - careers / expression of interest form handler.
 * Plain PHP mail(), no external libraries - works on any standard cPanel /
 * shared PHP hosting. Supports an optional CV/resume attachment (PDF or
 * Word doc, up to 5MB), sent as a proper multipart/mixed email.
 */

$to_email      = "movementmechanics.sa@gmail.com";
$site_name     = "Movement Mechanics";
$redirect_ok   = "careers.html?sent=1";
$redirect_fail = "careers.html?error=1";
$max_bytes     = 5 * 1024 * 1024; // 5MB
$allowed_ext   = ["pdf", "doc", "docx"];
$allowed_mime  = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream", // some browsers/hosts report this for .docx
];

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: careers.html");
    exit;
}

// Honeypot spam trap - if filled in, silently pretend success and bail
if (!empty($_POST["website"])) {
    header("Location: " . $redirect_ok);
    exit;
}

function mm_clean($v) {
    return htmlspecialchars(trim($v ?? ""), ENT_QUOTES, "UTF-8");
}

$name    = mm_clean($_POST["name"] ?? "");
$email   = mm_clean($_POST["email"] ?? "");
$phone   = mm_clean($_POST["phone"] ?? "");
$role    = mm_clean($_POST["role"] ?? "");
$link    = mm_clean($_POST["link"] ?? "");
$message = mm_clean($_POST["message"] ?? "");

// Basic validation
if ($name === "" || $email === "" || $message === "" ||
    !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header("Location: " . $redirect_fail);
    exit;
}

// ---- Handle the optional CV attachment ----
$attachment      = null;
$attachment_note = "No CV attached.";

if (!empty($_FILES["cv"]) && $_FILES["cv"]["error"] !== UPLOAD_ERR_NO_FILE) {
    $file = $_FILES["cv"];

    if ($file["error"] === UPLOAD_ERR_OK && is_uploaded_file($file["tmp_name"])) {
        $original_name = basename($file["name"]);
        $ext           = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));
        $mime          = function_exists("mime_content_type") ? mime_content_type($file["tmp_name"]) : $file["type"];

        if (!in_array($ext, $allowed_ext, true)) {
            $attachment_note = "CV attachment skipped - file type not allowed ($original_name).";
        } elseif ($file["size"] > $max_bytes) {
            $attachment_note = "CV attachment skipped - file was over 5MB ($original_name).";
        } elseif ($mime && !in_array($mime, $allowed_mime, true)) {
            $attachment_note = "CV attachment skipped - could not verify file type ($original_name).";
        } else {
            $data = file_get_contents($file["tmp_name"]);
            if ($data !== false) {
                $attachment = [
                    "name" => $original_name,
                    "data" => $data,
                    "type" => $mime ?: "application/octet-stream",
                ];
                $attachment_note = "CV attached: $original_name";
            } else {
                $attachment_note = "CV attachment skipped - could not read the uploaded file.";
            }
        }
    } else {
        $attachment_note = "CV attachment skipped - upload error.";
    }
}

$subject = "New careers enquiry - $site_name" . ($role !== "" ? " ($role)" : "");

$text_body  = "New careers / expression of interest submission\n";
$text_body .= "----------------------------------------\n";
$text_body .= "Name: $name\n";
$text_body .= "Email: $email\n";
$text_body .= "Phone: $phone\n";
$text_body .= "Role / Area of Interest: $role\n";
$text_body .= "LinkedIn / Portfolio Link: $link\n";
$text_body .= "$attachment_note\n";
$text_body .= "----------------------------------------\n";
$text_body .= "Message:\n$message\n";
$text_body .= "----------------------------------------\n";
$text_body .= "Submitted: " . date("Y-m-d H:i:s") . "\n";

$headers   = [];
$headers[] = "MIME-Version: 1.0";
$headers[] = "From: {$site_name} Website <no-reply@movementmechanics.co.za>";
$headers[] = "Reply-To: $name <$email>";

if ($attachment) {
    // Build a multipart/mixed email by hand - no external mail library needed.
    $boundary = "mm-" . md5(uniqid((string) mt_rand(), true));
    $headers[] = "Content-Type: multipart/mixed; boundary=\"$boundary\"";

    $body  = "--$boundary\r\n";
    $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $body .= $text_body . "\r\n";

    $body .= "--$boundary\r\n";
    $body .= "Content-Type: {$attachment['type']}; name=\"{$attachment['name']}\"\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n";
    $body .= "Content-Disposition: attachment; filename=\"{$attachment['name']}\"\r\n\r\n";
    $body .= chunk_split(base64_encode($attachment["data"])) . "\r\n";

    $body .= "--$boundary--";
} else {
    $headers[] = "Content-type: text/plain; charset=UTF-8";
    $body = $text_body;
}

$sent = @mail($to_email, $subject, $body, implode("\r\n", $headers));

header("Location: " . ($sent ? $redirect_ok : $redirect_fail));
exit;
