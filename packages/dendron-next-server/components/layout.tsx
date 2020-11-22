import { Box, Link, Image, Flex, ChakraProvider } from "@chakra-ui/react";
import Head from "next/head";
import React, { PropsWithChildren } from "react";
import { theme } from "../styles/theme";

const name = "Dendron";
export const siteTitle = "Dendron";

type Props = PropsWithChildren<{}>;

export default function Layout({ children }: Props) {
  return (
    <ChakraProvider resetCSS theme={theme}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Dendron" />
        <meta
          property="og:image"
          content={
            "https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/logo-256.png"
          }
        />
        <meta name="og:title" content={siteTitle} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <Flex height="full" direction="column">
        <Flex
          as="header"
          bgColor="gray.900"
          color="white"
          padding={4}
          alignItems="center"
        >
          <Image
            src="https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/logo-256.png"
            id="logo"
            alt={name}
            boxSize={16}
          />

          <Box marginLeft="auto">
            {" "}
            <Link
              target="_blank"
              href="https://dendron.memberful.com/account/subscriptions"
            >
              Update Subscription
            </Link>
          </Box>
        </Flex>

        <Box flexGrow={1} padding={8}>
          {children}
        </Box>
      </Flex>
    </ChakraProvider>
  );
}
