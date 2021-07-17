import { GetStaticPaths, GetStaticProps, GetStaticPropsContext, InferGetStaticPropsType } from 'next'
import {NoteProps, NotePropsDict} from "@dendronhq/common-all";
import { useRouter } from 'next/router'
import _ from 'lodash';

type NoteData = {
	notes: NotePropsDict;
}

type NoteRouterQuery = {
	id: string
}

export const getStaticProps: GetStaticProps = async (
  context: GetStaticPropsContext
) => {
	const fs = require("fs-extra");
	const {notes} = fs.readJSONSync("/tmp/nextjs/notes.json") as NoteData
	return {
		props: {
			notes
		}
	}
}

export const getStaticPaths: GetStaticPaths = async () => {
	const fs = require("fs-extra");
	const {notes} = fs.readJSONSync("/tmp/nextjs/notes.json") as NoteData
	return {
    paths: _.map(notes, (_note, id) => {
			return {params: {id}}
		}),
    fallback: false,
  }
}
export default function Note({notes}: InferGetStaticPropsType<typeof getStaticProps>) {
	const router = useRouter()
  const { id } = router.query as NoteRouterQuery;
	const note = notes[id];
	return <>Note {JSON.stringify(note)}</>
}