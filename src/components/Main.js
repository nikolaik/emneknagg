require('normalize.css');
require('styles/App.scss');

import React from 'react';

import EmneknaggHeader from './EmneknaggHeader';
import TweetList from './TweetList';

class AppComponent extends React.Component {
  render() {
    return (
      <div className="index">
        <EmneknaggHeader />
        <TweetList />
      </div>
    );
  }
}

AppComponent.propTypes = { initialCount: React.PropTypes.string };
AppComponent.defaultProps = {
  initialColor: 'orangeyellow'
};

export default AppComponent;
