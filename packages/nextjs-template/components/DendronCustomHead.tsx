import React from "react";
import Head from "next/head";
import _ from "lodash";
import parse from "html-react-parser";

type Props = {
  content: string
}

export default function DendronCustomHead({ content }: Props) {
  const parsedContent = parse(content);
  return (
    <Head>
      {parsedContent}
    </Head>
  )
}