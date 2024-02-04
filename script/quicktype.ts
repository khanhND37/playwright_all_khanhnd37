import fs from "fs";
import os from "os";
import path from "path";
import chalk from "chalk";
import { InputData, jsonInputForTargetLanguage, quicktype } from "quicktype-core";

const lang = "typescript";

/* eslint-disable no-console */
async function main(program: string, args: string[]) {
  // Exactly one command line argument allowed: the path to the directory contains JSON files.
  if (args.length !== 1) {
    console.log(chalk.red("error"), chalk.yellow("Please use: yarn gen-config-type <directory or file>"));
    return;
  }

  // Path passed from args
  const dirPath = args[0];

  // If dirPath is a file, not a directory
  const isFile = fs.statSync(dirPath).isFile();
  if (isFile) {
    const { dir, name } = path.parse(dirPath);
    await writeNewFile(name, dirPath, dir);
    console.log(chalk.green("🔥 Type successfully generated"));
    return;
  }

  // Else if dirPath is a directory
  let listFiles: fs.Dirent[] = [];

  try {
    const list = fs.readdirSync(dirPath, {
      withFileTypes: true,
    });
    listFiles = list.filter(file => {
      return file.isFile() && path.extname(file.name) == ".json";
    });
  } catch (e) {
    console.log(chalk.red("error"), chalk.yellow("Can't read directory"));
    return;
  }

  if (!listFiles.length) {
    console.log(chalk.green("List file empty, returning now..."));
    return;
  }

  for (const file of listFiles) {
    await handleFile(file, dirPath);
  }
  console.log(chalk.green("🔥 Types successfully generated"));
}

const handleFile = async (file: fs.Dirent, dirPath: string) => {
  const { name: fileName } = file;

  const pathToFile = path.join(dirPath, fileName);

  const { name: nameOfFile } = path.parse(fileName);

  await writeNewFile(nameOfFile, pathToFile, dirPath);
};

// Write to new .d.ts file
const writeNewFile = async (nameOfFile: string, pathToFile: string, dirPath: string) => {
  const jsonInput = jsonInputForTargetLanguage(lang);
  await jsonInput.addSource({ name: nameOfFile, samples: [fs.readFileSync(pathToFile, "utf8")] });

  const inputData = new InputData();
  await inputData.addInput(jsonInput);

  console.log(chalk.yellow(`Generating types from JSON file`), chalk.blue(nameOfFile));

  const result = await quicktype({ lang, inputData, rendererOptions: { "just-types": "true" } });

  const outputPath = path.join(dirPath, `${nameOfFile}.d.ts`);
  // Ignore auto generated file
  fs.appendFileSync(outputPath, `/* eslint-disable */` + os.EOL);
  for (const line of result.lines) {
    try {
      fs.appendFileSync(outputPath, line + os.EOL);
    } catch (err) {
      console.log(chalk.red(err));
    }
  }
};

main(process.argv[1], process.argv.slice(2));
