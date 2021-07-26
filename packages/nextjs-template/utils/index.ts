import fs from "fs-extra";
import path from "path";

export function getDataDir(): string {
	const dataDir = process.env.DATA_DIR;
	if (!dataDir) {
		throw new Error("DATA_DIR not set")
	}
	return dataDir;
}

export function getNoteBody(id: string) {
	const dataDir = getDataDir();
	const body = fs.readFileSync(path.join(dataDir, "notes", `${id}.html`), {encoding: "utf8"})
	return body;
}