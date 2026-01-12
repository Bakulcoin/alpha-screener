import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig } from './config';
import { createContainer } from './container';

async function main(): Promise<void> {
  console.log('Alpha Screener - Local Test Run');
  console.log('================================\n');

  const config = loadConfig();
  const container = createContainer(config);

  const testProject = {
    name: process.argv[2] || 'Ethereum',
    docsUrl: process.argv[3],
    githubUrl: process.argv[4],
    website: process.argv[5],
  };

  console.log(`Analyzing: ${testProject.name}`);
  if (testProject.docsUrl) console.log(`Docs: ${testProject.docsUrl}`);
  if (testProject.githubUrl) console.log(`GitHub: ${testProject.githubUrl}`);
  if (testProject.website) console.log(`Website: ${testProject.website}`);
  console.log('');

  try {
    const result = await container.orchestrator.analyze(testProject, async (state) => {
      console.log(`[STATE] ${state}`);
    });

    // Create output directory
    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate filenames with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = testProject.name.replace(/[^a-zA-Z0-9]/g, '-');
    const jsonFile = path.join(outputDir, `${safeName}-${timestamp}.json`);
    const mdFile = path.join(outputDir, `${safeName}-${timestamp}.md`);

    // Save files
    fs.writeFileSync(jsonFile, result.json, 'utf-8');
    fs.writeFileSync(mdFile, result.markdown, 'utf-8');

    console.log('\n=== ANALYSIS COMPLETE ===\n');

    if (result.noFunding && !result.analysis.funding) {
      console.log('Funding Status: no funding\n');
    }

    console.log(`Final Grade: ${result.analysis.rating.finalGrade}`);
    console.log(`Consistency Score: ${result.analysis.rating.consistencyScore}/100`);
    console.log(`Opportunity Score: ${result.analysis.rating.opportunityScore}/100`);
    console.log(`Execution Score: ${result.analysis.rating.executionCredibilityScore}/100`);
    console.log('');
    console.log(`Reports saved to:`);
    console.log(`  JSON: ${jsonFile}`);
    console.log(`  Markdown: ${mdFile}`);

  } catch (error) {
    console.error('Analysis failed:', error);
    process.exit(1);
  }
}

main();
