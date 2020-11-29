import { Box, Link, Icon, Image, Flex, ChakraProvider } from "@chakra-ui/react";
import { GoLinkExternal } from "react-icons/go";
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
          paddingX={4}
          paddingY={2}
          alignItems="center"
        >
          <Image
            src="https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/logo-256.png"
            id="logo"
            alt={name}
            boxSize={12}
          />


            {/*
          <Box marginLeft="auto">
            <Link
              target="_blank"
              href="https://dendron.memberful.com/account/subscriptions"
              color="currentColor"
              textDecoration="none"
              _hover={{ textDecoration: "inherit" }}
              role="group"
            >
              Contribute to Dendron{" "}
              <Box as="span" _groupHover={{ display: "none" }}>
                🌱
              </Box>
              <Icon
                as={GoLinkExternal}
                display="none"
                _groupHover={{ display: "inline-block" }}
              />
            </Link>
          </Box>
            */}
        </Flex>

        <Box flexGrow={1} padding={8}>
          {children}
        </Box>
      </Flex>
    </ChakraProvider>
  );
}
