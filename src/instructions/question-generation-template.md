# Question Generation Instructions

## Overview
This template provides instructions for generating Tableau Consultant certification practice questions for a specific topic. Follow these instructions systematically to create high-quality, exam-appropriate questions.

## Data Source
All topic information is maintained in: `/Users/markbanaria/Documents/test-review-framework/docs/Mapped_Catalog_Topics_to_URLs.csv`

This CSV contains the following columns:
- **Section**: Original exam section grouping
- **Topic**: The specific topic name
- **Assigned_URL**: Source URL for content
- **Domain**: Mapped domain (domain1, domain2, domain3, domain4)
- **Related_Topics**: Semicolon-separated list of related topics
- **Question_Count**: Target number of questions to generate

## Input Requirements
**Only provide the Topic Name** - all other information will be retrieved from the CSV.

Example: `"Create Level of Detail Expressions in Tableau"`

## Pre-Generation Steps

### 1. Look up Topic in CSV
- Find the topic row in the CSV file
- Extract: Assigned_URL, Domain, Related_Topics, Question_Count
- Validate that the URL is accessible

### 2. Content Analysis
**DEEP CRAWLING REQUIRED**: Perform comprehensive content analysis by:
- **Primary URL**: Crawl the source URL and extract key concepts
- **Nested Content Discovery**: Identify and follow ALL linked sub-pages and related documentation
- **Comprehensive Coverage**: For topics with extensive nested content, use comprehensive overview pages:
  - Functions: Use `https://help.tableau.com/current/pro/desktop/en-us/functions_all_categories.htm`
  - Performance: Include all related performance documentation links
  - Security: Follow all RLS and governance nested links
- **Content Depth Validation**: Ensure all major sub-topics, advanced scenarios, and enterprise patterns are covered
- Identify 10-20 main learning objectives from ALL available content (not just main page)
- Note any code examples, best practices, or common mistakes across nested content
- List technical terminology and definitions from comprehensive documentation

### 3. Related Content Review
- Review the Related_Topics from the CSV for cross-topic integration
- Identify potential integration points with related topics
- Note any prerequisites or dependencies

## Question Generation Framework

### Question Distribution
**IMPORTANT**: Adjust question count based on content depth discovered during deep crawling:

**Standard Topics (10-15 questions)**:
- **3-5 Knowledge Questions** (30%): Basic recall and understanding
- **4-6 Application Questions** (40%): Applying concepts to scenarios
- **3-5 Analysis Questions** (30%): Complex problem-solving and troubleshooting

**Complex Topics with Extensive Nested Content (25-40+ questions)**:
- **8-12 Knowledge Questions** (30%): Cover all major sub-categories
- **10-16 Application Questions** (40%): Diverse enterprise scenarios
- **7-12 Analysis Questions** (30%): Advanced integration and troubleshooting

**Examples of Complex Topics Requiring Enhanced Coverage**:
- Functions in Tableau (35+ questions covering all function categories)
- Performance Optimization (multiple related documentation areas)
- Security and Governance (extensive RLS and enterprise patterns)
- Data Connections (multiple connector types and scenarios)

### Difficulty Levels
- **Beginner** (20%): Direct concept recall
- **Intermediate** (50%): Scenario-based application
- **Advanced** (30%): Complex integration and troubleshooting

## Question Types and Templates

### 1. Knowledge Questions (Basic Understanding)
**Purpose**: Test fundamental concept recall

**Templates**:
- "What is the primary purpose of [CONCEPT]?"
- "Which of the following best describes [FEATURE]?"
- "When should you use [TECHNIQUE]?"

**Answer Options**:
- 1 clearly correct answer
- 3 plausible but incorrect distractors
- Avoid obvious wrong answers

### 2. Application Questions (Scenario-Based)
**Purpose**: Test ability to apply concepts in real situations

**Templates**:
- "A company needs to [BUSINESS_REQUIREMENT]. What is the best approach using [TOPIC]?"
- "You are troubleshooting [PROBLEM]. Which [TECHNIQUE] would most effectively resolve this?"
- "Given the constraint of [LIMITATION], how would you implement [SOLUTION]?"

**Scenarios to Include**:
- Performance optimization needs
- Security requirements
- Large-scale deployments
- Integration challenges
- User experience improvements

### 3. Analysis Questions (Complex Problem-Solving)
**Purpose**: Test advanced reasoning and integration of multiple concepts

**Templates**:
- "Your organization has [COMPLEX_SCENARIO]. You notice [PROBLEM_SYMPTOMS]. What combination of [TOPIC] and [RELATED_CONCEPT] would best address this?"
- "When implementing [ADVANCED_FEATURE] in an enterprise environment with [CONSTRAINTS], what is the most critical consideration for [GOAL]?"

## Domain-Specific Guidelines

### Domain 1: Evaluate Current State
- Focus on assessment and comparison questions
- Include licensing and architecture decisions
- Emphasize current vs. future state analysis

### Domain 2: Plan and Prepare Data Connections
- Emphasize data architecture decisions
- Include security and governance considerations
- Focus on scalability and performance

### Domain 3: Design and Troubleshoot Calculations and Workbooks
- Heavy emphasis on LOD expressions and calculations
- Include performance troubleshooting scenarios
- Focus on advanced chart types and interactions

### Domain 4: Establish Governance and Support Published Content
- Focus on enterprise deployment scenarios
- Include compliance and security questions
- Emphasize monitoring and maintenance

## Quality Standards

### Content Accuracy
- All technical information must be accurate
- Reference official Tableau documentation
- Avoid deprecated features or outdated practices

### Question Quality
- Questions should be clear and unambiguous
- Avoid trick questions or overly clever distractors
- Each question should test exactly one main concept
- Provide realistic scenarios relevant to consultant-level work

### Answer Options
- All distractors should be plausible but incorrect
- Avoid "all of the above" or "none of the above" options
- Keep option lengths roughly equal
- Randomize correct answer position

## Cross-Topic Integration

### When to Include Related Topics
- When the topic naturally integrates with others (30% of questions)
- For advanced difficulty questions
- When testing consultant-level strategic thinking

### Integration Approaches
- Combine data preparation with governance
- Link performance optimization with calculation design
- Connect architecture decisions with security requirements

## Output Format

Generate questions in this JSON structure:

```json
{
  "title": "[TOPIC_NAME] - Practice Questions",
  "description": "Practice questions for [TOPIC_NAME] covering [KEY_CONCEPTS]",
  "metadata": {
    "topic": "[TOPIC_NAME]",
    "domain": "[DOMAIN_NAME]",
    "difficulty": "[BEGINNER/INTERMEDIATE/ADVANCED]",
    "sourceUrl": "[SOURCE_URL]",
    "generatedDate": "[DATE]",
    "questionCount": [COUNT]
  },
  "questions": [
    {
      "id": "1",
      "question": "[QUESTION_TEXT]",
      "options": [
        "[OPTION_A]",
        "[OPTION_B]",
        "[OPTION_C]",
        "[OPTION_D]"
      ],
      "correctAnswer": [INDEX],
      "explanation": "[WHY_CORRECT_AND_WHY_OTHERS_WRONG]",
      "difficulty": "[BEGINNER/INTERMEDIATE/ADVANCED]",
      "tags": ["[TAG1]", "[TAG2]"]
    }
  ]
}
```

## Validation Checklist

Before finalizing questions:
- [ ] All questions are technically accurate
- [ ] Question distribution matches target percentages
- [ ] Scenarios are realistic for consultant-level work
- [ ] No questions test the same specific fact
- [ ] All distractors are plausible
- [ ] Explanations are educational and detailed
- [ ] Cross-topic integration is appropriate
- [ ] Language is clear and professional

## Example Generation Command

When ready to generate, use this simplified format:

```
Generate practice questions for the topic "[TOPIC_NAME]".
Look up this topic in the CSV file at `/Users/markbanaria/Documents/test-review-framework/docs/Mapped_Catalog_Topics_to_URLs.csv` to get the source URL, domain, related topics, and question count.
Follow the question generation template instructions and ensure questions are appropriate for Tableau Consultant certification level.
```

Example:
```
Generate practice questions for the topic "Create Level of Detail Expressions in Tableau".
Look up this topic in the CSV file to get all required information.
Follow the question generation template instructions.
```

---

*This template ensures consistent, high-quality question generation that aligns with the Salesforce Certified Tableau Consultant exam standards.*