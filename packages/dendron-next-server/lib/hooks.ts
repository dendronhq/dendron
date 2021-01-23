import { DendronConfig } from "@dendronhq/common-all";
import useSWR from "swr";
import { api, apiRemote } from "./config";

// @ts-ignore
const fetcher = (...args) => fetch(...args).then((res) => res.json());

export function useDendronConfig() {
  const { data, error } = useSWR(api("getConfig"), fetcher);
  return {
    config: data?.data as DendronConfig,
    isLoading: !error && !data,
    isError: error || data?.error,
    error
  };
}

export function useDendronGardens() {
  //const { data, error } = useSWR(apiRemote("gardenAll"), fetcher);
  const data = {
    data: [],
    error: null
  }
  const error = null;
  return {
    gardens: data?.data,
    isLoading: !error && !data,
    isError: error || data?.error,
    error
  };
}
