/* listen on port 80 for GET requests with q=search_term,
 * strip xss-stuff from q
 * relay search to twitter api
 * respond with twitter body */
var settings = require('./config');

/* Init */
var OAuth2 = require('oauth').OAuth2;
var oauth2 = new OAuth2(
    settings.TWITTER_CONSUMER_KEY,
    settings.TWITTER_CONSUMER_SECRET,
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
/* Express config */
app.use(express.static(__dirname + '/public'));
app.enable('trust proxy');

var get_token_and_search = function(res, search_url) {
    /* Get access token */
    oauth2.getOAuthAccessToken(
        '',
        { 'grant_type' : 'client_credentials' },
        function (e, access_token, refresh_token, results) {
            /* OAuth2.0 is easy */
            var options = { 'headers': { 'Authorization': 'Bearer ' + access_token } };
            /* TODO search_url */
            /* Ask Twitter what's happening */
            request.get(
                search_url,
                options,
                function(error, response, body) {
                    /* Respond with x */
                    //console.log(error, response, body);
                    res.send(body);
                }
            );
        }
    );
};

app.get('/', function(req, res){});
app.get('/time', function(req, res){
  res.setHeader('Content-Type', "application/json");
  res.setHeader('Access-Control-Allow-Origin', "*");
  // ISO-8601 and the format is: YYYY-MM-DDTHH:mm:ss.sssZ
  var now_str = new Date().toISOString();
  res.send({now: now_str});
});
app.get('/search', function(req, res){
  var search_url = settings.TWITTER_API_SEARCH_URL + "?q=" + settings.DEFAULT_SEARCH_TERM;

  if('q' in req.query) {
      search_url = settings.TWITTER_API_SEARCH_URL + req.url.replace("/search/","").replace("/","");
      util.log(util.inspect(req.query));
  }

  res.setHeader('Content-Type', "application/json");
  res.setHeader('Access-Control-Allow-Origin', "*");
  get_token_and_search(res, search_url);
});

util.log("http://localhost:"+settings.PORT);
app.listen(settings.PORT);

