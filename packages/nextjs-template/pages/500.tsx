import Error from "next/error";

export { getStaticProps } from "./util";

export default function Custom500() {
  return <Error statusCode={500} />;
}
