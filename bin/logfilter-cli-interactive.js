#!/usr/bin/env node

import fs from "fs"
import path from "path"
import readline from "readline"
import chalk from "chalk"
import { fileURLToPath } from "url"

// Fix __dirname issue in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration file path
const configFilePath = path.join(__dirname, "config.json")

// Load configuration or set default
let config = { inputFilePath: "../src/gateway-logs.json" }
if (fs.existsSync(configFilePath)) {
  try {
    config = JSON.parse(fs.readFileSync(configFilePath, "utf8"))
  } catch (error) {
    console.error("Error reading configuration file:", error.message)
  }
}

// Function to save configuration
const saveConfig = () => {
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), "utf8")
}

// Function to process logs
const processLogs = (inputFilePath, filterWords = [], highlightIndex = 3) => {
  if (!fs.existsSync(inputFilePath)) {
    console.error(`Error: Log file '${inputFilePath}' not found.`)
    return
  }

  let logsData
  try {
    logsData = JSON.parse(fs.readFileSync(inputFilePath, "utf8"))
  } catch (error) {
    console.error("Error reading JSON file:", error.message)
    return
  }

  // Generate regex pattern dynamically
  const regexPattern = filterWords.length
    ? `^.*${filterWords.map((word) => `\\b${word}\\b`).join(".*")}.*`
    : ".*"
  const regex = new RegExp(regexPattern, "i")

  // Filter logs
  const filteredLogs = logsData.filter((entry) => regex.test(entry.log))

  if (filteredLogs.length > 0) {
    console.log("\n🎯 Matching Logs:\n")
    filteredLogs.forEach((entry) =>
      console.log(highlightWord(entry.log, highlightIndex))
    )
  } else {
    console.log("\n❌ No logs matched your filter.")
  }

  console.log(`\n📊 Rows: ${filteredLogs.length}`)
}

// Function to highlight a specific word in logs
const highlightWord = (log, index) => {
  const words = log.split(" ")
  if (index >= 0 && index < words.length) {
    words[index] = chalk.hex("#32CEC2")(words[index])
  }
  return words.join(" ")
}

// Interactive mode
const promptUser = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  rl.question("\nInput filter (or 'exit' to quit): ", (inputText) => {
    if (inputText.toLowerCase() === "exit") {
      console.log("👋 Exiting Log Filter CLI.")
      rl.close()
      return
    }
    processLogs(config.inputFilePath, inputText.split(" "))
    promptUser()
  })
}

// Command handling
const args = process.argv.slice(2)
const command = args[0]

if (command === "inputfilepath" && args[1]) {
  config.inputFilePath = path.resolve(__dirname, args[1])
  saveConfig()
  console.log(`✅ Input file path updated to: ${config.inputFilePath}`)
} else if (command === "exec") {
  const filters = args.slice(1)
  processLogs(config.inputFilePath, filters)
  promptUser()
} else {
  console.log("🚀 Welcome to Log Filter CLI!")
  console.log("Commands:")
  console.log("  inputfilepath <path> - Set log file path")
  console.log("  exec [filters] - Execute log filtering")
}
