'use strict';

import React from 'react';

require('styles//TweetList.scss');

class TweetList extends React.Component {
  render() {
    return (
      <div className="tweetlist">
        List of tweets
      </div>
    );
  }
}

TweetList.displayName = 'TweetList';

// Uncomment properties you need
// TweetList.propTypes = {};
// TweetList.defaultProps = {};

export default TweetList;
