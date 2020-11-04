import React from "react";
import Layout from "../components/layout";
import "../styles/globals.css";
import 'react-sortable-tree/style.css'; // This only needs to be imported once in your app
import 'antd/dist/antd.css'

function App({ Component, pageProps }) {
      return <Layout Signout={<div></div>}>
        <Component {...pageProps} />
      </Layout>
}

export default App;