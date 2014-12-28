#!/bin/bash
mongoexport --db smcman --collection chat --out json/chat.json
mongoexport --db smcman --collection notes --out json/notes.json 
mongoexport --db smcman --collection admins --out json/admins.json 
mongoexport --db smcman --collection counters --out json/counters.json
mongoexport --db smcman --collection uploads --out json/uploads.json
mongoexport --db smcman --collection users --out json/users.json
mongoexport --db smcman --collection smcs --out json/smcs.json

