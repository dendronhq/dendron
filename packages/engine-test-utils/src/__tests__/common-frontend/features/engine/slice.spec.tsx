import { combinedStore, engineHooks, engineSlice } from "@dendronhq/common-frontend";
import { render as rtlRender, waitFor } from '@testing-library/react';
import {NoteProps} from "@dendronhq/common-all";
import React from 'react';
import { Provider } from 'react-redux';
import { createEngineFromServer, runEngineTestV5 } from "../../../../engine";
import { ENGINE_HOOKS } from "../../../../presets";

function render(
  ui: any,
  {
    preloadedState,
    store = combinedStore,
    ...renderOptions
  } = {} as any
) {
  function Wrapper({ children }: {children: any}) {
    return <Provider store={store}>{children}</Provider>
  }
  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}
const App = (props: {port: number, ws: string, note: NoteProps}) => {
	const dispatch = engineHooks.useEngineAppDispatch();
	dispatch(engineSlice.syncNote(props));
	const engine = engineHooks.useEngineAppSelector((state) => state.engine);

	return <div data-testid="resp">{JSON.stringify(engine.notes)}</div>;
}

describe("syncNote", () => {

	test("basic", async () => {
		await runEngineTestV5(async({port, wsRoot, engine})=> {
			const note = engine.notes["foo"]
			debugger;
			const {getByTestId} = render(<App port={port!} ws={wsRoot} note={note}/>)
			await waitFor(()=> expect(getByTestId("resp").innerHTML).not.toEqual("{}"))
			expect(JSON.parse(getByTestId("resp").innerHTML)["foo"]).toEqual(note)
		}, {
			expect,
			preSetupHook: ENGINE_HOOKS.setupBasic,
			createEngine: createEngineFromServer
		})
	});
});