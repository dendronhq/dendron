import Error from "next/error";

export { getStaticProps } from "../utils/getStaticPropsUtil";

export default function Custom500() {
  return <Error statusCode={500} />;
}
