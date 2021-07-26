import { NoteProps, NotePropsDict } from "@dendronhq/common-all";
import _ from 'lodash';
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext, InferGetStaticPropsType } from 'next';
import { useRouter } from 'next/router';
import {DendronNote, FRONTEND_CONSTANTS} from "@dendronhq/common-frontend";
import fs from "fs-extra";
import path from "path";
import { getDataDir, getNoteBody } from "../../utils";

type NoteData = {
	notes: NotePropsDict;
}

type NoteRouterQuery = {
	id: string
}

export const getStaticProps: GetStaticProps = async (
  context: GetStaticPropsContext
) => {
	const {params} = context;
	// TODO: run static
	const fs = require("fs-extra");
	const dataDir = getDataDir();
	const {notes} = fs.readJSONSync(path.join(dataDir, "notes.json")) as NoteData
	if (!params) {
		throw Error("params required")
	}
	const id = params["id"];
	if (!_.isString(id)) {
		throw Error("id required")
	}
	const body = getNoteBody(id);
	return {
		props: {
			notes,
			body,
		}
	}
}

export const getStaticPaths: GetStaticPaths = async () => {
	const dataDir = getDataDir();
	const {notes} = fs.readJSONSync(path.join(dataDir, "notes.json")) as NoteData
	return {
    paths: _.map(notes, (_note, id) => {

			return {params: {id}}
		}),
    fallback: false,
  }
}
export default function Note({notes, body}: InferGetStaticPropsType<typeof getStaticProps>) {
	const router = useRouter()
  const { id } = router.query as NoteRouterQuery;
	const note = notes[id] as NoteProps;
	return <DendronNote noteContent={body} />
}