const fs = require('fs');
const path = require('path');

// Get all actual files
const actualFiles = fs.readdirSync('public/question-banks')
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace('.json', ''));

console.log(`Found ${actualFiles.length} question bank files\n`);

// Define expected topics per domain (from testComposition.ts)
const domains = [
  {
    id: 'domain1',
    name: 'Evaluate Current State',
    topics: [
      "Compare License Types",
      "Tableau Products",
      "Upgrade Tableau Server Overview",
      "Location Data that Tableau Supports for Building Map Views",
      "Dashboards",
      "Structure Data for Analysis",
      "Optimize Relationship Queries Using Performance Options",
      "Best Practices for Published Data Sources",
      "Optimize Workbook Performance",
      "Tableau Cloud Release Notes",
      "Tableau Support Policy",
      "About Tableau Catalog",
      "Use Lineage for Impact Analysis",
      "Designing Efficient Production Dashboards Whitepaper"
    ],
    subtopics: {
      "Upgrade Tableau Server Overview": ["Upgrading from 2018.2 and Later (Windows)"],
      "Location Data that Tableau Supports for Building Map Views": ["Geocode Locations Tableau Does Not Recognize and Plot Them on a Map"]
    }
  },
  {
    id: 'domain4',
    name: 'Establish Governance and Support Published Content',
    topics: [
      "Governance in Tableau",
      "Publish Data Sources and Workbooks",
      "Data Security",
      "Data Labels",
      "Introduction to Tableau Metadata API",
      "Create a Virtual Connection",
      "Send Data-Driven Alerts from Tableau Cloud or Tableau Server",
      "Embed Views into Webpages",
      "Work with Content Revisions",
      "Administrative Views",
      "Use Admin Insights to Create Custom Views",
      "CMT Migration Limitations",
      "About Tableau Catalog",
      "Collect Data with the Tableau Server Repository",
      "Manage Content Access",
      "Tableau Public FAQ",
      "MFA and Tableau Cloud"
    ]
  }
];

function topicToFileName(topic) {
  return topic.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

domains.forEach(domain => {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`${domain.name} (${domain.id})`);
  console.log('='.repeat(70));
  
  let found = 0;
  let missing = [];
  
  // Check parent topics
  domain.topics.forEach(topic => {
    const expectedFile = topicToFileName(topic);
    const exists = actualFiles.includes(expectedFile);
    
    if (exists) {
      found++;
      console.log(`✓ ${topic}`);
      console.log(`  → ${expectedFile}.json`);
    } else {
      missing.push({topic, expectedFile});
      console.log(`✗ ${topic}`);
      console.log(`  → Expected: ${expectedFile}.json (NOT FOUND)`);
      
      // Try to find similar files
      const similar = actualFiles.filter(f => 
        f.includes(expectedFile.substring(0, 15)) || 
        expectedFile.includes(f.substring(0, 15))
      );
      if (similar.length > 0) {
        console.log(`  → Similar: ${similar.join(', ')}`);
      }
    }
  });
  
  // Check subtopics
  if (domain.subtopics) {
    console.log('\n--- Subtopics ---');
    Object.entries(domain.subtopics).forEach(([parent, subs]) => {
      subs.forEach(sub => {
        const expectedFile = topicToFileName(sub);
        const exists = actualFiles.includes(expectedFile);
        
        if (exists) {
          found++;
          console.log(`✓ ${sub} (subtopic)`);
          console.log(`  → ${expectedFile}.json`);
        } else {
          console.log(`✗ ${sub} (subtopic)`);
          console.log(`  → Expected: ${expectedFile}.json (NOT FOUND)`);
          console.log(`  → Should be integrated into: ${parent}`);
        }
      });
    });
  }
  
  const total = domain.topics.length + (domain.subtopics ? 
    Object.values(domain.subtopics).reduce((sum, arr) => sum + arr.length, 0) : 0);
  
  console.log(`\nSummary: ${found}/${total} found (${Math.round(found/total*100)}%)`);
  
  if (missing.length > 0) {
    console.log(`\nMissing files:`);
    missing.forEach(({topic, expectedFile}) => {
      console.log(`  - ${expectedFile}.json (${topic})`);
    });
  }
});
