/*********************************************************************
Copyright 2018 Amazon.com, Inc. and its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License").
You may not use this file except in compliance with the License.
A copy of the License is located at

  http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed
on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied. See the License for the specific language governing
permissions and limitations under the License.

Description: Common handlers for built-in intents.
LaunchRequest, AMAZON.NoIntent, AMAZON.HelpIntent, AMAZON.StopIntent,
AMAZON.CancelIntent, Unhandled, SessionEndedRequest, and the Error
Handler.
*********************************************************************/
const constants = require('./constants');
const helpers = require('./helpers');

const Jargon = require('@jargon/alexa-skill-sdk');
const ri = Jargon.ri;

module.exports = {
  /**
   * Handler for when a skill is launched. Delivers a response based on if a user is new or
   * returning and how complete their profile is.
   */
  LaunchHandler: {
    canHandle (handlerInput) {
      return (
        handlerInput.requestEnvelope.request.type === 'LaunchRequest' ||
        (handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
          handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StartOverIntent')
      );
    },
    handle: async (handlerInput) => {
      console.info('LaunchRequest');
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      let welcome;

      attributes[constants.STATE] = constants.STATES.START;

      /**
       * Message is determined first by if there are search results saved to the user and
       * then by if the profile is complete PROFCOMPLETE variable is set at the end
       * of the profileHandlers.js moveOn() function.
       */
      if (attributes[constants.PROFCOMPLETE]) {
        if (attributes[constants.SEARCH_RESULTS]) {
          let school = attributes[constants.SEARCH_RESULTS][0];
          let welcome = await handlerInput.jrm.render(ri("WELCOME_SHORT"))
          console.log(`welcome: ${welcome}`)
          let topPick = await handlerInput.jrm.render(ri("WELCOME_TOP_PICK", {"school": school['school.name'].replace('&', 'and')} ))
          console.log(`topPick: ${topPick}`)
          let menu = await handlerInput.jrm.render(ri("WELCOME_MENU"))
          console.log(`menu: ${menu}`)

          let message = welcome + '<break time="500ms"/>' + topPick + ' ' + menu
          console.log(`message: ${message}`)

          handlerInput.responseBuilder.speak(message).reprompt(message);
          attributes[constants.INTRO_MESSAGE] = message;
          helpers.saveUser(handlerInput, 'session');

          if (helpers.hasDisplay(handlerInput)) {
            let notAvailableMsg = await handlerInput.jrm.render(ri("NOT_AVAILABLE"))
            handlerInput.responseBuilder.addRenderTemplateDirective(
              helpers.buildSchoolTemplate(notAvailableMsg, school)
            );
          }

          return handlerInput.responseBuilder.getResponse();
        }
        let welcomeShort = await handlerInput.jrm.render(ri("WELCOME_SHORT"))
        console.log(`welcome: ${welcomeShort}`)
        console.log('welcome short message: ', welcomeShort);
        let menu = await handlerInput.jrm.render(ri("WELCOME_MENU"))
        console.log(`menu: ${menu}`)
        welcome = welcomeShort + '<break time="500ms"/>' + menu

        attributes[constants.STATE] = constants.STATES.SEARCH;
      } else if (
        (!attributes[constants.PROFCOMPLETE] &&
          (attributes[constants.SAT] ||
            attributes[constants.ACT] ||
            attributes[constants.COST] ||
            attributes[constants.DEGREE] ||
            attributes[constants.HOME])) ||
        attributes[constants.MAJOR]
      ) {
        let welcomeShort = await handlerInput.jrm.render(ri("WELCOME_SHORT"))
        console.log(`welcome: ${welcomeShort}`)
        let welcomeBackIncompleteProfile = await handlerInput.jrm.render(ri("WELCOME_BACK_INCOMPLETE_PROFILE"))
        welcome = `${welcomeShort}<break time="500ms"/>${welcomeBackIncompleteProfile}`;
        console.log(`welcomeShort: ${welcomeShort}`)

        attributes[constants.STATE] = constants.STATES.PROFILE;
      } else if (!attributes[constants.PROFCOMPLETE] && attributes[constants.FIRST_RUN] === false) {
        let welcomeShort = await handlerInput.jrm.render(ri("WELCOME_SHORT"))
        console.log(`welcome: ${welcomeShort}`)
        let welcomeBackNoProfile = await handlerInput.jrm.render(ri("WELCOME_BACK_NO_PROFILE"));
        console.log(`welcomeBackNoProfile: ${welcomeBackNoProfile}`)

        console.log('welcomeBackNoProfile_message 2', welcomeBackNoProfile)

        welcome =
          welcomeShort +
          '<break time="500ms"/>' +
          welcomeBackNoProfile
        attributes[constants.STATE] = constants.STATES.PROFILE;
      } else {
        let welcomeLong = await handlerInput.jrm.render(ri("WELCOME_LONG"))
        console.log(`welcomeLong: ${welcomeLong}`)
        let welcomeBackNoProfile = await handlerInput.jrm.render(ri("WELCOME_BACK_NO_PROFILE"))
        console.log(`welcomeBackNoProfile: ${welcomeBackNoProfile}`)

        console.log('welcomeBackNoProfile_message 3', welcomeBackNoProfile)

        welcome = welcomeLong;
        welcome +=
          '<break time="500ms"/>' + welcomeBackNoProfile;
        attributes[constants.STATE] = constants.STATES.PROFILE;
      }

      console.log('just before the return')
      attributes[constants.INTRO_MESSAGE] = welcome;

      return helpers.simpleDisplayResponse(handlerInput, attributes, welcome);
    }
  },
  /**
   * Basic AMAZON.NoIntent handler for any action the skill takes that is based on
   * the STATE the user is in. Used for simple responses to route users out of
   * other states in the skill.
   */
  NoHandler: {
    canHandle (handlerInput) {
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent'
      );
    },
    handle: async (handlerInput) => {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info('Generic AMAZON.NoIntent');
      let message;

      // Message is determined by the State of the user in the skill
      if (attributes[constants.STATE] === constants.STATES.PROFILE) {
        attributes[constants.STATE === constants.STATES.SEARCH];
        message = await handlerInput.jrm.render(ri("WELCOME_MENU"));
      } else if (attributes[constants.STATE] === constants.STATES.LIST_SCHOOLS) {
        message = await handlerInput.jrm.render(ri("REVIEW_RESULTS", {"count": attributes[constants.SEARCH_RESULTS].length}));
      } else if (attributes[constants.STATE] === constants.STATES.REFINE_SEARCH) {
        attributes[constants.PREVIOUS_STATE] = constants.STATES.REFINE_SEARCH;
        attributes[constants.STATE] = constants.STATES.REFINE_NO;
        message = await handlerInput.jrm.render(ri("REFINE_SEARCH_UNACCEPTED"));
      }

      return helpers.simpleDisplayResponse(handlerInput, attributes, message);
    }
  },
  /**
   * Generic handler for returning a user to the main menu if they invoke the
   * AMAZON.PreviousIntent with no context for the previous state.
   */
  PreviousHandler: {
    canHandle (handlerInput) {
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.PreviousIntent' ||
          handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StartOverIntent')
      );
    },
    handle: async (handlerInput) => {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.log(`${attributes[constants.STATE]}, AMAZON.PreviousIntent`);
      message = await handlerInput.jrm.render(ri("WELCOME_MENU"));

      return helpers.simpleDisplayResponse(handlerInput, attributes, message);
    }
  },
  /**
   * Help specific to when a user asks for the regions and states available
   */
  RegionListIntentHandler: {
    canHandle (handlerInput) {
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'RegionListIntent'
      );
    },
    handle: async (handlerInput) => {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.log(`${attributes[constants.STATE]}, RegionListIntent`);
      let locationHelp = await handlerInput.jrm.render(ri("LOCATION_HELP"))
      const message = locationHelp +
      ' ' +
      attributes[constants.INTRO_MESSAGE];

      helpers.saveUser(handlerInput, attributes, 'session');
      return helpers.simpleDisplayResponse(handlerInput, attributes, message);
    }
  },
  /**
   * Central handler for the AMAZON.HelpIntent. Help messages are contextual based on
   * STATE/completed attributes or return the generic help if there is no
   * contextual response defined.
   */
  HelpIntentHandler: {
    canHandle (handlerInput) {
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent'
      );
    },
    handle: async (handlerInput) => {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.log(`${attributes[constants.STATE]}, AMAZON.HelpIntent`);
      let message;

      // If there is no Intro Message stored for Alexa to say after the help then use the welcome menu

      let welcomeMenu = await handlerInput.jrm.render(ri("WELCOME_MENU"));

      attributes[constants.INTRO_MESSAGE] = attributes[constants.INTRO_MESSAGE]
        ? attributes[constants.INTRO_MESSAGE]
        : welcomeMenu;

      switch (attributes[constants.STATE]) {
        case constants.STATES.SCORES: {
          if (attributes[constants.SCORE]) {
            message = await handlerInput.jrm.render(ri("SCORE_NUMBER_HELP"));
          } else {
            message = await handlerInput.jrm.render(ri("SCORE_HELP"));
          }
          break;
        }
        case constants.STATES.COST: {
          message = await handlerInput.jrm.render(ri("COST_HELP"));
          break;
        }
        case constants.STATES.DEGREE: {
          message = await handlerInput.jrm.render(ri("DEGREE_HELP"));
          break;
        }
        case constants.STATES.MAJOR: {
          message = await handlerInput.jrm.render(ri("MAJOR_HELP"));
          break;
        }
        case constants.STATES.HOME: {
          let homeHelp = await handlerInput.jrm.render(ri("HOME_HELP"));
          let homeZipCode = await handlerInput.jrm.render(ri("HOME_ZIP_CODE"));
          message =
            homeHelp + 
          ' ' +
            homeZipCode;
          break;
        }
        case constants.STATES.LIST_SCHOOLS: {
          message = await handlerInput.jrm.render(ri("LIST_SCHOOLS_HELP"));
          break;
        }
        case constants.STATES.FAVORITES: {
          message = await handlerInput.jrm.render(ri("FAVORITES_HELP"));
          break;
        }
        case constants.STATES.SEARCH_BY_LOCATION: {
          message = await handlerInput.jrm.render(ri("LOCATION_HELP"));
          break;
        }
        case constants.STATES.START: {
          if (!attributes[constants.PROFCOMPLETE]) {
            attributes[constants.STATE] = constants.STATES.PROFILE;
            let welcomeHelp = await handlerInput.jrm.render(ri("WELCOME_HELP"));
            let welcomeMenu = await handlerInput.jrm.render(ri("WELCOME_MENU"));
            message =
              welcomeHelp +
              ' ' +
              welcomeMenu;
          } else {
              let welcomeHelp = await handlerInput.jrm.render(ri("WELCOME_HELP"));
              message =
              welcomeHelp +
              ' ' +
              attributes[constants.INTRO_MESSAGE];
            }
          break;
        }
        // At session end, the skill deletes the STATE variable so this case
        // handles when the HELP intent is triggered as a one-shot
        case undefined: {
            let welcomeHelp = await handlerInput.jrm.render(ri("WELCOME_HELP"));
            let welcomeMenu = await handlerInput.jrm.render(ri("WELCOME_MENU"));
            message =
            welcomeHelp +
            ' ' +
            welcomeMenu;
            break;
        }
        default: {
            let welcomeHelp = await handlerInput.jrm.render(ri("WELCOME_HELP"));
            message =
            welcomeHelp +
            ' ' +
            attributes[constants.INTRO_MESSAGE];
          }
      }

      helpers.saveUser(handlerInput, attributes, 'session');
      return helpers.simpleDisplayResponse(handlerInput, attributes, message);
    }
  },
  /**
   * Central handler for the AMAZON.StopIntent and AMAZON.CancelIntent.
   * Handler saves the session to DynamoDB and then sends a goodbye message.
   */
  CancelAndStopIntentHandler: {
    canHandle (handlerInput) {
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent' ||
          handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent')
      );
    },
    handle : async (handlerInput) => {
      console.info('Cancel and Stop Handler');

      let attributes = handlerInput.attributesManager.getSessionAttributes();
      attributes = helpers.clearSessionAttributes(attributes);
      helpers.saveUser(handlerInput, attributes, 'persistent');

      let goodbyeMessage = await handlerInput.jrm.render(ri("GOODBYE"));

      return handlerInput.responseBuilder
        .speak(goodbyeMessage)
        .withShouldEndSession(true)
        .getResponse();
    }
  },
  /**
   * Central handler for the SessionEndedRequest when the user says exit
   * or another session ending event occurs. Handler saves the session to
   * DynamoDB and exits.
   */
  SessionEndedRequestHandler: {
    canHandle (handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle (handlerInput) {
      console.info(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      attributes = helpers.clearSessionAttributes(attributes);

      helpers.saveUser(handlerInput, attributes, 'persistent');

      return handlerInput.responseBuilder.getResponse();
    }
  },
  /**
   * Catch all for when the skill cannot find a canHandle() that returns true.
   */
  UnhandledIntentHandler: {
    canHandle () {
      return true;
    },
    handle: async (handlerInput) => {
      console.info('Unhandled');
      let attributes = handlerInput.attributesManager.getSessionAttributes();

      if (attributes[constants.STATE] === constants.STATES.REFINE_SEARCH) {
        delete attributes[constants.STATE];

        helpers.saveUser(handlerInput, 'session');
      }

      let errorCant = await handlerInput.jrm.render(ri("ERROR_CANT"));
      let welcomeMenu = await handlerInput.jrm.render(ri("WELCOME_MENU"));


      const message = `${errorCant} ${welcomeMenu}`;

      return handlerInput.responseBuilder.speak(message).reprompt(message).getResponse();
    }
  },
  ResetProfileHandler: {
    canHandle (handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'ResetProfileIntent';
    },
    handle: async (handlerInput) => {
      helpers.clearUser(handlerInput);
      let profileReset = await handlerInput.jrm.render(ri("PROFILE_RESET"));
      let profileResetNext = await handlerInput.jrm.render(ri("PROFILE_RESET_NEXT"));
      return handlerInput.responseBuilder.speak(profileReset)
        .reprompt(profileResetNext)
      .getResponse();
    }
  },
  /**
   * Central error handler with contextual messaging.
   */
  ErrorHandler: {
    canHandle () {
      return true;
    },
    handle: async (handlerInput, error) => {
      console.error(`Error handled: ${error.message}`);
      console.info('Full error: ', error);

      let attributes = handlerInput.attributesManager.getSessionAttributes();
      let message;

      switch (attributes[constants.STATE]) {
        case constants.STATES.SCORES: {
          if (attributes[constants.SCORE]) {
            let rangeLow, rangeHigh;
            if (attributes[constants.SCORE] === constants.SAT) {
              rangeLow = 400;
              rangeHigh = 1600;
            } else {
              rangeLow = 1;
              rangeHigh = 36;
            }
            message = await handlerInput.jrm.render(ri("SCORE_NUMBER_ERROR", {"score": attributes[constants.SCORE], "rangeLow": rangeLow, "rangeHigh": rangeHigh}));

            return handlerInput.responseBuilder.speak(message).reprompt(message).getResponse();
          } else {
            message = 'SCORE_ERROR';
          }
          break;
        }
        case constants.STATES.COST: {
          message = 'COST_ERROR';
          break;
        }
        case constants.STATES.DEGREE: {
          message = 'DEGREE_ERROR';
          break;
        }
        case constants.STATES.MAJOR: {
          message = 'MAJOR_ERROR';
          break;
        }
        case constants.STATES.HOME: {
          message = 'HOME_ERROR';
          break;
        }
        case constants.STATES.REFINE_SEARCH: {
          message = 'SEARCH_ERROR';
          break;
        }
        case constants.STATES.LIST_SCHOOLS: {
          message = 'LIST_SCHOOLS_HELP';
          break;
        }
        case constants.STATES.MORE_INFORMATION: {
          message = 'MORE_INFORMATION_ERROR';
          break;
        }
        case constants.STATES.PROFILE: {
          message = 'PROFILE_ERROR';
          break;
        }
        case constants.STATES.FAVORITES: {
          if (attributes[constants.PREVIOUS_INTENT]) {
            if (attributes[constants.PREVIOUS_INTENT] === 'DeleteFromFavoritesIntent') {
              message = 'FAVORITES_DELETE_ERROR';
            } else if (attributes[constants.PREVIOUS_INTENT] === 'AddToFavoritesIntent') {
              message = 'FAVORITES_ADD_ERROR';
            }
          } else {
            message = 'FAVORITES_ERROR';
          }
          break;
        }
        default: {
          message  = await handlerInput.jrm.render(ri("ERROR_NOT_UNDERSTOOD"));
        }
      }

      let speakMsg = await handlerInput.jrm.render(ri(message));
      return handlerInput.responseBuilder
      .speak(speakMsg)
      .reprompt(speakMsg)
      .getResponse();
    }
  },
  /**
   * Error for the CanFulfillIntentRequest for marking the skill as not able to fulfill the
   * request from a user looking for skills.
   */
  CanFulfillIntentErrorHandler: {
    canHandle (handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'CanFulfillIntentRequest';
    },
    handle (handlerInput) {
      console.log(`CFIR Error handled: ${error.message}`);

      return handlerInput.responseBuilder
        .withCanFulfillIntent({
          canFulfill: 'NO',
          slots: {
            SCHOOL_NAME: {
              canUnderstand: 'NO',
              canFulfill: 'NO'
            },
            STATE: {
              canUnderstand: 'NO',
              canFulfill: 'NO'
            },
            REGION: {
              canUnderstand: 'NO',
              canFulfill: 'NO'
            }
          }
        })
        .getResponse();
    }
  }
};
