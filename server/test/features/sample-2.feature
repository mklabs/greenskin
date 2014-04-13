Feature: Basic browsing 2

  Scenario: Browsing offer page
  	Given I browse URL "http://kelkoo.fr"
    Then I want to render the page at "debug.png"