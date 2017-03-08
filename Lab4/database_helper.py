import sqlite3
from flask import g, json
import string
import random
import datetime
import hashlib

from flask_bcrypt import Bcrypt
from server import app

bcrypt = Bcrypt(app)

# Create connection object to represent the database
def connect_db():
    return sqlite3.connect("database.db")

# Gte the current database connection
def get_db():
    db = getattr(g, 'db', None)
    if db is None:
        db = g.db = connect_db()
    return db

# Add a new user to database
def add_user(email, password, firstname, familyname, gender, city, country):
    # If user does not already exist
    if not(get_user_by_email(email)):
        try:
            # Create a hashed version of password for storage
            password_hash = bcrypt.generate_password_hash(password)

            # Store user information in database
            c = get_db()
            c.execute("INSERT INTO users (email, password, firstname, familyname, gender, city, country) VALUES (?,?,?,?,?,?,?)", (email, password_hash, firstname, familyname, gender, city, country))
            c.commit()
            return True
        except:
            return False

# Fetch user information from database based on email
def get_user_by_email(email):
    try:
        c = get_db().cursor()
        c.execute("SELECT * FROM users WHERE email=?", (email,))
        return c.fetchone()
    except:
        return False

# Get user email from database based on token
def get_user_by_token(token):
    try:
        c = get_db().cursor()
        c.execute("SELECT * FROM online_users WHERE token=?", (token,))
        email=c.fetchone()[0]
        return get_user_by_email(email)
    except:
        return False

# Get user key  from database based on token
def get_key_by_token(token):
    try:
        c = get_db().cursor()
        c.execute("SELECT * FROM online_users WHERE token=?", (token,))
        key = c.fetchone()[2]
        return key
    except:
        return False

# Sign in user
def sign_in(email, password):
    try:
        # Retrieve user from database based on username email (is assumed to be unique)
        c = get_db().cursor()
        c.execute("SELECT * FROM users WHERE email=?", (email,))
        user_info = c.fetchone()

        # Make sure user exists in database
        if user_info:
            # Fetch the stored hashed password
            password_hash = user_info[1]

            # Compare hashed password stored in database with given password
            if bcrypt.check_password_hash(password_hash, password):
                # Return generated token and key
                return [True, "Successfully signed in.", [token_generator(), token_generator()]]
            else:
                return [False, "Wrong username or password.", ""]

        else:
            return [False, "Wrong username or password.", ""]
    except:
        return [False, "Error", ""]

# Add token and key to database
def add_token(email, data):
    try:
        c = get_db()
        cur = c.cursor()
        cur.execute("SELECT * FROM online_users WHERE email=?", (email,))

        # Check if user exist in database
        # If so, update database with new token and key
        # If not, add user, token and key to database
        if cur.fetchone():
            c.execute("UPDATE online_users SET token=?, key=? WHERE email=?", (data[0], data[1], email))
            c.commit()
        else:
            c.execute("INSERT INTO online_users (email, token, key) VALUES (?,?,?)", (email, data[0], data[1]))
            c.commit()

        return True
    except:
        return False

# Sign out user based in token
def sign_out(token):
    try:
        # Delete user from database/online_users
        c = get_db()
        c.execute("DELETE FROM online_users WHERE token=?", (token,))
        c.commit()
        return True
    except:
        return False

# Check if user is signed in based on token
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

# Change password for signed in user
def change_password(token, oldpassword, newpassword):
    try:
        c=get_db()
        cur = c.cursor()
        # Fetch email from database using token
        cur.execute("SELECT * FROM online_users WHERE token=?", (token,))
        email = cur.fetchone()[0]

        # Fetch user information from database
        cur.execute("SELECT * FROM users WHERE email=?", (email,))
        user_info = cur.fetchone()

        # Make sure user exists
        if user_info:
            # Check that old password is correct
            if bcrypt.check_password_hash(user_info[1], oldpassword):
                # Create a hashed version of new password
                newpassword_hash = bcrypt.generate_password_hash(newpassword)

                # Store new hashed password in database
                c.execute("UPDATE users SET password=? WHERE email=?", (newpassword_hash, email))
                c.commit()
                return [True, "Password changed."]
            else:
                return [False, "Wrong username or password."]
        else:
            return [False, "Wrong username or password."]
    except:
        return [False, "Error"]

# Fetch user messages from database based on token
def get_user_messages_by_token(token):
    try:
        c = get_db().cursor()
        c.execute("SELECT * FROM online_users WHERE token=?", (token,))
        email=c.fetchone()[0]
        return get_user_messages_by_email(email)
    except:
        return False

# Fetch user messages from database based on email
def get_user_messages_by_email(email):
    try:
        c = get_db().cursor()
        c.execute("SELECT * FROM messages WHERE touser=?", (email,))
        return c.fetchall()
    except:
        return False

# Save message in database
def post_message(token, message, email):
    try:
        c = get_db()
        cur = c.cursor()
        # Fetch email of user that sends the message
        cur.execute("SELECT * FROM online_users WHERE token=?", (token,))
        fromuser=cur.fetchone()[0]
        # Check if user that receives message exists
        cur.execute("SELECT * FROM users WHERE email=?", (email,))
        if cur.fetchone():
            # Insert message in database
            c.execute("INSERT INTO messages (fromuser, touser, message, time) VALUES (?,?,?,?)",
                      (fromuser, email, message, str(datetime.datetime.now())))
            c.commit()
            return True
        else:
            return False
    except:

        return False

# Generate a random string of characters
def token_generator(size=36, chars=string.ascii_uppercase+string.ascii_lowercase+string.digits):
    return ''. join(random.choice(chars) for _ in range(size))

#  Returns the time of earliest posted message
def earliest_date():
    try:
        c = get_db()
        cur = c.cursor()
        cur.execute("SELECT MIN(time) FROM messages")
        time=cur.fetchone()
        #  Returns a default value if there are no messages in the database
        if time[0] == None:
            return "9999-01-01 00:00:00.000000"
        else:
            return time
    except:
        return False

#  Returns the time of latest posted message
def newest_date():
    try:
        c = get_db()
        cur = c.cursor()
        cur.execute("SELECT MAX(time) FROM messages")
        time=cur.fetchone()
        #  Returns a default value if there are no messages in the database
        if time[0] == None:
            return "9999-01-01 00:00:00.000000"
        else:
            return time
    except:
        return False

#  Creates message statistics
def get_messages_statistics(firsttime, timestep, steps):
    data=[]
    timelabel=[]
    format = '%Y-%m-%d %H:%M:%S.%f'
    #  Loops as many times as there is steps.
    for i in xrange(steps):
        try:
            c = get_db()
            cur = c.cursor()
            #  Create new fromtime, starttime+i*timestep
            fromtime = datetime.datetime.strptime(firsttime, format) + i * timestep
            #  Create new totime, fromtime+timestep+ 1 second to retrieve even the last message
            totime=fromtime + timestep + datetime.timedelta(0, 1)
            cur.execute("SELECT COUNT(message) FROM messages WHERE time >= DATETIME(?) AND time < DATETIME(?)", (fromtime, totime))
            numberOfMessages=int(''.join(map(str,cur.fetchone())))
            data.append(numberOfMessages)
            timelabel.append(fromtime.strftime("%d %b %H:%M"))
        except:
            return False
    return [data, timelabel]

#  Creates city statistics
def get_city_statistics():
    try:
        c = get_db()
        cur = c.cursor()
        # This returns a array were [0] is how many there is that
        # have the unique combination city [1] and country [2]
        cur.execute("SELECT COUNT(email) AS numberOf, city, country FROM users GROUP BY city, country")
        return cur.fetchall()
    except:
        return False

# Divide receive data and return original data
def decrypt_data(data):
    data = json.loads(data)

    # Validates that 
    if validate_token(data):
        return {"success": True, "data": data["data"]}
    else:
        return {"success": False, "data": data["data"]}

# Validate that token from sender equals token in database
def validate_token(data):
    token = data["id"]
    hash = data["hash"]
    org_data = data["data"]

    # Use token to look up key in database
    # Use data and key to create new hash
    # Compare new hash with received hash, return true if match, false if not
    if not token == "null" or token == None:
        key = get_key_by_token(token)
        data_to_hash = json.dumps(org_data, sort_keys=True)+str(key)
        hash_data = hashlib.sha256(data_to_hash).hexdigest()
        return hash_data == hash

    # If no token then user is not signed in yet and no token or key exist
    return True

#  Returns user data, key and token for google user
def getGoogleuser(userid):
    try:
        # Retrieve user from database based on googleId
        c = get_db().cursor()
        c.execute("SELECT * FROM users WHERE googleId=?", (userid,))
        user_info = c.fetchone()

        # Make sure user exists in database
        if user_info:
            return [True, "Successfully signed in.", user_info[0], [token_generator(), token_generator()]]
        else:
            return [False, "No such user.","" , ""]
    except:
        return [False, "Error", "", ""]

#  Adds a google user to the database
def add_googleuser(email, firstname, familyname, gender, city, country, userid):
    if not(get_user_by_email(email)):
        try:
            # Store user information in database
            c = get_db()
            c.execute("INSERT INTO users (email, firstname, familyname, gender, city, country, googleId) VALUES (?,?,?,?,?,?,?)", (email, firstname, familyname, gender, city, country, userid))
            c.commit()
            return True
        except:
            return False

#  Closes the database
def close():
    get_db().close()
