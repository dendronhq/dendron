import { NoteProps, NotePropsDict } from "@dendronhq/common-all";
import _ from 'lodash';
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext, InferGetStaticPropsType } from 'next';
import Head from "next/head";
import { useRouter } from 'next/router';
import {DendronNote, FRONTEND_CONSTANTS} from "@dendronhq/common-frontend";
import fs from "fs-extra";
import path from "path";
import { getDataDir, getNoteBody, getNoteMeta, getNotes } from "../../utils";
import React from "react";

type NoteData = {
	notes: NotePropsDict;
}

type NoteRouterQuery = {
	id: string
}

declare global {
	interface Window { CommandBar: any; }
}

export default function Note({note, body}: InferGetStaticPropsType<typeof getStaticProps>) {
	const ctx = "Note"
	const router = useRouter()
	const [bodyFromState, setBody] = React.useState<string|undefined>(undefined);
	const { id } = router.query as NoteRouterQuery;

	// initialize command bar
	React.useEffect(()=> {
			var org='5c96ee1c';
			// @ts-ignore
			var w=window;var d=document;var cb=[];cb.q=[];window.CommandBar=new Proxy(cb,{get:function(f,n){if(n in f){return f[n]} return function(){var a=Array.prototype.slice.call(arguments);a.unshift(n);cb.q.push(a)}},});var load=function(){var a="h";var t="s";var r=null;try { r = localStorage.getItem('commandbar.lc'); } catch (e) {};var e="https://api.commandbar.com";var o="o";var c="l";var n="t";var l="c";if(r&&r.includes("local")){var v="a";var s=":8";var i="p:/";e="htt"+i+"/"+c+o+l+v+c+a+o+t+n+s+"000"}var m=d.createElement("script");var h=e+"/latest/"+org;h=r?h+"?lc="+r:h;m.type="text/javascript";m.async=true;m.src=h;d.head.appendChild(m)};if(w.attachEvent){w.attachEvent("onload",load)}else{w.addEventListener("load",load,false)}
			const loggedInUserId = '12345'
			window.CommandBar.boot(loggedInUserId);


			const notesFetch = () => {
					return fetch("/data/notes.json").then(async (resp) => {
						const data = await resp.json() as NoteData;
						const allNotes = _.values(data.notes);
						return allNotes;
					});
			};
			window.CommandBar.addContext("notes-meta", notesFetch);
			function lookupCb({note}: {note: NoteProps}, context: any) {
				router.push(`/notes/${note.id}`);
			}
		window.CommandBar.addCallback(
			"lookup", 
			lookupCb
		);
	}, [])

	// setup body
	React.useEffect(()=> {
		if (_.isUndefined(id)) {
			return;
		}
		// loaded page statically 
		if (id === note.id) {
			return;
		}
		// otherwise, dynamically fetch page
		fetch(`/data/notes/${id}.html`).then(async resp => {
			const contents = await resp.text();
			setBody(contents);
		})
	}, [id]);

	let noteBody = (id === note.id) ? body : bodyFromState;

	if (_.isUndefined(noteBody)) {
		return <>Loading...</>
	}

	return <>
		<DendronNote noteContent={noteBody} />
	</>
}
export const getStaticPaths: GetStaticPaths = async () => {
	const dataDir = getDataDir();
	const {notes} = getNotes();
	return {
    paths: _.map(notes, (_note, id) => {

			return {params: {id}}
		}),
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps = async (
  context: GetStaticPropsContext
) => {
	const {params} = context;
	if (!params) {
		throw Error("params required")
	}
	const id = params["id"];
	if (!_.isString(id)) {
		throw Error("id required")
	}
	const [body, note] = await Promise.all([getNoteBody(id), getNoteMeta(id)])
	return {
		props: {
			body,
			note,
		}
	}
}