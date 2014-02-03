
$(function() {


	var datasource;

	var graphiteUrl = "http://192.168.33.33";
	var graphiteAuth = "";

	var graphiteOptions = {}
	if (typeof padnulls != 'undefined') graphiteOptions['padnulls'] = padnulls;
	datasource = new TasseoGraphiteDatasource(graphiteUrl, graphiteAuth, graphiteOptions)


	/* gather all configuration settings from global variables and turn
	 * them into proper options.
	 */
	var realtimePeriod = (typeof period == 'undefined') ? 5 : period;
	var refreshInterval = (typeof refresh == 'undefined') ? 2000 : refresh;

	var dashboardOptions = {}
	if (typeof interpolation != 'undefined') dashboardOptions['interpolation'] = interpolation;
	if (typeof renderer != 'undefined')      dashboardOptions['renderer'] = renderer;
	if (typeof stroke != 'undefined')        dashboardOptions['stroke'] = stroke;

	if (typeof criticalColor != 'undefined') dashboardOptions['criticalColor'] = criticalColor;
	if (typeof warningColor != 'undefined')  dashboardOptions['warningColor'] = warningColor;
	if (typeof normalColor != 'undefined')   dashboardOptions['normalColor'] = normalColor;

	var uiOptions = {
	  refreshInterval: refreshInterval,
	  realtimePeriod: realtimePeriod
	}
	if (typeof title != 'undefined')                    uiOptions['title'] = title;
	if (typeof toolbar != 'undefined')                  uiOptions['toolbar'] = toolbar;
	if (typeof theme != 'undefined' && theme == "dark") uiOptions['darkMode'] = true;

	/* For all metrics */
	$.getJSON(graphiteUrl + '/metrics/index.json', function(data) {
	  console.log(data);
	  metrics = data
		  .filter(function(key) {
		  	return /^$name/.test(key);
		  })

		  .map(function(key) {
		    return {
		      target: key,
		      alias: key.replace('r8-monitoring.har.', '')
		    };   
		  });


	  var dashboard = window.dashboard = new TasseoDashboard(metrics, datasource, realtimePeriod, dashboardOptions);
	  var ui = new TasseoUi(dashboard, uiOptions);
	});

});
