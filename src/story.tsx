import React from "react";
import { addYears } from "date-fns";
import {
  Action,
  Condition,
  Effect,
  GameState,
  PlatzObj,
  Result
} from "./StoryEngine";

export const LOOSE_END: PlatzObj = {
  id: "loose_end",
  description: <div style={{ color: "red" }}>"todo: fill this in"</div>
};

const flagsAreOn = (...keys: string[]): Condition => (game: GameState) =>
  !keys.some((key) => !game.state[key]);

const flagIsOn = flagsAreOn;

const flagsAreOff = (...keys: string[]): Condition => (game: GameState) =>
  !keys.some((key) => game.state[key]);

const flagIsOff = flagsAreOff;

type StateSetter = (value: any, ...keys: string[]) => Effect;

const setStates: StateSetter = (value, ...keys) => (game: GameState) => {
  keys.forEach((key) => (game.state[key] = value));
};

const setFlagsOn = setStates.bind(null, true);
const setFlagsOff = setStates.bind(null, false);
const setFlagOn = setFlagsOn;
const setFlagOff = setFlagsOff;

const sequence = (writing: [string, string][], finalResult: Result) => {
  if (writing.length === 0)
    throw new Error("need at least one item in a sequence");
  const screens = writing.map(([description, ok]) => ({
    description,
    actions: [{ text: ok, result: finalResult }]
  }));
  for (let i = 1; i < screens.length; i++) {
    screens[i - 1].actions![0].result = screens[i];
  }
  return screens[0];
};

export const departureDate = new Date(3072, 2, 3);

export interface CalendarDay {
  date: Date;
  description: string;
}

export const calendar: CalendarDay[] = [
  {
    date: addYears(departureDate, 350),
    description:
      "All human life on Earth predicted extinct at this time. The cosmonauts are likely the only ones left."
  }
];

export const ship_calendar: Action = {
  id: "ship_calendar",
  text: "Check the calendar",
  result: (game) => {
    const event = calendar.find(({ date }) => date === game.date);
    if (event) {
      return {
        id: `calendar-event-${game.date.toUTCString()}`,
        description: event.description
      };
    }
    return {
      id: "calendar-event-none",
      description: "Nothing special today"
    };
  }
};

const DisengageWindowCover: Action = {
  id: "DisengageWindowCover",
  text: "Disengage the window cover",
  condition: flagIsOff("WindowCoverDisengaged"),
  result: [
    setFlagOn("WindowCoverDisengaged"),
    sequence(
      [
        [
          "A latch disengages. With some effort you open the shutter, revealing a small porthole. Peering through, you can see endless foreign stars. You have travelled far. The stars you see are not the stars you knew back at home. A ponderous dreadful awe fills your soul.",
          "Gaze into the void"
        ],
        [
          "You stare out, a speck engulfed in a vast void. The void would embrace you without a thought. It feels almost as though it already has. You know there are other travellers out there, but in this moment you cannot imagine their existence.",
          "You have work to do. Best get back."
        ]
      ],
      "ship_cabin"
    )
  ]
};

const EngageWindowCover: Action = {
  id: "EngageWindowCover",
  text: "Engage the window cover",
  condition: flagIsOn("WindowCoverDisengaged"),
  result: [
    setFlagOff("WindowCoverDisengaged"),
    {
      description:
        "You close the shutters, shutting out the empty blackness of the void.",
      actions: [
        {
          text: "Return to the cabin",
          result: "ship_cabin"
        }
      ]
    }
  ]
};

export const story: { [key: string]: PlatzObj } = {
  intro: {
    description:
      "You wake up in your spaceship. At least you think you're awake. It's completely dark.",
    actions: [
      {
        id: "find_personal_flashlight",
        text: "Feel around for something helpful",
        result: {
          description:
            "Reaching out into the dark, you find your trusty multitool.",
          actions: [
            {
              text: "Turn on the flashlight on your multitool",
              result: {
                description:
                  "You turn the flashlight on and look around. Your ship is running on emergency power. Only the critical life support systems seem to be active.",
                actions: [
                  {
                    text: "Log in to the ship's computer",
                    result: {
                      description: (game) => (
                        <div className="computer">
                          <p>Welcome to CrOS v3402.583.66</p>
                          <p>
                            MotD brought to you by RezCo: "The greater the
                            struggle, the more weary the stalwart heart becomes.
                            The wise know the noble joy of despair."
                          </p>
                          <p>[enter username] |</p>
                        </div>
                      ),
                      text_input: {
                        set: "player.name",
                        result: LOOSE_END
                      }
                    }
                  },
                  {
                    text: "Try to remember what happened",
                    result: "remember_name"
                  }
                ]
              }
            },
            {
              text: "Activate the laser on your multitool",
              result: {
                description:
                  "You turn on the laser, but in the darkness you fail to aim it properly. The laser burns your foot. You quickly turn the laser back off.",
                actions: [
                  {
                    text: "Turn on the flashlight",
                    result: {
                      description:
                        "You turn the flashlight on and look around. Your ship is running on emergency power. Only the critical life support systems seem to be active."
                    }
                  },
                  {
                    text: "Activate the multitool's laser",
                    result: {
                      description:
                        "For some reason, you decide to activate the laser again. This time you burn your eye."
                    }
                  }
                ]
              }
            }
          ]
        }
      },
      {
        text: "Try to remember what happened",
        result: "remember_name"
      }
    ]
  },

  remember_name: {
    description: "Let's see, your name is...",
    text_input: {
      set: "player.name",
      result: {
        description: ({ player }) =>
          `Ah good, you remember your name: ${player.name}.`,
        actions: [
          {
            id: "cares_about_name",
            text: "It would be a shame to forget one's own name.",
            result: "remember_background"
          },
          {
            id: "name_unimportant",
            text: "It's just a name, it is unimportant.",
            result: "remember_background"
          }
        ]
      }
    }
  },

  remember_background: {
    description:
      "As your head clears, you continue to gain your bearings. You recall more about who you are...",
    actions: [
      {
        id: "background_bounty_hunter",
        text:
          "You are a bounty hunter, doing the dangerous work of keeping order in the wilder worlds.",
        result: "remember_recent_past"
      },
      {
        id: "background_poverty",
        text:
          "You grew up in poverty and have always had to improvise to survive.",
        result: "remember_recent_past"
      },
      {
        id: "background_merchant",
        text:
          "You are a travelling merchant, peddling rare and fascinating goods.",
        result: "remember_recent_past"
      },
      {
        id: "background_doctor",
        text: "You are a doctor, keeping folks around for a little longer.",
        result: "remember_recent_past"
      },
      {
        id: "background_mechanic",
        text:
          "You are a mechanic, keeping robots and ships in repair and running smoothly.",
        result: "remember_recent_past"
      }
    ]
  },

  ship_cabin: {
    description: "You are in your ship's cabin.",
    actions: [
      {
        id: "power_on",
        condition: flagIsOff("ship_power_on"),
        text: "Power on the ship",
        result: [
          setFlagOn("ship_power_on"),
          {
            description:
              "You throw the switch to power on the ship's cabin. In a flurry of activity, the ship's controls come to life and await your command.",
            actions: [
              {
                text: "Look around",
                result: "ship_cabin"
              }
            ]
          }
        ]
      },
      {
        id: "navigate",
        condition: flagIsOn("ship_power_on"),
        text: "Navigate to a destination",
        result: LOOSE_END
      },
      {
        id: "open_energy_controls",
        condition: flagIsOn("ship_power_on"),
        text: "Adjust energy controls",
        result: LOOSE_END
      },
      {
        id: "open_comms",
        condition: flagIsOn("ship_power_on"),
        text: "Check the communications panel",
        result: "comms_panel"
      },
      DisengageWindowCover,
      EngageWindowCover
    ]
  },

  comms_panel: {
    description: "You have no new messages",
    actions: [
      {
        id: "return_to_cabin",
        text: "Return to the cabin",
        result: "ship_cabin"
      }
    ]
  },

  /*

  CHARACTER CREATION IDEAS

  where did you come from
    poverty (low money/luck, high deftness/fighting)
    caravaneers (low deftness/sneak, high money/speech)
    slave (low fighting/money, high luck/deftness)

  how did you get stranded out here
    betrayed and left to die (you have an enemy, improved resilience)
    running away (improved luck/resilience)
    a mission gone wrong (improved relationships)
  
  what motivates you to move forward now?
    revenge (improved resilience, reduced luck)
    love of life (improved resilience/charm, reduced fighting)

  what are your skills
    charm: you can influence people to like you, or fear you
    shooting: you are skilled with aimed weapons

    faith: in giving yourself up to a higher power, you will reap your reward
    science: can identify natural phenomena and engineer things
    luck: you instinctively turn situations to your advantage
    piloting: make advanced maneuvers


  after examining the ships logs, you conclude that...
    ship absorbed emergency fuel from a space anomaly (scientist)
    a kind soul helped (charm)
    your salvation was an act of a higher power (faith)

  starting gift
    alien trinket
    strange cipher
    map of an unknown world



  GAME MECHANICS IDEAS
  
  ship tasks
    repair sensors
    start computer
    align navigation
    power up reactor
    connect auxiliary batteries
    
  ship controls
    navigation
    energy distribution
      heat
      weapons
      shields
      sensors
      thrusters
    comms
    
  */

  remember_recent_past: LOOSE_END
};
