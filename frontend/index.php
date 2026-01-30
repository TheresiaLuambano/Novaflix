<?php
/**
 * BurudaniKiganjani Frontend Entry Point
 * 
 * This file serves as the entry point for the frontend application.
 * It redirects all requests to the main index.html file.
 */

// Get the request URI
$requestUri = $_SERVER['REQUEST_URI'];

// Remove query string if present
$path = strtok($requestUri, '?');

// List of file paths that should be served directly
$directFiles = [
    '/index.html',
    '/browse.html',
    '/watch.html',
    '/search.html',
    '/login.html',
    '/register.html',
    '/my-list.html',
];

// List of asset paths that should be served directly
$assetExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];

// Check if the request is for a direct file
if (in_array($path, $directFiles)) {
    // Serve the file directly
    $filePath = __DIR__ . $path;
    if (file_exists($filePath)) {
        // Determine content type
        $ext = pathinfo($filePath, PATHINFO_EXTENSION);
        $mimeTypes = [
            'html' => 'text/html',
            'css' => 'text/css',
            'js' => 'application/javascript',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'ico' => 'image/x-icon',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf',
        ];
        
        $contentType = $mimeTypes[$ext] ?? 'application/octet-stream';
        header('Content-Type: ' . $contentType);
        header('Cache-Control: public, max-age=31536000');
        readfile($filePath);
        exit;
    }
}

// Check if the request is for an asset
$assetExt = pathinfo($path, PATHINFO_EXTENSION);
if (in_array('.' . $assetExt, $assetExtensions)) {
    $filePath = __DIR__ . $path;
    if (file_exists($filePath)) {
        $mimeTypes = [
            'css' => 'text/css',
            'js' => 'application/javascript',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            'ico' => 'image/x-icon',
            'woff' => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf' => 'font/ttf',
        ];
        
        $contentType = $mimeTypes[$assetExt] ?? 'application/octet-stream';
        header('Content-Type: ' . $contentType);
        header('Cache-Control: public, max-age=31536000');
        readfile($filePath);
        exit;
    }
}

// For all other requests, serve index.html (SPA behavior)
$indexFile = __DIR__ . '/index.html';

if (file_exists($indexFile)) {
    // Set proper headers for HTML
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Pragma: no-cache');
    header('Expires: 0');
    
    // Read and output index.html
    readfile($indexFile);
} else {
    // Fallback error response
    http_response_code(404);
    echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Not Found</title>
    <style>
        body { font-family: Arial, sans-serif; background: #141414; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .container { text-align: center; }
        h1 { font-size: 3rem; margin-bottom: 1rem; }
        p { color: #b3b3b3; }
        a { color: #e50914; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>404</h1>
        <p>The page you\'re looking for doesn\'t exist.</p>
        <p><a href="/">Go back home</a></p>
    </div>
</body>
</html>';
}

