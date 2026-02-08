Feature: Heading rendering in preview

  Background:
    Given the application is loaded

  Scenario: All heading levels render as correct HTML elements
    Given the editor contains:
      """
      # Heading 1
      ## Heading 2
      ### Heading 3
      #### Heading 4
      """
    When the preview renders
    Then the preview should contain an "h1" with text "Heading 1"
    And the preview should contain an "h2" with text "Heading 2"
    And the preview should contain an "h3" with text "Heading 3"
    And the preview should contain an "h4" with text "Heading 4"

  Scenario: Title page metadata renders correctly
    Given the editor contains:
      """
      ---
      title: "My Report"
      subtitle: "Executive Summary"
      author: "Test Author"
      date: "2026-01-01"
      ---

      # First Section
      Content here.
      """
    When the preview renders
    Then the preview should contain text "My Report"
    And the preview should contain text "Executive Summary"
    And the preview should contain text "Test Author"
