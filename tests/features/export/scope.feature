Feature: Export scope selection

  Background:
    Given the application is loaded
    And IndexedDB documents are cleared

  Scenario: Scope selector is hidden with a single document
    When I open the export dropdown
    Then the export scope selector should not be visible

  Scenario: Scope selector is visible with multiple documents
    When I click the explorer toggle button
    And I add a new document named "chapter.md"
    And I open the export dropdown
    Then the export scope selector should be visible

  Scenario: Default scope is "current" when editing a non-main document
    When I click the explorer toggle button
    And I add a new document named "chapter.md"
    And I click the document "chapter.md" in the file list
    And I open the export dropdown
    Then the export scope "current" should be selected by default

  Scenario: Default scope is "main" when editing the main document
    When I click the explorer toggle button
    And I add a new document named "chapter.md"
    And I click the document "main.md" in the file list
    And I open the export dropdown
    Then the export scope "main" should be selected by default

  Scenario: Exporting a non-main document produces its own content
    When I click the explorer toggle button
    And I add a new document named "chapter.md"
    And the editor contains:
      """
      ---
      title: "Chapter Doc"
      ---

      # Chapter Heading
      Chapter body text.
      """
    And I click the document "main.md" in the file list
    And the editor contains:
      """
      ---
      title: "Main Doc"
      ---

      # Main Heading
      Main body text.
      """
    And I click the document "chapter.md" in the file list
    When I export as "docx"
    Then the DOCX text content should contain "Chapter Heading"
    And the DOCX text content should not contain "Main Heading"

  Scenario: Explicit main scope from a non-main doc exports resolved main content
    When I click the explorer toggle button
    And I add a new document named "fragment.md"
    And the editor contains:
      """
      Fragment body text here.
      """
    And I click the document "main.md" in the file list
    And the editor contains:
      """
      ---
      title: "Composed Doc"
      ---

      # Composed Root
      @include(fragment.md)
      """
    And I click the document "fragment.md" in the file list
    And I open the export dropdown
    And I choose the export scope "main"
    When I export as "docx"
    Then the DOCX text content should contain "Composed Root"
    And the DOCX text content should contain "Fragment body text here."

  Scenario: Main scope sublabel reports actual @include count
    When I click the explorer toggle button
    And I add a new document named "a.md"
    And I add a new document named "b.md"
    And I click the document "main.md" in the file list
    And the editor contains:
      """
      # Root
      @include(a.md)
      @include(b.md)
      """
    And I open the export dropdown
    Then the export scope "main" sublabel should contain "2 @includes"

  Scenario: Main scope sublabel reports no includes when main has none
    When I click the explorer toggle button
    And I add a new document named "other.md"
    And I click the document "main.md" in the file list
    And I open the export dropdown
    Then the export scope "main" sublabel should contain "no @includes"
