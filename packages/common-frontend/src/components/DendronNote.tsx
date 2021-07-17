/* eslint-disable react/no-danger */
import React from "react";


type Props = {
	noteContent: string
}

export function DendronNote({noteContent}: Props) {
  return <>
    <div dangerouslySetInnerHTML={{ __html: noteContent }} />
  </>;
}
