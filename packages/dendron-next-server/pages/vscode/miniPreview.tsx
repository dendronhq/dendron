import {
  DEngineClient,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { engineSlice, WebEngine } from "@dendronhq/common-frontend";
import { useRouter } from "next/router";
import React from "react";

const convertMd = ({
  engine,
  fname,
  vaultName,
}: {
  engine: DEngineClient;
  fname: string;
  vaultName: string;
}) => {
  const vault = VaultUtils.getVaultByNameOrThrow({
    vaults: engine.vaults,
    vname: vaultName,
  });
  const note = NoteUtils.getNoteByFnameV5({
    fname,
    notes: engine.notes,
    vault: vault!,
    wsRoot: engine.wsRoot,
  });
  return note;
};

export default function MiniPreview({
  engine,
}: {
  engine: engineSlice.EngineState;
}) {
  // @ts-ignore
  const webEngine = new WebEngine(engine);
  const [note, setNote] = React.useState<NoteProps>();
  const router = useRouter();
  const { isReady } = router;
  if (!isReady) {
    return <> </>;
  }
  React.useEffect(() => {
    const { fname, vaultName } = router.query;
    // @ts-ignore
    let resp = convertMd({ engine: webEngine, fname, vaultName });
    setNote(resp);
    console.log("response", resp);
  }, [router.query.fname, router.query.vaultName]);
  if (!note) {
    return <>Loading..</>;
  }
  return (
    <>
      Fname: {router.query.fname}, Body: {note.body}
    </>
  );
}
