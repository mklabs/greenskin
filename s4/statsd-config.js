/*

See statsd config example for full documentation

*/
{
  port: 8125,
  backends: [ 'statsd-fs' ],
  fs: {
    storage: require('path').join(__dirname, '../../../tmp/metrics')
  }
}
