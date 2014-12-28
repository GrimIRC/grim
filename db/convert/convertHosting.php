<?php

	require_once("globals.php");

	$ch = new convertHosting();

	class convertHosting {

		var $db;

		function convertHosting() {

			$this->db = $GLOBALS['db'];

			$hosting = $this->db->getAll("SELECT *,DATE_FORMAT(indate, '%Y-%m-%dT%TZ') AS isodate FROM hosting");

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

			foreach ($hosting as $h) {

				/*

					{
					    "__v" : 0,
					    "_id" : ObjectId("537104584626f9901c2224b8"),
					    "complete" : true,
					    "description" : "Screenshot from 2014-03-26 18:38:00.png",
					    "indate" : ISODate("2014-05-12T17:26:48.709Z"),
					    "is_smc" : false,
					    "mime_type" : "image/png",
					    "nick" : "protocoldoug",
					    "secret" : "fb69f2440ef02e4af2d3495bf6c09689",
					    "tiny_url" : 1
					}

				*/

				$is_smc = false;
				if ($h['issmc']) { $is_smc = true; }

				$object = array(
					"complete" => true,
					"description" => $h['description'],
					// "indate" => 'ISODate("'.$h['isodate'].'")',
					"indate" => array('$date' => (strtotime($h['isodate']) * 1000)),
					"is_smc" => $is_smc,
					"mime_type" => "{unknown}",
					"nick" => $h['nick'],
					"legacy" => array(
						"recnum" => $h['recnum'],
						"secret" => $h['secret'],
						"file" => $h['file'],
						"category" => $h['category']
					),
				);

				// print_r($object);

				$json = json_encode($object);

				// Strip quotes outside of isodate.
				// $json = preg_replace('/^(.+)(")(ISODate.+?\))(")(.+)$/', "$1$3$5", $json);
				// $json = stripslashes($json);

				echo $json."\n";



			}

		}

	}

?>