function search_twitter(options) {
    var search = 'https://search.twitter.com/search.json?q=' + escape(options.search_term) + '&result_type=recent&callback=?';
    /* Twitter search */
    /* TODO 
     *  - linkify hashtags and @usernames
     */

    $.getJSON(search, function(query) {
        var results = query.results;

        var tweets = $(".tweet");
        var tweet_ids = Array();
        for(var i=0; i<tweets.length; i++) {
            tweet_ids.push(tweets[i].id);
        }

        /* update relative times */
        $.each(results, function (i) {
            $("#" + results[i].id_str + " .when").html(get_relative_time(results[i].created_at));
        });

        /* no existing tweets */
        var new_results = _.filter(results, function(result) { 
            return $.inArray(result.id_str, tweet_ids) == -1;
        });
        /* put new tweets in the dom */
        var output = "";
        $.each(new_results, function(i) {
            output += format_tweet(new_results[i], options);
        });
        $(options.feed_selector).prepend(output);

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

function format_tweet(result, options) {
    var rel_when = get_relative_time(result.created_at);

    /* HTML template data */
    var data = {
        result: result,
        text: format_text(result.text, options.search_term),
        rel_when: rel_when,
        retweet_url: 'http://twitter.com/intent/retweet?tweet_id=' + result.id_str,
        reply_url: 'http://twitter.com/intent/tweet?in_reply_to=' + result.id_str,
        tweet_url: 'https://twitter.com/' + result.from_user + '/status/' + result.id_str,
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
    return output;
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

    twitter_timout = window.setTimeout(function() {
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
    var re = new RegExp(term, "i");
    list = re.exec(text);
    if ( list ) {
        for ( i = 0; i < list.length; i++ ) {
            text = text.replace( list[i], '<span class="search-term-highlight">'+ list[i] + '</span>' );
        }
    }
    return text;
}
function update_search_term(event) {
    var value = $("#search-term-field").val();
    var old_value = $("#search-term").html();
    if(value == old_value) {
        /* Do nothing */
        $("#myModal").modal('toggle');
        return;
    }

    /* Remove old tweets */
    $(".tweet").remove();

    /* Stop polling the old search term */
    window.clearTimeout(twitter_timout);
    /* Update the new */
    $("#search-term").html(value);
    $("#myModal").modal('toggle');
    /* Start polling the new search term */
    var options = {
        search_term: value,
        search_term_selector: '#search-term',
        feed_selector: '#twitter_feed',
        poll_interval: 10,
    };
    poll_twitter(options);
}
function getURLParameter(name) {
    var uri = (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    if(uri === null) {
        return false;
    }
    return decodeURIComponent(uri);
}

$(document).ready(function(){
    var twitter_timeout = -1;
    /* Define options */
    console.log(getURLParameter('q'));
    var options = {
        search_term: getURLParameter('q') || 'Charlie Sheen',
        search_term_selector: '#search-term',
        feed_selector: '#twitter_feed',
        poll_interval: 10,
    };
    var clock_options = {
        format: "HH:mm",
        clock_selector: "#clock",
    };

    /* Update the title */
    $(options.search_term_selector).html(options.search_term);

    /* Start updating stuff */
    poll_twitter(options);
    update_clock(clock_options);
    /* appropriate overflow */
    $(window).resize();

    /* Add listener to search button click to update search term */
    $("#search-term-button").click(update_search_term);
    /* Enter key*/
    $("#search-term-field").keyup(function(event){
        /* Enter key */
        if(event.keyCode == 13) {
            $("#search-term-button").click();
        }
    });
    /* Set initial input field value */
    $("#search-term-field").val(options.search_term);

    /* Set field focus on modal open */
    $('#myModal').on('shown', function () {
        $('#search-term-field').focus();
    });

});

/* No scollbar in fullscreen */
$(window).resize(function() {
    if((window.fullScreen) || (window.innerWidth == screen.width && window.innerHeight == screen.height)) {
        $("html").css("overflow", "hidden");
    } else {
        $("html").css("overflow", "auto");
    }
});
