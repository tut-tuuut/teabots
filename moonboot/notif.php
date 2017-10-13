#!/usr/bin/php
<?php

require_once __DIR__ . '/../data.php';
require_once __DIR__ . '/config.tea.php';

// room
if (count($argv) >= 2) {
  parse_str($argv[1], $params);
} else {
  die('room is mandatory');
}
$params = array_keys($params);
$room = array_pop($params);

$query = urlencode('"moon moon"');
$searchUrl = 'https://www.googleapis.com/customsearch/v1?q=%s&key=%s&cx=%s&searchType=image&imgType=photo&imgSize=large&num=%d&start=%d';

$searchCurl = curl_init(sprintf($searchUrl, $query, $googleApi['api_key'], $googleApi['search_engine_id'], 1, mt_rand(0, 100)));
curl_setopt($searchCurl, CURLOPT_RETURNTRANSFER, true);
$response = json_decode(curl_exec($searchCurl), true);
curl_close($searchCurl);
$images = $response['items'];

$ch = curl_init('https://tea-ebook.hipchat.com/v2/room/' . $rooms[$room]['id'] . '/notification?auth_token=' . $rooms[$room]['token']);
$data = array(
  'color' => 'yellow',
  'message' => '<img src="' . $images[0]['link'] . '" width="300">',
  'notify' => false,
  'message_format' => 'html'
);
$dataJson = json_encode($data);

curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
curl_setopt($ch, CURLOPT_POSTFIELDS, $dataJson);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
  'Content-Type: application/json',
  'Content-Length: ' . strlen($dataJson))
);

curl_exec($ch);
curl_close($ch);
