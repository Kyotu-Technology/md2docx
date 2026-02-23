Feature: Toast notifications

  Background:
    Given the application is loaded

  Scenario: Warning toast appears when exporting empty content
    Given the editor is empty
    When I click the generate button
    Then a toast notification should appear
    And the toast should contain text "Main document is empty!"
    And the toast should have a solid dark background
    And the toast should be fully visible

  Scenario: Toast disappears after timeout
    Given the editor is empty
    When I click the generate button
    Then a toast notification should appear
    When I wait for the toast to dismiss
    Then no toast notifications should be visible

  Scenario: Toast can be closed manually
    Given the editor is empty
    When I click the generate button
    Then a toast notification should appear
    When I click the toast close button
    Then no toast notifications should be visible
