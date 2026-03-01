Feature: Document metrics panel

  Background:
    Given the application is loaded

  Scenario: Badge shows word count after entering content
    Given the editor contains:
      """
      # Hello World
      This is a paragraph with several words.
      """
    When the preview renders
    Then the metrics badge should be visible
    And the metrics badge should show a character count

  Scenario: Panel opens on badge click and shows category table
    Given the editor contains:
      """
      ## Section
      A paragraph with several words.
      """
    When the preview renders
    And I open the metrics panel
    Then the metrics panel should be open
    And the metrics table should have 4 columns

  Scenario: Body category has non-zero counts for paragraph content
    Given the editor contains:
      """
      This is a paragraph with some words in it.
      """
    When the preview renders
    And I open the metrics panel
    Then the metrics row "Body" should have non-zero chars

  Scenario: Headings category has non-zero counts for heading content
    Given the editor contains:
      """
      # First Heading
      ## Second Heading
      """
    When the preview renders
    And I open the metrics panel
    Then the metrics row "Headings" should have non-zero chars

  Scenario: Lists category has non-zero counts for list content
    Given the editor contains:
      """
      - First item
      - Second item
      - Third item
      """
    When the preview renders
    And I open the metrics panel
    Then the metrics row "Lists" should have non-zero chars

  Scenario: Tables category has non-zero counts for table content
    Given the editor contains:
      """
      | Name  | Value |
      | ----- | ----- |
      | Alpha | 100   |
      """
    When the preview renders
    And I open the metrics panel
    Then the metrics row "Tables" should have non-zero chars

  Scenario: Code category has non-zero counts for code blocks
    Given the editor contains:
      """
      ```javascript
      const x = 42;
      ```
      """
    When the preview renders
    And I open the metrics panel
    Then the metrics row "Code" should have non-zero chars

  Scenario: Empty categories show zero counts
    Given the editor contains:
      """
      Just a paragraph, no code or lists.
      """
    When the preview renders
    And I open the metrics panel
    Then the metrics row "Code" should have zero chars
    And the metrics row "Lists" should have zero chars
    And the metrics row "Tables" should have zero chars

  Scenario: Total row is visible with non-zero word count
    Given the editor contains:
      """
      # Heading
      Body paragraph here.
      """
    When the preview renders
    And I open the metrics panel
    Then the metrics total row should be visible

  Scenario: Title page row appears with frontmatter
    Given the editor contains:
      """
      ---
      title: "My Report"
      author: "Test Author"
      ---
      # Introduction
      Content here.
      """
    When the preview renders
    And I open the metrics panel
    Then the metrics row "Title page" should be visible

  Scenario: Title page row hidden without frontmatter
    Given the editor contains:
      """
      # Introduction
      Content here.
      """
    When the preview renders
    And I open the metrics panel
    Then the metrics row "Title page" should not be visible

  Scenario: Heading skip warning appears for non-sequential headings
    Given the editor contains:
      """
      # Top Level
      ### Skipped Level Two
      """
    When the preview renders
    And I open the metrics panel
    Then the metrics panel should show a heading skip warning

  Scenario: Badge disappears when editor is cleared
    Given the editor contains:
      """
      # Some content
      """
    When the preview renders
    Then the metrics badge should be visible
    Given the editor is empty
    Then the metrics badge should not be visible
