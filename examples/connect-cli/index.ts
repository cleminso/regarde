#!/usr/bin/env node

import { Command } from "@regarde-dev/cli";

// Create a new command instance to test CLI integration
const testCommand = new Command();

// Test basic CLI functionality
console.log("🔍 Testing Regarde CLI integration...");
console.log("Available commands:", Object.keys(testCommand));

// Simulate CLI usage
console.log("\n📋 Testing commands:");
console.log("1. regarde login");
console.log("2. regarde whoami"); 
console.log("3. regarde register-app");

export { testCommand };