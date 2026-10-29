import React from "react";
import { hydrateRoot } from "react-dom/client";
import App from "./App";
import "./style.css";
import "./app/app.css";
hydrateRoot(
  document.getElementById("root"),
  <App path={location.protocol === "file:" ? "/" : location.pathname} />,
);
