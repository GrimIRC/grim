<?php

	// local test database server
	define('MYSQL_HOST', '127.0.0.1');
	define('MYSQL_USERNAME', 'root');
	define('MYSQL_PASSWORD', 'rt56mn#$');
	define('MYSQL_DB', 'smcbot');

	require_once("DB_PDO.php");

	$GLOBALS['db'] = new DB_PDO(MYSQL_HOST,MYSQL_DB,MYSQL_USERNAME,MYSQL_PASSWORD);

?>