<?php

$memcached = new Memcached('teabots');
if (!count($memcached->getServerList())) {
    $ok = $memcached->addServer('127.0.0.1', 11211);
    if ($ok === false) {
        die('memcached server failed');
    }
}
