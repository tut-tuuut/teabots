<?php

$db = new SQLite3('teabots.db');
$db->exec('CREATE TABLE IF NOT EXISTS botzac (id INTEGER PRIMARY KEY, quote TEXT, total INTEGER)');

function getLeastQuotedPhrase($db) {
  $result = $db->query('SELECT * FROM botzac ORDER BY total ASC LIMIT 1');
  return $result->fetchArray();
}

function incrementQuoteTotal($db, $quoteId) {
  $db->exec("UPDATE botzac SET total = (total + 1) WHERE id = $quoteId");
}

function loadQuotes($db, $quotes) {
  $stmt = $db->prepare("INSERT OR IGNORE INTO botzac (quote, total) VALUES (:quote, 0)");

  foreach ($quotes as $quote) {
    $stmt->bindValue(':quote', $quote);
    $stmt->execute();
  }
}
