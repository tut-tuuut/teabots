#!/usr/local/bin/php
<?php

$color = 'purple';
if (sizeof($argv) >= 2) {
    parse_str($argv[1]);
}
if (sizeof($argv) >= 3) {
    parse_str($argv[2]);
}

if (isset($message)) {
    $ch = curl_init('https://tea-ebook.hipchat.com/v2/room/487692/notification?auth_token=miYJfXA6hgBPZ3P4EEkibEP9Iarb8Nsd7r22ZV2d');
    $data = array(
        'color' => $color,
        'message' => urldecode($message),
        'notify' => true,
        'message_format' => 'text'
    );
    $dataJson = json_encode($data);

    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $dataJson);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
            'Content-Type: application/json',
            'Content-Length: ' . strlen($dataJson))
    );

    curl_exec($ch);
}
