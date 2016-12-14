<?php

require_once(__DIR__ . '/../data.php');
require_once(__DIR__ . '/../memcached.php');
require_once(__DIR__ . '/quotes.php');

const LAST_QUOTE_KEY = 'botzac.lastquote';

$lastQuote = $memcached->get(LAST_QUOTE_KEY);
do {
  $quote = $quotes[array_rand($quotes)];
} while ($quote == $lastQuote);

$memcached->set(LAST_QUOTE_KEY, $quote);

$response = [
  'color' => $colors[array_rand($colors)],
  'message' => $quote,
  'notify' => false,
  'message_format' => 'text'
];

header('Content-Type: application/json');
echo json_encode($response);
