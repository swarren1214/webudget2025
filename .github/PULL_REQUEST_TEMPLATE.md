**Related Issue:** *Closes #ISSUE_NUMBER*

**Summary of Changes:**

* **What:** Briefly describe the technical changes made in this PR.  
* **Why:** Explain the reasoning behind these changes. What problem does it solve?

**How to Test:**

Please provide clear, step-by-step instructions for the reviewer to manually test your changes.

1. `git checkout <your-branch-name>`  
2. `docker-compose up --build`  
3. Describe the specific API requests to make (e.g., using cURL or Postman) or UI interactions to perform.  
4. What is the expected outcome?

**Author's Checklist:**

* [ ] My PR title follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format (`<type>(<scope>): <subject>`).  
* [ ] I have added/updated unit tests for my changes.  
* [ ] I have updated the relevant documentation (e.g., API spec, `README.md`).  
* [ ] All new and existing tests pass (`npm test`).  
* [ ] The code has been linted and formatted.

**Reviewer's Checklist:**

* [ ] The code follows the project's architectural principles and coding standards.  
* [ ] The changes are understandable and maintainable.  
* [ ] The tests are adequate and cover the new logic.  
* [ ] The documentation is clear and accurate.
