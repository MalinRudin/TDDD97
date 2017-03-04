import sqlite3
from flask import g
import string
import random
import datetime

def connect_db():
    return sqlite3.connect("database.db")

def get_db():
    db = getattr(g, 'db', None)
    if db is None:
        db = g.db = connect_db()
    return db

def add_user(email, password, firstname, familyname, gender, city, country):
    if not(get_user_by_email(email)):
        try:
            c = get_db()
            c.execute("INSERT INTO users (email, password, firstname, familyname, gender, city, country) VALUES (?,?,?,?,?,?,?)", (email, password, firstname, familyname, gender, city, country))
            c.commit()
            return True
        except:
            return False

def get_user_by_email(email):
    try:
        c = get_db().cursor()
        c.execute("SELECT * FROM users WHERE email=?", (email,))
        return c.fetchone()
    except:
        return False

def get_user_by_token(token):
    try:
        c = get_db().cursor()
        c.execute("SELECT * FROM online_users WHERE token=?", (token,))
        email=c.fetchone()[0]
        return get_user_by_email(email)
    except:
        return False


def sign_in(email, password):
    try:
        c = get_db().cursor()
        c.execute("SELECT * FROM users WHERE email=? AND password=?", (email, password))
        token=token_generator()
        if c.fetchone():
            return [True, "Successfully signed in.", token]
        else:
            return [False, "Wrong username or password.", ""]
    except:
        return [False, "Error", ""]

def add_token(email, token):
    try:
        c = get_db()
        cur = c.cursor()
        cur.execute("SELECT * FROM online_users WHERE email=?", (email,))
        if cur.fetchone():
            c.execute("UPDATE online_users SET token=? WHERE email=?", (token, email))
            c.commit()
        else:
            c.execute("INSERT INTO online_users (email, token) VALUES (?,?)", (email, token))
            c.commit()

        return True
    except:
        return False

def sign_out(token):
    try:
        c = get_db()
        c.execute("DELETE FROM online_users WHERE token=?", (token,))
        c.commit()
        return True
    except:
        return False

def is_signed_in(token):
    try:
        c = get_db().cursor()
        c.execute("SELECT * FROM online_users WHERE token=?", (token,))
        if c.fetchone():
            return True
        else:
            return False
    except:
        return False

def change_password(token, oldpassword, newpassword):
    try:
        c=get_db()
        cur = c.cursor()
        cur.execute("SELECT * FROM online_users WHERE token=?", (token,))
        email = cur.fetchone()[0]

        cur.execute("SELECT * FROM users WHERE email=? AND password=?", (email, oldpassword))
        if cur.fetchone():
            c.execute("UPDATE users SET password=? WHERE email=?", (newpassword, email))
            c.commit()
            return [True, "Password changed."]
        else:
            return [False, "Wrong username or password."]
    except:
        return [False, "Error"]

def get_user_messages_by_token(token):
    try:
        c = get_db().cursor()
        c.execute("SELECT * FROM online_users WHERE token=?", (token,))
        email=c.fetchone()[0]
        return get_user_messages_by_email(email)
    except:
        return False

def get_user_messages_by_email(email):
    try:
        c = get_db().cursor()
        c.execute("SELECT * FROM messages WHERE touser=?", (email,))
        return c.fetchall()
    except:
        return False

def post_message(token, message, email):
    try:
        c = get_db()
        cur = c.cursor()
        cur.execute("SELECT * FROM online_users WHERE token=?", (token,))
        fromuser=cur.fetchone()[0]
        cur.execute("SELECT * FROM users WHERE email=?", (email,))
        if cur.fetchone():
            c.execute("INSERT INTO messages (fromuser, touser, message, time) VALUES (?,?,?,?)",
                      (fromuser, email, message, str(datetime.datetime.now())))
            c.commit()
            return True
        else:
            return False
    except:

        return False

def token_generator(size=36, chars=string.ascii_uppercase+string.ascii_lowercase+string.digits):
    return ''. join(random.choice(chars) for _ in range(size))

def earliest_date():
    try:
        c = get_db()
        cur = c.cursor()
        cur.execute("SELECT MIN(time) FROM messages")
        time=cur.fetchone()
        if time[0] == None:
            return "9999-01-01 00:00:00.000000"
        else:
            return time
    except:
        return False

def newest_date():
    try:
        c = get_db()
        cur = c.cursor()
        cur.execute("SELECT MAX(time) FROM messages")
        time=cur.fetchone()
        if time[0] == None:
            return "9999-01-01 00:00:00.000000"
        else:
            return time
    except:
        return False

def get_messages_statistics(firsttime, timestep, steps):
    data=[]
    timelabel=[]
    format = '%Y-%m-%d %H:%M:%S.%f'
    for i in xrange(steps):
        try:
            c = get_db()
            cur = c.cursor()

            fromtime = datetime.datetime.strptime(firsttime, format) + i * timestep
            totime=fromtime + timestep + datetime.timedelta(0, 1)
            cur.execute("SELECT COUNT(message) FROM messages WHERE time >= DATETIME(?) AND time < DATETIME(?)", (fromtime, totime))
            numberOfMessages=int(''.join(map(str,cur.fetchone())))
            data.append(numberOfMessages)
            timelabel.append(fromtime.strftime("%d %b %H:%M"))
        except:
            return False
    return [data, timelabel]

def get_city_statistics():
    try:
        c = get_db()
        cur = c.cursor()
        cur.execute("SELECT COUNT(email) AS numberOf, city, country FROM users GROUP BY city, country")
        return cur.fetchall()
    except:
        return False


def close():
    get_db().close()