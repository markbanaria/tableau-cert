export interface TestDomain {
  id: string;
  name: string;
  description: string;
  weightPercentage: number;
  questionCount: number; // For a 60-question exam
  questionBanks: string[]; // Direct references to .json filenames (without .json extension)
}

export interface TestComposition {
  examName: string;
  totalQuestions: number;
  passingScore: number;
  timeLimit: number; // in minutes
  domains: TestDomain[];
}

// Based on Salesforce Certified Tableau Consultant exam structure
// Aligned with source_of_truth.xml hierarchical structure
// Note: Subtopics are integrated into their parent topic question banks
export const TABLEAU_CONSULTANT_COMPOSITION: TestComposition = {
  examName: "Salesforce Certified Tableau Consultant",
  totalQuestions: 60,
  passingScore: 750, // out of 1000
  timeLimit: 120,
  domains: [
    {
      id: "domain1",
      name: "Evaluate Current State",
      description: "Map analytics architecture and assess current state analytics solutions",
      weightPercentage: 22,
      questionCount: 13, // 22% of 60 questions
      questionBanks: [
        "compare-license-types",
        "tableau-products",
        "upgrade-tableau-server-overview",
        "upgrading-from-2018-2-and-later-windows", // subtopic of upgrade-tableau-server-overview
        "location-data-tableau-supports",
        "geocode-locations-not-recognized", // subtopic of location-data-tableau-supports
        "dashboards",
        "structure-data-for-analysis",
        "optimize-relationship-queries-performance-options",
        "best-practices-published-data-sources",
        "optimize-workbook-performance",
        "tableau-cloud-release-notes",
        "tableau-support-policy",
        "about-tableau-catalog",
        "use-lineage-for-impact-analysis",
        "designing-efficient-production-dashboards-whitepaper"
      ]
    },
    {
      id: "domain2",
      name: "Plan and Prepare Data Connections",
      description: "Design data architecture and establish data connectivity strategies",
      weightPercentage: 22,
      questionCount: 13, // 22% of 60 questions
      questionBanks: [
        "get-your-data-tableau-ready",
        "set-up-data-sources",
        "rls-best-practices-for-data-sources-and-workbooks",
        "overview-of-row-level-security-options-in-tableau",
        "row-level-security-in-the-database",
        "best-practices-for-row-level-security-in-tableau-with-entitlements-tables-whitepaper",
        "how-relationships-differ-from-joins",
        "functions-in-tableau",
        "user-functions", // subtopic of functions-in-tableau (appears in both domain2 and domain3)
        "dashboard-extensions-api",
        "tableau-prep-save-and-share-your-work",
        "designing-efficient-production-dashboards-whitepaper",
        "manage-data",
        "refresh-extracts"
      ]
    },
    {
      id: "domain3",
      name: "Design and Troubleshoot Calculations and Workbooks",
      description: "Build advanced analytics solutions and troubleshoot complex workbooks",
      weightPercentage: 40,
      questionCount: 24, // 40% of 60 questions
      questionBanks: [
        "optimize-workbook-performance",
        "tableau-workbook-performance-checklist",
        "create-custom-fields-with-calculations",
        "level-of-detail-expressions", // subtopic of create-custom-fields-with-calculations
        "level-of-detail-expressions-and-aggregation", // subtopic of level-of-detail-expressions
        "functions-in-tableau", // subtopic of create-custom-fields-with-calculations (appears in both domain2 and domain3)
        "best-practices-for-creating-calculations-in-tableau", // subtopic of create-custom-fields-with-calculations
        "actions",
        "filter-data-from-your-views",
        "tableaus-order-of-operations",
        "use-radar-charts-to-compare-dimensions-over-several-metrics",
        "view-acceleration",
        "interpret-a-performance-recording",
        "designing-efficient-workbooks-whitepaper",
        "exploring-sankey-and-radial-charts-with-the-new-chart-types-pilot-on-tableau-public",
        "use-dynamic-zone-visibility",
        "fiscal-dates"
      ]
    },
    {
      id: "domain4",
      name: "Establish Governance and Support Published Content",
      description: "Implement governance frameworks and support enterprise Tableau deployments",
      weightPercentage: 16,
      questionCount: 10, // 16% of 60 questions
      questionBanks: [
        "governance-in-tableau",
        "publish-data-sources-and-workbooks",
        "data-security",
        "data-labels",
        "introduction-to-tableau-metadata-api",
        "create-virtual-connection",
        "send-data-driven-alerts",
        "embed-views-into-webpages",
        "work-with-content-revisions",
        "administrative-views",
        "use-admin-insights-to-create-custom-views",
        "cmt-migration-limitations",
        "about-tableau-catalog",
        "collect-data-with-tableau-server-repository",
        "manage-content-access",
        "tableau-public-faq",
        "mfa-and-tableau-cloud"
      ]
    }
  ]
};

// Quiz composition options for different practice scenarios
export const QUIZ_COMPOSITIONS = {
  FULL_PRACTICE: {
    name: "Full Practice Exam",
    totalQuestions: 60,
    domains: TABLEAU_CONSULTANT_COMPOSITION.domains
  },
  DOMAIN_FOCUS: {
    name: "Domain-Focused Practice",
    totalQuestions: 15,
    // Will sample proportionally from selected domain(s)
  },
  QUICK_REVIEW: {
    name: "Quick Review",
    totalQuestions: 20,
    // Balanced sampling across all domains
  },
  WEAK_AREAS: {
    name: "Weak Areas Focus",
    totalQuestions: 30,
    // User can select specific domains to focus on
  },
  PARENT_TOPICS_ONLY: {
    name: "Parent Topics Focus",
    totalQuestions: 40,
    // Focus on parent topics without subtopic integration
  },
  INTEGRATED_ASSESSMENT: {
    name: "Integrated Topic Assessment",
    totalQuestions: 50,
    // Include questions that span parent topics and their integrated subtopics
  }
};

export function getQuestionDistribution(
  composition: TestComposition,
  totalQuestions: number
): Record<string, number> {
  const distribution: Record<string, number> = {};

  composition.domains.forEach(domain => {
    const percentage = domain.weightPercentage / 100;
    distribution[domain.id] = Math.round(totalQuestions * percentage);
  });

  // Ensure total adds up exactly
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  if (total !== totalQuestions) {
    const diff = totalQuestions - total;
    const firstDomain = composition.domains[0].id;
    distribution[firstDomain] += diff;
  }

  return distribution;
}

// Helper function to get question bank filenames for a domain
export function getQuestionBanksForDomain(domainId: string): string[] {
  const domain = TABLEAU_CONSULTANT_COMPOSITION.domains.find(d => d.id === domainId);
  return domain?.questionBanks || [];
}