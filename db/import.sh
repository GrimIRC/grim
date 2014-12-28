#!/bin/bash
echo "Just clearing out chat and uploads...."
function clearCollection {
    mongo <<EOF
    use smcman
    db.chat.remove()
    db.uploads.remove()
EOF
}
clearCollection

echo "Now importing everything..."

mongoimport --db smcman --collection chat --file json/chat.json
mongoimport --db smcman --collection notes --file json/notes.json
mongoimport --db smcman --collection admins --file json/admins.json
mongoimport --db smcman --collection counters --file json/counters.json
mongoimport --db smcman --collection uploads --file json/uploads.json
mongoimport --db smcman --collection users --file json/users.json
mongoimport --db smcman --collection smcs --file json/smcs.json

