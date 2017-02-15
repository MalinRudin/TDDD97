import os
import sqlite3
from flask import g
from server import app

def connect_db():
    return sqlite3.connect('database.db')

def get_db():
    db = getattr(g, 'db', None)
    if db is None:
        g.db = connect_db()
    return g.db.cursor()

def add_user(email, password, firstname, familyname, gender, city, country):
    if not(get_user_by_email(email)):
        try:
            c = get_db()
            c.execute("insert into users (email, password, firstname, familyname, gender, city, country) values (?,?,?,?,?,?,?)", (email, password, firstname, familyname, gender, city, country))
            c.commit()
            return True
        except:
            return False

def get_user_by_email(email):
    try:
        c = get_db()
        c.execute('SELECT * FROM users WHERE email=?', email)
        #user=c.fetchone()
        c.commit()
        return 'user'
    except:
        return False

def sign_in(email, password):

    try:
        c = get_db()
        c.execute("SELECT * FROM users WHERE email=? AND password=?", (email, password))
        c.commit()
        return "Hej"
    except:
        return [False, "Error"]
    if user[0] == 1:
        token = "HLKHASKD"
        return [True, token]
    return [False, "Kass"]


def debug():
    c = get_db()
    c.execute("SELECT * FROM users WHERE email='123'")

    if c.fetchone():
        print("Found!")

    else:
        print("Not found...")


def close():
    get_db().close()