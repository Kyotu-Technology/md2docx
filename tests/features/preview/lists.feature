Feature: List rendering in preview

  Background:
    Given the application is loaded

  Scenario: Bullet list displays with disc markers
    Given the editor contains:
      """
      - First item
      - Second item
      - Third item
      """
    When the preview renders
    Then the preview should contain a "ul" element
    And the "ul" should have 3 "li" children
    And the "ul" list-style-type should be "disc"

  Scenario: Numbered list displays with decimal markers
    Given the editor contains:
      """
      1. Step one
      2. Step two
      3. Step three
      """
    When the preview renders
    Then the preview should contain an "ol" element
    And the "ol" should have 3 "li" children
    And the "ol" list-style-type should be "decimal"

  Scenario: Checklist displays with checkbox icons
    Given the editor contains:
      """
      - [x] Completed task
      - [ ] Pending task
      """
    When the preview renders
    Then the preview should contain a checklist with 2 items
    And the first checklist item should show a checked checkbox
    And the second checklist item should show an unchecked checkbox

  Scenario: Mixed lists render correctly
    Given the editor contains:
      """
      ## Bullet List

      - Alpha
      - Beta

      ## Numbered List

      1. One
      2. Two

      ## Checklist

      - [x] Done
      - [ ] Todo
      """
    When the preview renders
    Then the preview should contain a "ul" element
    And the preview should contain an "ol" element
    And the preview should contain a checklist with 2 items
