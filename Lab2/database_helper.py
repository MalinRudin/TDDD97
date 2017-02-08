import os
import sqlite3
from flask import g
from server import app

def connect_db():
    return sqlite3.connect("database.db")

def get_db():
    db = getattr(g, 'db', None)
    if db is None:
        db = g.db = connect_db()
    return db

def add_user(email, password, firstname, familyname, gender, city, country):
    c = get_db()
    c.execute("insert into users (email, password, firstname, familyname, gender, city, country) values (?,?,?,?,?,?,?)", (email, password, firstname, familyname, gender, city, country))
    c.commit()

def close():
    get_db().close()