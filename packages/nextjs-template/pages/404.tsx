import Error from "next/error";

export { getStaticProps } from "./util";

export default function Custom404() {
  return <Error statusCode={404} />;
}
