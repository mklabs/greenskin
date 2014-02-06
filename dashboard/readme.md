## Dashboard part

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

Site (domains), Pathnames, Browsers, Dates Range

> TBD: Define each pages and the global URL structure

/dashboard/s/i/s/14

Global URL pattern:

- `/dashboard/<domain>/<pathname>/<browser>/<time>`
- `/dashboard/test/<year>/<date>_<id>` (still not clear. Links for each point in a graf)


### Pages

homepage:

- /dashboard - /dashboard/a/a/a/14
  - Higher lvl dashboard
  - Default: all sites and all templates in all browser over the last 30 days
  - Nav or Form to choose:
    - List of domains
    - List of URLs per domain
    - Browser
    - Date range
  - Modules
  	- Browser time avg on all URLs for all timings (per tab)
  	- Timeline (if we can generate screenshots), one row per URLs
  	- Average metrics for all URLs (nb of requests, size, google pagespeed score etc.)
  	- Avg / Median yslow scores

domain:

- /dashboard/example-com/a/a/14
  - Synthetic view for all URLs within a same domain
  - Browser timings median, percentiles, etc.
  - timeline

url:

-  /dashboard/example-com/ctl-do-search-siteSearchQuery-sony-vaio-fromform-true/a/14
  - Browser time median for all browsers
  - timeline, a browser per row
  - content breakdown, size & requests
  - Pagespeed score
  - Nb of requests, graphs and pie per type
  - Size, graphs and pie
  - Page timelines (ber browser, avg timings backend, render, dom, full load)
