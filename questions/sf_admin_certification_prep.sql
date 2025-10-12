-- Salesforce Administrator Certification Questions: Certification Prep
-- Object Manager and Lightning App Builder Section
-- 12 questions total: 4 Easy, 6 Medium, 2 Hard

DO $$
DECLARE
  question_id UUID;
BEGIN

-- Question 1: What percentage of the Salesforce Administrator exam focuses on Object Manager and Lightning App Builder? (Easy)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'What percentage of the Salesforce Administrator exam focuses on Object Manager and Lightning App Builder?',
  'Object Manager and Lightning App Builder',
  1,
  'Object Manager and Lightning App Builder comprises 20% of the Salesforce Administrator exam. This section covers object architecture, relationships, field management, page layouts, record types, and business processes.',
  'https://trailhead.salesforce.com/content/learn/modules/administrator-certification-prep-setup-and-objects/practice-user-setup',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, '20%', true, CURRENT_TIMESTAMP),
  (question_id, '15%', false, CURRENT_TIMESTAMP),
  (question_id, '25%', false, CURRENT_TIMESTAMP),
  (question_id, '18%', false, CURRENT_TIMESTAMP);

-- Question 2: Which of the following is a core topic covered in the Object Manager and Lightning App Builder exam section? (Easy)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'Which of the following is a core topic covered in the Object Manager and Lightning App Builder exam section?',
  'Object Manager and Lightning App Builder',
  1,
  'Object architecture is a fundamental topic in the Object Manager and Lightning App Builder section. It includes understanding standard and custom objects, their relationships, and how they fit into the overall Salesforce data model.',
  'https://trailhead.salesforce.com/content/learn/modules/administrator-certification-prep-setup-and-objects/practice-user-setup',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Object architecture', true, CURRENT_TIMESTAMP),
  (question_id, 'Email integration', false, CURRENT_TIMESTAMP),
  (question_id, 'Mobile app development', false, CURRENT_TIMESTAMP),
  (question_id, 'Analytics dashboard creation', false, CURRENT_TIMESTAMP);

-- Question 3: What is the primary focus when studying field management for the Salesforce Administrator certification? (Easy)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'What is the primary focus when studying field management for the Salesforce Administrator certification?',
  'Object Manager and Lightning App Builder',
  1,
  'Field management focuses on creating, editing, and deleting fields on both standard and custom objects. This includes understanding field types, validation rules, and how fields interact with page layouts and security settings.',
  'https://trailhead.salesforce.com/content/learn/modules/administrator-certification-prep-setup-and-objects/practice-user-setup',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Creating, editing, and deleting fields on standard and custom objects', true, CURRENT_TIMESTAMP),
  (question_id, 'Designing custom field icons and colors', false, CURRENT_TIMESTAMP),
  (question_id, 'Programming custom field behaviors with Apex', false, CURRENT_TIMESTAMP),
  (question_id, 'Integrating fields with external systems', false, CURRENT_TIMESTAMP);

-- Question 4: Which Trailhead module is recommended as related preparation for the Object Manager certification topics? (Easy)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'Which Trailhead module is recommended as related preparation for the Object Manager certification topics?',
  'Object Manager and Lightning App Builder',
  1,
  'The "Data Modeling" module is specifically recommended as related preparation for Object Manager certification topics. It provides deep understanding of how to structure data in Salesforce using objects and relationships.',
  'https://trailhead.salesforce.com/content/learn/modules/administrator-certification-prep-setup-and-objects/practice-user-setup',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Data Modeling', true, CURRENT_TIMESTAMP),
  (question_id, 'Apex Programming', false, CURRENT_TIMESTAMP),
  (question_id, 'Marketing Cloud Basics', false, CURRENT_TIMESTAMP),
  (question_id, 'Community Cloud Implementation', false, CURRENT_TIMESTAMP);

-- Question 5: When preparing for the certification exam, what type of questions should you focus on practicing for the Object Manager section? (Medium)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'When preparing for the certification exam, what type of questions should you focus on practicing for the Object Manager section?',
  'Object Manager and Lightning App Builder',
  2,
  'Scenario-based practice questions are recommended for Object Manager preparation. These questions test your ability to apply object management concepts in real-world business situations, which mirrors the actual exam format.',
  'https://trailhead.salesforce.com/content/learn/modules/administrator-certification-prep-setup-and-objects/practice-user-setup',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Scenario-based practice questions', true, CURRENT_TIMESTAMP),
  (question_id, 'Memorization-based recall questions', false, CURRENT_TIMESTAMP),
  (question_id, 'Multiple choice vocabulary tests', false, CURRENT_TIMESTAMP),
  (question_id, 'Code compilation exercises', false, CURRENT_TIMESTAMP);

-- Question 6: What is the most effective study approach for mastering page layout creation and assignment? (Medium)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'What is the most effective study approach for mastering page layout creation and assignment?',
  'Object Manager and Lightning App Builder',
  2,
  'Hands-on learning and practical application are emphasized as the most effective approach. This includes actually creating page layouts, assigning them to different profiles, and testing how they work in different user contexts.',
  'https://trailhead.salesforce.com/content/learn/modules/administrator-certification-prep-setup-and-objects/practice-user-setup',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Hands-on learning and practical application', true, CURRENT_TIMESTAMP),
  (question_id, 'Reading documentation without practice', false, CURRENT_TIMESTAMP),
  (question_id, 'Watching video tutorials only', false, CURRENT_TIMESTAMP),
  (question_id, 'Memorizing page layout field positions', false, CURRENT_TIMESTAMP);

-- Question 7: Which project is specifically recommended to practice Object Manager skills for certification preparation? (Medium)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'Which project is specifically recommended to practice Object Manager skills for certification preparation?',
  'Object Manager and Lightning App Builder',
  2,
  'The "Build a Battle Station App" project is recommended for practicing Object Manager skills. This project provides hands-on experience with object creation, field management, and relationship building.',
  'https://trailhead.salesforce.com/content/learn/modules/administrator-certification-prep-setup-and-objects/practice-user-setup',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Build a Battle Station App', true, CURRENT_TIMESTAMP),
  (question_id, 'Create a Marketing Campaign', false, CURRENT_TIMESTAMP),
  (question_id, 'Build a Community Portal', false, CURRENT_TIMESTAMP),
  (question_id, 'Design a Mobile App Interface', false, CURRENT_TIMESTAMP);

-- Question 8: What is the primary benefit of using interactive flashcards during Object Manager certification preparation? (Medium)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'What is the primary benefit of using interactive flashcards during Object Manager certification preparation?',
  'Object Manager and Lightning App Builder',
  2,
  'Interactive flashcards help reinforce key concepts and terminology while providing immediate feedback. They are particularly effective for memorizing object relationships, field types, and configuration options.',
  'https://trailhead.salesforce.com/content/learn/modules/administrator-certification-prep-setup-and-objects/practice-user-setup',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Reinforce key concepts and terminology with immediate feedback', true, CURRENT_TIMESTAMP),
  (question_id, 'Replace the need for hands-on practice', false, CURRENT_TIMESTAMP),
  (question_id, 'Provide real-time system access', false, CURRENT_TIMESTAMP),
  (question_id, 'Generate automatic certification scores', false, CURRENT_TIMESTAMP);

-- Question 9: When studying business process configuration, what should be the main area of focus? (Medium)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'When studying business process configuration, what should be the main area of focus?',
  'Object Manager and Lightning App Builder',
  2,
  'The main focus should be on understanding how business processes integrate with record types and page layouts to control user experience and data entry workflows. This includes creating processes that guide users through specific business scenarios.',
  'https://trailhead.salesforce.com/content/learn/modules/administrator-certification-prep-setup-and-objects/practice-user-setup',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Integration with record types and page layouts to control user workflows', true, CURRENT_TIMESTAMP),
  (question_id, 'Programming complex business logic in Apex', false, CURRENT_TIMESTAMP),
  (question_id, 'Creating custom business process icons', false, CURRENT_TIMESTAMP),
  (question_id, 'Designing process automation with external systems', false, CURRENT_TIMESTAMP);

-- Question 10: What is the recommended approach for exploring related badges during Object Manager certification preparation? (Medium)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'What is the recommended approach for exploring related badges during Object Manager certification preparation?',
  'Object Manager and Lightning App Builder',
  2,
  'Related badges should be explored for deeper understanding of interconnected concepts. Each badge provides focused learning on specific aspects of Object Manager functionality, creating a comprehensive knowledge foundation.',
  'https://trailhead.salesforce.com/content/learn/modules/administrator-certification-prep-setup-and-objects/practice-user-setup',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Explore badges for deeper understanding of interconnected concepts', true, CURRENT_TIMESTAMP),
  (question_id, 'Complete badges only after passing the certification', false, CURRENT_TIMESTAMP),
  (question_id, 'Focus on badges unrelated to Object Manager', false, CURRENT_TIMESTAMP),
  (question_id, 'Skip badges and focus only on modules', false, CURRENT_TIMESTAMP);

-- Question 11: A Salesforce Administrator is preparing for certification and needs to demonstrate mastery of object relationships in complex business scenarios. They have a multinational organization with different business processes, regulatory requirements, and user roles across regions. What comprehensive preparation strategy would best prepare them for advanced Object Manager questions on the certification exam? (Hard)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'A Salesforce Administrator is preparing for certification and needs to demonstrate mastery of object relationships in complex business scenarios. They have a multinational organization with different business processes, regulatory requirements, and user roles across regions. What comprehensive preparation strategy would best prepare them for advanced Object Manager questions on the certification exam?',
  'Object Manager and Lightning App Builder',
  3,
  'A comprehensive approach combining hands-on practice with scenario-based learning provides the best preparation. This includes creating complex object hierarchies, implementing multiple business processes, testing various record type assignments, and understanding how all components work together in real-world scenarios.',
  'https://trailhead.salesforce.com/content/learn/modules/administrator-certification-prep-setup-and-objects/practice-user-setup',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Combine hands-on practice with scenario-based learning, creating complex object hierarchies and testing multiple business processes', true, CURRENT_TIMESTAMP),
  (question_id, 'Focus exclusively on memorizing Salesforce documentation and feature lists', false, CURRENT_TIMESTAMP),
  (question_id, 'Complete only the basic Object Manager modules without advanced projects', false, CURRENT_TIMESTAMP),
  (question_id, 'Study theoretical concepts without practical implementation in a Salesforce org', false, CURRENT_TIMESTAMP);

-- Question 12: An organization is implementing a comprehensive Salesforce solution that requires integration between Object Manager configurations, Lightning App Builder customizations, and business process automation. For certification preparation, what advanced understanding should an administrator demonstrate regarding the interdependencies between these components? (Hard)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'An organization is implementing a comprehensive Salesforce solution that requires integration between Object Manager configurations, Lightning App Builder customizations, and business process automation. For certification preparation, what advanced understanding should an administrator demonstrate regarding the interdependencies between these components?',
  'Object Manager and Lightning App Builder',
  3,
  'Advanced understanding requires demonstrating how object architecture drives page layout design, which influences Lightning App Builder customizations, which in turn affects business process flows. This includes understanding how field dependencies, record types, and user permissions create cascading effects across the entire system.',
  'https://trailhead.salesforce.com/content/learn/modules/administrator-certification-prep-setup-and-objects/practice-user-setup',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Understand how object architecture drives page layout design, Lightning customizations, and business process flows with cascading system effects', true, CURRENT_TIMESTAMP),
  (question_id, 'Focus on each component independently without considering integration points', false, CURRENT_TIMESTAMP),
  (question_id, 'Memorize individual feature capabilities without understanding system-wide impacts', false, CURRENT_TIMESTAMP),
  (question_id, 'Implement solutions using only standard configurations without customization', false, CURRENT_TIMESTAMP);

RAISE NOTICE 'Created 12 Certification Prep questions successfully.';

END $$;