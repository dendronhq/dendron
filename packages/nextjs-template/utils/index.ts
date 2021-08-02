import fs from "fs-extra";
import path from "path";
import { NoteProps, NotePropsDict } from "@dendronhq/common-all";
import _ from "lodash";

export type NoteData = {
	notes: NotePropsDict;
}

const NOTE_META_DIR = "meta";
const NOTE_BODY_DIR = "notes";

export function getDataDir(): string {
	const dataDir = process.env.DATA_DIR;
	if (!dataDir) {
		throw new Error("DATA_DIR not set")
	}
	return dataDir;
}

export function getNoteBody(id: string) {
	const dataDir = getDataDir();
	const body = fs.readFile(path.join(dataDir, NOTE_BODY_DIR, `${id}.html`), {encoding: "utf8"})
	return body;
}

let _NOTES_CACHE: NoteData|undefined;

export function getNotes() {
	console.log("getNotes")
	if (_.isUndefined(_NOTES_CACHE)) {
		console.log("getNotes:readFromDisk")
		const dataDir = getDataDir();
		_NOTES_CACHE = fs.readJSONSync(path.join(dataDir, "notes.json")) as NoteData
	}
	return _NOTES_CACHE;
}

export function getNoteMeta(id: string) {
	const dataDir = getDataDir();
	return fs.readJSON(path.join(dataDir, NOTE_META_DIR, `${id}.json`)) as Promise<NoteProps>;
}