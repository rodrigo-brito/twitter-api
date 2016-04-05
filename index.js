var Twitter 	= require('twitter');
var bigInt 		= require("big-integer");
//Arquivo com chaves de acesso
var config 		= require('./key_access');

var client = new Twitter({
	consumer_key: config.keys.consumer_key,
	consumer_secret: config.keys.consumer_secret,
	access_token_key: config.keys.access_token_key,
	access_token_secret: config.keys.access_token_secret
});



var getTimelineTwitter = function(screen_name, max_id, count, callback){
	var params = {
		screen_name: screen_name,
		count: count,
		exclude_replies: true,
		include_rts: true,
		trim_user: true,
		contributor_details: false
	};
	if(max_id != null){
		params.max_id = max_id;
	}
	client.get('statuses/user_timeline', params, function(error, tweets, response){
		if(!error){
			tweets.forEach(function(tt){
				console.log(tt.id_str+' : '+tt.text);
			});
			if(callback){
				callback(null, tweets[ tweets.length - 1 ].id_str);
			}
		}else{
			console.log("ERRO: ");
			console.log(error);
			if(callback){
				callback(true);
			}
		}
	});
};

getTimelineTwitter('g1', null, 5, function(err, last_id){
	if(!err){
		var id = bigInt(last_id);
		var next_id = id.minus(1); //Necessário reduzir em uma unidade o id para não incluir o último retornado
		getTimelineTwitter('g1', next_id.toString(), 5);
	}
});