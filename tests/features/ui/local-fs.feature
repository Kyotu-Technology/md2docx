Feature: Local filesystem sync

  Background:
    Given the local filesystem mock is set up with files:
      """
      {
        "main.md": "# Main document\n\nInitial content from disk."
      }
      """
    And the application is loaded
    And IndexedDB documents are cleared

  Scenario: Mount button is visible in supporting browsers
    Then the mount folder button is visible

  Scenario: Mounting a folder shows connected status
    When I click the explorer toggle button
    And I click the mount folder button
    Then the local-fs status shows connected
    And the file explorer shows the local file "main.md"

  Scenario: Mounted folder with subdirectories renders folder view
    Given the local filesystem mock is set up with files:
      """
      {
        "README.md": "# Readme",
        "docs/intro.md": "intro body",
        "docs/api.md": "api body"
      }
      """
    And the application is loaded
    When I click the explorer toggle button
    And I click the mount folder button
    Then the local-fs status shows connected
    And the file explorer shows the local file "README.md"
    And the file explorer shows folder "docs" with 2 files
    And the folder "docs" is expanded

  Scenario: Collapsing and expanding a folder
    Given the local filesystem mock is set up with files:
      """
      {
        "README.md": "r",
        "docs/a.md": "a",
        "docs/b.md": "b"
      }
      """
    And the application is loaded
    When I click the explorer toggle button
    And I click the mount folder button
    And I click the folder "docs" in the explorer
    Then the folder "docs" is collapsed
    When I click the folder "docs" in the explorer
    Then the folder "docs" is expanded

  Scenario: Unmounting returns to IndexedDB mode
    When I click the explorer toggle button
    And I click the mount folder button
    Then the local-fs status shows connected
    When I click the mount folder button
    Then the local-fs status is hidden
    And the current document name should be "main.md"

  Scenario: External modification of current file prompts the user
    When I click the explorer toggle button
    And I click the mount folder button
    And I locally edit the editor without saving by appending:
      """
       edited in app
      """
    And an external modification of "main.md" with content:
      """
      # Main document from disk
      """
    Then a toast with action buttons "Use External" and "Keep Mine" is visible

  Scenario: Clicking Use External replaces the editor content
    When I click the explorer toggle button
    And I click the mount folder button
    And I locally edit the editor without saving by appending:
      """
       edited in app
      """
    And an external modification of "main.md" with content:
      """
      # External version
      """
    And I click the toast action "Use External"
    Then the editor content is:
      """
      # External version
      """

  Scenario: Clicking Keep Mine preserves the editor content
    When I click the explorer toggle button
    And I click the mount folder button
    And I locally edit the editor without saving by appending:
      """
       my edit
      """
    And an external modification of "main.md" with content:
      """
      # External version
      """
    And I click the toast action "Keep Mine"
    Then the editor value should contain "my edit"
    And no toast with action button "Use External" is visible

  Scenario: External deletion of current file offers re-create
    Given the local filesystem mock is set up with files:
      """
      {
        "main.md": "# Main",
        "notes.md": "# Notes\nSome notes."
      }
      """
    And the application is loaded
    When I click the explorer toggle button
    And I click the mount folder button
    And I switch to the file "notes.md" in the explorer
    And an external deletion of "notes.md" is triggered
    Then a toast with action buttons "Re-create" and "Close" is visible

  Scenario: Re-creating a deleted file persists to disk
    Given the local filesystem mock is set up with files:
      """
      {
        "main.md": "# Main",
        "notes.md": "# Notes\nRecover me."
      }
      """
    And the application is loaded
    When I click the explorer toggle button
    And I click the mount folder button
    And I switch to the file "notes.md" in the explorer
    And an external deletion of "notes.md" is triggered
    And I click the toast action "Re-create"
    Then the file on disk at "notes.md" exists
    And the file explorer shows the local file "notes.md"

  Scenario: Closing after external deletion switches to main document
    Given the local filesystem mock is set up with files:
      """
      {
        "main.md": "# Main doc",
        "notes.md": "notes"
      }
      """
    And the application is loaded
    When I click the explorer toggle button
    And I click the mount folder button
    And I switch to the file "notes.md" in the explorer
    And an external deletion of "notes.md" is triggered
    And I click the toast action "Close"
    Then the file explorer does not show the local file "notes.md"
    And the current document name should be "main.md"

  Scenario: External creation adds the file without a toast
    When I click the explorer toggle button
    And I click the mount folder button
    And an external creation of "new.md" with content:
      """
      # Freshly created
      """
    Then the file explorer shows the local file "new.md"
    And no toast with action button "Use External" is visible

  Scenario: Non-current file external modification updates silently
    Given the local filesystem mock is set up with files:
      """
      {
        "main.md": "# Main",
        "notes.md": "# Notes"
      }
      """
    And the application is loaded
    When I click the explorer toggle button
    And I click the mount folder button
    And an external modification of "notes.md" with content:
      """
      # Notes updated externally
      """
    Then no toast with action button "Use External" is visible

  Scenario: Inline delete confirmation restores on cancel
    When I click the explorer toggle button
    And I add a new document named "temp.md"
    And I start deleting the document "temp.md"
    Then the document "temp.md" shows an inline delete confirmation
    When I cancel the delete confirmation for "temp.md"
    Then the document "temp.md" no longer shows a delete confirmation
    And the document "temp.md" should be listed

  Scenario: Inline delete confirmation removes the document
    When I click the explorer toggle button
    And I add a new document named "gone.md"
    And I start deleting the document "gone.md"
    Then the document "gone.md" shows an inline delete confirmation
    When I delete the document "gone.md"
    Then the document "gone.md" should not be listed

  Scenario: Hidden dotfiles and dot-directories are skipped during scan
    Given the local filesystem mock is set up with files:
      """
      {
        "visible.md": "visible",
        ".hidden.md": "should be ignored",
        ".env": "SECRET=x",
        ".git/config": "[core]"
      }
      """
    And the application is loaded
    When I click the explorer toggle button
    And I click the mount folder button
    Then the local-fs status shows connected
    And the file explorer shows the local file "visible.md"
    And the file explorer does not show the local file ".hidden.md"
    And the file explorer does not show the local file ".env"
