import React from "react";
import Layout from "../components/layout";
import { Provider } from "react-redux";
import {engineStore} from "@dendronhq/common-frontend";
import Head from "next/head";


function AppVSCode({ Component, pageProps }) {
  console.log("loadding AppVSCode")
  return <Provider store={engineStore}>
  <Component {...pageProps} />
  </Provider>
  
}

function App({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default App;
