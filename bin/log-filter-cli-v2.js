#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
// import chalk from "chalk";
import { fileURLToPath } from "url";

// Fix __dirname issue in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default input file (gateway-logs.json in the same directory)
// const inputFilePath = path.join(__dirname, "gateway-logs.json");
const inputFilePath = path.join(__dirname, "../src/gateway-logs.json");

// Check if the file exists
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

// Create interactive CLI
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("🚀 Welcome to the Log Filter CLI!");
console.log("🔍 Enter space-separated keywords to filter logs (or type 'exit' to quit).");

// Function to dynamically generate regex from input words
function generateRegexPattern(input) {
    // Split input by spaces
    const words = input.trim().split(/\s+/);

    // Ensure each word is properly formatted
    const regexParts = words.map(word => (word.match(/^\w+$/) ? `\\b${word}\\b` : word));

    // Join words with `.*` and enforce `^` at the start and `.*` at the end
    return `^.*${regexParts.join(".*")}.*`;
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
            const regex = new RegExp(regexPattern, "i"); // Case-insensitive match

            // Filter and output matching logs
            const filteredLogs = logsData.filter(entry => regex.test(entry.log));

            if (filteredLogs.length > 0) {
                console.log("\n🎯 Matching Logs:\n");
                filteredLogs.forEach(entry => console.log(entry.log));
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