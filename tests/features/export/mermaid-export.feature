Feature: Mermaid diagram export

  Background:
    Given the application is loaded

  Scenario: DOCX preserves mermaid diagram aspect ratio
    Given the editor contains:
      """
      ---
      title: "Mermaid Test"
      ---

      ```mermaid
      graph TD
        A[Start] --> B[Step 1]
        B --> C[Step 2]
        C --> D[Step 3]
        D --> E[Step 4]
        E --> F[End]
      ```
      """
    When I export as "docx"
    Then the DOCX should contain an image with correct aspect ratio
