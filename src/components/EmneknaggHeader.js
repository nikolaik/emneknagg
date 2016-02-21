'use strict';

import React from 'react';

require('styles/EmneknaggHeader.scss');

class EmneknaggHeader extends React.Component {
  render() {
    return (
      <div className="emneknaggheader">
        #something 13:00
      </div>
    );
  }
}

EmneknaggHeader.displayName = 'EmneknaggHeader';

// Uncomment properties you need
// EmneknaggHeader.propTypes = {};
// EmneknaggHeader.defaultProps = {};

export default EmneknaggHeader;
