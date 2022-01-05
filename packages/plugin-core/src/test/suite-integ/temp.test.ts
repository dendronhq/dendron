import { describe } from "mocha";
import { TestEvent } from "../../services/TestEvent";

suite("telemetry", function () {
  describe("testing event", () => {
    test("enabled by configuration", (done) => {
      const blah = new TestEvent();

      const disp = blah.onNoteChange((str) => {
        console.log("inside blah" + str);
      });

      blah.triggerCallback("dummy one");

      disp.dispose();

      blah.triggerCallback("dummy two");

      done();
    });
  });
});
