import process from "process";

import { app } from "./index";
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`start on port ${port}`);
});
