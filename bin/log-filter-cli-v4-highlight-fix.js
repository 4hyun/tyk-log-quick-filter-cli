#!/usr/bin/env node

import fs from "fs"
import path from "path"
import readline from "readline"
import chalk from "chalk"
import { fileURLToPath } from "url"

// Fix __dirname issue in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Default input file (located in src/)
const inputFilePath = path.join(__dirname, "../src/gateway-logs.json")

// Check if file exists
if (!fs.existsSync(inputFilePath)) {
  console.error(`Error: Log file '${inputFilePath}' not found.`)
  process.exit(1)
}

// Load JSON data
let logsData
try {
  logsData = JSON.parse(fs.readFileSync(inputFilePath, "utf8"))
} catch (error) {
  console.error("Error reading JSON file:", error.message)
  process.exit(1)
}

// Create interactive CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

console.log("🚀 Welcome to the Log Filter CLI (with Highlighting) V4!")
console.log("🔍 Enter space-separated keywords to filter logs.")
console.log(
  "🔦 Optional: Add '--highlight X' to highlight the Xth word in results."
)
console.log("📌 Type 'exit' to quit.")

// Function to extract `--highlight` index and filter words from input
const DATE_INDEX = 2
const HOSTNAME_INDEX = 3
const DEFAULT_HIGHLIGHT_INDEX = HOSTNAME_INDEX
function parseInput(input) {
  const words = input.trim().split(/\s+/)
  let highlightIndex = DEFAULT_HIGHLIGHT_INDEX

  // Check for `--highlight` flag and extract index
  const highlightPos = words.indexOf("--highlight")
  if (highlightPos !== -1 && words.length > highlightPos + 1) {
    highlightIndex = parseInt(words[highlightPos + 1], 10)
    words.splice(highlightPos, 2) // Remove `--highlight` and its argument from words
  }

  return { words, highlightIndex }
}

// Function to dynamically generate regex from input words
function generateRegexPattern(words) {
  const regexParts = words.map((word) =>
    word.match(/^\w+$/) ? `\\b${word}\\b` : word
  )
  return `^.*${regexParts.join(".*")}.*`
}

// Function to highlight a specific word in each matching log
function highlightWord(log, index) {
  const words = log.split(" ") // Split by spaces
  if (index !== null && index >= 0 && index < words.length) {
    words[index] = chalk.hex("#32CEC2")(words[index]) // Limegreen highlight
  }
  return words.join(" ")
}

// Function to prompt user for input
function promptUser() {
  rl.question("\nInput filter: ", (inputText) => {
    if (inputText.toLowerCase() === "exit") {
      console.log("👋 Exiting Log Filter CLI.")
      rl.close()
      return
    }

    try {
      // Parse input to extract filter words and highlight index
      const { words, highlightIndex } = parseInput(inputText)

      if (words.length === 0) {
        console.log("\n⚠️ Please provide at least one keyword for filtering.")
        return promptUser()
      }

      // Generate regex pattern dynamically
      const regexPattern = generateRegexPattern(words)
      console.log(`🔎 Generated Regex: ${regexPattern}`)

      // Compile regex
      const regex = new RegExp(regexPattern, "i")

      // Filter matching logs
      const filteredLogs = logsData.filter((entry) => regex.test(entry.log))

      if (filteredLogs.length > 0) {
        console.log("\n🎯 Matching Logs:\n")
        filteredLogs.forEach((entry) =>
          console.log(highlightWord(entry.log, highlightIndex))
        )
      } else {
        console.log("\n❌ No logs matched your filter.")
      }

      // Print row count summary
      console.log(`\n📊 Rows: ${filteredLogs.length}`)
    } catch (error) {
      console.error("\n⚠️ Invalid input. Try again.")
    }

    // Recursively prompt for next input
    promptUser()
  })
}

// Start the interactive loop
promptUser()
