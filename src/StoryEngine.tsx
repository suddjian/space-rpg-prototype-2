import React, { useState } from "react";
import { makeAutoObservable, toJS } from "mobx";
import { observer } from "mobx-react-lite";

import { departureDate, LOOSE_END, story } from "./story";

export type Player = { name: string };

export type PlatzFn = (game: GameState) => PlatzObj;

export type Effect = (game: GameState) => void;

export type PlatzRef = PlatzObj | string | PlatzFn | Effect;

export type Result = PlatzRef | PlatzRef[];

export type PlatzObj = {
  id?: string;
  description:
    | string
    | React.ReactNode
    | ((game: GameState) => string | React.ReactNode);
  actions?: Action[];
  text_input?: TextInput;
};

export type TextInput = {
  id?: string;
  set: string;
  result: Result;
};

export type Action = {
  id?: string;
  text: string | ((game: GameState) => string);
  result: Result;
  condition?: Condition;
};

export type Condition = (game: GameState) => boolean;

const processResult = (result: Result, game: GameState): PlatzObj | null => {
  if (typeof result === "string") {
    return story[result];
  }
  if (Array.isArray(result)) {
    return result.reduce((acc: PlatzObj | null, current) => {
      const platz = processResult(current, game);
      return acc || platz;
    }, null);
  }
  if (typeof result === "function") {
    return result(game) || null;
  }
  return result;
};

export class GameState {
  constructor(start?: PlatzObj) {
    if (start) this.platz = start;
    makeAutoObservable(this);
  }

  turn = 0;
  day = 1;
  date = departureDate;
  player: Player = { name: "Spacefarer" };
  state: Record<string, any> = {};
  actionLog: { action: Action; result: PlatzObj }[] = [];
  storyStack: string[] = [];
  platz: PlatzObj = story.intro;

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
    const result = processResult(action.result, this) || LOOSE_END;
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

const Spacer = () => <span className="spacer"></span>;

export const StoryEngine = observer(() => {
  const [game] = useState(new GameState(story.ship_cabin));
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
      <Spacer />
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
