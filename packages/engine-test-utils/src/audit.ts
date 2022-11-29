import fs from "fs-extra";
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
  "server-response-time",
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
// type AuditResult = LighthouseResult['audits']['x']
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

async function getReport(
  lhr: LighthouseResult,
  dir: string,
  name: string,
  type: ValidTypes
) {
  name = name.substring(0, name.lastIndexOf(".")) || name;

  if (validTypes.includes(type)) {
    const reportBody = ReportGenerator.generateReport(lhr, type);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(`${dir}/${name}.${type}`, reportBody);
  } else {
    console.log(`Invalid report type specified: ${type} Skipping Reports...)`);
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

  Object.entries(reports.formats ?? {}).forEach(async ([key, value]) => {
    if (value) {
      await getReport(
        median,
        reports.directory,
        reports.name,
        key as ValidTypes
      );
    }
  });

  const result = {
    vital: {
      lhr: median,
      medianOf: runs,
    },
  };

  const audits = result.vital.lhr.audits;

  const data = Object.entries(audits)
    .filter(([key]) => metricFilter.includes(key))
    .map(([_, value]) => {
      return {
        metric: value.title,
        value: `${Math.round(value.numericValue as number)} ${
          value.numericUnit
        }`,
      };
    });

  log(data);

  return result;
}

export { playAudit };
