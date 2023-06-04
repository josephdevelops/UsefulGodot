extends CanvasLayer

@onready var new_user_button = $NewUserButton
@onready var reset_password_button = $ResetPasswordButton
@onready var http_request = $HTTPRequest

@onready var email_input = $EmailInput
@onready var password_input = $PasswordInput
@onready var prompt_text = $PromptText

@onready var name_input = $NameInput
@onready var submit_name = $NameButton

@onready var score_input = $ScoreInput
@onready var submit_score_button = $SubmitScoreButton


# Use this game API key if you want to test it with a functioning leaderboard
# "987dbd0b9e5eb3749072acc47a210996eea9feb0"
var game_API_key = "dev_95b740a89c8e4724831231d7626441d1"
var domain_key = ["domain-key : t7td55y9"]
var leaderboard_key = "14610"
var development_mode = true
var token
var user_id
var player_identifier
var score

var method = HTTPClient.METHOD_POST
var method_get = HTTPClient.METHOD_GET
var method_patch = HTTPClient.METHOD_PATCH


var leaderboard_http = HTTPRequest.new()
var submit_score_http = HTTPRequest.new()
var set_player_name_http = HTTPRequest.new()
var get_player_info_http = HTTPRequest.new()
var get_name_http = HTTPRequest.new()
var increase_balance_http = HTTPRequest.new()


func _ready(): pass

func _on_new_user_button_pressed(): register_account()
	
func _on_login_button_pressed():
	await login_account()
	auth_account()

func _on_reset_password_button_pressed(): password_reset()
	
func _on_show_leaderboard_button_pressed(): _get_leaderboards()
	
func _on_submit_score_button_pressed(): _upload_score()
	
func _on_name_button_pressed(): set_player_name()
	
func _on_get_info_button_pressed(): get_player_info()

func _on_get_name_button_pressed(): get_player_name()

func _on_increase_balance_button_pressed(): _increase_balance()

	
func register_account():
	var url = "https://api.lootlocker.io/white-label-login/sign-up"
	var header = [\
	"domain-key: t7td55y9",\
	"is-development: true", \
	"Content-Type: application/json"
	]
	
	var request_body = {
		"email" : email_input.text,
		"password" : password_input.text,
		"name": "Player Name DOG"
		}
		
	prompt_text.text = 'registering new account...'
	
	http_request.request(url, header, method, JSON.stringify(request_body))
	
	var response = await http_request.request_completed
	response = JSON.parse_string(str(response))
	
	if "session_token" in response:
		token = response.session_token
		

	prompt_text.text = str(response)
	print("token: "+str(token))
	

	
func login_account():
	var url = "https://api.lootlocker.io/white-label-login/login"
	var header = [\
	"domain-key: t7td55y9",\
	"is-development: true", \
	"Content-Type: application/json"
	]
	
	var request_body = {
		"email" : email_input.text,
		"password" : password_input.text,
		"remember" : true
		}
		
	prompt_text.text = 'Logging in...'
	
	http_request.request(url, header, method, JSON.stringify(request_body))
	
	var response = await http_request.request_completed
	response = JSON.parse_string(str(response))
	
	if "session_token" in response:
		token = response.session_token
		
	if "user_id" in response:
		user_id = response.user_id	
		

	prompt_text.text = str(response)
	print(token)
	print(user_id)
	
func verify_account():
	var url = "https://api.lootlocker.io/white-label-login/request-verification"
	var header = [\
	"domain-key: t7td55y9",\
	"is-development: true", \
	"Content-Type: application/json"
	]
	
	var request_body = {
		"game_id" : 10,
		"user_id" : 11,
		"email" : email_input.text
		}
		
	print('verify')
	
	http_request.request(url, header, method, JSON.stringify(request_body))
	
	var response = await http_request.request_completed
	response = JSON.parse_string(str(response))
	
	if "x-session-token" in response:
		token = response.session_token

	print(response)
	print(token)


func auth_account():
	var url = "https://api.lootlocker.io/game/v2/session/white-label"
	var header = ["Content-Type: application/json"]
	var request_body = {
		"game_key" : "dev_95b740a89c8e4724831231d7626441d1",
		"email" : email_input.text,
		"token" : token,
		"password" : password_input.text,
		"game_version" : "0.0.5",
	}
	
	prompt_text.text = 'Authenticating...'

	http_request.request(url, header, method, JSON.stringify(request_body))
	
	var response = await http_request.request_completed
	response = JSON.parse_string(response[3].get_string_from_utf8())
	
#	response = JSON.parse_string(str(response))
#	print(response{"session-token"})
	if "session_token" in response:
		print("session token is in response")
		token = response["session_token"]
	else:
		print("session token is not in response")
		

	prompt_text.text = "Token : " + str(token) + "\n" + "Response : " + str(response)
	print(token)
	print(response)



func password_reset():
	var url = "https://api.lootlocker.io/white-label-login/request-reset-password"
	var header = [
		"domain-key: t7td55y9",
		"is-development: true",
		"Content-Type: application/json"
		
	]
	var request_body = {
		"email" : email_input.text
	}

	http_request.request(url, header, method, JSON.stringify(request_body))
	
	var response = await http_request.request_completed
	response = JSON.parse_string(str(response))
	
	if "session_token" in response:
		token = response.session_token
		

	prompt_text.text = str(response)
	print(token)

	
func _upload_score():
	var url = "https://api.lootlocker.io/game/leaderboards/"+leaderboard_key+"/submit"
	var header = ["Content-Type: application/json", "x-session-token:"+token]
	var data = { "score": str(score_input.text) }
	submit_score_http = HTTPRequest.new()
	add_child(submit_score_http)
	submit_score_http.request_completed.connect(_on_upload_score_request_completed)
	# Send request
	submit_score_http.request(url, header, method, JSON.stringify(data))
	# Print what we're sending, for debugging purposes:
	print(data)


func _on_upload_score_request_completed(result, response_code, headers, body) :
	var json = JSON.parse_string(body.get_string_from_utf8())
	
	# Print data
	print("sent: " + str(json))
	prompt_text.text = "sent: " + str(json)
	# Clear node
	submit_score_http.queue_free()
	

func _get_leaderboards():
	print("Getting leaderboards")
	var url = "https://api.lootlocker.io/game/leaderboards/"+leaderboard_key+"/list?count=10"
	var header = ["Content-Type: application/json", "x-session-token:"+token]
	
	# Create a request node for getting the highscore
	leaderboard_http = HTTPRequest.new()
	add_child(leaderboard_http)
	leaderboard_http.request_completed.connect(_on_leaderboard_request_completed)
	# Send request
	leaderboard_http.request(url, header, method_get, "")


func _on_leaderboard_request_completed(result, response_code, headers, body):
	var json = JSON.parse_string(body.get_string_from_utf8())
	
	# Print data
	print(json)
	
	
	# Formatting as a leaderboard
	var leaderboardFormatted = ""
	for n in json.items.size():
		leaderboardFormatted += str(json.items[n].rank)+str(". ")
		if len(json.items[n].player.name) > 0:
			leaderboardFormatted += str(json.items[n].player.name)+str(" - ")
		else:
			leaderboardFormatted += "Unknown - "
		leaderboardFormatted += str(json.items[n].score)+str("\n")
	
	# Print the formatted leaderboard to the console
	print(leaderboardFormatted)
	prompt_text.text = str(leaderboardFormatted)
	# Clear node
	leaderboard_http.queue_free()
	

func set_player_name():

	var url = "https://api.lootlocker.io/game/player/name"
	var header = [
		"x-session-token:" + token,
		"LL-Version: 2021-03-01",
		"Content-Type: application/json"
		]
	var data = { "name" : name_input.text }
	set_player_name_http = HTTPRequest.new()
	add_child(set_player_name_http)
	set_player_name_http.request_completed.connect(_on_player_name_changed)
	# Send request
	set_player_name_http.request(url, header, method_patch, JSON.stringify(data))
	# Print what we're sending, for debugging purposes:
	print(data)


func _on_player_name_changed(result, response_code, header, body) :
	var json = JSON.parse_string(body.get_string_from_utf8())

	# Print data
	print("player name: " + str(json))
	prompt_text.text = "Player Name set to: " + str(json)
	# Clear node
	set_player_name_http.queue_free()


func get_player_info():
	
	var url = "https://api.lootlocker.io/game/v1/player/info"
	var header = ["x-session-token:"+token]
	var data = { }
	get_player_info_http = HTTPRequest.new()
	add_child(get_player_info_http)
	get_player_info_http.request_completed.connect(_player_info_recieved)
	# Send request
	get_player_info_http.request(url, header, method_get, "")


func _player_info_recieved(result, response_code, header, data) :
	var json = JSON.parse_string(data.get_string_from_utf8())
	
	prompt_text.text = "Player Info: " + str(json)
	get_player_info_http.queue_free()
	
	
func get_player_name():
	
	var url = "https://api.lootlocker.io/game/player/name"
	var header = [
		"x-session-token:"+token,
		"LL-Version: 2021-03-01"
	]

	# Create a request node for getting the highscore
	var get_name_http = HTTPRequest.new()
	add_child(get_name_http)
	get_name_http.request_completed.connect(_on_get_player_name)
	# Send request
	get_name_http.request(url, header, method_get, "")


func _on_get_player_name(result, response_code, header, body):
	var json = JSON.parse_string(body.get_string_from_utf8())
	
	# Print data
	print(json)
	prompt_text.text = "player name: " + str(json)
	get_name_http.queue_free()


func _increase_balance():
	
	var url = "https://api.lootlocker.io/game/player/progressions/marks/points/add" #switch add with subtract to remove
	var header = ["Content-Type: application/json", "x-session-token:"+token]
	var data = { "amount": 100 }
	increase_balance_http = HTTPRequest.new()
	add_child(increase_balance_http)
	increase_balance_http.request_completed.connect(_on_increase_balance)
	# Send request
	increase_balance_http.request(url, header, method, JSON.stringify(data))
	# Print what we're sending, for debugging purposes:
	print(data)


func _on_increase_balance(result, response_code, headers, body) :
	var json = JSON.parse_string(body.get_string_from_utf8())
	
	# Print data
	print("Balance: " + str(json))
	prompt_text.text = "sent: " + str(json)
	# Clear node
	increase_balance_http.queue_free()

