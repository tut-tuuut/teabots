<?php

require_once(__DIR__ . '/../db.php');
require_once(__DIR__ . '/../data.php');
require_once(__DIR__ . '/quotes.php');

loadQuotes($db, $quotes);

$quote = getLeastQuotedPhrase($db);
incrementQuoteTotal($db, $quote['id']);

$response = [
    'color' => $colors[array_rand($colors)],
    'message' => $quote['quote'],
    'notify' => false,
    'message_format' => 'text'
];

header('Content-Type: application/json');
echo json_encode($response);
