/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { extractCodeName, rndString } from "@utils/string";
import {
  FullConfig,
  FullResult,
  Location,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStatus,
  TestStep,
} from "@playwright/test/reporter";
import type { FullConfig as FullConfigPublic, FullProject as FullProjectPublic } from "@playwright/test";
import { TestError } from "@core/reporters/ocg/playwright-test-type";

import type { RunResult } from "@types";
import { OcgLogger } from "@core/logger";
import * as crypto from "crypto";
import path from "path";
import StackUtils from "stack-utils";
import fs from "fs";
import { codeFrameColumns } from "@babel/code-frame";
import colors from "colors/safe";
import type { TransformCallback } from "stream";
import { Transform } from "stream";
import yazl from "yazl";
import S3Uploader from "@core/utils/s3";
import { MultiMap } from "@core/reporters/ocg/multi-map";
import fetch from "node-fetch";

const logger = OcgLogger.get();

const testHubDomain = `${process.env.TESTHUB_HTTP}://${process.env.TESTHUB_DOMAIN}`;
const testHubApiKey = process.env.TESTHUB_API_KEY;

const helperDomain = `https://${process.env.HELPER_API_DOMAIN}`;
const helperBasicAuth = process.env.HELPER_API_BASIC_AUTH;

const realEnv = process.env.REAL_ENV ? process.env.REAL_ENV : process.env.ENV;
const env = process.env.ENV === "local" ? realEnv : process.env.ENV;

export type JsonLocation = Location;
export type JsonError = string;
export type JsonStackFrame = { file: string; line: number; column: number };

export type TestAttachment = {
  name: string;
  body?: string;
  path?: string;
  contentType: string;
};

export type HTMLReport = {
  attachments: TestAttachment[];
  files: TestFileSummary[];
  stats: Stats;
  projectNames: string[];
};

export type JsonReport = {
  config: JsonConfig;
  project: JsonProject;
  suites: JsonSuite[];
};

export type JsonConfig = Omit<FullConfig, "projects" | "attachments">;

type TestEntry = {
  testCase: TestCaseC;
  testCaseSummary: TestCaseSummary;
};

export type TestStepC = {
  title: string;
  startTime: string;
  duration: number;
  location?: Location;
  snippet?: string;
  error?: string;
  steps: TestStepC[];
  count: number;
};

export type JsonProject = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
  name: string;
  outputDir: string;
  repeatEach: number;
  retries: number;
  testDir: string;
  testIgnore: string[];
  testMatch: string[];
  timeout: number;
};

export type JsonSuite = {
  fileId: string;
  title: string;
  location?: JsonLocation;
  suites: JsonSuite[];
  tests: JsonTestCase[];
};

export type TestResultC = {
  retry: number;
  startTime: string;
  duration: number;
  steps: TestStepC[];
  errors: string[];
  attachments: TestAttachment[];
  status: "passed" | "failed" | "timedOut" | "skipped" | "interrupted";
};

export type JsonTestCase = {
  testId: string;
  title: string;
  location: JsonLocation;
  expectedStatus: TestStatus;
  timeout: number;
  annotations: { type: string; description?: string }[];
  retries: number;
  results: JsonTestResult[];
  ok: boolean;
  outcome: "skipped" | "expected" | "unexpected" | "flaky";
};

export type JsonAttachment = {
  name: string;
  body?: string | Buffer;
  path?: string;
  contentType: string;
};

export type JsonTestResult = {
  retry: number;
  workerIndex: number;
  startTime: string;
  duration: number;
  status: TestStatus;
  errors: JsonError[];
  attachments: JsonAttachment[];
  steps: JsonTestStep[];
};

export type JsonTestStep = {
  title: string;
  category: string;
  startTime: string;
  duration: number;
  error?: JsonError;
  steps: JsonTestStep[];
  location?: Location;
  snippet?: string;
  count: number;
};

export class TestCaseInfo {
  steps: TestStep[];
  result: string;
}

export type Stats = {
  total: number;
  expected: number;
  unexpected: number;
  flaky: number;
  skipped: number;
  ok: boolean;
  duration: number;
};

export type TestFile = {
  fileId: string;
  fileName: string;
  tests: TestCaseC[];
};

export type TestCaseC = TestCaseSummary & {
  results: TestResultC[];
};

export type TestFileSummary = {
  fileId: string;
  fileName: string;
  tests: TestCaseSummary[];
  stats: Stats;
};

export type TestCaseSummary = {
  testId: string;
  title: string;
  path: string[];
  projectName: string;
  location: Location;
  annotations: { type: string; description?: string }[];
  outcome: "skipped" | "expected" | "unexpected" | "flaky";
  duration: number;
  ok: boolean;
};

/**
 * FullConfigInternal allows the plumbing of configuration details throughout the Test Runner without
 * increasing the surface area of the public API type called FullConfig.
 */
export interface FullConfigInternal extends FullConfigPublic {
  _configDir: string;
  _testGroupsCount: number;
  _attachments: {
    name: string;
    path?: string;
    body?: Buffer;
    contentType: string;
  }[];
  _screenshotsDir: string;

  // Overrides the public field.
  projects: FullProjectInternal[];
}

/**
 * FullProjectInternal allows the plumbing of configuration details throughout the Test Runner without
 * increasing the surface area of the public API type called FullProject.
 */
export interface FullProjectInternal extends FullProjectPublic {
  _screenshotsDir: string;
}

export default class OcgReporter implements Reporter {
  private testCases = new Map<string, RunResult>();
  private suiteName = "";
  private startedAt: Date;

  printsToStdio() {
    return false;
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.suiteName = rndString(10);
    this.config = config;
    this.suite = suite;
    this.startedAt = new Date();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const fileId = calculateSha1(test.parent.location!.file.split(path.sep).join("/"));
    const [, projectName, , ...titles] = test.titlePath();
    const testIdExpression = `project:${projectName}|path:${titles.join(">")}|repeat:${test.repeatEachIndex}`;
    const testId = fileId + "-" + calculateSha1(testIdExpression);

    const codeName = extractCodeName(test.title);
    if (codeName.length > 0) {
      let failReason = result?.error?.message;
      if (failReason) {
        failReason = failReason.replace(
          // eslint-disable-next-line no-control-regex
          /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
          "",
        );

        const location = result?.error?.location;
        failReason = `${failReason}\n${location?.file}:${location?.line}:${location?.column}`;
      }
      const runResult: RunResult = {
        codeName: codeName[0],
        env: env,
        reportUrl: `https://${process.env.REPORT_DOMAIN}`,
        startAt: result.startTime,
        finishedAt: new Date(result.startTime.getTime() + result.duration),
        type: "automation",
        result: result.status == "passed" ? "pass" : "fail",
        runGroupId: -1,
        testResult: "",
        realResult: result.status,
        buildUrl: "",
        testId: testId,
        failReason: failReason,
      };
      // overwrite with result of the last run
      this.testCases.set(codeName[0], runResult);
    } else {
      logger.error(`Cannot extract code name from ${test.title}`);
    }
  }

  async onEnd(result: FullResult): Promise<void> {
    const projectSuites = this.suite.suites;
    const reports = projectSuites.map(suite => {
      const rawReporter = new RawReporter();
      const report = rawReporter.generateProjectReport(this.config, suite);
      return report;
    });
    let passed = 0;
    let failed = 0;
    let timedOut = 0;
    let skipped = 0;
    const builder = new HtmlBuilder();
    const buildUrl = process.env.BUILD_URL ? process.env.BUILD_URL : "https://autopilot.shopbase.dev/job/autopilot";
    const { testResult } = await builder.build(new RawReporter().generateAttachments(this.config), reports);
    const userEmail = process.env.TH_JOB_CREATED_BY_EMAIL || process.env.BUILD_USER_EMAIL;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    for (const [, value] of this.testCases.entries()) {
      // 'passed' | 'failed' | 'timedOut' | 'skipped';
      switch (value.realResult) {
        case "passed":
          passed++;
          break;
        case "failed":
          failed++;
          break;
        case "timedOut":
          timedOut++;
          break;
        case "skipped":
          skipped++;
          break;
      }
    }

    // Prevent call API + send notify when in local
    if (!process.env.HELPER_API_DOMAIN && process.env.TESTHUB_REPORT_LOCAL === "no") {
      logger.info("Skip sending report to test-hub.");
      return;
    }

    let runGroupId = process.env.TH_RUN_GROUP_ID;

    const requestObj = {
      // name: this.suiteName, - don't need to update the name
      env: env,
      report_url: `https://${process.env.REPORT_DOMAIN}`,
      started_at: this.startedAt,
      finished_at: new Date(),
      result: result.status == "passed" ? "pass" : "fail",
      passed: passed,
      failed: failed,
      timed_out: timedOut,
      skipped: skipped,
      running_user_email: userEmail,
      test_result: testResult,
    };
    let requestUrl = `${testHubDomain}/api/run_groups/`;
    const headerObj = {
      "Content-Type": "application/json",
      Authorization: `Api-Key ${testHubApiKey}`,
    };

    // eslint-disable-next-line no-console
    console.log("Report object");
    // eslint-disable-next-line no-console
    console.log(requestObj);

    if (!runGroupId || runGroupId === "-1") {
      // Run group id NOT existed
      // ~> Create new run group
      const res = await fetch(requestUrl, {
        method: "POST",
        body: JSON.stringify(requestObj),
        headers: headerObj,
      });

      if (res.ok) {
        const result = (await res.json()) as any;
        if (result.id) {
          runGroupId = result.id;
          logger.info("Create run group successfully");
        } else {
          logger.warn("Failed to create run group", res);
        }
      }
    } else {
      // Run group id existed
      // ~> update run group
      requestUrl = `${requestUrl}${runGroupId}/`;
      const res = await fetch(requestUrl, {
        method: "PUT",
        body: JSON.stringify(requestObj),
        headers: headerObj,
      });

      if (res.ok) {
        const result = (await res.json()) as any;
        if (result.id) {
          logger.info("Update run group successfully");
        } else {
          logger.warn("Failed to update run group", res);
        }
      }
    }
    // eslint-disable-next-line no-console
    console.log("Run group report request url");
    // eslint-disable-next-line no-console
    console.log(requestUrl);

    if (!runGroupId) {
      logger.warn("Cannot create run group");
    }

    const runResults = [];
    for (const [key, value] of this.testCases.entries()) {
      // TODO retry
      runResults.push({
        run_group_id: runGroupId ? parseInt(runGroupId) : null,
        code_name: key,
        env: value.env,
        report_url: value.reportUrl,
        type: value.type,
        started_at: value.startAt,
        finished_at: value.finishedAt,
        result: value.result,
        build_url: buildUrl,
        test_id: value.testId,
        fail_reason: value.failReason,
      });
    }

    const helperBasicAuthHeader = {
      "Content-Type": "application/json",
      Authorization: `Basic ${helperBasicAuth}`,
    };
    let res = await fetch(`${helperDomain}/api/runs/bulk`, {
      method: "POST",
      body: JSON.stringify(runResults),
      headers: helperBasicAuthHeader,
    });
    if (res.ok) {
      // eslint-disable-next-line no-console
      console.log("Add runs success");
    }

    // notify
    const reportObj = {
      run_group_id: runGroupId ? parseInt(runGroupId) : null,
      passed: passed,
      failed: failed,
      timed_out: timedOut,
      skipped: skipped,
      build_url: buildUrl,
      started_time: this.startedAt,
      running_user_email: userEmail,
      env: env,
      branch: process.env.BRANCH,
      suite_or_case_id: process.env.SUITE_ID_OR_CASE_ID,
    };

    // eslint-disable-next-line no-console
    console.log("Notification object");
    // eslint-disable-next-line no-console
    console.log(reportObj);

    res = await fetch(`${helperDomain}/api/notify`, {
      method: "POST",
      body: JSON.stringify(reportObj),
      headers: helperBasicAuthHeader,
    });

    if (res.ok) {
      logger.info("post notification done");
    } else {
      logger.warn("post notification not done");
    }
  }

  private config!: FullConfig;
  private suite!: Suite;
  private stepsInFile = new MultiMap<string, JsonTestStep>();
  timeDistance = (date1, date2) => {
    let distance = Math.abs(date1 - date2);
    const hours = Math.floor(distance / 3600000);
    distance -= hours * 3600000;
    const minutes = Math.floor(distance / 60000);
    distance -= minutes * 60000;
    const seconds = Math.floor(distance / 1000);
    return `${hours}h:${("0" + minutes).slice(-2)}m:${("0" + seconds).slice(-2)}s`;
  };
}

class RawReporter {
  private config!: FullConfig;
  private suite!: Suite;
  private stepsInFile = new MultiMap<string, JsonTestStep>();

  onBegin(config: FullConfig, suite: Suite) {
    this.config = config;
    this.suite = suite;
  }

  async onEnd() {
    const projectSuites = this.suite.suites;
    for (const suite of projectSuites) {
      const project = suite.project();

      const reportFolder = path.join(project.outputDir, "report");
      fs.mkdirSync(reportFolder, { recursive: true });
      let reportFile: string | undefined;
      for (let i = 0; i < 10; ++i) {
        reportFile = path.join(
          reportFolder,
          sanitizeForFilePath(project.name || "project") + (i ? "-" + i : "") + ".report",
        );
        try {
          if (fs.existsSync(reportFile)) continue;
        } catch (e) {
          logger.error(e);
        }
        break;
      }
      if (!reportFile) throw new Error("Internal error, could not create report file");
      const report = this.generateProjectReport(this.config, suite);
      fs.writeFileSync(reportFile, JSON.stringify(report, undefined, 2));
    }
  }

  generateAttachments(config: FullConfig): JsonAttachment[] {
    return this._createAttachments((config as FullConfigInternal)._attachments);
  }

  generateProjectReport(config: FullConfig, suite: Suite): JsonReport {
    this.config = config;
    const project = suite.project();

    const report: JsonReport = {
      config,
      project: {
        metadata: project.metadata,
        name: project.name,
        outputDir: project.outputDir,
        repeatEach: project.repeatEach,
        retries: project.retries,
        testDir: project.testDir,
        testIgnore: serializePatterns(project.testIgnore),
        testMatch: serializePatterns(project.testMatch),
        timeout: project.timeout,
      },
      suites: suite.suites.map(fileSuite => {
        // fileId is based on the location of the enclosing file suite.
        // Don't use the file in test/suite location, it can be different
        // due to the source map / require.
        const fileId = calculateSha1(fileSuite.location!.file.split(path.sep).join("/"));
        return this._serializeSuite(fileSuite, fileId);
      }),
    };
    for (const file of this.stepsInFile.keys()) {
      let source: string;
      try {
        source = fs.readFileSync(file, "utf-8") + "\n//";
      } catch (e) {
        continue;
      }
      const lines = source.split("\n").length;
      const highlighted = codeFrameColumns(
        source,
        { start: { line: lines, column: 1 } },
        { highlightCode: true, linesAbove: lines, linesBelow: 0 },
      );
      const highlightedLines = highlighted.split("\n");
      const lineWithArrow = highlightedLines[highlightedLines.length - 1];
      for (const step of this.stepsInFile.get(file)) {
        // Don't bother with snippets that have less than 3 lines.
        if (step.location!.line < 2 || step.location!.line >= lines) continue;
        // Cut out snippet.
        const snippetLines = highlightedLines.slice(step.location!.line - 2, step.location!.line + 1);
        // Relocate arrow.
        const index = lineWithArrow.indexOf("^");
        const shiftedArrow =
          lineWithArrow.slice(0, index) + " ".repeat(step.location!.column - 1) + lineWithArrow.slice(index);
        // Insert arrow line.
        snippetLines.splice(2, 0, shiftedArrow);
        step.snippet = snippetLines.join("\n");
      }
    }
    return report;
  }

  private _serializeSuite(suite: Suite, fileId: string): JsonSuite {
    const location = this._relativeLocation(suite.location);
    return {
      title: suite.title,
      fileId,
      location,
      suites: suite.suites.map(s => this._serializeSuite(s, fileId)),
      tests: suite.tests.map(t => this._serializeTest(t, fileId)),
    };
  }

  private _serializeTest(test: TestCase, fileId: string): JsonTestCase {
    const [, projectName, , ...titles] = test.titlePath();
    const testIdExpression = `project:${projectName}|path:${titles.join(">")}|repeat:${test.repeatEachIndex}`;
    const testId = fileId + "-" + calculateSha1(testIdExpression);
    return {
      testId,
      title: test.title,
      location: this._relativeLocation(test.location)!,
      expectedStatus: test.expectedStatus,
      timeout: test.timeout,
      annotations: test.annotations,
      retries: test.retries,
      ok: test.ok(),
      outcome: test.outcome(),
      results: test.results.map(r => this._serializeResult(test, r)),
    };
  }

  private _serializeResult(test: TestCase, result: TestResult): JsonTestResult {
    return {
      retry: result.retry,
      workerIndex: result.workerIndex,
      startTime: result.startTime.toISOString(),
      duration: result.duration,
      status: result.status,
      errors: formatResultFailure(this.config, test, result, "", true).map(error => error.message),
      attachments: this._createAttachments(result.attachments, result),
      steps: dedupeSteps(result.steps.map(step => this._serializeStep(test, step))),
    };
  }

  private _serializeStep(test: TestCase, step: TestStep): JsonTestStep {
    const result: JsonTestStep = {
      title: step.title,
      category: step.category,
      startTime: step.startTime.toISOString(),
      duration: step.duration,
      error: step.error?.message,
      location: this._relativeLocation(step.location),
      steps: dedupeSteps(step.steps.map(step => this._serializeStep(test, step))),
      count: 1,
    };

    if (step.location) this.stepsInFile.set(step.location.file, result);
    return result;
  }

  private _createAttachments(
    attachments: TestResult["attachments"],
    ioStreams?: Pick<TestResult, "stdout" | "stderr">,
  ): JsonAttachment[] {
    const out: JsonAttachment[] = [];
    if (!attachments) {
      attachments = [];
    }

    for (const attachment of attachments) {
      if (attachment.body) {
        out.push({
          name: attachment.name,
          contentType: attachment.contentType,
          body: attachment.body,
        });
      } else if (attachment.path) {
        out.push({
          name: attachment.name,
          contentType: attachment.contentType,
          path: attachment.path,
        });
      }
    }

    if (ioStreams) {
      for (const chunk of ioStreams.stdout) out.push(this._stdioAttachment(chunk, "stdout"));
      for (const chunk of ioStreams.stderr) out.push(this._stdioAttachment(chunk, "stderr"));
    }

    return out;
  }

  private _stdioAttachment(chunk: Buffer | string, type: "stdout" | "stderr"): JsonAttachment {
    if (typeof chunk === "string") {
      return {
        name: type,
        contentType: "text/plain",
        body: chunk,
      };
    }
    return {
      name: type,
      contentType: "application/octet-stream",
      body: chunk,
    };
  }

  private _relativeLocation(location: Location | undefined): Location | undefined {
    if (!location) return undefined;
    const file = toPosixPath(path.relative(this.config.rootDir, location.file));
    return {
      file,
      line: location.line,
      column: location.column,
    };
  }
}

class HtmlBuilder {
  // private _reportFolder: string;
  private _tests = new Map<string, JsonTestCase>();
  private _testPath = new Map<string, string[]>();
  private _dataZipFile: yazl.ZipFile;
  private _hasTraces = false;

  constructor() {
    this._dataZipFile = new yazl.ZipFile();
  }

  async build(
    testReportAttachments: JsonAttachment[],
    rawReports: JsonReport[],
  ): Promise<{
    ok: boolean;
    testResult: string;
    singleTestId: string | undefined;
  }> {
    const data = new Map<string, { testFile: TestFile; testFileSummary: TestFileSummary }>();
    for (const projectJson of rawReports) {
      for (const file of projectJson.suites) {
        const fileName = file.location!.file;
        const fileId = file.fileId;
        let fileEntry = data.get(fileId);
        if (!fileEntry) {
          fileEntry = {
            testFile: { fileId, fileName, tests: [] },
            testFileSummary: {
              fileId,
              fileName,
              tests: [],
              stats: emptyStats(),
            },
          };
          data.set(fileId, fileEntry);
        }
        const { testFile, testFileSummary } = fileEntry;
        const testEntries: TestEntry[] = [];
        await this._processJsonSuite(file, fileId, projectJson.project.name, [], testEntries);
        for (const test of testEntries) {
          testFile.tests.push(test.testCase);
          testFileSummary.tests.push(test.testCaseSummary);
        }
      }
    }

    let ok = true;
    for (const [fileId, { testFile, testFileSummary }] of data) {
      const stats = testFileSummary.stats;
      for (const test of testFileSummary.tests) {
        if (test.outcome === "expected") ++stats.expected;
        if (test.outcome === "skipped") ++stats.skipped;
        if (test.outcome === "unexpected") ++stats.unexpected;
        if (test.outcome === "flaky") ++stats.flaky;
        ++stats.total;
        stats.duration += test.duration;
      }
      stats.ok = stats.unexpected + stats.flaky === 0;
      if (!stats.ok) ok = false;

      const testCaseSummaryComparator = (t1: TestCaseSummary, t2: TestCaseSummary) => {
        const w1 = (t1.outcome === "unexpected" ? 1000 : 0) + (t1.outcome === "flaky" ? 1 : 0);
        const w2 = (t2.outcome === "unexpected" ? 1000 : 0) + (t2.outcome === "flaky" ? 1 : 0);
        if (w2 - w1) return w2 - w1;
        return t1.location.line - t2.location.line;
      };
      testFileSummary.tests.sort(testCaseSummaryComparator);

      this._addDataFile(fileId + ".json", testFile);
    }

    const htmlReport: HTMLReport = {
      attachments: await this._serializeAttachments(testReportAttachments),
      files: [...data.values()].map(e => e.testFileSummary),
      projectNames: rawReports.map(r => r.project.name),
      stats: [...data.values()].reduce((a, e) => addStats(a, e.testFileSummary.stats), emptyStats()),
    };
    htmlReport.files.sort((f1, f2) => {
      const w1 = f1.stats.unexpected * 1000 + f1.stats.flaky;
      const w2 = f2.stats.unexpected * 1000 + f2.stats.flaky;
      return w2 - w1;
    });

    this._addDataFile("report.json", htmlReport);

    // Inline report data.
    let testResult = "";
    await new Promise(f => {
      this._dataZipFile!.end(undefined, () => {
        this._dataZipFile!.outputStream.pipe(new Base64Encoder())
          .on("data", function (d) {
            if (d) {
              testResult += d;
            }
          })
          .on("close", f);
      });
    });
    let singleTestId: string | undefined;
    if (htmlReport.stats.total === 1) {
      const testFile: TestFile = data.values().next().value.testFile;
      singleTestId = testFile.tests[0].testId;
    }

    return { ok, testResult, singleTestId };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _addDataFile(fileName: string, data: any) {
    this._dataZipFile.addBuffer(Buffer.from(JSON.stringify(data)), fileName);
  }

  private async _processJsonSuite(
    suite: JsonSuite,
    fileId: string,
    projectName: string,
    path: string[],
    outTests: TestEntry[],
  ) {
    const newPath = [...path, suite.title];
    await Promise.all(
      suite.suites.map(async s => await this._processJsonSuite(s, fileId, projectName, newPath, outTests)),
    );
    await Promise.all(suite.tests.map(async t => outTests.push(await this._createTestEntry(t, projectName, newPath))));
  }

  private async _createTestEntry(test: JsonTestCase, projectName: string, path: string[]): Promise<TestEntry> {
    const duration = test.results.reduce((a, r) => a + r.duration, 0);
    this._tests.set(test.testId, test);
    const location = test.location;
    path = [...path.slice(1)];
    this._testPath.set(test.testId, path);
    return {
      testCase: {
        testId: test.testId,
        title: test.title,
        projectName,
        location,
        duration,
        annotations: test.annotations,
        outcome: test.outcome,
        path,
        results: await Promise.all(test.results.map(async r => await this._createTestResult(r))),
        ok: test.outcome === "expected" || test.outcome === "flaky",
      },
      testCaseSummary: {
        testId: test.testId,
        title: test.title,
        projectName,
        location,
        duration,
        annotations: test.annotations,
        outcome: test.outcome,
        path,
        ok: test.outcome === "expected" || test.outcome === "flaky",
      },
    };
  }

  private async _serializeAttachments(attachments: JsonAttachment[]) {
    let lastAttachment: TestAttachment | undefined;
    return (
      await Promise.all(
        attachments.map(async a => {
          if (a.name === "trace") this._hasTraces = true;
          if ((a.name === "stdout" || a.name === "stderr") && a.contentType === "text/plain") {
            if (lastAttachment && lastAttachment.name === a.name && lastAttachment.contentType === a.contentType) {
              lastAttachment.body += stripAnsiEscapes(a.body as string);
              return null;
            }
            a.body = stripAnsiEscapes(a.body as string);
            lastAttachment = a as TestAttachment;
            return a;
          }

          if (a.path) {
            const fileName = a.path;
            const extName = path.extname(a.path);
            const spl = a.path!.split("/");
            let s3FilePath = "";
            try {
              // put to s3
              const s3Uploader = new S3Uploader(
                process.env.AWS_BUCKET,
                process.env.AWS_REGION,
                process.env.AWS_KEY_ID,
                process.env.AWS_SECRET,
              );
              s3FilePath = `${process.env.ENV}/${spl[spl.length - 2]}/${rndString(10)}-${a.name}${extName}`;
              await s3Uploader.uploadFile(a.path, s3FilePath, a.contentType);
            } catch (e) {
              return {
                name: `Missing attachment "${a.name}"`,
                contentType: kMissingContentType,
                body: `Attachment file ${fileName} is missing`,
              };
            }
            return {
              name: a.name,
              contentType: a.contentType,
              path: `https://${process.env.AWS_REPORT_BUCKET}.s3.${process.env.AWS_REPORT_REGION}.amazonaws.com/${s3FilePath}`,
              body: a.body,
            };
          }

          if (a.body instanceof Buffer) {
            if (isTextContentType(a.contentType)) {
              // Content type is like this: "text/html; charset=UTF-8"
              const charset = a.contentType.match(/charset=(.*)/)?.[1];
              try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const body = a.body.toString((charset as any) || "utf-8");
                return {
                  name: a.name,
                  contentType: a.contentType,
                  body,
                };
              } catch (e) {
                // Invalid encoding, fall through and save to file.
              }
            }
            const sha1 = calculateSha1(a.body) + ".dat";
            return {
              name: a.name,
              contentType: a.contentType,
              path: "data/" + sha1,
              body: a.body,
            };
          }
          // string
          return {
            name: a.name,
            contentType: a.contentType,
            body: a.body,
          };
        }),
      )
    ).filter(Boolean) as TestAttachment[];
  }

  private async _createTestResult(result: JsonTestResult): Promise<TestResultC> {
    return {
      duration: result.duration,
      startTime: result.startTime,
      retry: result.retry,
      steps: result.steps.map(s => this._createTestStep(s)),
      errors: result.errors,
      status: result.status,
      attachments: await this._serializeAttachments(result.attachments),
    };
  }

  private _createTestStep(step: JsonTestStep): TestStepC {
    return {
      title: step.title,
      startTime: step.startTime,
      duration: step.duration,
      snippet: step.snippet,
      steps: step.steps.map(s => this._createTestStep(s)),
      location: step.location,
      error: step.error,
      count: step.count,
    };
  }
}

class Base64Encoder extends Transform {
  private _remainder: Buffer | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): void {
    if (this._remainder) {
      chunk = Buffer.concat([this._remainder, chunk]);
      this._remainder = undefined;
    }

    const remaining = chunk.length % 3;
    if (remaining) {
      this._remainder = chunk.slice(chunk.length - remaining);
      chunk = chunk.slice(0, chunk.length - remaining);
    }
    chunk = chunk.toString("base64");
    this.push(Buffer.from(chunk));
    callback();
  }

  override _flush(callback: TransformCallback): void {
    if (this._remainder) this.push(Buffer.from(this._remainder.toString("base64")));
    callback();
  }
}

// helper funcs
export function serializePatterns(patterns: string | RegExp | (string | RegExp)[]): string[] {
  if (!Array.isArray(patterns)) patterns = [patterns];
  return patterns.map(s => s.toString());
}

export function calculateSha1(buffer: Buffer | string): string {
  const hash = crypto.createHash("sha1");
  hash.update(buffer);
  return hash.digest("hex");
}

export function toPosixPath(aPath: string): string {
  return aPath.split(path.sep).join(path.posix.sep);
}

function dedupeSteps(steps: JsonTestStep[]): JsonTestStep[] {
  const result: JsonTestStep[] = [];
  let lastStep: JsonTestStep | undefined;
  for (const step of steps) {
    const canDedupe = !step.error && step.duration >= 0 && step.location?.file && !step.steps.length;
    if (
      canDedupe &&
      lastStep &&
      step.category === lastStep.category &&
      step.title === lastStep.title &&
      step.location?.file === lastStep.location?.file &&
      step.location?.line === lastStep.location?.line &&
      step.location?.column === lastStep.location?.column
    ) {
      ++lastStep.count;
      lastStep.duration += step.duration;
      continue;
    }
    result.push(step);
    lastStep = canDedupe ? step : undefined;
  }
  return result;
}

function indent(lines: string, tab: string) {
  return lines.replace(/^(?=.+$)/gm, tab);
}

export function formatResultFailure(
  config: FullConfig,
  test: TestCase,
  result: TestResult,
  initialIndent: string,
  highlightCode: boolean,
): ErrorDetails[] {
  const errorDetails: ErrorDetails[] = [];

  if (result.status === "passed" && test.expectedStatus === "failed") {
    errorDetails.push({
      message: indent(colors.red(`Expected to fail, but passed.`), initialIndent),
    });
  }

  for (const error of result.errors) {
    const formattedError = formatError(config, error, highlightCode, test.location.file);
    errorDetails.push({
      message: indent(formattedError.message, initialIndent),
      location: formattedError.location,
    });
  }
  return errorDetails;
}

type ErrorDetails = {
  message: string;
  location?: Location;
};

export function formatError(config: FullConfig, error: TestError, highlightCode: boolean, file?: string): ErrorDetails {
  const stack = error.stack;
  const tokens = [];
  let location: Location | undefined;
  if (stack) {
    const parsed = prepareErrorStack(stack, file);
    tokens.push(parsed.message);
    location = parsed.location;
    if (location) {
      try {
        const source = fs.readFileSync(location.file, "utf8");
        const codeFrame = codeFrameColumns(source, { start: location }, { highlightCode });
        // Convert /var/folders to /private/var/folders on Mac.
        if (!file || fs.realpathSync(file) !== location.file) {
          tokens.push("");
          tokens.push(colors.gray(`   at `) + `${relativeFilePath(config, location.file)}:${location.line}`);
        }
        tokens.push("");
        tokens.push(codeFrame);
      } catch (e) {
        // Failed to read the source file - that's ok.
      }
    }
    tokens.push("");
    tokens.push(colors.dim(parsed.stackLines.join("\n")));
  } else if (error.message) {
    tokens.push(error.message);
  } else if (error.value) {
    tokens.push(error.value);
  }
  return {
    location,
    message: tokens.join("\n"),
  };
}

function relativeFilePath(config: FullConfig, file: string): string {
  return path.relative(config.rootDir, file) || path.basename(file);
}

const stackUtils = new StackUtils();

export function prepareErrorStack(
  stack: string,
  file?: string,
): {
  message: string;
  stackLines: string[];
  location?: Location;
} {
  if (file) {
    // Stack will have /private/var/folders instead of /var/folders on Mac.
    file = fs.realpathSync(file);
  }
  const lines = stack.split("\n");
  let firstStackLine = lines.findIndex(line => line.startsWith("    at "));
  if (firstStackLine === -1) firstStackLine = lines.length;
  const message = lines.slice(0, firstStackLine).join("\n");
  const stackLines = lines.slice(firstStackLine);
  let location: Location | undefined;
  for (const line of stackLines) {
    const parsed = stackUtils.parseLine(line);
    if (!parsed || !parsed.file) continue;
    const resolvedFile = path.join(process.cwd(), parsed.file);
    if (!file || resolvedFile === file) {
      location = {
        file: resolvedFile,
        column: parsed.column || 0,
        line: parsed.line || 0,
      };
      break;
    }
  }
  return { message, stackLines, location };
}

const emptyStats = (): Stats => {
  return {
    total: 0,
    expected: 0,
    unexpected: 0,
    flaky: 0,
    skipped: 0,
    ok: true,
    duration: 0,
  };
};

const addStats = (stats: Stats, delta: Stats): Stats => {
  stats.total += delta.total;
  stats.skipped += delta.skipped;
  stats.expected += delta.expected;
  stats.unexpected += delta.unexpected;
  stats.flaky += delta.flaky;
  stats.ok = stats.ok && delta.ok;
  stats.duration += delta.duration;
  return stats;
};

const ansiRegex = new RegExp(
  // eslint-disable-next-line no-control-regex, max-len
  "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))",
  "g",
);

export function stripAnsiEscapes(str: string): string {
  return str.replace(ansiRegex, "");
}

const kMissingContentType = "x-playwright/missing";

function isTextContentType(contentType: string) {
  return contentType.startsWith("text/") || contentType.startsWith("application/json");
}

export function sanitizeForFilePath(s: string) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\x00-\x2C\x2E-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]+/g, "-");
}
