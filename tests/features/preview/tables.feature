Feature: Table rendering in preview

  Background:
    Given the application is loaded

  Scenario: Table with angle brackets preserves cell content
    Given the editor contains:
      """
      | Category | Small | Medium | Large |
      |---|---|---|---|
      | Items | <50 units | 50-100 units | >100 units |
      | Rules | <20 basic | 20-60 advanced | >60 complex |
      """
    When the preview renders
    Then the preview should contain a "table" element
    And the "table" should have 3 "tr" children
    And the table should have 4 columns
    And the preview should contain text "<50 units"
    And the preview should contain text ">100 units"
    And the preview should contain text "<20 basic"
    And the preview should contain text ">60 complex"

  Scenario: Table with mixed angle brackets and regular content
    Given the editor contains:
      """
      | Metric | Threshold |
      |---|---|
      | Score | >90 points |
      | Errors | <5 allowed |
      | Range | 10-20 items |
      """
    When the preview renders
    Then the preview should contain a "table" element
    And the "table" should have 4 "tr" children
    And the preview should contain text ">90 points"
    And the preview should contain text "<5 allowed"

  Scenario: Paragraph with angle brackets preserves content
    Given the editor contains:
      """
      The value should be <100 and >50 for valid results.
      """
    When the preview renders
    Then the preview should contain text "<100"
    And the preview should contain text ">50"
