#!/usr/bin/env node


import fs from "fs";
import path from "path";
import readline from "readline";
// import chalk from "chalk";
import { fileURLToPath } from "url";

// Fix __dirname issue in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default input file (located in the same directory as the script)
const inputFilePath = path.join(__dirname, "gateway-logs.json");

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
console.log("🔍 Enter a regex pattern to filter logs (or type 'exit' to quit).");

// Function to prompt user for regex input
function promptUser() {
    rl.question("\nInput regex filter: ", (regexPattern) => {
        if (regexPattern.toLowerCase() === "exit") {
            console.log("👋 Exiting Log Filter CLI.");
            rl.close();
            return;
        }

        try {
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