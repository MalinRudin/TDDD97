from geventwebsocket.handler import WebSocketHandler  # Websocket import
from geventwebsocket import WebSocketError
from gevent.pywsgi import WSGIServer    # WSGI server import
from flask import request, Flask    # Flask import
from datetime import datetime
from oauth2client import client, crypt  #   Import for google auth
from flask import jsonify

app = Flask(__name__)
import database_helper

#  Dict for handling online users
online_users={}

#  Route all client routing
@app.route('/home')
@app.route('/browse')
@app.route('/account')
@app.route('/statistics')
@app.route('/')
def index():
    #  Send them to the static file client.html
    return app.send_static_file('client.html')

#  route that handel socket XMLHttp requests.
@app.route('/socket')
def socket():
    if request.environ.get('wsgi.websocket'):
        ws = request.environ['wsgi.websocket']
        while True:
            try:
                # Receive and decrypt data
                data_obj = database_helper.decrypt_data(ws.receive())
                data = data_obj["data"]
                success = data_obj["success"]

                if success:
                    if data["message"] == "close connection":
                        user=database_helper.get_user_by_token(data["token"])
                        #  There is a user
                        if user is not False:
                            #  check if it exist in online_users
                            if online_users.get(user[0]):
                                #  Delete from online_users
                                del online_users[user[0]]
                        updateLiveUser() #update livedata
                        break  # Stop while loop

                    if data["message"] == "signin":
                        user = database_helper.get_user_by_token(data["token"])
                        if user is not False:
                            #  add socket to online_users
                            online_users[user[0]]=ws
                        updateLiveUser()  # update livedata
                else:
                    print "Not a trusted user"


            except WebSocketError as e:
                print(str(e))
                break  # Stop while loop

        return ""  #


@app.route('/sign_in', methods=['POST'])
# (email, password)
def sign_in():
    # Receive data and decrypt it
    data_obj = database_helper.decrypt_data(request.form['data'])
    data = data_obj["data"]
    success = data_obj["success"]

    email = data["email"]
    password = data["password"]

    [success, message, data]=(database_helper.sign_in(email, password))
    if success:
        if online_users.get(email):
            try:
                online_users[email].send("signout")
            except:
                print "Socket is already dead."
        updateLiveUser()  # update livedata

    # Add token and key to database
    database_helper.add_token(email, data)
    data = {'success': success, 'message': message, "data": data}
    return jsonify(data)

@app.route('/sign_up', methods=['POST'])
# sign_up(email, password, firstname, familyname, gender, city, country)
def sign_up():
    data_obj = database_helper.decrypt_data(request.form['data'])
    data = data_obj["data"]

    email = data["email"]
    password = data['password']
    firstname = data['firstname']
    familyname = data['familyname']
    gender = data['gender']
    city = data['city']
    country = data['country']

    if email.find('@')==-1:
        data = {'success': False, 'message': 'Error, invalid email.'}
        return jsonify(data)
    if len(password)<6:
        data = {'success': False, 'message': 'Error, password to short.'}
        return jsonify(data)
    if len(email)<1 or len(password)<1 or len(firstname)<1 or len(familyname)<1 or len(gender)<1 or len(city)<1 or len(country)<1:
        data = {'success': False, 'message': 'Error, invalid data.'}
        return jsonify(data)

    if database_helper.add_user(email, password, firstname, familyname, gender, city, country):
        data={'success': True, 'message': 'Successfully created a new user.'}
        updateLiveCity()  # update the city statistics
        return jsonify(data)
    else:
        data = {'success': False, 'message': 'Error, no user created.'}
        return jsonify(data)

@app.route('/sign_out', methods=['POST'])
#sign_out(token)
def sign_out():
    # Receive and decrypt data
    data_obj = database_helper.decrypt_data(request.form['data'])
    data = data_obj["data"]
    success = data_obj["success"]

    # Checks if correct user
    if success:
        token = data['token']

        userdata = database_helper.get_user_by_token(token)
        if userdata is not False:
            if online_users.get(userdata[0]):
                del online_users[userdata[0]]
            updateLiveUser()  # update livedata
        if database_helper.sign_out(token):

            data = {'success': True, 'message': 'Successfully signed out.'}
            return jsonify(data)
        else:
            data = {'success': False, 'message': 'Error with sign out'}
            return jsonify(data)
    else:
        data = {'success': False, 'message': 'You been logged out by another client.'}
        return jsonify(data)

@app.route('/change_password', methods=['POST'])
#change_password(token, old_password, new_password)
def change_password():
    # Receive and decrypt data
    data_obj = database_helper.decrypt_data(request.form['data'])
    data = data_obj["data"]
    success = data_obj["success"]

    # Check if correct user
    if success:
        token = data['token']
        oldpassword = data['oldpassword']
        newpassword = data['newpassword']

        if len(newpassword)<6:
            data = {'success': False, 'message': 'Error, password to short.'}
            return jsonify(data)
        if database_helper.is_signed_in(token):
            [success, message]=database_helper.change_password(token, oldpassword, newpassword)
            data = {'success': success, 'message': message}
            return jsonify(data)
        else:
            data = {'success': False, 'message': 'You are not logged in.'}
            return jsonify(data)
    else:
        data = {'success': False, 'message': 'Error with change password.'}
        return jsonify(data)

@app.route('/get_user_data_by_token', methods=['POST'])
#get_user_data_by_token(token)
def get_user_data_by_token():
    # Revieve and decrypt data
    data_obj = database_helper.decrypt_data(request.form['data'])
    data = data_obj["data"]
    success = data_obj["success"]

    # Check if correct user
    if success:
        token = data['token']

        if database_helper.is_signed_in(token):
            data=database_helper.get_user_by_token(token)
            if data:
                userdata = {}
                userdata["email"]=data[0]
                userdata["firstname"] = data[2]
                userdata["familyname"]=data[3]
                userdata["gender"]=data[4]
                userdata["city"] = data[5]
                userdata["country"] = data[6]
                jsondata = {'success': True, 'message': "User data retrieved.", "data": userdata}
                return jsonify(jsondata)
            else:
                data = {'success': False, 'message': 'No such user'}
                return jsonify(data)
        else:
            data = {'success': False, 'message': 'You are not logged in.'}
            return jsonify(data)
    else:
        data = {'success': False, 'message': 'Error receiving user data.'}
        return jsonify(data)

@app.route('/get_user_data_by_email', methods=['POST'])
#get_user_data_by_email(token, email)
def get_user_data_by_email():
    # Receive and decrypt data
    data_obj = database_helper.decrypt_data(request.form['data'])
    data = data_obj["data"]
    success = data_obj["success"]

    # Check if correct user
    if success:
        token = data['token']
        email = data['email']

        if database_helper.is_signed_in(token):
            data = database_helper.get_user_by_email(email)
            if data:
                userdata = {}
                userdata["email"] = data[0]
                userdata["firstname"] = data[2]
                userdata["familyname"] = data[3]
                userdata["gender"] = data[4]
                userdata["city"] = data[5]
                userdata["country"] = data[6]
                jsondata = {'success': True, 'message': "User data retrieved.", "data": userdata}
                return jsonify(jsondata)
            else:
                data = {'success': False, 'message': 'No such user'}
                return jsonify(data)
        else:
            data = {'success': False, 'message': 'You are not logged in.'}
            return jsonify(data)
    else:
        data = {'success': False, 'message': 'Error receiving user data.'}
        return jsonify(data)

@app.route('/get_user_messages_by_token', methods=['POST'])
#get_user_messages_by_token(token)
def get_user_messages_by_token():
    # Receive and decrypt data
    data_obj = database_helper.decrypt_data(request.form['data'])
    data = data_obj["data"]
    success = data_obj["success"]

    # Check if correct user
    if success:
        token = data['token']

        if database_helper.is_signed_in(token):
            messages = database_helper.get_user_messages_by_token(token)
            if messages:
                data = {'success': True, 'message': 'User messages retrieved.', 'data': messages}
                return jsonify(data)
            else:
                data = {'success': False, 'message': 'No messages found.'}
                return jsonify(data)
        else:
            data = {'success': False, 'message': 'You are not logged in.'}
            return jsonify(data)
    else:
        data = {'success': False, 'message': 'Error receiving messages.'}
        return jsonify(data)

@app.route('/get_user_messages_by_email', methods=['POST'])
#get_user_messages_by_email(token, email)
def get_user_messages_by_email():
    # Recieve and decrypt data
    data_obj = database_helper.decrypt_data(request.form['data'])
    data = data_obj["data"]
    success = data_obj["success"]

    # Check if correct user
    if success:
        token = data['token']
        email = data['email']

        if database_helper.is_signed_in(token):
            messages = database_helper.get_user_messages_by_email(email)
            if messages:
                data = {'success': True, 'message': 'User messages retrieved.', 'data': messages}
                return jsonify(data)
            else:
                data = {'success': False, 'message': 'No messages found.'}
                return jsonify(data)
        else:
            data = {'success': False, 'message': 'You are not logged in.'}
            return jsonify(data)
    else:
        data = {'success': False, 'message': 'Error receiving messages.'}
        return jsonify(data)

@app.route('/post_message', methods=['POST'])
#post_message(token, message, email)
def post_message():
    # Receive and decrytp data
    data_obj = database_helper.decrypt_data(request.form['data'])
    data = data_obj["data"]
    success = data_obj["success"]

    # Check if correct user
    if success:
        token = data['token']
        email = data['email']
        message = data['message']

        if database_helper.is_signed_in(token):
            if database_helper.post_message(token, message, email):
                data = {'success': True, 'message': 'Message posted'}
                updateLiveMessage()
                return jsonify(data)
            else:
                data = {'success': False, 'message': 'No such user.'}
                return jsonify(data)
        else:
            data = {'success': False, 'message': 'You are not logged in.'}
            return jsonify(data)
    else:
        data = {'success': False, 'message': 'Error posting message.'}
        return jsonify(data)

#  XMLHttp response for the user statistics
@app.route('/liveuser', methods=["POST"])
def liveuser():
    male=0
    female=0
    unknown=0
    #  Loop over all online users
    for email in online_users.iterkeys():
        data=database_helper.get_user_by_email(email)
        # Check the gender and update the variables
        if data is not False:
            gender=data[4]
            if gender == "Male":
                male += 1
            elif gender == "Female":
                female += 1
            else:
                unknown +=1
    data = {'male' : male, 'female': female, 'unknown': unknown}
    return jsonify(data)

#  Function called when user statistics is changed login/logout
def updateLiveUser():
    #  Send to all online user
    for user, socket in online_users.items():
        try:
            socket.send("liveuser")
        except:
            print "Socket is already dead."

#  Function called when message statistics is changed -> message posted
def updateLiveMessage():
    # send message to all online users
    for user, socket in online_users.items():
        try:
            socket.send("livemessage")
        except:
            print "Socket is already dead."

# Function called when a new user is created
def updateLiveCity():
    # send message to all online users
    for user, socket in online_users.items():  # send message to update livedata to online users
        try:
            socket.send("livecity")
        except:
            print "Socket is already dead."

#  Create message statistics
@app.route('/livemessage', methods=["POST"])
def livemessage():
    firsttime=''.join(database_helper.earliest_date())
    lasttime=''.join(database_helper.newest_date())
    format='%Y-%m-%d %H:%M:%S.%f'
    #  Calculate the timespan between the first and he last message
    timespan=datetime.strptime(lasttime, format) - datetime.strptime(firsttime, format)
    steps=20
    #  Divide the timespan in to steps
    timestep=timespan/steps
    #  Get data from the database
    data=database_helper.get_messages_statistics(firsttime, timestep, steps)
    return jsonify(data)

#  Routing of city statistic, mostly done in database_helper
@app.route('/livecity', methods=["POST"])
def livecity():
    data=database_helper.get_city_statistics()
    return jsonify(data)

#  Handles a googlesign in
@app.route('/googlesignin', methods=["POST"])
def googlesignin():
    token = request.form['idtoken']
    userid=googleverify(token)

    if userid is not False:
        [success, message, email, data] = database_helper.getGoogleuser(userid)
        #  There is such a user
        if success:
            #  Already signed in
            if online_users.get(email):
                #  Logout other clients
                try:
                    online_users[email].send("signout")
                except:
                    print "Socket is already dead."
            updateLiveUser()  # update livedata

            # Add token and key to database
            database_helper.add_token(email, data)
            data = {'success': success, 'message': message, "data": data}
            return jsonify(data)
        else:
            data = {'success': False, 'message': 'No user exist for this googleid.'}
            return jsonify(data)
    else:
        data = {'success': False, 'message': 'Invalid token .'}
        return jsonify(data)

#  Function that signup a google user
@app.route('/googlesignup', methods=["POST"])
def googlesignup():
    data_obj = database_helper.decrypt_data(request.form['data'])
    data = data_obj["data"]

    #  Get google userid
    userid = googleverify(data["id_token"])
    email = data["email"]
    firstname = data['firstname']
    familyname = data['familyname']
    gender = data['gender']
    city = data['city']
    country = data['country']

    if database_helper.add_googleuser(email, firstname, familyname, gender, city, country, userid):
        data={'success': True, 'message': 'Successfully created a new user.'}
        updateLiveCity()  # update the city statistics
        return jsonify(data)
    else:
        data = {'success': False, 'message': 'Error, no user created.'}
        return jsonify(data)

#  Gets the google userid by it's idtooken
def googleverify(id_token):
    GOOGLE_CLIENT_ID = '296246087105-7tgq8nj5jvpr2uu40dauc1a3vicgv2lq.apps.googleusercontent.com'
    try:
        idinfo = client.verify_id_token(id_token, GOOGLE_CLIENT_ID)

        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise crypt.AppIdentityError("Wrong issuer.")

        userid = idinfo['sub']
        return userid
    except:
        return False

#  Start the server
if __name__ == '__main__':
    http_server = WSGIServer(('', 5000), app, handler_class=WebSocketHandler)
    http_server.serve_forever()
