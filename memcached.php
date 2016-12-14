<?php

$memcached = new Memcached('teabots');
if (!count($memcached->getServerList())) {
    $ok = $memcached->addServer('localhost', 11211);
    if ($ok === false) {
        die('memcached server failed');
    }
}
