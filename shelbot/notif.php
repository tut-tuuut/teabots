#!/usr/local/bin/php
<?php

require_once(__DIR__ . '/../config.php');

$color = 'purple';
if (sizeof($argv) >= 2) {
    parse_str($argv[1]);
}
if (sizeof($argv) >= 3) {
    parse_str($argv[2]);
}

if (isset($message)) {
    $ch = curl_init('https://tea-ebook.hipchat.com/v2/room/' . $roomDev . '/notification?auth_token=' . $tokenDev);
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
