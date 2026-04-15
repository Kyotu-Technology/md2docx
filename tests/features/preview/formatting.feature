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

  Scenario: Inline code with underscores does not trigger italic
    Given the editor contains:
      """
      Use `special_rounding` in your code.
      """
    When the preview renders
    Then the preview should contain a "code" element
    And the "code" element should contain text "special_rounding"
    And the preview paragraph should not contain an "em" element

  Scenario: Inline code with asterisks does not trigger bold
    Given the editor contains:
      """
      Pass `**kwargs` to the function.
      """
    When the preview renders
    Then the preview should contain a "code" element
    And the "code" element should contain text "**kwargs"
    And the preview paragraph should not contain a "strong" element

  Scenario: Mixed bold, code with underscores, and italic in one line
    Given the editor contains:
      """
      **bold text** then `code_with_underscores` then *italic text* here.
      """
    When the preview renders
    Then the preview should contain a "strong" element
    And the preview should contain a "code" element
    And the preview should contain an "em" element
    And the "code" element should contain text "code_with_underscores"

  Scenario: Underscores inside words do not trigger italic
    Given the editor contains:
      """
      The some_var_name should stay plain text.
      """
    When the preview renders
    Then the preview paragraph should not contain an "em" element

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

  Scenario: Inline code preserves HTML-like tags
    Given the editor contains:
      """
      The `<svg>` tag inside without `</svg>` in the middle should stay intact.
      """
    When the preview renders
    Then the preview should contain text "<svg>"
    And the preview should contain text "</svg>"

  Scenario: Link URL with parentheses parses correctly
    Given the editor contains:
      """
      See [docs](../spec/Appendix%202%20(PROSERV-0043).md) for details.
      """
    When the preview renders
    Then the preview should contain a link with href "../spec/Appendix%202%20(PROSERV-0043).md"
    And the preview should contain text "docs"
