#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import chalk from "chalk";
import { fileURLToPath } from "url";

// Fix __dirname issue in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default input file (located in src/)
const inputFilePath = path.join(__dirname, "../src/gateway-logs.json");

// Check if file exists
if (!fs.existsSync(inputFilePath)) {
    console.error(`Error: Log file '${inputFilePath}' not found.`);
    process.exit(1);
}

// Load JSON data
let logsData;
try {
    logsData = JSON.parse(fs.readFileSync(inputFilePath, "utf8"));
} catch (error) {
    console.error("Error reading JSON file:", error.message);
    process.exit(1);
}

// Parse CLI arguments for flags
const args = process.argv.slice(2);
const highlightIndexFlag = args.indexOf("--highlight") !== -1 ? parseInt(args[args.indexOf("--highlight") + 1], 10) : null;

// Create interactive CLI
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("🚀 Welcome to the Log Filter CLI V3!");
console.log("🔍 Enter space-separated keywords to filter logs (or type 'exit' to quit).");

// Function to dynamically generate regex from input words
function generateRegexPattern(input) {
    const words = input.trim().split(/\s+/);
    const regexParts = words.map(word => (word.match(/^\w+$/) ? `\\b${word}\\b` : word));
    return `^.*${regexParts.join(".*")}.*`;
}

// Function to highlight a specific word in each matching log
function highlightWord(log, index) {
    const words = log.split(" "); // Split by spaces
    if (index !== null && index >= 0 && index < words.length) {
        words[index] = chalk.hex("#32CD32")(words[index]); // Limegreen highlight
    }
    return words.join(" ");
}

// Function to prompt user for input
function promptUser() {
    rl.question("\nInput filter (space-separated words): ", (inputText) => {
        if (inputText.toLowerCase() === "exit") {
            console.log("👋 Exiting Log Filter CLI.");
            rl.close();
            return;
        }

        try {
            // Generate regex pattern dynamically
            const regexPattern = generateRegexPattern(inputText);
            console.log(`🔎 Generated Regex: ${regexPattern}`);

            // Compile regex
            const regex = new RegExp(regexPattern, "i");

            // Filter matching logs
            const filteredLogs = logsData.filter(entry => regex.test(entry.log));

            if (filteredLogs.length > 0) {
                console.log("\n🎯 Matching Logs:\n");
                filteredLogs.forEach(entry => console.log(highlightWord(entry.log, highlightIndexFlag)));
            } else {
                console.log("\n❌ No logs matched your filter.");
            }

            // Print row count summary
            console.log(`\n📊 Rows: ${filteredLogs.length}`);
        } catch (error) {
            console.error("\n⚠️ Invalid regex pattern. Try again.");
        }

        // Recursively prompt for next input
        promptUser();
    });
}

// Start the interactive loop
promptUser();