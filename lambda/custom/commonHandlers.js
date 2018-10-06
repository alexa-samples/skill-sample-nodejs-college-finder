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
    handle (handlerInput) {
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
          message =
            helpers.getMessage(handlerInput, 'WELCOME_SHORT') +
            '<break time="500ms"/>' +
            helpers
              .getMessage(handlerInput, 'WELCOME_TOP_PICK')
              .replace('%%SCHOOL%%', school['school.name'].replace('&', 'and')) +
            helpers.getMessage(handlerInput, 'WELCOME_MENU');

          handlerInput.responseBuilder.speak(message).reprompt(message);
          attributes[constants.INTRO_MESSAGE] = message;
          helpers.saveUser(handlerInput, 'session');

          if (helpers.hasDisplay(handlerInput)) {
            handlerInput.responseBuilder.addRenderTemplateDirective(
              helpers.buildSchoolTemplate(helpers.getMessage(handlerInput, 'NOT_AVAILABLE'), school)
            );
          }

          return handlerInput.responseBuilder.getResponse();
        }
        welcome =
          helpers.getMessage(handlerInput, 'WELCOME_SHORT') +
          '<break time="500ms"/>' +
          helpers.getMessage(handlerInput, 'WELCOME_MENU');
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
        welcome = `${helpers.getMessage(
          handlerInput,
          'WELCOME_SHORT'
        )}<break time="500ms"/>${helpers.getMessage(
          handlerInput,
          'WELCOME_BACK_INCOMPLETE_PROFILE'
        )}`;
        attributes[constants.STATE] = constants.STATES.PROFILE;
      } else if (!attributes[constants.PROFCOMPLETE] && attributes[constants.FIRST_RUN] === false) {
        welcome =
          helpers.getMessage(handlerInput, 'WELCOME_SHORT') +
          '<break time="500ms"/>' +
          helpers.getMessage(handlerInput, 'WELCOME_BACK_NO_PROFILE');
        attributes[constants.STATE] = constants.STATES.PROFILE;
      } else {
        welcome = helpers.getMessage(handlerInput, 'WELCOME_LONG');
        welcome +=
          '<break time="500ms"/>' + helpers.getMessage(handlerInput, 'WELCOME_BACK_NO_PROFILE');
        attributes[constants.STATE] = constants.STATES.PROFILE;
      }

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
    handle (handlerInput) {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info('Generic AMAZON.NoIntent');
      let message;

      // Message is determined by the State of the user in the skill
      if (attributes[constants.STATE] === constants.STATES.PROFILE) {
        attributes[constants.STATE === constants.STATES.SEARCH];
        message = helpers.getMessage(handlerInput, 'WELCOME_MENU');
      } else if (attributes[constants.STATE] === constants.STATES.LIST_SCHOOLS) {
        message = helpers
          .getMessage(handlerInput, 'REVIEW_RESULTS')
          .replace('%%RESULT_COUNT%%', attributes[constants.SEARCH_RESULTS].length);
      } else if (attributes[constants.STATE] === constants.STATES.REFINE_SEARCH) {
        attributes[constants.PREVIOUS_STATE] = constants.STATES.REFINE_SEARCH;
        attributes[constants.STATE] = constants.STATES.REFINE_NO;
        message = helpers.getMessage(handlerInput, 'REFINE_SEARCH_UNACCEPTED');
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
    handle (handlerInput) {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.log(`${attributes[constants.STATE]}, AMAZON.PreviousIntent`);
      const message = helpers.getMessage(handlerInput, 'WELCOME_MENU');

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
    handle (handlerInput) {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.log(`${attributes[constants.STATE]}, RegionListIntent`);
      const message =
        helpers.getMessage(handlerInput, 'LOCATION_HELP') +
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
    handle (handlerInput) {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.log(`${attributes[constants.STATE]}, AMAZON.HelpIntent`);
      let message;

      // If there is no Intro Message stored for Alexa to say after the help then use the welcome menu
      attributes[constants.INTRO_MESSAGE] = attributes[constants.INTRO_MESSAGE]
        ? attributes[constants.INTRO_MESSAGE]
        : helpers.getMessage(handlerInput, 'WELCOME_MENU');

      switch (attributes[constants.STATE]) {
        case constants.STATES.SCORES: {
          if (attributes[constants.SCORE]) {
            message = helpers.getMessage(handlerInput, 'SCORE_NUMBER_HELP');
          } else {
            message = helpers.getMessage(handlerInput, 'SCORE_HELP');
          }
          break;
        }
        case constants.STATES.COST: {
          message = helpers.getMessage(handlerInput, 'COST_HELP');
          break;
        }
        case constants.STATES.DEGREE: {
          message = helpers.getMessage(handlerInput, 'DEGREE_HELP');
          break;
        }
        case constants.STATES.MAJOR: {
          message = helpers.getMessage(handlerInput, 'MAJOR_HELP');
          break;
        }
        case constants.STATES.HOME: {
          message =
            helpers.getMessage(handlerInput, 'HOME_HELP') +
            ' ' +
            helpers.getMessage(handlerInput, 'HOME_ZIP_CODE');
          break;
        }
        case constants.STATES.LIST_SCHOOLS: {
          message = helpers.getMessage(handlerInput, 'LIST_SCHOOLS_HELP');
          break;
        }
        case constants.STATES.FAVORITES: {
          message = helpers.getMessage(handlerInput, 'FAVORITES_HELP');
          break;
        }
        case constants.STATES.SEARCH_BY_LOCATION: {
          message = helpers.getMessage(handlerInput, 'LOCATION_HELP');
          break;
        }
        case constants.STATES.START: {
          if (!attributes[constants.PROFCOMPLETE]) {
            attributes[constants.STATE] = constants.STATES.PROFILE;
            message =
              helpers.getMessage(handlerInput, 'WELCOME_HELP') +
              ' ' +
              helpers.getMessage(handlerInput, 'WELCOME_MENU');
          } else {
            message =
              helpers.getMessage(handlerInput, 'WELCOME_HELP') +
              ' ' +
              attributes[constants.INTRO_MESSAGE];
          }
          break;
        }
        // At session end, the skill deletes the STATE variable so this case
        // handles when the HELP intent is triggered as a one-shot
        case undefined: {
          message =
            helpers.getMessage(handlerInput, 'WELCOME_HELP') +
            ' ' +
            helpers.getMessage(handlerInput, 'WELCOME_MENU');
          break;
        }
        default: {
          message =
            helpers.getMessage(handlerInput, 'WELCOME_HELP') +
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
    handle (handlerInput) {
      console.info('Cancel and Stop Handler');

      let attributes = handlerInput.attributesManager.getSessionAttributes();
      attributes = helpers.clearSessionAttributes(attributes);
      helpers.saveUser(handlerInput, attributes, 'persistent');

      return handlerInput.responseBuilder
        .speak(helpers.getMessage(handlerInput, 'GOODBYE'))
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
    handle (handlerInput) {
      console.info('Unhandled');
      let attributes = handlerInput.attributesManager.getSessionAttributes();

      if (attributes[constants.STATE] === constants.STATES.REFINE_SEARCH) {
        delete attributes[constants.STATE];

        helpers.saveUser(handlerInput, 'session');
      }

      const message = `${helpers.getMessage(handlerInput, 'ERROR_CANT')} ${helpers.getMessage(
        handlerInput,
        'WELCOME_MENU'
      )}`;

      return handlerInput.responseBuilder.speak(message).reprompt(message).getResponse();
    }
  },
  ResetProfileHandler: {
    canHandle (handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'ResetProfileIntent';
    },
    handle (handlerInput) {
      helpers.clearUser(handlerInput);
      return handlerInput.responseBuilder.speak("Your profile has been reset")
        .reprompt("Your profile has been reset. What would you like to do next?")
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
    handle (handlerInput, error) {
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
            message = helpers
              .getMessage(handlerInput, 'SCORE_NUMBER_ERROR')
              .replace('%%NUMBER%%', number)
              .replace('%%SCORE%%', attributes[constants.SCORE])
              .replace('%%RANGELOW%%', rangeLow)
              .replace('%%RANGEHIGH%%', rangeHigh);

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
          message = helpers.getMessage(handlerInput, 'ERROR_NOT_UNDERSTOOD');
        }
      }

      return handlerInput.responseBuilder
        .speak(helpers.getMessage(handlerInput, message))
        .reprompt(helpers.getMessage(handlerInput, message))
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
