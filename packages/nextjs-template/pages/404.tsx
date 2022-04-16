import Error from "next/error";

export { getStaticProps } from "../utils/getStaticPropsUtil";

export default function Custom404() {
  return <Error statusCode={404} />;
}
