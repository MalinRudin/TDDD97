from flask import request, Flask
app = Flask(__name__)
import database_helper

@app.route('/')
def index():
    return 'Hello World!'


@app.route('/sign_in', methods=['POST'])
# (email, password)
def sign_in():
    test=request.form['test']
    name = request.form['name']
    return test+name

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
    database_helper.add_user(email, password, firstname, familyname, gender, city, country)
    return 'Kankse gick bra!'

@app.route('/sign_out', methods=['POST'])
#sign_out(token)
def sign_out():
    return ''

@app.route('/change_password', methods=['POST'])
#change_password(token, old_password, new_password)
def change_password():
    return ''

@app.route('/get_user_data_by_token', methods=['POST'])
#get_user_data_by_token(token)
def get_user_data_by_token():
    return ''

@app.route('/get_user_data_by_email', methods=['POST'])
#get_user_data_by_email(token, email)
def get_user_data_by_email():
    return ''

@app.route('/get_user_messages_by_token', methods=['POST'])
#get_user_messages_by_token(token)
def get_user_messages_by_token():
    return ''

@app.route('/get_user_messages_by_email', methods=['POST'])
#get_user_messages_by_email(token, email)
def get_user_messages_by_email():
    return ''

@app.route('/post_message', methods=['POST'])
#post_message(token, message, email)
def post_message():
    return ''

if __name__ == '__main__':
    app.run()