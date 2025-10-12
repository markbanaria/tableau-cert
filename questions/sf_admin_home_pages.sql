-- Salesforce Administrator Certification Questions: Home Pages
-- Object Manager and Lightning App Builder Section
-- 12 questions total: 4 Easy, 6 Medium, 2 Hard

DO $$
DECLARE
  question_id UUID;
BEGIN

-- Question 1: Where do you access Lightning App Builder to create custom Home pages? (Easy)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'Where do you access Lightning App Builder to create custom Home pages?',
  'Object Manager and Lightning App Builder',
  1,
  'Lightning App Builder is accessed through Setup > Lightning App Builder. This is the primary tool for creating and customizing Home pages, App pages, and Record pages in Lightning Experience.',
  'https://trailhead.salesforce.com/content/learn/modules/lightning_app_builder/lightning_app_builder_homepage',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Setup > Lightning App Builder', true, CURRENT_TIMESTAMP),
  (question_id, 'Setup > Home Page Layouts', false, CURRENT_TIMESTAMP),
  (question_id, 'Setup > Page Layouts', false, CURRENT_TIMESTAMP),
  (question_id, 'Setup > Lightning Experience', false, CURRENT_TIMESTAMP);

-- Question 2: What template should you select when creating a new Home page in Lightning App Builder? (Easy)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'What template should you select when creating a new Home page in Lightning App Builder?',
  'Object Manager and Lightning App Builder',
  1,
  'When creating a new page in Lightning App Builder, you must select the "Home Page" template specifically for creating Home pages. Each template type (Home Page, App Page, Record Page) serves different purposes.',
  'https://trailhead.salesforce.com/content/learn/modules/lightning_app_builder/lightning_app_builder_homepage',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Home Page', true, CURRENT_TIMESTAMP),
  (question_id, 'App Page', false, CURRENT_TIMESTAMP),
  (question_id, 'Record Page', false, CURRENT_TIMESTAMP),
  (question_id, 'Custom Page', false, CURRENT_TIMESTAMP);

-- Question 3: Which component is commonly available for Home pages to display upcoming calendar events? (Easy)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'Which component is commonly available for Home pages to display upcoming calendar events?',
  'Object Manager and Lightning App Builder',
  1,
  'Today''s Events is a standard component available for Home pages that displays upcoming calendar events. Other standard components include Assistant, Performance, Key Deals, and Today''s Tasks.',
  'https://trailhead.salesforce.com/content/learn/modules/lightning_app_builder/lightning_app_builder_homepage',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Today''s Events', true, CURRENT_TIMESTAMP),
  (question_id, 'Calendar Widget', false, CURRENT_TIMESTAMP),
  (question_id, 'Event Display', false, CURRENT_TIMESTAMP),
  (question_id, 'Schedule Component', false, CURRENT_TIMESTAMP);

-- Question 4: What happens when you first edit a standard Home page in Lightning App Builder? (Easy)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'What happens when you first edit a standard Home page in Lightning App Builder?',
  'Object Manager and Lightning App Builder',
  1,
  'When you first edit a standard Home page, Salesforce automatically creates a copy of the standard page to preserve the original. This allows customization while maintaining upgrade capabilities.',
  'https://trailhead.salesforce.com/content/learn/modules/lightning_app_builder/lightning_app_builder_homepage',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Salesforce creates a copy of the standard page', true, CURRENT_TIMESTAMP),
  (question_id, 'The original page is modified directly', false, CURRENT_TIMESTAMP),
  (question_id, 'A new page template is generated', false, CURRENT_TIMESTAMP),
  (question_id, 'The page becomes read-only', false, CURRENT_TIMESTAMP);

-- Question 5: A Salesforce Administrator wants to assign a custom Home page to sales users only. What is the most appropriate activation method? (Medium)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'A Salesforce Administrator wants to assign a custom Home page to sales users only. What is the most appropriate activation method?',
  'Object Manager and Lightning App Builder',
  2,
  'App-profile combinations provide the most granular control for assigning Home pages to specific user groups. This method allows you to target specific profiles (like sales users) with specific apps, ensuring the right users see the right Home page.',
  'https://trailhead.salesforce.com/content/learn/modules/lightning_app_builder/lightning_app_builder_homepage',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Assign to app-profile combinations for sales profiles', true, CURRENT_TIMESTAMP),
  (question_id, 'Make it the org default and restrict access', false, CURRENT_TIMESTAMP),
  (question_id, 'Set it as default for the Sales app only', false, CURRENT_TIMESTAMP),
  (question_id, 'Create permission sets for Home page access', false, CURRENT_TIMESTAMP);

-- Question 6: When designing a Home page for executives, which component would be most appropriate to display high-level sales metrics? (Medium)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'When designing a Home page for executives, which component would be most appropriate to display high-level sales metrics?',
  'Object Manager and Lightning App Builder',
  2,
  'The Performance component is designed to display key performance indicators and metrics, making it ideal for executives who need to see high-level sales data and organizational performance at a glance.',
  'https://trailhead.salesforce.com/content/learn/modules/lightning_app_builder/lightning_app_builder_homepage',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Performance component', true, CURRENT_TIMESTAMP),
  (question_id, 'Today''s Tasks component', false, CURRENT_TIMESTAMP),
  (question_id, 'Assistant component', false, CURRENT_TIMESTAMP),
  (question_id, 'Today''s Events component', false, CURRENT_TIMESTAMP);

-- Question 7: What is a key advantage of using template-based pages when creating custom Home pages? (Medium)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'What is a key advantage of using template-based pages when creating custom Home pages?',
  'Object Manager and Lightning App Builder',
  2,
  'Template-based pages retain upgrade capabilities, meaning they can benefit from future Salesforce enhancements and updates. This is a best practice to ensure long-term maintainability and access to new features.',
  'https://trailhead.salesforce.com/content/learn/modules/lightning_app_builder/lightning_app_builder_homepage',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Retains upgrade capabilities from Salesforce', true, CURRENT_TIMESTAMP),
  (question_id, 'Allows unlimited component customization', false, CURRENT_TIMESTAMP),
  (question_id, 'Provides better page load performance', false, CURRENT_TIMESTAMP),
  (question_id, 'Enables real-time data synchronization', false, CURRENT_TIMESTAMP);

-- Question 8: A company has different departments that need different Home page layouts. What is the most efficient approach to accommodate this requirement? (Medium)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'A company has different departments that need different Home page layouts. What is the most efficient approach to accommodate this requirement?',
  'Object Manager and Lightning App Builder',
  2,
  'Creating separate Home pages for different departments and using app-profile combinations is the most efficient and maintainable approach. This provides clear separation of content and easy management of department-specific requirements.',
  'https://trailhead.salesforce.com/content/learn/modules/lightning_app_builder/lightning_app_builder_homepage',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Create separate Home pages and assign them using app-profile combinations', true, CURRENT_TIMESTAMP),
  (question_id, 'Use a single Home page with conditional visibility', false, CURRENT_TIMESTAMP),
  (question_id, 'Create different Lightning apps for each department', false, CURRENT_TIMESTAMP),
  (question_id, 'Implement custom Apex components for dynamic content', false, CURRENT_TIMESTAMP);

-- Question 9: Which activation option would you choose to make a custom Home page the default for all users across the entire organization? (Medium)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'Which activation option would you choose to make a custom Home page the default for all users across the entire organization?',
  'Object Manager and Lightning App Builder',
  2,
  'The "Make default for entire org" activation option sets the custom Home page as the default for all users organization-wide. This is the appropriate choice when you want consistent Home page experience across all users.',
  'https://trailhead.salesforce.com/content/learn/modules/lightning_app_builder/lightning_app_builder_homepage',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Make default for entire org', true, CURRENT_TIMESTAMP),
  (question_id, 'Set default for all apps', false, CURRENT_TIMESTAMP),
  (question_id, 'Assign to all profiles individually', false, CURRENT_TIMESTAMP),
  (question_id, 'Use system administrator override', false, CURRENT_TIMESTAMP);

-- Question 10: When creating a Home page for customer service representatives, which standard component would be most relevant for displaying their daily work items? (Medium)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'When creating a Home page for customer service representatives, which standard component would be most relevant for displaying their daily work items?',
  'Object Manager and Lightning App Builder',
  2,
  'Today''s Tasks component displays daily work items and task assignments, making it most relevant for customer service representatives who need to track and manage their daily responsibilities and follow-ups.',
  'https://trailhead.salesforce.com/content/learn/modules/lightning_app_builder/lightning_app_builder_homepage',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Today''s Tasks', true, CURRENT_TIMESTAMP),
  (question_id, 'Key Deals', false, CURRENT_TIMESTAMP),
  (question_id, 'Performance', false, CURRENT_TIMESTAMP),
  (question_id, 'Assistant', false, CURRENT_TIMESTAMP);

-- Question 11: A multi-national company needs different Home pages for users in different regions, with some pages containing region-specific components that require different data sources. The administrator wants to maintain centralized control while allowing regional customization. What is the most scalable architecture approach? (Hard)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'A multi-national company needs different Home pages for users in different regions, with some pages containing region-specific components that require different data sources. The administrator wants to maintain centralized control while allowing regional customization. What is the most scalable architecture approach?',
  'Object Manager and Lightning App Builder',
  3,
  'Creating a base template with region-specific variants using app-profile combinations provides the optimal balance of centralized control and regional customization. This approach is scalable, maintainable, and leverages standard Salesforce functionality while allowing for region-specific components and data sources.',
  'https://trailhead.salesforce.com/content/learn/modules/lightning_app_builder/lightning_app_builder_homepage',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Create a base Home page template with core components, then create region-specific variants using app-profile combinations with additional custom components', true, CURRENT_TIMESTAMP),
  (question_id, 'Use a single Home page with complex conditional visibility rules based on user location fields', false, CURRENT_TIMESTAMP),
  (question_id, 'Implement custom Lightning Web Components that dynamically load content based on user region', false, CURRENT_TIMESTAMP),
  (question_id, 'Create separate Lightning apps for each region with their own Home pages', false, CURRENT_TIMESTAMP);

-- Question 12: An organization has implemented a complex Home page strategy where different user personas (Sales Managers, Sales Reps, Customer Service, Executives) need different combinations of components and layouts. The administrator needs to ensure optimal performance while maintaining the ability to quickly deploy updates. Which design pattern best addresses these requirements? (Hard)
INSERT INTO questions (content, question_type, difficulty_level, explanation, source_url, updated_at)
VALUES (
  'An organization has implemented a complex Home page strategy where different user personas (Sales Managers, Sales Reps, Customer Service, Executives) need different combinations of components and layouts. The administrator needs to ensure optimal performance while maintaining the ability to quickly deploy updates. Which design pattern best addresses these requirements?',
  'Object Manager and Lightning App Builder',
  3,
  'A component-based design with reusable custom components and persona-specific Home pages provides optimal performance, maintainability, and deployment flexibility. Using app-profile combinations ensures proper targeting while shared components enable consistent updates across personas.',
  'https://trailhead.salesforce.com/content/learn/modules/lightning_app_builder/lightning_app_builder_homepage',
  CURRENT_TIMESTAMP
) RETURNING id INTO question_id;

INSERT INTO answers (question_id, content, is_correct, created_at) VALUES
  (question_id, 'Implement a component-based design using reusable custom components with persona-specific Home pages assigned via app-profile combinations, maintaining shared components in a managed package approach', true, CURRENT_TIMESTAMP),
  (question_id, 'Create dynamic Home pages that use Apex controllers to determine component visibility based on user attributes', false, CURRENT_TIMESTAMP),
  (question_id, 'Use a single Home page with extensive conditional visibility rules and custom CSS for different layouts', false, CURRENT_TIMESTAMP),
  (question_id, 'Develop separate Lightning applications for each persona with their own complete Home page sets', false, CURRENT_TIMESTAMP);

RAISE NOTICE 'Created 12 Home Pages questions successfully.';

END $$;