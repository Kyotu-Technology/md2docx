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

  Scenario: Numbered list preserves custom start number
    Given the editor contains:
      """
      5. Item five
      6. Item six
      7. Item seven
      """
    When the preview renders
    Then the "ol" should have a "start" attribute equal to "5"
    And the "ol" should have 3 "li" children

  Scenario: Two numbered lists separated by paragraph keep independent start numbers
    Given the editor contains:
      """
      1. First step

      Some text between lists.

      2. Second step
      """
    When the preview renders
    Then the preview should contain 2 "ol" elements
    And the first "ol" should have a "start" attribute equal to "1"
    And the second "ol" should have a "start" attribute equal to "2"

  Scenario: Polish-style list with closing paren marker is recognized
    Given the editor contains:
      """
      1) First
      2) Second
      3) Third
      """
    When the preview renders
    Then the preview should contain an "ol" element
    And the "ol" should have 3 "li" children

  Scenario: Polish-style nested paren list keeps numbers from concatenating
    Given the editor contains:
      """
      1. A user is entitled to:

         1) data export;
         2) account deletion;
         3) usage history.

      2. Second main item.
      """
    When the preview renders
    Then the preview should contain 2 "ol" elements
    And the top-level "ol" should have 2 direct "li" children
    And the first top-level "li" should contain a nested "ol" with 3 "li" children
    And the second "ol" should have a "class" attribute equal to "paren-list"

  Scenario: Numlist with blank lines between top-level items stays as one list
    Given the editor contains:
      """
      1. First

      2. Second

      3. Third
      """
    When the preview renders
    Then the preview should contain 1 "ol" elements
    And the "ol" should have 3 "li" children

  Scenario: Multiple blank lines preserve nested sub-list
    Given the editor contains:
      """
      1. Parent A


         1) Sub item
      2. Parent B
      """
    When the preview renders
    Then the preview should contain 2 "ol" elements
    And the top-level "ol" should have 2 direct "li" children
    And the first top-level "li" should contain a nested "ol" with 1 "li" children

  Scenario: Mixed marker parent dot with sub paren still nests
    Given the editor contains:
      """
      1. Parent

         1) Sub one
         2) Sub two
      """
    When the preview renders
    Then the preview should contain 2 "ol" elements
    And the second "ol" should have a "class" attribute equal to "paren-list"
    And the second "ol" should have 2 "li" children

  Scenario: Numbered list with indented sub-items renders nested
    Given the editor contains:
      """
      1. First
         1. Sub-A
         2. Sub-B
      2. Second
      """
    When the preview renders
    Then the top-level "ol" should have 2 direct "li" children
    And the first top-level "li" should contain a nested "ol" with 2 "li" children

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
