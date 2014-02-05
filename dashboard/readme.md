## Dashboard part


Initial implementation relies on http://shopify.github.io/dashing/

## Notes

Global consideration:

- Should we go for: JavaScript app / thin backend (graphite directly),
  Webapp (ruby, node, play.. talks to graphite) / Static generated pages
  and reports, with a bit of JS app ?

Role of the dashboard:

Read

- View high level metrics and reports for all monitoring "buckets"
- View all metrics in the context of a monitoring "bucket"
- Ability to choose: Domain, path, browser, date ranges.
- Ability to click through a "point" in any graph, and directs to test
  specific metrics and reports: http://speedcurve.com/demo/test/30/140121_X9_2J7/
- Get inspiration for display and structure from
  http://speedcurve.com/demo/b1/h/a/90/

Write

- Should the dashboard do it ?
- Creates a new monitoring bucket
- Create, update, remove URLs in a bucket
- Configure cron interval for tests and metrics gathering

## URL structure

Based on the patterns derived from speedcurve demo: http://speedcurve.com/demo

> TBD: Define each pages and the global URL structure
