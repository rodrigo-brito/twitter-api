var Twitter 	= require('twitter');
var config 		= require('./key_access');

var client = new Twitter({
	consumer_key: config.keys.consumer_key,
	consumer_secret: config.keys.consumer_secret,
	access_token_key: config.keys.access_token_key,
	access_token_secret: config.keys.access_token_secret
});

var params = {
	screen_name: 'g1politica',
	count: 200,
	exclude_replies: true,
	include_rts: false,
	trim_user: true,
	contributor_details: false
};

client.get('statuses/user_timeline', params, function(error, tweets, response){
	if(!error){
		tweets.forEach(function(tt){
			console.log(tt.text);
		});
	}else{
		console.log("ERRO: "+error);
	}
});