import { Breadcrumb, AutoComplete } from "antd";
import _ from "lodash";
import React from "react";
import { NoteProps } from "@dendronhq/common-all";
import { DendronCommonProps, verifyNoteData } from "../utils/types";
import DendronSpinner from "./DendronSpinner";

export function DendronLookup(props: DendronCommonProps) {
  if (!verifyNoteData(props)) {
    return <DendronSpinner />;
  }

	// --- Methods
	const onClick = (noteActive: NoteProps) => {
		console.log("BOND: onclickCalled")
		window.CommandBar.execute(3724);
		window.CommandBar.open(noteActive.fname);
		return undefined;
	}


	// --- Logic
  const { dendronRouter, notes } = props;
  const noteActive = notes[dendronRouter.query.id];
  return (
    <AutoComplete
      options={[]}
      style={{ width: "60%"}}
      onSelect={() => {}}
      onSearch={() => {}}
      onClick={() => onClick(noteActive)}
      placeholder="Lookup"
    />
  );
}
