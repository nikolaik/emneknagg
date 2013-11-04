/* listen on port 80 for GET requests with q=search_term,
 * strip xss-stuff from q
 * relay search to twitter api
 * respond with twitter body */
var twitter_consumer_key = 'jQdzAQuDezn8jyQDtSYAcA';
var twitter_consumer_secret = 'lueF7nru9iY77mu5ozp7c8WTmiuKkDAhJXT2UUPn4';
var twitter_api_search_url = 'https://api.twitter.com/1.1/search/tweets.json?q=';
var default_search_term = "%23dnsgf";

/* Init */
var OAuth2 = require('oauth').OAuth2;
var oauth2 = new OAuth2(
    twitter_consumer_key,
    twitter_consumer_secret, 
    'https://api.twitter.com/', 
    null,
    'oauth2/token', 
    null);
var request = require('request'),
    http = require('http'),
    express = require('express'),
    util = require('util'),
    url = require('url');

var app = express();
app.enable('trust proxy')

var get_token_and_search = function(res, query) {
    /* Get access token */
    oauth2.getOAuthAccessToken(
        '',
        { 'grant_type' : 'client_credentials' },
        function (e, access_token, refresh_token, results) {
            /* OAuth2.0 is easy */
            var options = { 'headers': { 'Authorization': 'Bearer ' + access_token } };
            /* Ref: https://dev.twitter.com/docs/api/1.1/get/search/tweets */
            var search = twitter_api_search_url + escape(query) + '&result_type=recent';
            /* TODO-maybe: since_id */
            /* Ask Twitter what's happening */
            request.get(
                search,
                options,
                function(error, response, body) {
                    /* Respond with x */
                    //console.log(error, response, body);
                    res.send(body);
                }
            );
        }
    );
}

app.get('/search', function(req, res){
  var query = default_search_term;

  if('q' in req.query) {
      query = req.query.q;
      util.log(util.inspect(req.query));
  }

  res.setHeader('Content-Type', "application/json");
  res.setHeader('Access-Control-Allow-Origin', "*");
  get_token_and_search(res, query);
});

util.log("http://localhost:8000");
app.listen(8000);

