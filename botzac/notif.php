#!/usr/local/bin/php
<?php

require_once('../data.php');
require_once('quotes.php');

$ch = curl_init("https://tea-ebook.hipchat.com/v2/room/1291826/notification?auth_token=XxwKfgtC9aIfpyrHzq1EEsaKPlynYYxl973dG1ha");
$data = array(
    "color" => $colors[array_rand($colors)],
    "message" => $quotes[array_rand($quotes)],
    "notify" => true,
    "message_format" => "text"
);
$dataJson = json_encode($data);

curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($ch, CURLOPT_POSTFIELDS, $dataJson);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Content-Type: application/json',
    'Content-Length: ' . strlen($dataJson))
);

curl_exec($ch);
