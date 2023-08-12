import tracer from "dd-trace";

tracer.init(); // initialized in a different file to avoid hoisting.
export default tracer;
