import {
  Box,
  Button,
  Center,
  Grid,
  Heading,
  Link,
  Text,
  VStack
} from "@chakra-ui/react";
import _ from "lodash";
import Head from "next/head";
import React from "react";
import { useDendronGardens } from "../lib/hooks";

export default function Home() {
  const { isError, gardens, error } = useDendronGardens();
  if (isError) return <div>failed to load: {JSON.stringify(error)}</div>;
  let extra: any;
  // if (_.isEmpty(gardens)) {
  //   extra = <Button>New Garden from Git</Button>;
  // }
  if (_.isEmpty(gardens)) {
    extra = (
      <Box maxW="32rem">
        <VStack spacing={4} align="stretch">
          <Center>
            <Heading mb={4}>Welcome to Dendron</Heading>
          </Center>
          <Text fontSize="xl">
            If you haven't already done so, you can install Dendron by following
            the instructions &nbsp;
            <Link
              href="https://dendron.so/notes/678c77d9-ef2c-4537-97b5-64556d6337f1.html"
              isExternal
            >
              here
            </Link>
          </Text>
          <Button>Publish a new site from Git (coming soon) </Button>
        </VStack>
      </Box>
    );
  }
  return (
    <>
      <Head>
        <title>Dendron</title>
        <link rel="icon" href="/favicon.ico" />
        <script type="text/javascript" src="/static/memberful.js"></script>
      </Head>

      <Grid justifyContent="center">{extra}</Grid>
    </>
  );
}
