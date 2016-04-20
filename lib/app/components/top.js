var moment = require('moment');

module.exports = class name {
  constructor(doc) {
    this.doc = doc;
  }

  build() {
    var top = [];
    var doc = this.doc;

    top.push({
      label: 'Job name: <strong>' +  doc.name + '</strong>',
      value: 'every ' + doc.repeatInterval,
      icon: 'flash'
    });

    if (doc.lastRunResults && doc.lastRunResults[0]) {
      top.push({
        label: '<strong>Metrics</strong>',
        value: Object.keys(doc.lastRunResults[0].metrics).length + ' metrics monitored',
        icon: 'arrow-graph-up-right'
      });
    }

    top.push({
      label: '<strong>Next run / Last run (started/completed)</strong>',
      value: moment(Date.parse(doc.nextRunAt)).fromNow() + ' / ' + moment(Date.parse(doc.lastRunAt)).fromNow() + ' / ' +
        moment(Date.parse(doc.lastFinishedAt)).fromNow(),
      icon: 'ios-timer-outline'
    });

    return top;
  }

  toArray() {
    return this.build();
  }
}


