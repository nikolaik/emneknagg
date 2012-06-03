function searchTwitter(query, since) {
    var retweet_url = 'http://twitter.com/intent/retweet?tweet_id=';
    var reply_url = 'http://twitter.com/intent/tweet?in_reply_to=';
    /* Twitter search */
    /* TODO 
     *  - refresh_url
     *  - fix time
     */
    var search = 'http://search.twitter.com/search.json?q=' + query + '&count=10&callback=?';
    var screen_name = 'nrktest';

    $.getJSON(search, function(query) {
        $.each(query.results, function(i) {
            var result = query.results[i];
            var id = result.id_str;
            var time = result.created_at.slice(4) /* without weekday */
            /* relative tweet time */
            moment.lang('en'); // parse english month name
            var when = moment(time, "MMM DD HH:mm:ss Z YYYY");
            moment.lang('nb'); // format in norwegian locale
            var rel_when = when.fromNow();
            var tweet_url = 'https://twitter.com/' + result.from_user + '/status/' + result.id_str;
            var profile_pic_url = 'https://api.twitter.com/1/users/profile_image?screen_name=' + result.from_user + '&size=normal';
            /* Format tweet */
            $('#twitter_feed').append('<div class="tweet row-fluid"><div class="span1 offset2"><img src="' + profile_pic_url + '" /></div><div class="span9"><span class="screen_name"><a href="#">screen_name</a></span><span class="text">' + result.text + '</span><br /><a href="' + tweet_url + '">' + rel_when +'</a> &bull; <a href="'+ reply_url + id +'">svar</a> &bull; <a href="'+ retweet_url + id +'">retweet</a></div></div>');
        });

        if( !query.results ) {
            $('#twitter_feed').html("Ikke svar fra Twitter.");
        }
    });

}
function pollTwitter() {
    console.log("Polling Twitter.");
    /* check if id is present
     * if it is not, then append */
    
}

$(document).ready(function(){
    setTimeout( 'pollTwitter()', 100); // in milliseconds
    var search_query = '%23qazwsx';
    searchTwitter(search_query, ""); 
});
