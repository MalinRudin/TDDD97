from geventwebsocket.handler import WebSocketHandler
from geventwebsocket import WebSocketError
from gevent.pywsgi import WSGIServer
from flask import request, Flask

import json
app = Flask(__name__)
import database_helper

# online_users[0]=websocket conection, online_users[1]=emailadress
online_users=[]

@app.route('/')
def index():
    return app.send_static_file('client.html')

@app.route('/socket')
def socket():
    if request.environ.get('wsgi.websocket'):
        ws = request.environ['wsgi.websocket']
        while True:
            try:
                data = ws.receive()
                if data == "close connection":
                    for user in online_users:  # loop throw all online users
                        if user[0] == ws:  # The connection match
                            online_users.remove(user)  # remove this one
                            break  # Stop while loop

                if data is not None: #then it's a token
                    user = database_helper.get_user_by_token(data)
                    if user is not False:
                        online_users.append([ws, user[0]])

            except WebSocketError as e:
                print(str(e))
                break  # Stop while loop

        return ""  #


@app.route('/sign_in', methods=['POST'])
# (email, password)
def sign_in():
    email=request.form['email']
    password = request.form['password']
    [success, message, token]=(database_helper.sign_in(email, password))
    for user in online_users:
        if user[1]==email: #loged in on other computer
            user[0].send('signout')  # Send logout message
            online_users.remove(user)


    database_helper.add_token(email, token)
    data = {'success': success, 'message': message, "data": token}
    return json.dumps(data)

@app.route('/sign_up', methods=['POST'])
#sign_up(email, password, firstname, familyname, gender, city, country)
def sign_up():
    email = request.form['email']
    password = request.form['password']
    firstname = request.form['firstname']
    familyname = request.form['familyname']
    gender = request.form['gender']
    city = request.form['city']
    country = request.form['country']
    if email.find('@')==-1:
        data = {'success': False, 'message': 'Error, invalid email.'}
        return json.dumps(data)
    if len(password)<6:
        data = {'success': False, 'message': 'Error, password to short.'}
        return json.dumps(data)
    if len(email)<1 or len(password)<1 or len(firstname)<1 or len(familyname)<1 or len(gender)<1 or len(city)<1 or len(country)<1:
        data = {'success': False, 'message': 'Error, invalid data.'}
        return json.dumps(data)

    if database_helper.add_user(email, password, firstname, familyname, gender, city, country):
        data={'success': True, 'message': 'Successfully created a new user.'}
        return json.dumps(data)
    else:
        data = {'success': False, 'message': 'Error, no user created.'}
        return json.dumps(data)

@app.route('/sign_out', methods=['POST'])
#sign_out(token)
def sign_out():
    token= request.form['token']
    userdata = database_helper.get_user_by_token(token)
    if userdata is not False:
        for user in online_users:  # loop through online_users
            if user[1] == userdata[0]:  # userdata[0]=email
                 #user[0].send("close")
                 #user[0].close()  # close connection
                online_users.remove(user) # remove users were email match
    if database_helper.sign_out(token):

        data = {'success': True, 'message': 'Successfully signed out.'}
        return json.dumps(data)
    else:
        data = {'success': False, 'message': 'Error'}
        return json.dumps(data)

@app.route('/change_password', methods=['POST'])
#change_password(token, old_password, new_password)
def change_password():
    token = request.form['token']
    oldpassword = request.form['oldpassword']
    newpassword = request.form['newpassword']
    if len(newpassword)<6:
        data = {'success': False, 'message': 'Error, password to short.'}
        return json.dumps(data)
    if database_helper.is_signed_in(token):
        [success, message]=database_helper.change_password(token, oldpassword, newpassword)
        data = {'success': success, 'message': message}
        return json.dumps(data)
    else:
        data = {'success': False, 'message': 'You are not logged in.'}
        return json.dumps(data)

@app.route('/get_user_data_by_token', methods=['POST'])
#get_user_data_by_token(token)
def get_user_data_by_token():
    token = request.form['token']
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
            return json.dumps(jsondata)
        else:
            data = {'success': False, 'message': 'No such user'}
            return json.dumps(data)
    else:
        data = {'success': False, 'message': 'You are not logged in.'}
        return json.dumps(data)

@app.route('/get_user_data_by_email', methods=['POST'])
#get_user_data_by_email(token, email)
def get_user_data_by_email():
    token = request.form['token']
    email = request.form['email']
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
            return json.dumps(jsondata)
        else:
            data = {'success': False, 'message': 'No such user'}
            return json.dumps(data)
    else:
        data = {'success': False, 'message': 'You are not logged in.'}
        return json.dumps(data)

@app.route('/get_user_messages_by_token', methods=['POST'])
#get_user_messages_by_token(token)
def get_user_messages_by_token():
    token = request.form['token']
    if database_helper.is_signed_in(token):
        messages = database_helper.get_user_messages_by_token(token)
        if messages:
            data = {'success': True, 'message': 'User messages retrieved.', 'data': messages}
            return json.dumps(data)
        else:
            data = {'success': False, 'message': 'No messages found.'}
            return json.dumps(data)
    else:
        data = {'success': False, 'message': 'You are not logged in.'}
        return json.dumps(data)

@app.route('/get_user_messages_by_email', methods=['POST'])
#get_user_messages_by_email(token, email)
def get_user_messages_by_email():
    token = request.form['token']
    email = request.form['email']
    if database_helper.is_signed_in(token):
        messages = database_helper.get_user_messages_by_email(email)
        if messages:
            data = {'success': True, 'message': 'User messages retrieved.', 'data': messages}
            return json.dumps(data)
        else:
            data = {'success': False, 'message': 'No messages found.'}
            return json.dumps(data)
    else:
        data = {'success': False, 'message': 'You are not logged in.'}
        return json.dumps(data)

@app.route('/post_message', methods=['POST'])
#post_message(token, message, email)
def post_message():
    token = request.form['token']
    email = request.form['email']
    message= request.form['message']
    if database_helper.is_signed_in(token):
        if database_helper.post_message(token, message, email):
            data = {'success': True, 'message': 'Message posted'}
            return json.dumps(data)
        else:
            data = {'success': False, 'message': 'No such user.'}
            return json.dumps(data)
    else:
        data = {'success': False, 'message': 'You are not logged in.'}
        return json.dumps(data)

if __name__ == '__main__':
    http_server = WSGIServer(('', 5000), app, handler_class=WebSocketHandler)
    http_server.serve_forever()