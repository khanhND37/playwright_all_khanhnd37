import * as fs from "fs";
import * as path from "path";

/* eslint-disable no-console */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function main(program: string, args: string[]) {
  const directory = "./tests";
  const totalFile = updateJsonFiles(directory);
  console.log(totalFile);
}

interface JsonObject {
  /* eslint-disable */
  [key: string]: any;
}

function updateJsonFiles(directory: string) {
  let totalJSONFiles = 0;
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      totalJSONFiles += updateJsonFiles(filePath); // Recursively call function for subdirectories
    } else if (path.extname(file) === ".json") {
      totalJSONFiles++;
      try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const jsonObject: JsonObject = JSON.parse(fileContent);

        jsonObject.env = jsonObject.env || {};
        jsonObject.env.prodtest = jsonObject.env.prodtest || {};
        jsonObject.env.prodtest.accounts_domain = "accounts-test.shopbase.com";
        jsonObject.env.prodtest.api = "https://prod-test-api.shopbase.com";

        const modifiedContent = JSON.stringify(jsonObject, null, 2);
        fs.writeFileSync(filePath, modifiedContent, "utf-8");

        console.log(`Updated JSON file: ${filePath}`);
      } catch (error) {
        console.error(`Error updating JSON file ${filePath}: ${error}`);
      }
    }
  }

  return totalJSONFiles;
}
main(process.argv[1], process.argv.slice(2));
