<?php

require_once(__DIR__ . '/../data.php');
require_once(__DIR__ . '/quotes.php');

$quote = $quotes[array_rand($quotes)];

$response = [
    'color' => $colors[array_rand($colors)],
    'message' => $quote['quote'],
    'notify' => false,
    'message_format' => 'text'
];

header('Content-Type: application/json');
echo json_encode($response);
