import { NoteData } from "./types";


export async function fetchNotes() {
	const resp = await fetch("/data/notes.json");
	return await resp.json() as NoteData
}

