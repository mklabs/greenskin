Feature: Basic browsing

  Scenario: Browsing homepage
    Given there are 1 coffees left in the machine
    And I have deposited 1$
    When I press the coffee button
    Then I should be served a caa