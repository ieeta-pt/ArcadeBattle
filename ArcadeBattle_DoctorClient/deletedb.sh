#!/bin/sh

# delete migrations
rm -r app/migrations

# delet db
rm db.sqlite3

# refactor db
python manage.py makemigrations app 
python manage.py sqlmigrate app 0001
python manage.py migrate 
