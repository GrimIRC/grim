<?php

	require_once("globals.php");

	$ch = new convertUsers();

	class convertUsers {

		var $db;

		function convertUsers() {

			$this->db = $GLOBALS['db'];

			$users = $this->db->getCol("SELECT DISTINCT(nick) FROM hosting");


			/*

				MariaDB [smcbot]> select * from hosting limit 1\G
				*************************** 1. row ***************************
				     recnum: 7
				       nick: protocoldoug
				     secret: 232740.987165929
				       file: protocoldoug_smc_cigar.blend
				     indate: 2006-09-15 13:39:19
				      issmc: 0
				description: 
				   category: Other SMC's

			*/

			// print_r($hosting);

			foreach ($users as $u) {

				$object = array(
					"nick" => $u,
				);

				$json = json_encode($object);
				echo $json."\n";



			}

		}

	}

?>