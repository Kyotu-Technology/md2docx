Feature: Preview visual regression

  Background:
    Given the application is loaded

  Scenario: Full document preview matches baseline
    Given the editor contains the file "full-document.md"
    When the preview fully renders
    Then the preview pane should match the visual baseline "full-document"

  Scenario: List rendering matches visual baseline
    Given the editor contains the file "lists.md"
    When the preview fully renders
    Then the preview pane should match the visual baseline "lists"

  Scenario: Empty state matches visual baseline
    Given the editor is empty
    Then the preview pane should match the visual baseline "empty-state"
