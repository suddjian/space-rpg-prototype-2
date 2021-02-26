import * as React from "react";
import { render } from "react-dom";
import { StoryEngine } from "./StoryEngine";
import "./styles.css";

export default function App() {
  return (
    <div className="app">
      <h1>Space RPG Prototype 2</h1>
      <StoryEngine />
    </div>
  );
}

const rootElement = document.getElementById("root");
render(<App />, rootElement);
