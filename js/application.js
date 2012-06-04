function search_twitter(options) {
    var search = 'http://search.twitter.com/search.json?q=' + escape(options.search_term) + '&result_type=recent&callback=?';
    /* Twitter search */
    /* TODO 
     *  - linkify URLs 
     *  - color our own search-term.
     */

    $.getJSON(search, function(query) {
        $.each(query.results, function(i) {
            var result = query.results[i];

            var tweets = $(".tweet");
            var tweet_ids = Array();
            for(var i=0; i<tweets.length; i++) {
                tweet_ids.push(tweets[i].id);
            }

            /* new tweet? */
            if( $.inArray(result.id_str, tweet_ids) == -1 ) {
                /* ...then append */
                append_tweet(result, options);
            }
            else {
                /* no, then only update relative time */
                $("#" + result.id_str + " .when").html(get_relative_time(result.created_at));
            }
        });
        if( !query.results ) {
            console.log("No response from Twitter.");
        }
    });

}
function get_relative_time(time_str) {
    /* relative tweet time */
    var time = time_str.slice(4) // without weekday
    moment.lang('en'); // parse english month name
    var when = moment(time, "DD MMM YYYY HH:mm:ss Z");
    moment.lang('nb'); // format in norwegian locale

    return when.fromNow();
}

function append_tweet(result, options) {
    var rel_when = get_relative_time(result.created_at);

    /* HTML template data */
    var data = {
        result: result,
        text: format_text(result.text, options.search_term),
        rel_when: rel_when,
        retweet_url: 'http://twitter.com/intent/retweet?tweet_id=' + result.id,
        reply_url: 'http://twitter.com/intent/tweet?in_reply_to=' + result.id,
        tweet_url: 'https://twitter.com/' + result.from_user + '/status/' + result.id,
        profile_pic_url: 'https://api.twitter.com/1/users/profile_image?screen_name=' + result.from_user + '&size=bigger',
    };

    /* Format tweet */
    var template = '<div id="<%= result.id_str %>" class="tweet row-fluid"> \
           <div class="span1"> \
               <img src="<%= profile_pic_url %>" /> \
           </div> \
           <div class="span11"> \
               <span class="screen_name"><a href="http://twitter.com/<%= result.from_user %>"><%= result.from_user %></a></span> <span class="text"><%= text %></span><br /> \
               <a href="<%= tweet_url %>"><span class="when"><%= rel_when %></span></a><span class="links" style="display:none;"> &bull; <a href="<%= reply_url %>">svar</a> &bull; <a href="<%= retweet_url %>">retweet</a></span> \
           </div> \
       </div>';
    var output = _.template(template, data);

    $(options.feed_selector).append(output);
}
function update_clock(options) {
    var time = moment().format(options.format);
    $(options.clock_selector).html(time);

    window.setTimeout(function() {
        update_clock(options);
    }, 1000); // every second
}

function poll_twitter(options) {
    search_twitter(options); 

    window.setTimeout(function() {
        poll_twitter(options)
    }, options.poll_interval * 1000); // every poll_interval seconds
}

function format_text( text, search_term) {
    text = urlize(text);
    text = highlight_term(text, search_term);
    return text;
}

/* Urlize */
function urlize( text ) {
    list = text.match( /\b(http:\/\/|www\.|http:\/\/www\.)[^ ]{2,100}\b/g );
    if ( list ) {
        for ( i = 0; i < list.length; i++ ) {
            text = text.replace( list[i], "<a target='_blank' href='" + list[i] + "'>"+ list[i] + "</a>" );
        }
    }
    return text;
}

function highlight_term( text, term ) {
    var re = new RegExp(term);
    list = re.exec(text);
    if ( list ) {
        for ( i = 0; i < list.length; i++ ) {
            text = text.replace( list[i], '<span class="search-term-highlight">'+ list[i] + '</span>' );
        }
    }
    return text;
}

$(document).ready(function(){
    /* Define options */
    var options = {
        search_term: '#dnsgf',
        search_term_selector: '#search-term',
        feed_selector: '#twitter_feed',
        poll_interval: 10,
    };
    var clock_options = {
        format: "HH:mm:ss",
        clock_selector: "#clock",
    };

    /* Update the title */
    $(options.search_term_selector).html(options.search_term);

    /* Start updating stuff */
    poll_twitter(options);
    update_clock(clock_options);
});
