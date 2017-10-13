<?php

require_once __DIR__ . '/../data.php';
require_once __DIR__ . '/config.php';

$query = urlencode('"moon moon"');
$searchUrl = 'https://www.googleapis.com/customsearch/v1?q=%s&key=%s&cx=%s&searchType=image&imgType=photo&imgSize=large&num=%d&start=%d';

$searchCurl = curl_init(sprintf($searchUrl, $query, $googleApi['api_key'], $googleApi['search_engine_id'], 1, mt_rand(0, 100)));
curl_setopt($searchCurl, CURLOPT_RETURNTRANSFER, true);
$response = json_decode(curl_exec($searchCurl), true);
curl_close($searchCurl);
$images = $response['items'];

$response = [
  'color' => 'yellow',
  'message' => '<img src="' . $images[0]['link'] . '" width="300">',
  'notify' => false,
  'message_format' => 'html'
];

header('Content-Type: application/json');
echo json_encode($response);
