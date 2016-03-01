#!/usr/bin/php
<?php

require_once(__DIR__ . '/../config.php');
require_once(__DIR__ . '/../data.php');
require_once(__DIR__ . '/quotes.php');

// room
if (sizeof($argv) >= 2) {
  parse_str($argv[1]);
} else {
  die('room is mandatory');
}

$ch = curl_init('https://tea-ebook.hipchat.com/v2/room/' . $rooms[$room]['id'] . '/notification?auth_token=' . $rooms[$room]['token']);
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
