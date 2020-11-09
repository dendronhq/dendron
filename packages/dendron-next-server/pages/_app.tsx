import React from "react";
import Layout from "../components/layout";
import "../styles/globals.css";
import 'antd/dist/antd.css'

function App({ Component, pageProps }) {
      return <Layout Signout={<div></div>}>
        <Component {...pageProps} />
      </Layout>
}

export default App;