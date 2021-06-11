import { Box, Heading } from "@chakra-ui/react";
import _ from "lodash";
import dynamic from "next/dynamic";
import Head from "next/head";
import React, { useState } from "react";
import { useWindowSize } from "../../components/hooks";

const Tree = dynamic(
  () => {
    return import("react-d3-tree");
  },
  { ssr: false }
);

const myTreeData = [
  {
    name: "Top Level",
    attributes: {
      keyA: "val A",
      keyB: "val B",
      keyC: "val C",
    },
    children: [
      {
        name: "Level 2: A",
        attributes: {
          keyA: "val A",
          keyB: "val B",
          keyC: "val C",
        },
      },
      {
        name: "Level 2: B",
      },
    ],
  },
];
type TreeViewState = {
  translate: {
    x: number;
    y: number;
  };
};

export default function Edit() {
  const size = useWindowSize();
  const [window, setWindow] = useState(undefined);
  const [treeViewState, setTreeViewState] = useState<TreeViewState>({
    translate: { x: 0, y: 0 },
  });
  if (_.isUndefined(size.height)) {
    return null;
  }
  if (!_.isEqual(window, size)) {
    // @ts-ignore
    setWindow(size);
    setTreeViewState({
      translate: {
        // @ts-ignore
        x: size.width / 2,
        y: size.height / 5,
      },
    });
  }

  return (
    <>
      <Head>
        <title>Edit Schema</title>
      </Head>

      <Box>
        <Heading as="h1"> Edit Schema</Heading>
      </Box>

      <Box height="100%">
        <Tree
          orientation={"vertical"}
          data={myTreeData}
          translate={treeViewState.translate}
        />
      </Box>
    </>
  );
}
