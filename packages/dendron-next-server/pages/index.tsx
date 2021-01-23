import { Button, Grid, Image } from "@chakra-ui/react";
import _ from "lodash";
import Head from "next/head";
import { useDendronGardens } from "../lib/hooks";

export default function Home() {
  const { isError, isLoading, gardens, error } = useDendronGardens();
  if (isError) return <div>failed to load: {JSON.stringify(error)}</div>;
  let extra: any;
  if (_.isEmpty(gardens)) {
    extra = <Button>New Garden from Git</Button>;
  }
  return (
    <>
      <Head>
        <title>Dendron</title>
        <link rel="icon" href="/favicon.ico" />
        <script type="text/javascript" src="/static/memberful.js"></script>
      </Head>

      <Grid justifyContent="center">
        {extra}
      </Grid>
    </>
  );
}
