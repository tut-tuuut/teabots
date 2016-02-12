#!/usr/bin/php
<?php

require_once(__DIR__ . '/../config.php');

// room
if (sizeof($argv) >= 2) {
    parse_str($argv[1]);
} else {
    die('room is mandatory');
}

// message
if (sizeof($argv) >= 3) {
    parse_str($argv[2]);
}

// color
$color = 'purple';
if (sizeof($argv) >= 4) {
    parse_str($argv[3]);
}

if (isset($message)) {
    $ch = curl_init('https://tea-ebook.hipchat.com/v2/room/' . $rooms[$room]['id'] . '/notification?auth_token=' . $rooms[$room]['token']);
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
