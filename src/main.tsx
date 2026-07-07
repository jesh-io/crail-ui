import React from "react";
import ReactDOM from "react-dom/client";

import "./kit/fonts.css";
import "./kit/index";
import "./showcase/showcase.css";
import App from "./showcase/App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
