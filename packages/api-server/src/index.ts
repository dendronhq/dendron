import app from "./Server";

function launch(opts?: { port?: number }): Promise<number> {
  const listenPort = opts?.port || 0;
  return new Promise((resolve) => {
    const server = app.listen(listenPort, () => {
      const port = (server.address() as any).port;
      resolve(port);
    });
  });
}
export { app, launch };
