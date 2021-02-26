import React, { useState } from "react";
import { makeAutoObservable, toJS } from "mobx";
import { observer } from "mobx-react-lite";

import {
  Action,
  departureDate,
  GameState,
  LOOSE_END,
  PlatzObj,
  Result,
  story,
  TextInput
} from "./story";

const extractResult = (result: Result, game: GameState): PlatzObj | null => {
  if (typeof result === "string") {
    return story[result];
  }
  if (Array.isArray(result)) {
    return result.reduce((acc: PlatzObj | null, current) => {
      const platz = extractResult(current, game);
      return acc || platz;
    }, null);
  }
  if (typeof result === "function") {
    return result(game) || null;
  }
  return result;
};

class RealGameState implements GameState {
  constructor(start?: PlatzObj) {
    if (start) this.platz = start;
    makeAutoObservable(this);
  }

  turn = 0;
  day = 1;
  date = departureDate;
  player = { name: "Spacefarer" };
  state = {};
  actionLog: { action: Action; result: PlatzObj }[] = [];
  storyStack: string[] = [];
  platz = story.intro;

  doTextInput(textInput: TextInput, value: string) {
    const key = textInput.set.split(".");
    // use reduce to find the game state to modify
    const object = key
      .slice(0, -1)
      .reduce((obj, keyPart) => obj[keyPart], this as any);
    // set the state on the game object.
    // this is kinda unsafe but y'know whatevs
    object[key[key.length - 1]] = value;
    this.doAction({
      text: "input text",
      result: textInput.result
    });
  }

  doAction(action: Action) {
    const result = extractResult(action.result, this) || LOOSE_END;
    this.actionLog.push({ action, result });
    this.platz = result;
  }
}

const TextInputComp: React.FC<{
  onSubmit: (value: string) => void;
}> = ({ onSubmit }) => {
  const [inputValue, setInputValue] = useState("");
  return (
    <>
      <input
        className="text-input"
        onChange={(event) => setInputValue(event.target.value)}
      />
      <button onClick={() => onSubmit(inputValue)}>Continue</button>
    </>
  );
};

export const StoryEngine = observer(() => {
  const [game] = useState(new RealGameState(story.ship_cabin));
  console.log(toJS(game));

  const description =
    typeof game.platz.description === "function"
      ? game.platz.description(game)
      : toJS(game.platz.description);

  const textInput = game.platz.text_input;

  const actions = (game.platz.actions || []).filter((action) => {
    console.log(action.id, action.condition);
    return action.condition == null || action.condition(game);
  });

  return (
    <div className="platz">
      <div className="description">{description}</div>
      <div className="actions">
        {!!textInput && (
          <TextInputComp
            onSubmit={(value) => game.doTextInput(textInput, value)}
          />
        )}
        {actions.map((action) => (
          <div
            key={action.id}
            role="button"
            className="action"
            onClick={() => game.doAction(action)}
          >
            {action.text}
          </div>
        ))}
      </div>
    </div>
  );
});
