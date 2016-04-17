var Twitter 	= require('twitter');
var MongoClient = require('mongodb').MongoClient;
var bigInt 		= require("big-integer");
var config 		= require('./key_access');

if( !process.argv[2] ){
	console.log("Argument missing: Informe o nick do perfil: Ex: g1politica");
	process.exit(1);
}

//Variáveis
var user_name 	= process.argv[2]; //perfil coletado é passado como 1º parâmetro
var count 		= 200;
var mongo_url 	= 'mongodb://localhost:27017/Twitter';

//Chaves de acesso da aplicação
var client = new Twitter({
	consumer_key: config.keys.consumer_key,
	consumer_secret: config.keys.consumer_secret,
	access_token_key: config.keys.access_token_key,
	access_token_secret: config.keys.access_token_secret
});

/**
 * Salva lista de Twitts em uma base de dados Mongo DB
 * @param  {Array(JSON)}   twitts   Lista de twitts a ser salvo
 * @param  {Function} callback Evento acionado ao fim do salvamento
 * de Twiitts juntamente com a lista de objetos persistidos
 */
var saveTwitts =  function(twitts, callback){
	MongoClient.connect(mongo_url, function(err, db) {
		if(!err){
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

/**
 * Remove quebras de linhas em blocos de textos para impressão em linha única
 * @param  {String} text Texto que será removido quebras de linhas
 * @return {String}      Texto final sem quebras de linhas
 */
var trimEndline = function(text){
	return text.replace(/\r?\n|\r/g, " ");
};

/**
 * Executa a requisição para a API do Twitter e salva lista de Twitts
 * @param  {String}   screen_name nickname do perfil a ser capturado
 * @param  {String}   max_id      Id a partir da qual deve ser capturado, caso null, captura desde o início da timeline
 * @param  {int}   	  count       Quantidade de Twiits a ser capturado por requisição
 * @param  {Function} callback    evento de finalização da requisição, retorna evento de erro e último id capturado
 */
var getTimelineTwitter = function(screen_name, max_id, count, callback){
	var params = {
		screen_name: screen_name,
		count: count,
		exclude_replies: false,
		include_rts: false,
		trim_user: true,
		contributor_details: false
	};
	if(max_id != null){
		params.max_id = max_id;
	}
	client.get('statuses/user_timeline', params, function(error, tweets, response){
		if(!error){
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

/**
 * Inicia captura de Twitts
 */
getTimelineTwitter(user_name, null, count, function callback(err, last_id){
	if(!err){
		if(last_id != null){
			getTimelineTwitter(user_name, last_id, count, callback);
		}
	}else{
		//Em caso de erro, repete a requisição com o id parado
		getTimelineTwitter(user_name, last_id, count, callback);
	}
});