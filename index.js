var Twitter 	= require('twitter');
var MongoClient = require('mongodb').MongoClient;
var bigInt 		= require("big-integer");
var config 		= require('./key_access');

//Variáveis
var user_name 	= 'g1politica';
var count 		= 200;
var mongo_url 	= 'mongodb://localhost:27017/Twitter';

var client = new Twitter({
	consumer_key: config.keys.consumer_key,
	consumer_secret: config.keys.consumer_secret,
	access_token_key: config.keys.access_token_key,
	access_token_secret: config.keys.access_token_secret
});

var saveTwitts =  function(twitts, callback){
	MongoClient.connect(mongo_url, function(err, db) {
		if(!err){
			console.log("Conectado ao banco com sucesso");
			console.log("------------------------------");
			var collection = db.collection(user_name);
			collection.insertMany(twitts, function(err, result) {
				if(!err){
					db.close();
					console.log(result.result.n+" Twitts inseridos.");
					callback(result);
				}else{
					console.err(err);
				}
			});
		}else{
			console.err("Erro ao conectar ao banco de dados.");
			console.log("-----------------------------------");
			console.err(err);
			db.close();
		}
	});
};

var trimEndline = function(text){
	return text.replace(/\r?\n|\r/g, " ");
};

var getTimelineTwitter = function(screen_name, max_id, count, callback){
	var params = {
		screen_name: screen_name,
		count: count,
		exclude_replies: false,
		include_rts: true,
		trim_user: true,
		contributor_details: false
	};
	if(max_id != null){
		params.max_id = max_id;
	}
	client.get('statuses/user_timeline', params, function(error, tweets, response){
		if(!error){
			/*tweets.forEach(function(tt){
				console.log(tt.id_str+' : '+trimEndline(tt.text) );
			});*/

			if(tweets.length > 0){
				saveTwitts(tweets, function(){
					var id = bigInt(tweets[ tweets.length - 1 ].id_str);
					var next_id = id.minus(1); //Necessário reduzir em uma unidade o id para não incluir o último retornado
					callback(null, next_id.toString());
				});
			}else{
				callback(null, null); //Null simboliza que não há mais twitts
			}
		}else{
			console.log("ERRO: ");
			console.log(error);
			if(callback){
				callback(error, max_id);//Retorna o último id antes do erro
			}
		}
	});
};


getTimelineTwitter(user_name, null, count, function callback(err, last_id){
	if(!err){
		if(last_id != null){
			getTimelineTwitter(user_name, last_id, count, callback);
		}
	}else{
		getTimelineTwitter(user_name, last_id, count, callback);
	}
});