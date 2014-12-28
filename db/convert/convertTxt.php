<?php

	require_once("globals.php");

	$ct = new convertTxt();

	class convertTxt {

		var $db;

		function convertTxt() {

			$this->db = $GLOBALS['db'];

			$txt = $this->db->getAll("SELECT * FROM txt");

			// print_r($txt);

			$whole = array();

			foreach ($txt as $t) {

				$num_params = preg_match_all("/\%\d+?\%/", $t['string']);
				echo "----------------------> num params: ".$num_params."\n";
				
				$redo = preg_replace("/(\%\d+?)\%/", "$1", $t['string']);

				$object = array(
					"fields" => $num_params,
					"identifier" => $t['command'],
					"text" => $redo,
				);

				print_r($object);

				array_push($whole, $object);


			}

			echo json_encode($whole)."\n";

			echo "cool!\n";

		}

	}

?>