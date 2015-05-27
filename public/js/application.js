/* global _, moment, history */

var _refresh_url;
var _server_time_start;
var _server_offset = 0; // server vs client time offset (in case client computer can't tell time)
var _twitter_timeout = -1; // callback id for twitter polling
//var base_url = 'http://localhost:3000';
var relay_url = '/search/';
var time_sync_url = '/time/';


function search_twitter(options) {
    var search = relay_url + '?q=' + escape(options.search_term) + '&include_entities=1&result_type=recent';
    if(_refresh_url) {
        search = relay_url + _refresh_url;
    }

    $.getJSON(search, function(query) {
        //console.log(query);
        if( !query.statuses ) {
            //console.log("No response from Twitter.");
            return;
        }

        /* set refresh_url for next search */
        _refresh_url = query.search_metadata.refresh_url;

        var results = query.statuses;

        var tweets = $(".tweet");
        var tweet_ids = [];
        for(var i=0; i<tweets.length; i++) {
            tweet_ids.push(tweets[i].id);
        }

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

        /* update relative times */
        $('.tweet .when').each(function () {
            var created_at = $(this).attr('data-created_at');
            $(this).html(get_relative_time(created_at));
        });

    });

}
function get_relative_time(time_str) {
    /* relative tweet time */
    var time = time_str.slice(4); // without weekday
    moment.lang('en'); // parse english month name
    var when = moment(time, "MMM DD HH:mm:ss Z YYYY");
    moment.lang('nb'); // format in norwegian locale

    var now = moment().utc().diff(_server_offset);
    return when.from(now);
}

function format_tweet(result, options) {
    /* HTML template data */
    var data = {
        result: result,
        text: format_text(result.text, options.search_term),
        rel_when: get_relative_time(result.created_at),
        retweet_url: 'http://twitter.com/intent/retweet?tweet_id=' + result.id_str,
        reply_url: 'http://twitter.com/intent/tweet?in_reply_to=' + result.id_str,
        tweet_url: 'https://twitter.com/' + result.user.screen_name + '/status/' + result.id_str,
        profile_pic_url: result.user.profile_image_url_https.replace("normal", "bigger")
    };

    /* Format tweet */
    var template = '';
        template += '<div id="<%= result.id_str %>" class="tweet row-fluid">';
        template += '  <div class="span1">';
        template += '       <a href="http://twitter.com/<%= result.user.screen_name %>"><img src="<%= profile_pic_url %>" /></a>';
        template += '   </div>';
        template += '   <div class="span11">';
        template += '       <span class="screen_name"><a href="http://twitter.com/<%= result.user.screen_name %>"><%= result.user.screen_name %></a></span> <span class="text"><%= text %></span><br />';
        template += '       <a href="<%= tweet_url %>"><span class="when" data-created_at="<%= result.created_at %>"><%= rel_when %></span></a><span class="links" style="display:none;"> &bull; <a href="<%= reply_url %>">svar</a> &bull; <a href="<%= retweet_url %>">retweet</a></span>';
        template += '   </div>';
       template += '</div>';
    var output = _.template(template, data);
    return output;
}
function update_clock(options) {
    var now = moment(moment().utc().diff(_server_offset));
    var time = now.format(options.format);
    $(options.clock_selector).html(time);

    window.setTimeout(function() {
        update_clock(options);
    }, 1000); // every second
}

function poll_twitter(options) {
    search_twitter(options); 

    _twitter_timeout = window.setTimeout(function() {
        poll_twitter(options);
    }, options.poll_interval * 1000); // every poll_interval seconds
}

function format_text( text, search_term) {
    text = urlize(text);
    text = highlight_term(text, search_term);
    return text;
}

/* Urlize */
function urlize( text ) {
    var _list = text.match( /\b(http:\/\/|www\.|http:\/\/www\.)[^ ]{2,100}\b/g );
    if ( _list ) {
        var i;
        for ( i = 0; i < _list.length; i++ ) {
            text = text.replace( _list[i], "<a target='_blank' href='" + _list[i] + "'>"+ _list[i] + "</a>" );
        }
    }
    return text;
}

function highlight_term( text, term ) {
    var re = new RegExp(term, "i");
    var _list = re.exec(text);
    if ( _list ) {
        var i ;
        for ( i = 0; i < _list.length; i++ ) {
            text = text.replace( _list[i], '<span class="search-term-highlight">'+ _list[i] + '</span>' );
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

    _refresh_url = null;

    /* Stop polling the old search term */
    window.clearTimeout(_twitter_timeout);
    /* ...update the new */
    $("#search-term").html(value);
    document.title = "Emneknagg: " + value;
    /* Update address bar */
    history.pushState(null, "Realtime Twitter" + value, "https://" + location.host + "/?q=" + value);
    /* Close modal */
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
    var uri = (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1];
    if(uri === null) {
        return false;
    }
    return decodeURIComponent(uri);
}

$(document).ready(function(){
    /* Define options */
    var options = {
        search_term: getURLParameter('q') || '#dnsgf',
        search_term_selector: '#search-term',
        feed_selector: '#twitter_feed',
        poll_interval: 10, 
        // (15 minute window * 60 seconds ) / 180 allowed requests per window = avg 1 request every 5 seconds
        // Ref: https://dev.twitter.com/docs/rate-limiting/1.1
        // TODO replace with streaming API
    };
    options.title = "Emneknagg";
    var clock_options = {
        format: "HH:mm",
        clock_selector: "#clock",
    };

    /* Update the title */
    $(options.search_term_selector).html(options.search_term);
    document.title = options.title + ": " + options.search_term;

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

    /* Get server time */
    $.get(time_sync_url, function(data){
        _server_time_start = data.now;
        _server_offset = moment(_server_time_start).diff(new Date());

        /* Start updating stuff */
        poll_twitter(options);
        update_clock(clock_options);
    });
    /* appropriate overflow */
    $(window).resize();

});

/* No scollbar in fullscreen */
$(window).resize(function() {
    if((window.fullScreen) || (window.innerWidth == screen.width && window.innerHeight == screen.height)) {
        $("html").css("overflow", "hidden");
    } else {
        $("html").css("overflow", "auto");
    }
});
