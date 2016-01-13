#!/usr/local/bin/php
<?php

$ch = curl_init('https://tea-ebook.hipchat.com/v2/room/487692/notification?auth_token=miYJfXA6hgBPZ3P4EEkibEP9Iarb8Nsd7r22ZV2d');
$data = array(
    'color' => 'yellow',
    'message' => 'Standup !',
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
