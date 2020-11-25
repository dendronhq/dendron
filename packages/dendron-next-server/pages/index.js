import { Box, Grid, Image } from "@chakra-ui/react";
import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Head>
        <title>Dendron</title>
        <link rel="icon" href="/favicon.ico" />
        <script type="text/javascript" src="/static/memberful.js"></script>
      </Head>

      <Grid justifyContent="center">
        <Image
          alt="Environmentalist"
          src="https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/stickers.png"
          boxSize={96}
        />
      </Grid>
    </>
  );
}
