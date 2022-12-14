import os from "os";
import _ from "lodash";
import path from "path";
import {
  axios,
  Time,
  DendronError,
  ERROR_SEVERITY,
  fromThrowable,
  ResultAsync,
  errAsync,
  okAsync,
  AxiosError,
} from "@dendronhq/common-all";
import { readJson, mkDir, writeFile, GitUtils } from "@dendronhq/common-server";
// @ts-ignore
import sizeLimit from "size-limit";
// @ts-ignore
import filePlugin from "@size-limit/file";
// @ts-ignore
import webpackPlugin from "@size-limit/webpack";
// @ts-ignore
import timePlugin from "@size-limit/time";
// @ts-ignore
import lighthouse from "lighthouse";
// @ts-ignore
import { computeMedianRun as _computeMedianRun } from "lighthouse/lighthouse-core/lib/median-run";
// @ts-ignore
import lighthouseDesktopConfig from "lighthouse/lighthouse-core/config/lr-desktop-config";
// @ts-ignore
import lighthouseMobileConfig from "lighthouse/lighthouse-core/config/lr-mobile-config";
// @ts-ignore
import ReportGenerator from "lighthouse/report/generator/report-generator";
import type { RunnerResult, Flags } from "lighthouse/types/externs";

const sizeMetrics = ["size"] as const;
const timeMetrics = ["time", "runTime", "loadTime"] as const;
const vitalsMetrics = [
  // core web vitals
  "cumulative-layout-shift",
  "largest-contentful-paint",
  "total-blocking-time", // proxy for First Input Delay (FID)
  // others
  "first-contentful-paint",
  "speed-index",
  "interactive",
] as const;

type TimeMetrics = typeof timeMetrics[number];
type SizeMetrics = typeof sizeMetrics[number];
type VitalsMetrics = typeof vitalsMetrics[number];

const validTypes = ["csv", "html", "json"] as const;
type ValidTypes = typeof validTypes[number];

const defaultReports: Reports = {
  formats: {
    csv: false,
    html: false,
    json: true,
  },
  name: new Date().toISOString().replace(/:/g, "_"),
  directory: `${process.cwd()}/.audit`,
};

type Reports = {
  formats: {
    [key in ValidTypes]?: boolean;
  };
  name: string;
  directory: string;
};

type LighthouseResult = RunnerResult["lhr"];

type FilePathsMap = Record<string, string[]>;

type AuditConfig = {
  port: number;
  url: string;
  runs?: number;
  options?: Flags;
  config?: Record<string, any>;
  reports?: Partial<Reports>;
  formFactor: "desktop" | "mobile";
  disableLogs?: boolean;
  filePath?: string | FilePathsMap;
};

type Audit = {
  name: string;
  date: string;
  commitHash: string | undefined;
  githubRef: string | undefined;
  os: string;
  pkgPath: string;
  vitals: {
    [key in VitalsMetrics]?: {
      value: number | string;
      unit: string | undefined;
      description: string | undefined;
    };
  };
  sizes: {
    [name: string]: {
      [key in SizeMetrics | TimeMetrics]?: {
        value: number | undefined;
        unit: string | undefined;
        description: string | undefined;
      };
    };
  };
};

const generateLighthouseReport = fromThrowable<
  (lhr: LighthouseResult, type: ValidTypes) => any,
  DendronError
>(ReportGenerator.generateReport, (error: unknown) => {
  return new DendronError({
    message: `Cannot generate lighthouse report`,
    severity: ERROR_SEVERITY.FATAL,
    ...(error instanceof Error && { innerError: error }),
  });
});

const computeMedianRun = fromThrowable<
  (results: LighthouseResult[]) => LighthouseResult,
  DendronError
>(_computeMedianRun, (error: unknown) => {
  return new DendronError({
    message: `Cannot compute medianRun`,
    severity: ERROR_SEVERITY.FATAL,
    ...(error instanceof Error && { innerError: error }),
  });
});

function getNextJsFilePaths() {
  const nextjsPath = `${process.cwd()}/.next`;
  return readJson(`${nextjsPath}/build-manifest.json`).map((anyJson) => {
    const filePathsMap =
      anyJson && typeof anyJson === "object" && "pages" in anyJson
        ? (anyJson.pages as FilePathsMap)
        : {};
    const result: FilePathsMap = Object.fromEntries(
      Object.entries(filePathsMap).map(([name, paths]) => {
        return [
          name,
          paths
            .filter((p) => {
              const extName = path.extname(p);
              return extName === ".js";
            })
            .map((p) => `${nextjsPath}/${p}`),
        ];
      })
    );
    return result;
  });
}

function generateReport(
  lhr: LighthouseResult,
  dir: string,
  name: string,
  type: ValidTypes
) {
  dir = `${dir}/lighthouse`;
  name = name.substring(0, name.lastIndexOf(".")) || name;
  if (validTypes.includes(type)) {
    return mkDir(dir, { recursive: true })
      .andThen(() => {
        return generateLighthouseReport(lhr, type);
      })
      .andThen((report: any) => {
        return writeFile(`${dir}/${name}.${type}`, report).map(() => report);
      });
  } else {
    return errAsync(
      new DendronError({
        message: `Invalid report type specified: ${type} Skipping Reports...)`,
      })
    );
  }
}

function generateReports(medianLhr: LighthouseResult, reports: Reports) {
  const resultList = Object.entries(reports.formats ?? {}).flatMap(
    ([key, value]) => {
      if (value) {
        return generateReport(
          medianLhr,
          reports.directory,
          reports.name,
          key as ValidTypes
        );
      }
      return [];
    }
  );
  return ResultAsync.combine(resultList);
}

function computeSizes(filePathsMap: FilePathsMap) {
  const resultList = Object.entries(filePathsMap).map(([name, filePaths]) => {
    return ResultAsync.fromPromise<
      { [key in SizeMetrics | TimeMetrics]?: number }[],
      DendronError
    >(
      sizeLimit([filePlugin, webpackPlugin, timePlugin], filePaths),
      (error: unknown) => {
        return new DendronError({
          message: `Unable to measure sizes`,
          severity: ERROR_SEVERITY.FATAL,
          ...(error instanceof Error && { innerError: error }),
        });
      }
    ).map(([result]) => {
      return {
        [name]: {
          ...("size" in result && {
            size: {
              value: result.size,
              unit: "byte",
              description: "Gzipped",
            },
          }),
          ...("time" in result && {
            time: {
              value: result.time,
              unit: "second",
              description: "run time + load time",
            },
          }),
          ...("runTime" in result && {
            runTime: {
              value: result.runTime,
              unit: "second",
              description:
                "Time which was spent for both event groups (scriptParseCompile and scriptEvaluation). See https://github.com/mbalabash/estimo#fields-description",
            },
          }),
          ...("loadTime" in result && {
            loadTime: {
              value: result.loadTime,
              unit: "second",
              description: "Load time based on a slow 3g network",
            },
          }),
        },
      };
    });
  });
  return ResultAsync.combine(resultList).map((result) => {
    return result.reduce((accum, current) => {
      return { ...accum, ...current };
    });
  });
}

async function computeVitals(
  url: string,
  port: number,
  runs: number,
  auditConfig: AuditConfig,
  log: (...args: any[]) => void
) {
  const results: ResultAsync<LighthouseResult, DendronError>[] = [];
  for (let index = 1; index <= runs; index += 1) {
    /* eslint-disable no-await-in-loop -- should run in serie */
    const result = await ResultAsync.fromPromise<RunnerResult, DendronError>(
      lighthouse(
        url,
        {
          port,
          ...auditConfig.options,
        },
        {
          ...(auditConfig.formFactor === "desktop"
            ? lighthouseDesktopConfig
            : lighthouseMobileConfig),
          ...auditConfig.config,
        }
      ),
      (error: unknown) => {
        return new DendronError({
          message: `Unable to run lighthouse`,
          severity: ERROR_SEVERITY.FATAL,
          ...(error instanceof Error && { innerError: error }),
        });
      }
    ).map(({ lhr }) => lhr);

    log(`Lighthouse run #${index}`);

    // @ts-ignore -- remove when https://github.com/supermacro/neverthrow/issues/434 is fixed
    results.push(result);
  }

  // @ts-ignore -- remove when https://github.com/supermacro/neverthrow/issues/434 is fixed
  return ResultAsync.combine(results).andThen((r) => computeMedianRun(r));
}

export async function playAudit(auditConfig: AuditConfig) {
  const log = auditConfig.disableLogs ? () => {} : console.log; // eslint-disable-line no-console
  const url = auditConfig.url;
  const port = auditConfig.port;
  const runs = auditConfig.runs ?? 5;
  const reports = { ...defaultReports, ...auditConfig.reports };
  const gitRootPath = await GitUtils.getGitRoot("");
  const pkgPath = process.cwd().replace(gitRootPath ?? "", "");
  const filePathsMap = {
    ...(await getNextJsFilePaths().unwrapOr({})),
    ...(typeof auditConfig.filePath === "string"
      ? { [auditConfig.filePath]: [auditConfig.filePath] }
      : auditConfig.filePath),
  };

  const lighthouseResult = await computeVitals(
    url,
    port,
    runs,
    auditConfig,
    log
  );

  const result = await lighthouseResult
    .asyncAndThen((medianLhr) => {
      return generateReports(medianLhr, reports).map(() => medianLhr);
    })
    .andThen((medianLhr) => {
      return computeSizes(filePathsMap).map((sizes) => ({ sizes, medianLhr }));
    })
    .map(({ sizes, medianLhr }) => {
      const vitals = Object.fromEntries(
        Object.entries(medianLhr.audits)
          .filter(([key]) => vitalsMetrics.includes(key as VitalsMetrics))
          .map(([key, value]) => {
            return [
              key,
              {
                value: value.numericValue,
                unit: value.numericUnit,
                description: value.description,
              },
            ] as const;
          })
      );

      const audit: Audit = {
        name: new Date().toISOString().replace(/:/g, "_"),
        date: Time.now().toLocaleString(),
        commitHash: process.env.GITHUB_SHA,
        githubRef: process.env.GITHUB_REF,
        os: os.platform(),
        pkgPath,
        vitals,
        sizes,
      };

      if (process.env.AIRTABLE_API_KEY) {
        const headers = {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        };
        const { vitals, sizes, ...rest } = audit;
        const report = {
          records: [
            {
              fields: {
                vitals: JSON.stringify(vitals, null, 2),
                sizes: JSON.stringify(sizes, null, 2),
                ...rest,
              },
            },
          ],
        };
        log("Sending report..", report);
        return ResultAsync.fromPromise(
          axios.post(
            `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/WebPerformanceData`,
            report,
            { headers }
          ),
          (error: unknown) => {
            return new DendronError({
              message: `Error posting report to airtable: ${JSON.stringify(
                (error as AxiosError).response?.data,
                null,
                2
              )}`,
              severity: ERROR_SEVERITY.FATAL,
              ...(error instanceof Error && { innerError: error }),
            });
          }
        ).map(() => {
          log("Send report done.");
          return audit;
        });
      }
      log(JSON.stringify(audit, null, 2));
      return okAsync(audit);
    });

  if (result.isErr()) {
    throw result.error;
  }
  return result;
}
