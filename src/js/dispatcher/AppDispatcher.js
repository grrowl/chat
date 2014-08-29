// ChatDispatcher

var Dispatcher = require('../lib/Flux').Dispatcher;
var copyProperties = require('react/lib/copyProperties');

var AppDispatcher = copyProperties(new Dispatcher(), {

  /**
   * A bridge function between the views and the dispatcher, marking the action
   * as a view action.  Another variant here could be dispatchServerAction.
   * @param  {object} action The data coming from the view.
   */
  dispatchServerAction: function(action, data) {
    this.dispatch({
      source: 'SERVER_ACTION',
      action: action,
      data: data
    });
  },

  /**
   * A bridge function between the views and the dispatcher, marking the action
   * as a view action.  Another variant here could be dispatchServerAction.
   * @param  {object} action The data coming from the view.
   */
  dispatchViewAction: function(action, data) {
    this.dispatch({
      source: 'VIEW_ACTION',
      action: action,
      data: data
    });
  }

});

module.exports = AppDispatcher;
