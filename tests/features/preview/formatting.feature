Feature: Text formatting in preview

  Background:
    Given the application is loaded

  Scenario: Bold text renders with strong tag
    Given the editor contains:
      """
      This is **bold text** in a paragraph.
      """
    When the preview renders
    Then the preview should contain a "strong" element
    And the "strong" element should contain text "bold text"

  Scenario: Italic text renders with em tag
    Given the editor contains:
      """
      This is *italic text* in a paragraph.
      """
    When the preview renders
    Then the preview should contain an "em" element
    And the "em" element should contain text "italic text"

  Scenario: Inline code renders with code tag
    Given the editor contains:
      """
      Use the `console.log()` function.
      """
    When the preview renders
    Then the preview should contain a "code" element
    And the "code" element should contain text "console.log()"

  Scenario: Code block renders with pre and code tags
    Given the editor contains:
      """
      ```javascript
      const x = 42;
      ```
      """
    When the preview renders
    Then the preview should contain a "pre" element
    And the "pre" element should contain a "code" element

  Scenario: Table renders with correct structure
    Given the editor contains:
      """
      | Name  | Value |
      | ----- | ----- |
      | Alpha | 100   |
      | Beta  | 200   |
      """
    When the preview renders
    Then the preview should contain a "table" element
    And the "table" should have 3 "tr" children
    And the first row should contain "th" cells

  Scenario: Table preserves empty cells
    Given the editor contains:
      """
      | Name  | Value | Notes |
      | ----- | ----- | ----- |
      | Alpha | 100   |       |
      | Beta  |       | ok    |
      """
    When the preview renders
    Then the preview should contain a "table" element
    And the table should have 3 columns
    And row 2 should have 3 cells
    And row 3 should have 3 cells
