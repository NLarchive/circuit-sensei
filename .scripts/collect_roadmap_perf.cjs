#!/usr/bin/env node

/**
 * Collect and analyze roadmap performance metrics
 * Run with: node .scripts/collect_roadmap_perf.js
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class RoadmapPerformanceCollector {
  constructor() {
    this.results = [];
    this.outputFile = path.join(__dirname, '..', 'test-results', 'roadmap-performance.json');
  }

  async runTests() {
    console.log('🚀 Running roadmap performance tests...');

    // Run Playwright tests and capture output
    const playwrightPath = path.join(__dirname, '..', 'node_modules', '.bin', 'playwright.cmd');
    const testProcess = spawn(playwrightPath, ['test', 'roadmap.performance.spec.js', '--reporter=json'], {
      cwd: path.join(__dirname, '..'),
      stdio: ['inherit', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    testProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    testProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    return new Promise((resolve, reject) => {
      testProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const results = JSON.parse(stdout);
            this.analyzeResults(results);
            resolve(results);
          } catch (e) {
            console.error('Failed to parse test results:', e);
            reject(e);
          }
        } else {
          console.error('Tests failed with code:', code);
          console.error('stderr:', stderr);
          reject(new Error(`Tests failed with code ${code}`));
        }
      });

      testProcess.on('error', reject);
    });
  }

  analyzeResults(testResults) {
    console.log('\n📊 Analyzing performance results...');

    const performanceData = {
      timestamp: new Date().toISOString(),
      summary: {},
      details: {},
      recommendations: []
    };

    // Extract performance marks from test output
    testResults.suites?.forEach(suite => {
      suite.specs?.forEach(spec => {
        spec.tests?.forEach(test => {
          if (test.results?.[0]?.stdout) {
            const stdout = test.results[0].stdout;
            const performanceLines = stdout.split('\n').filter(line =>
              line.includes('Performance Measurements:') ||
              line.includes('User Journey Times:') ||
              line.includes('Game Engine Ready:') ||
              line.includes('Component Loading Order:')
            );

            if (performanceLines.length > 0) {
              this.parsePerformanceOutput(stdout, performanceData);
            }
          }
        });
      });
    });

    // Calculate summary statistics
    if (performanceData.details.componentTimes) {
      const times = Object.values(performanceData.details.componentTimes);
      performanceData.summary = {
        averageLoadTime: times.reduce((a, b) => a + b, 0) / times.length,
        slowestComponent: Object.entries(performanceData.details.componentTimes)
          .reduce((max, [comp, time]) => time > max.time ? { component: comp, time } : max, { time: 0 }),
        fastestComponent: Object.entries(performanceData.details.componentTimes)
          .reduce((min, [comp, time]) => time < min.time ? { component: comp, time } : min, { time: Infinity }),
        totalLoadTime: performanceData.details.totalLoad || 0
      };
    }

    // Generate recommendations
    this.generateRecommendations(performanceData);

    // Save results
    this.saveResults(performanceData);

    // Print summary
    this.printSummary(performanceData);
  }

  parsePerformanceOutput(stdout, performanceData) {
    // stdout is an array of objects with "text" properties
    console.log('Raw stdout:', JSON.stringify(stdout, null, 2));
    const fullOutput = stdout.map(item => item.text || '').join('');
    console.log('Full output:', fullOutput);

    const lines = fullOutput.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === 'Performance Measurements:') {
        performanceData.details.componentTimes = {};
        i++;
        while (i < lines.length && lines[i].trim() && !lines[i].includes('User Journey')) {
          const match = lines[i].match(/^(.+?):\s*([\d.]+)ms$/);
          if (match) {
            performanceData.details.componentTimes[match[1]] = parseFloat(match[2]);
          }
          i++;
        }
        i--; // Adjust for loop increment
      }

      if (line === 'User Journey Times:') {
        performanceData.details.journeyTimes = {};
        i++;
        while (i < lines.length && lines[i].trim() && !lines[i].includes('Game Engine')) {
          const match = lines[i].match(/^(.+?):\s*([\d.]+)ms$/);
          if (match) {
            performanceData.details.journeyTimes[match[1]] = parseFloat(match[2]);
          }
          i++;
        }
        i--; // Adjust for loop increment
      }

      if (line.includes('Game Engine Ready:')) {
        const match = line.match(/Game Engine Ready:\s*([\d.]+)ms/);
        if (match) {
          performanceData.details.gameEngineReady = parseFloat(match[1]);
        }
      }

      if (line.includes('Component Loading Order:')) {
        performanceData.details.loadingOrder = [];
        i++;
        while (i < lines.length && lines[i].trim() && !lines[i].includes('---')) {
          const match = lines[i].match(/^\d+\.\s*(.+?)\s+at\s+([\d.]+)ms$/);
          if (match) {
            performanceData.details.loadingOrder.push({
              component: match[1],
              time: parseFloat(match[2])
            });
          }
          i++;
        }
        i--; // Adjust for loop increment
      }
    }
  }

  generateRecommendations(performanceData) {
    const recommendations = [];

    if (performanceData.details.componentTimes) {
      const { variantSelectors, levelStars, totalLoad } = performanceData.details.componentTimes;

      if (variantSelectors && levelStars) {
        const diff = variantSelectors - levelStars;
        if (diff > 1000) {
          recommendations.push({
            priority: 'high',
            issue: `Variant selectors load ${diff.toFixed(0)}ms slower than stars`,
            suggestion: 'Optimize variant data loading or use precomputed summaries'
          });
        }
      }

      if (totalLoad > 10000) {
        recommendations.push({
          priority: 'high',
          issue: `Total load time (${totalLoad.toFixed(0)}ms) exceeds 10s threshold`,
          suggestion: 'Implement code splitting or lazy loading for heavy components'
        });
      }

      // Check for slow components
      Object.entries(performanceData.details.componentTimes).forEach(([component, time]) => {
        if (time > 5000) {
          recommendations.push({
            priority: 'medium',
            issue: `${component} loads slowly (${time.toFixed(0)}ms)`,
            suggestion: 'Consider optimizing or deferring this component'
          });
        }
      });
    }

    if (performanceData.details.journeyTimes) {
      const { 'game-playable': gamePlayable } = performanceData.details.journeyTimes;
      if (gamePlayable > 12000) {
        recommendations.push({
          priority: 'high',
          issue: 'Time to playable game exceeds 12s',
          suggestion: 'Optimize initial data loading and game initialization'
        });
      }
    }

    performanceData.recommendations = recommendations;
  }

  saveResults(performanceData) {
    // Ensure test-results directory exists
    const dir = path.dirname(this.outputFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.outputFile, JSON.stringify(performanceData, null, 2));
    console.log(`📁 Results saved to: ${this.outputFile}`);
  }

  printSummary(performanceData) {
    console.log('\n📈 Performance Summary:');
    console.log('='.repeat(50));

    if (performanceData.summary) {
      console.log(`Total Load Time: ${performanceData.summary.totalLoadTime?.toFixed(2) || 'N/A'}ms`);
      console.log(`Average Component Time: ${performanceData.summary.averageLoadTime?.toFixed(2) || 'N/A'}ms`);
      console.log(`Slowest Component: ${performanceData.summary.slowestComponent?.component || 'N/A'} (${performanceData.summary.slowestComponent?.time?.toFixed(2) || 'N/A'}ms)`);
      console.log(`Fastest Component: ${performanceData.summary.fastestComponent?.component || 'N/A'} (${performanceData.summary.fastestComponent?.time?.toFixed(2) || 'N/A'}ms)`);
    }

    if (performanceData.recommendations?.length > 0) {
      console.log('\n💡 Recommendations:');
      performanceData.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`);
        console.log(`   → ${rec.suggestion}`);
      });
    }

    console.log('\n✅ Performance collection complete!');
  }

  async collect() {
    try {
      await this.runTests();
    } catch (error) {
      console.error('❌ Performance collection failed:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const collector = new RoadmapPerformanceCollector();
  collector.collect();
}

module.exports = RoadmapPerformanceCollector;