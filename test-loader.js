const fs = require('fs');
const path = require('path');

// Simulate the topic discovery logic
const testComposition = {
  domains: [
    {
      id: "domain1",
      name: "Evaluate Current State",
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
    }
  ]
};

function topicToFileName(topic) {
  return topic.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const domain = testComposition.domains[0];
console.log(`Domain 1: ${domain.name}`);
console.log(`Expected topics: ${domain.topics.length}`);

let found = 0;
let missing = [];

domain.topics.forEach(topic => {
  const fileName = topicToFileName(topic) + '.json';
  const filePath = path.join(__dirname, 'public/question-banks', fileName);
  
  if (fs.existsSync(filePath)) {
    found++;
    console.log(`✓ ${fileName}`);
  } else {
    missing.push(fileName);
    console.log(`✗ ${fileName} - MISSING`);
  }
});

// Check subtopics
if (domain.subtopics) {
  Object.entries(domain.subtopics).forEach(([parent, subs]) => {
    subs.forEach(subtopic => {
      const fileName = topicToFileName(subtopic) + '.json';
      const filePath = path.join(__dirname, 'public/question-banks', fileName);
      
      if (fs.existsSync(filePath)) {
        found++;
        console.log(`✓ ${fileName} (subtopic)`);
      } else {
        missing.push(fileName);
        console.log(`✗ ${fileName} (subtopic) - MISSING`);
      }
    });
  });
}

console.log(`\nTotal expected: ${domain.topics.length + 2}`);
console.log(`Found: ${found}`);
console.log(`Missing: ${missing.length}`);
if (missing.length > 0) {
  console.log('\nMissing files:');
  missing.forEach(f => console.log(`  - ${f}`));
}
