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

  Scenario: Table with extra cells in some rows normalizes to max column count
    Given the editor contains:
      """
      | Endpoint | Method |
      |---|---|
      | A | GET handler |
      | B | POST handler |
      | C | PUT handler | source C |
      | D | DELETE handler | source D |
      """
    When the preview renders
    Then the preview should contain a "table" element
    And the table should have 3 columns
    And row 1 should have 3 cells
    And row 2 should have 3 cells
    And row 3 should have 3 cells
    And row 5 should have 3 cells
    And the preview should contain text "source C"
    And the preview should contain text "source D"

  Scenario: Short rows in wider table are padded with empty cells
    Given the editor contains:
      """
      | A | B | C |
      |---|---|---|
      | 1 | 2 |
      | 3 | 4 | 5 |
      """
    When the preview renders
    Then the table should have 3 columns
    And row 2 should have 3 cells
    And row 3 should have 3 cells

  Scenario: Reproduces user's inconsistent table from issue
    Given the editor contains:
      """
      | Requirement | Mechanism |
      |---|---|
      | Max payload size | 10 MB. Larger requests rejected with 413 |
      | Rate limit | 100 requests per minute | `1.0 API specification` §4 |
      | Auth method | Bearer token over HTTPS; tokens expire after 1 hour | `1.0 API specification` §4 |
      """
    When the preview renders
    Then the table should have 3 columns
    And row 1 should have 3 cells
    And row 2 should have 3 cells
    And row 3 should have 3 cells
    And row 4 should have 3 cells
    And the preview should contain text "Max payload size"
    And the preview should contain text "Rate limit"
    And the preview should contain text "Auth method"
