Feature: File explorer

  Background:
    Given the application is loaded
    And IndexedDB documents are cleared

  Scenario: Explorer panel is hidden by default
    Then the file explorer panel should not be visible

  Scenario: Explorer panel opens via toggle and closes via close button
    When I click the explorer toggle button
    Then the file explorer panel should be visible
    And the file list should contain 1 document
    And the document "main.md" should be listed
    When I click the explorer close button
    Then the file explorer panel should not be visible

  Scenario: Ctrl+B outside editor toggles the explorer
    When I click outside the editor
    And I press Ctrl+B on the document
    Then the file explorer panel should be visible
    When I press Ctrl+B on the document
    Then the file explorer panel should not be visible

  Scenario: Adding a new document
    When I click the explorer toggle button
    And I add a new document named "chapter1.md"
    Then the file list should contain 2 documents
    And the document "chapter1.md" should be listed
    And the current document name should be "chapter1.md"

  Scenario: Switching between documents preserves content
    When I click the explorer toggle button
    And I add a new document named "notes.md"
    And the editor contains:
      """
      # Notes content
      """
    And I click the document "main.md" in the file list
    Then the editor should not contain "Notes content"
    When I click the document "notes.md" in the file list
    Then the editor value should contain "Notes content"

  Scenario: Deleting a non-main document
    When I click the explorer toggle button
    And I add a new document named "temp.md"
    Then the file list should contain 2 documents
    When I delete the document "temp.md"
    Then the file list should contain 1 document
    And the current document name should be "main.md"

  Scenario: Cannot delete the main document
    When I click the explorer toggle button
    Then the document "main.md" should not have a delete button

  Scenario: Renaming a document
    When I click the explorer toggle button
    And I add a new document named "old-name.md"
    When I rename the document "old-name.md" to "new-name.md"
    Then the document "new-name.md" should be listed
    And the document "old-name.md" should not be listed

  Scenario: @include resolves in preview for main document
    When I click the explorer toggle button
    And I add a new document named "fragment.md"
    And the editor contains:
      """
      ## Fragment Title
      Fragment body text here.
      """
    And I click the document "main.md" in the file list
    And the editor contains:
      """
      # Main Document
      @include(fragment.md)
      """
    When the preview renders
    Then the preview should contain text "Fragment Title"
    And the preview should contain text "Fragment body text here."

  Scenario: Main document star indicator is visible
    When I click the explorer toggle button
    Then the document "main.md" should have the main star active

  Scenario: @include autocomplete shows available files
    When I click the explorer toggle button
    And I add a new document named "chapter1.md"
    And I click the document "main.md" in the file list
    And I type "@include(" in the editor
    Then the include autocomplete dropdown should be visible
    And the autocomplete should list "chapter1.md"
    When I press "Enter" in the editor
    Then the editor value should contain "@include(chapter1.md)"
    And the include autocomplete dropdown should not be visible

  Scenario: @include autocomplete filters by partial name
    When I click the explorer toggle button
    And I add a new document named "intro.md"
    And I add a new document named "summary.md"
    And I click the document "main.md" in the file list
    And I type "@include(int" in the editor
    Then the include autocomplete dropdown should be visible
    And the autocomplete should list "intro.md"
    And the autocomplete should not list "summary.md"

  Scenario: @include autocomplete hides on Escape
    When I click the explorer toggle button
    And I add a new document named "chapter1.md"
    And I click the document "main.md" in the file list
    And I type "@include(" in the editor
    Then the include autocomplete dropdown should be visible
    When I press "Escape" in the editor
    Then the include autocomplete dropdown should not be visible

  Scenario: @include autocomplete is visible when typing in scrolled document
    When I click the explorer toggle button
    And I add a new document named "chapter1.md"
    And I click the document "main.md" in the file list
    And I fill the editor with 50 lines of text
    And I type "@include(" in the editor
    Then the include autocomplete dropdown should be visible
    And the autocomplete dropdown should be within the viewport

  Scenario: Preview data-line attributes are correct after @include
    When I click the explorer toggle button
    And I add a new document named "included.md"
    And the editor contains:
      """
      Line one of included.
      Line two of included.
      Line three of included.
      """
    And I click the document "main.md" in the file list
    And the editor contains:
      """
      # Before Include
      @include(included.md)
      # After Include
      """
    When the preview renders
    Then the preview should contain text "Before Include"
    And the preview should contain text "After Include"
    And the preview element containing "After Include" should have data-line "2"
