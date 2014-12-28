<?php


class DB_PDO {

	// database handler.
	var $dbh;

	// db connection properties.
	var $dbhost;
	var $dbname;
	var $dbuser;
	var $dbpass;

	// Sometimes, you gotta debug.
	var $debug = false;

	// error messages
	var $error_flag = false;
	
	// set properly when inserts are used outside of transactions
	var $last_insert_id;
	

	function DB_PDO($host,$name,$user,$pass) {

		$this->dbhost = $host;
		$this->dbname = $name;
		$this->dbuser = $user;
		$this->dbpass = $pass;

		$this->tryConnection();

	}

	function tryConnection() {

		if (!$this->dbh) {
			try {
				$this->dbh = new PDO("mysql:host=".$this->dbhost.";dbname=".$this->dbname, $this->dbuser, $this->dbpass); 
				$this->dbh->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
				$this->dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			} catch(PDOException $e) {
				print ("Could not connect to server.\n");
				print ("getMessage(): " . $e->getMessage () . "\n");
				die("Database error.\n");
			}

			// We tell it to throw exceptions on errors, we catch these and report on them.
			$this->dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

		}

	}

	function getCol($q,$prep_array = array()) {

		$temporary = array();
		$returner = array();
		$result = $this->goSQL($q,$prep_array);

		if (!$this->error_flag) {

			// Get the results into an array.
			while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
				array_push($temporary,$row);
			}

			// Push the values from one row into an array.
			// Break at each column, because we only want the first column
			// But don't break after each row.
			foreach ($temporary as $head => $row) {
				foreach ($row as $key => $val) {
					array_push($returner,$val);
					break;
				}
			}

		}

		return $returner;

	}

	function getOne($q,$prep_array = array()) {

		$temporary = array();
		$returner = "";
		$result = $this->goSQL($q,$prep_array);

		if (!$this->error_flag) {

			// Get the results into an array.
			while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
				array_push($temporary,$row);
				break;
			}

			// Push the values from one row into a scalar.
			// Break at each point, we really just want the first one.
			foreach ($temporary as $head => $row) {
				foreach ($row as $key => $val) {
					$returner = $val;
					break;
				}
				break;
			}

		}

		return $returner;

	}

	function getAll($q,$prep_array = array()) {

		// Init our return.
		$returner = array();

		// Get a result.
		$result = $this->goSQL($q,$prep_array);
		
		if (!$this->error_flag) {

			// Cycle that result, and push it.
			while ($row = $result->fetch (PDO::FETCH_ASSOC)) {
				array_push($returner,$row);
			}

		}	
		
		return $returner;

	}

	function getRow($q,$prep_array = array()) {

		$temporary = array();
		$returner = array();
		$result = $this->goSQL($q,$prep_array);

		if (!$this->error_flag) {

			// Get the results into an array.
			while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
				array_push($temporary,$row);
				break;
			}

			// Push the values from one row into an array.
			foreach ($temporary as $head => $row) {
				foreach ($row as $key => $val) {
					$returner[$key] = $val;
				}
				break;
			}

		}

		return $returner;

	}

	// Make a straight up query.
	function query($q,$prep_array = array()) {
		// Just abstract goSQL
		return $this->goSQL($q,$prep_array);
	}

	// Query the database.
	function goSQL ($statement,$prep_array = array()) { // database wrapper

		// Echo the statement if debugging
		if ($this->debug) {
			echo "DB_PDO:Statement debug:".$statement."\n";
		}

		$this->tryConnection();

		try {
			if (empty($prep_array)) {
				$result = $this->dbh->query($statement);
			} else {
				$result = $this->dbh->prepare($statement);
				$result->execute($prep_array);
			}

			$this->error_flag = false;
			$this->last_insert_id = $this->dbh->lastInsertId();
		} catch(PDOException $e) {
			$this->error_flag = true;
			$this->error_message = $e->getMessage();
			echo 'PDO Query error: ' . $e->getMessage();
			echo "\n\n";
			return array();
		}

		return $result;

	}

}

?>