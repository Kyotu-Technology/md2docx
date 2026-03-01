Feature: DOCX export quality

  Background:
    Given the application is loaded

  Scenario: DOCX file has valid structure
    Given the editor contains the file "full-document.md"
    When I export as "docx"
    Then the downloaded file should have extension ".docx"
    And the DOCX should have a valid internal structure

  Scenario: DOCX preserves heading hierarchy
    Given the editor contains:
      """
      ---
      title: "Test Doc"
      ---

      # Main Title
      ## Section One
      Some paragraph text.
      ### Subsection
      More text here.
      """
    When I export as "docx"
    Then the DOCX text content should contain "Main Title"
    And the DOCX text content should contain "Section One"
    And the DOCX text content should contain "Subsection"
    And the DOCX text content should contain "Some paragraph text."

  Scenario: DOCX contains bullet list items
    Given the editor contains:
      """
      ---
      title: "List Doc"
      ---

      - Alpha
      - Beta
      - Gamma
      """
    When I export as "docx"
    Then the DOCX text content should contain "Alpha"
    And the DOCX text content should contain "Beta"
    And the DOCX text content should contain "Gamma"
    And the DOCX should contain numbered paragraphs

  Scenario: DOCX contains table data
    Given the editor contains:
      """
      ---
      title: "Table Doc"
      ---

      | Name  | Value |
      | ----- | ----- |
      | Item1 | 100   |
      | Item2 | 200   |
      """
    When I export as "docx"
    Then the DOCX text content should contain "Item1"
    And the DOCX text content should contain "Item2"

  Scenario: DOCX table header row is bold and columns are proportional
    Given the editor contains:
      """
      ---
      title: "Table Formatting"
      ---

      | ID | Full Description of the Feature | Status |
      | -- | ------------------------------- | ------ |
      | 1  | Implement user authentication   | Done   |
      | 2  | Add dashboard analytics view    | WIP    |
      """
    When I export as "docx"
    Then the DOCX table header row should be bold
    And the DOCX table columns should have proportional widths

  Scenario: DOCX HTML conversion preserves semantic structure
    Given the editor contains the file "full-document.md"
    When I export as "docx"
    Then the DOCX HTML should contain a "h1" tag
    And the DOCX HTML should contain a "ul" tag
    And the DOCX HTML should contain a "ol" tag
    And the DOCX HTML should contain a "table" tag
