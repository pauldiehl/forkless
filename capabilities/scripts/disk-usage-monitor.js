#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');

// Configuration
const WARNING_THRESHOLD = 80; // Default 80%
const CRITICAL_THRESHOLD = 95; // Critical at 95%

function parseArgs() {
    const args = process.argv.slice(2);
    let threshold = WARNING_THRESHOLD;
    let showAll = false;
    let json = false;

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--threshold':
                threshold = parseInt(args[++i]);
                if (isNaN(threshold) || threshold < 1 || threshold > 100) {
                    console.error('Error: Threshold must be between 1-100');
                    process.exit(1);
                }
                break;
            case '--show-all':
                showAll = true;
                break;
            case '--json':
                json = true;
                break;
            case '--help':
                showHelp();
                process.exit(0);
            default:
                console.error(`Unknown argument: ${args[i]}`);
                process.exit(1);
        }
    }

    return { threshold, showAll, json };
}

function showHelp() {
    console.log(`
Disk Usage Monitor - Check disk usage and warn on high usage

Usage: node disk-usage-monitor.js [options]

Options:
  --threshold N    Set warning threshold percentage (default: 80)
  --show-all      Show all mounts, not just warnings
  --json          Output in JSON format
  --help          Show this help message

Examples:
  node disk-usage-monitor.js
  node disk-usage-monitor.js --threshold 90
  node disk-usage-monitor.js --show-all --json
    `);
}

function getDiskUsage() {
    const platform = os.platform();
    let command;
    
    if (platform === 'win32') {
        // Windows - use wmic
        command = 'wmic logicaldisk get size,freespace,caption';
    } else {
        // Unix-like systems - use df
        command = 'df -h';
    }

    try {
        const output = execSync(command, { encoding: 'utf8' });
        return parseDiskUsage(output, platform);
    } catch (error) {
        console.error('Error getting disk usage:', error.message);
        process.exit(1);
    }
}

function parseDiskUsage(output, platform) {
    const mounts = [];
    
    if (platform === 'win32') {
        // Parse Windows output
        const lines = output.trim().split('\n').slice(1); // Skip header
        
        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 3) {
                const [caption, freeSpace, size] = parts;
                if (size && freeSpace && caption) {
                    const sizeBytes = parseInt(size);
                    const freeBytes = parseInt(freeSpace);
                    const usedBytes = sizeBytes - freeBytes;
                    const usagePercent = Math.round((usedBytes / sizeBytes) * 100);
                    
                    mounts.push({
                        mount: caption,
                        size: formatBytes(sizeBytes),
                        used: formatBytes(usedBytes),
                        available: formatBytes(freeBytes),
                        usagePercent: usagePercent
                    });
                }
            }
        }
    } else {
        // Parse Unix df output
        const lines = output.trim().split('\n').slice(1); // Skip header
        
        for (const line of lines) {
            // Handle wrapped lines (filesystem name on separate line)
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 6) {
                const [filesystem, size, used, available, usageStr, mount] = parts;
                const usagePercent = parseInt(usageStr.replace('%', ''));
                
                // Skip special filesystems
                if (filesystem.startsWith('/dev/') || mount === '/' || mount.startsWith('/')) {
                    mounts.push({
                        filesystem,
                        mount,
                        size,
                        used,
                        available,
                        usagePercent
                    });
                }
            }
        }
    }
    
    return mounts;
}

function formatBytes(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + sizes[i];
}

function getStatusColor(usagePercent) {
    if (usagePercent >= CRITICAL_THRESHOLD) return '\x1b[41m'; // Red background
    if (usagePercent >= WARNING_THRESHOLD) return '\x1b[43m'; // Yellow background
    return '\x1b[42m'; // Green background
}

function getStatusText(usagePercent) {
    if (usagePercent >= CRITICAL_THRESHOLD) return 'CRITICAL';
    if (usagePercent >= WARNING_THRESHOLD) return 'WARNING';
    return 'OK';
}

function displayResults(mounts, options) {
    const { threshold, showAll, json } = options;
    const warnings = mounts.filter(m => m.usagePercent >= threshold);
    
    if (json) {
        const result = {
            timestamp: new Date().toISOString(),
            threshold,
            total_mounts: mounts.length,
            warnings: warnings.length,
            mounts: showAll ? mounts : warnings
        };
        console.log(JSON.stringify(result, null, 2));
        return;
    }

    // Text output
    console.log('='.repeat(60));
    console.log('DISK USAGE MONITOR');
    console.log('='.repeat(60));
    console.log(`Timestamp: ${new Date().toLocaleString()}`);
    console.log(`Warning threshold: ${threshold}%`);
    console.log(`Total mounts checked: ${mounts.length}`);
    console.log(`Warnings found: ${warnings.length}`);
    console.log('');

    const displayMounts = showAll ? mounts : warnings;
    
    if (displayMounts.length === 0) {
        if (showAll) {
            console.log('No mounts found.');
        } else {
            console.log(`✅ All mounts are below ${threshold}% usage threshold.`);
        }
        return;
    }

    // Table header
    console.log('STATUS   MOUNT POINT              USAGE    SIZE      USED      AVAILABLE');
    console.log('-'.repeat(80));

    for (const mount of displayMounts) {
        const status = getStatusText(mount.usagePercent);
        const color = getStatusColor(mount.usagePercent);
        const reset = '\x1b[0m';
        
        const mountPoint = (mount.mount || mount.filesystem || '').padEnd(20).substring(0, 20);
        const usage = `${mount.usagePercent}%`.padStart(6);
        const size = (mount.size || '').padStart(8);
        const used = (mount.used || '').padStart(8);
        const available = (mount.available || '').padStart(10);
        
        console.log(`${color}${status.padEnd(8)}${reset} ${mountPoint} ${usage}  ${size}  ${used}  ${available}`);
    }

    // Summary
    console.log('');
    if (warnings.length > 0) {
        console.log(`⚠️  ${warnings.length} mount(s) above ${threshold}% usage!`);
        
        // Show critical mounts
        const critical = warnings.filter(m => m.usagePercent >= CRITICAL_THRESHOLD);
        if (critical.length > 0) {
            console.log(`🚨 ${critical.length} mount(s) at CRITICAL levels (≥${CRITICAL_THRESHOLD}%)!`);
        }
    } else {
        console.log(`✅ All systems normal - no mounts above ${threshold}% usage.`);
    }
}

function main() {
    try {
        const options = parseArgs();
        
        console.log('Checking disk usage...');
        const mounts = getDiskUsage();
        
        if (mounts.length === 0) {
            console.log('No disk mounts found.');
            return;
        }

        displayResults(mounts, options);
        
        // Exit with appropriate code
        const warnings = mounts.filter(m => m.usagePercent >= options.threshold);
        const critical = mounts.filter(m => m.usagePercent >= CRITICAL_THRESHOLD);
        
        if (critical.length > 0) {
            process.exit(2); // Critical
        } else if (warnings.length > 0) {
            process.exit(1); // Warnings
        } else {
            process.exit(0); // All good
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { getDiskUsage, parseDiskUsage, formatBytes };