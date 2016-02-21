import 'core-js/fn/object/assign';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/Main';


var emneknaggJson = require('json!./emneknagg.json');

// Render the main component into the dom
ReactDOM.render(<App statuses={emneknaggJson.statuses} />, document.getElementById('app'));
