import os from "os";
import {
  axios,
  Time,
  DendronError,
  ERROR_SEVERITY,
  ErrorUtils,
  fromThrowable,
  errAsync,
} from "@dendronhq/common-all";
import { mkDir, writeFile } from "@dendronhq/common-server";
// @ts-ignore
import lighthouse from "lighthouse";
// @ts-ignore
import { computeMedianRun } from "lighthouse/lighthouse-core/lib/median-run";
// @ts-ignore
import lighthouseDesktopConfig from "lighthouse/lighthouse-core/config/lr-desktop-config";
// @ts-ignore
import lighthouseMobileConfig from "lighthouse/lighthouse-core/config/lr-mobile-config";
// @ts-ignore
import ReportGenerator from "lighthouse/report/generator/report-generator";
import type { RunnerResult, Flags } from "lighthouse/types/externs";

const metricFilter = [
  // core web vitals
  "cumulative-layout-shift",
  "largest-contentful-paint",
  "total-blocking-time", // proxy for First Input Delay (FID)
  // others
  "first-contentful-paint",
  "speed-index",
  "interactive",
];

const validTypes = ["csv", "html", "json"] as const;

const defaultReports: Reports = {
  formats: {
    csv: false,
    html: false,
    json: false,
  },
  name: `lighthouse-${new Date().toISOString().replace(/:/g, "_")}`,
  directory: `${process.cwd()}/lighthouse`,
};

type ValidTypes = typeof validTypes[number];

type Reports = {
  formats: {
    [key in ValidTypes]?: boolean;
  };
  name: string;
  directory: string;
};

type LighthouseResult = RunnerResult["lhr"];
type AuditConfig = {
  port: number;
  url: string;
  runs?: number;
  options?: Flags;
  config?: Record<string, any>;
  reports?: Partial<Reports>;
  formFactor: "desktop" | "mobile";
  disableLogs?: boolean;
};

type AuditReport = {
  vital: {
    lhr: LighthouseResult;
    medianOf: number;
  };
};

const generateLighthouseReport = fromThrowable<
  (lhr: LighthouseResult, type: ValidTypes) => any,
  DendronError
>(ReportGenerator.generateReport, (error) => {
  return new DendronError({
    message: `Cannot generate lighthouse report`,
    severity: ERROR_SEVERITY.FATAL,
    ...(error instanceof Error && { innerError: error }),
  });
});

function generateReport(
  lhr: LighthouseResult,
  dir: string,
  name: string,
  type: ValidTypes
) {
  name = name.substring(0, name.lastIndexOf(".")) || name;

  if (validTypes.includes(type)) {
    return mkDir(dir, { recursive: true })
      .andThen(() => {
        return generateLighthouseReport(lhr, type);
      })
      .andThen((report) => {
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

async function playAudit(auditConfig: AuditConfig): Promise<AuditReport> {
  const log = auditConfig.disableLogs ? () => {} : console.log; // eslint-disable-line no-console

  const url = auditConfig.url;
  const port = auditConfig.port;
  const runs = auditConfig.runs ?? 5;
  const reports = { ...defaultReports, ...auditConfig.reports };
  const results: Array<LighthouseResult> = [];

  for (let index = 0; index < runs; index += 1) {
    /* eslint-disable no-await-in-loop -- should run in serie */
    const result = await lighthouse(
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
    );
    results.push(result.lhr);
  }

  const median = computeMedianRun(results) as LighthouseResult;

  await Promise.all(
    Object.entries(reports.formats ?? {}).map(async ([key, value]) => {
      if (value) {
        const result = await generateReport(
          median,
          reports.directory,
          reports.name,
          key as ValidTypes
        );

        result.match(
          (_report) => {
            // console.log(report);
          },
          (_error) => {
            // console.log(error);
          }
        );
      }
    })
  );

  const result = {
    vital: {
      lhr: median,
      medianOf: runs,
    },
  };

  const audits = result.vital.lhr.audits;

  const data = Object.entries(audits)
    .filter(([key]) => metricFilter.includes(key))
    .map(([key, value]) => {
      return [key, Math.round(value.numericValue as number)] as const;
    });

  if (process.env.AIRTABLE_API_KEY) {
    const headers = {
      Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    };

    const report = {
      records: [
        {
          fields: {
            name: reports.name,
            date: Time.now().toLocaleString(),
            commitHash: process.env.GITHUB_SHA,
            githubRef: process.env.GITHUB_REF,
            os: os.platform(),
            ...Object.fromEntries(data),
          },
        },
      ],
    };

    log("Send report..", report);

    try {
      await axios.post(
        `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/WebPerformanceData`,
        report,
        { headers }
      );
    } catch (error) {
      if (ErrorUtils.isAxiosError(error)) {
        console.log(error.response);
      }
    }

    log("Send report done.");
  }

  log(data);

  return result;
}

export { playAudit };
