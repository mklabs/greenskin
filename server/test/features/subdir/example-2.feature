Feature: Basic browsing

  Scenario: Browsing homepage
    Given I browse URL "http://example.com"
    Then I fill "LYS" in "from"
    And I fill "PAR" in "to"
    And I submit the form "[name=flights_search]"
    And I want to render the page at "debug.png"
