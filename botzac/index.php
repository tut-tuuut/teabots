<?php
require_once('../data.php');
require_once('quotes.php');

$response = [
    "color" => $colors[array_rand($colors)],
    "message" => $quotes[array_rand($quotes)],
    "notify" => false,
    "message_format" => "text"
];

header('Content-Type: application/json');
echo json_encode($response);
