import { DendronError } from "@dendronhq/common-all";
import { DLogger } from "@dendronhq/common-server";
import { HistoryService } from "@dendronhq/engine-server";
import { ILookupControllerV3 } from "./LookupControllerV3Interface";
import { NoteLookupProviderChangeStateResp } from "./LookupProviderV3Interface";

export class NoteLookupProviderUtils {
  static cleanup(opts: { id: string; controller: ILookupControllerV3 }) {
    const { id, controller } = opts;
    controller.onHide();
    HistoryService.instance().remove(id, "lookupProvider");
  }

  static subscribe(opts: {
    id: string;
    controller: ILookupControllerV3;
    logger: DLogger;
    onDone?: Function;
    onError?: Function;
    onChangeState?: Function;
    onHide?: Function;
  }): Promise<any | undefined> {
    const { id, controller, logger, onDone, onError, onChangeState, onHide } =
      opts;

    return new Promise((resolve) => {
      HistoryService.instance().subscribev2("lookupProvider", {
        id,
        listener: async (event) => {
          if (event.action === "done") {
            if (onDone) {
              const out = await onDone(event);
              NoteLookupProviderUtils.cleanup({ id, controller });
              resolve(out);
            } else {
              resolve(event);
            }
          } else if (event.action === "error") {
            if (onError) {
              const out = await onError(event);
              resolve(out);
            } else {
              const error = event.data.error as DendronError;
              logger.error({ error });
              resolve(undefined);
            }
          } else if (event.action === "changeState") {
            if (onChangeState) {
              const out = await onChangeState(event);
              resolve(out);
            } else {
              const data = event.data as NoteLookupProviderChangeStateResp;
              if (data.action === "hide") {
                if (onHide) {
                  const out = await onHide(event);
                  resolve(out);
                } else {
                  logger.info({
                    ctx: id,
                    msg: "changeState.hide event received.",
                  });
                  resolve(undefined);
                }
              } else {
                logger.error({
                  ctx: id,
                  msg: "invalid changeState action received.",
                });
                resolve(undefined);
              }
            }
          } else {
            logger.error({
              ctx: id,
              msg: `unexpected event: ${event.action}`,
              event,
            });
            resolve(undefined);
          }
        },
      });
    });
  }
}
