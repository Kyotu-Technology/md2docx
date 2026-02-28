Feature: Document sharing via URL

  Background:
    Given the application is loaded
    And IndexedDB documents are cleared

  Scenario: Share button opens the share dialog
    When I click the share button
    Then the share dialog should be visible
    And the share dialog should show size estimate

  Scenario: Share dialog closes on Escape
    When I click the share button
    Then the share dialog should be visible
    When I press Escape
    Then the share dialog should not be visible

  Scenario: Share dialog closes on backdrop click
    When I click the share button
    Then the share dialog should be visible
    When I click the share dialog backdrop
    Then the share dialog should not be visible

  Scenario: Copy share link for single document
    Given the editor contains:
      """
      # Test Document
      Some content here for sharing.
      """
    When I click the share button
    And I click copy link in share dialog
    Then a success toast should appear with text "Share link copied"

  Scenario: Share with password
    Given the editor contains:
      """
      # Secret Document
      This is confidential content.
      """
    When I click the share button
    And I enable password protection in share dialog
    And I enter share password "test123"
    And I click copy link in share dialog
    Then a success toast should appear with text "Share link copied"

  Scenario: Keyboard shortcut opens share dialog
    When I press Ctrl+Shift+L on the document
    Then the share dialog should be visible

  Scenario: Share multiple files shows scope options
    When I click the explorer toggle button
    And I add a new document named "chapter1.md"
    And I click the share button
    Then the share dialog should show scope options
    And the share dialog should show "All files" option

  Scenario: Roundtrip encode and decode without password
    Given the editor contains:
      """
      # Shared Document
      Hello from the other side.
      """
    Then sharing roundtrip without password should preserve content

  Scenario: Roundtrip encode and decode with password
    Given the editor contains:
      """
      # Secret Shared
      Password-protected content.
      """
    Then sharing roundtrip with password "mypassword" should preserve content

  Scenario: Decryption with wrong password fails
    Then sharing decrypt with wrong password should fail

  Scenario: Expired TTL link is rejected
    Then sharing with expired TTL should fail

  Scenario: Import from shared URL without password
    Given a share URL is prepared with content "# Imported Doc\nSome shared text."
    When I navigate to the app with the share URL
    Then the import dialog should be visible
    When I click replace all in import dialog
    Then the editor value should contain "Imported Doc"

  Scenario: Import from shared URL with password
    Given a share URL is prepared with content "# Secret Import" and password "pass123"
    When I navigate to the app with the share URL
    Then the password prompt should be visible
    When I enter import password "pass123"
    And I click the decrypt button
    Then the import dialog should be visible
    When I click replace all in import dialog
    Then the editor value should contain "Secret Import"

  Scenario: Import dialog cancel preserves existing content
    Given the editor contains:
      """
      # Original Content
      """
    And the current document is saved to IndexedDB
    And a share URL is prepared with content "# Replacement"
    When I navigate to the app with the share URL
    Then the import dialog should be visible
    When I click cancel in import dialog
    Then the editor value should contain "Original Content"
