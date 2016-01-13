<?php

require_once(__DIR__ . '/../data.php');
require_once(__DIR__ . '/quotes.php');

$response = [
    "color" => $colors[array_rand($colors)],
    "message" => $quotes[array_rand($quotes)],
    "notify" => false,
    "message_format" => "text"
];

header('Content-Type: application/json');
echo json_encode($response);
