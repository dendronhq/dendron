import { GetStaticProps, GetStaticPropsContext } from 'next'

export const getStaticProps: GetStaticProps = async (
  context: GetStaticPropsContext
) => {
	const fs = require("fs-extra");
	const {notes} = fs.readJSONSync("/tmp/nextjs/notes.json")
	return {
		props: {
			notes
		}
	}
}

export default function Note() {
	return <>Note</>
}