Feature: Formatting toolbar

  Background:
    Given the application is loaded
    And the editor contains:
      """
      Hello world
      """

  Scenario: Toolbar appears on selection and disappears when cleared
    When I select text "Hello" in the editor
    Then the formatting toolbar should be visible
    When I click inside the editor without selecting
    Then the formatting toolbar should not be visible

  Scenario: Bold applies and toggles off correctly
    When I select text "Hello" in the editor
    And I click the "bold" toolbar button
    Then the editor should contain "**Hello** world"
    And the "bold" toolbar button should be active
    And the "italic" toolbar button should not be active
    When I select text "Hello" in the editor
    And I click the "bold" toolbar button
    Then the editor should contain "Hello world"

  Scenario: Italic applies and does not false-activate bold
    When I select text "Hello" in the editor
    And I click the "italic" toolbar button
    Then the editor should contain "*Hello* world"
    And the "italic" toolbar button should be active
    And the "bold" toolbar button should not be active
    When I select text "Hello" in the editor
    And I click the "italic" toolbar button
    Then the editor should contain "Hello world"

  Scenario: Bold+italic detects both and toggles independently
    Given the editor contains:
      """
      ***Hello*** world
      """
    When I select text "Hello" in the editor
    Then the "bold" toolbar button should be active
    And the "italic" toolbar button should be active
    When I click the "bold" toolbar button
    Then the editor should contain "*Hello* world"
    And the "italic" toolbar button should be active
    And the "bold" toolbar button should not be active

  Scenario: Code and link formatting
    When I select text "Hello" in the editor
    And I click the "code" toolbar button
    Then the editor should contain "`Hello` world"
    When I select text "world" in the editor
    And I click the "link" toolbar button
    Then the editor should contain "`Hello` [world](url)"

  Scenario: Keyboard shortcuts apply formatting
    When I select text "Hello" in the editor
    And I press Ctrl+B
    Then the editor should contain "**Hello** world"
    When I select text "world" in the editor
    And I press Ctrl+I
    Then the editor should contain "**Hello** *world*"

  Scenario: Formatting updates preview
    When I select text "Hello" in the editor
    And I click the "bold" toolbar button
    When the preview renders
    Then the preview should contain a "strong" element
    And the "strong" element should contain text "Hello"
