Feature: HTML export quality

  Background:
    Given the application is loaded

  Scenario: HTML export has valid structure
    Given the editor contains the file "full-document.md"
    When I export as "html"
    Then the downloaded file should have extension ".html"
    And the HTML should contain a complete document structure
    And the HTML should contain a "h1" tag with text "Introduction"

  Scenario: HTML export preserves lists
    Given the editor contains:
      """
      ---
      title: "List Doc"
      ---

      - Bullet one
      - Bullet two

      1. Number one
      2. Number two
      """
    When I export as "html"
    And the HTML should contain a "ul" tag
    And the HTML should contain an "ol" tag
    And the HTML should contain 2 "ul > li" elements
    And the HTML should contain 2 "ol > li" elements

  Scenario: HTML export includes styling
    Given the editor contains the file "full-document.md"
    When I export as "html"
    Then the HTML should contain a "style" tag
