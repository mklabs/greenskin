require "rest-client"

graphite = 'dc1-se-prod-admin-02.prod.dc1.kelkoo.net';

SCHEDULER.every '10s', :first_in => 0 do
    target = "dc1-r8-prod-apa-03.accesslog.c500.fr"
    url = "http://#{graphite}/render?format=json&target=#{target}&from=-30day"
    graphite_json_data = RestClient.get url
    send_event 'test-graphite', { series: graphite_json_data }
end
