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

Description: Handlers for adding and updating items in the user's
profile. Profile variables make the full search easier by storing
variables used to filter the search results rather than soliciting
these variables on each search.

Current profile items - test scores (ACT/SAT), max cost for
tuition/fees a year, degree type (bachelor's/associate's/all),
major, home zip code.
*********************************************************************/
const constants = require('./constants');
const helpers = require('./helpers');

const Jargon = require('@jargon/alexa-skill-sdk');
const ri = Jargon.ri;

/**
 * Sends error message to user for invalid numeric inputs.
 *
 * @param {Object} handlerInput
 * @param {Object} attributes
 * @param {Number} number
 */
async function numberError (handlerInput, attributes, number) {
  if (attributes[constants.STATE] === constants.STATES.SCORES) {
    let rangeLow, rangeHigh;
    if (attributes[constants.SCORES] === constants.SAT) {
      rangeLow = 400;
      rangeHigh = 1600;
    } else {
      rangeLow = 1;
      rangeHigh = 36;
    }
    let scoreNumberError = await handlerInput.jrm.render(ri("SCORE_NUMBER_ERROR", {"score": attributes[constants.SCORES], "rangelow": rangeLow, "rangehigh": rangeHigh}));
    attributes[constants.INTRO_MESSAGE] = scoreNumberError
  } else if (attributes[constants.STATE] === constants.STATES.COST) {
    let costNumberError = await handlerInput.jrm.render(ri("COST_NUMBER_ERROR", {"number": number}));
    attributes[constants.INTRO_MESSAGE] = costNumberError
  } else {
      let homeZipError = await handlerInput.jrm.render(ri("HOME_ZIP_CODE_ERROR", {"zipcode": number}));
      attributes[constants.INTRO_MESSAGE] = homeZipError
  }

  return handlerInput.responseBuilder
    .speak(attributes[constants.INTRO_MESSAGE])
    .reprompt(attributes[constants.INTRO_MESSAGE])
    .getResponse();
}

/**
 * Verifies all profile variables are populated. If a variable is missing then it starts the flow to solicit
 * a value. If all variables are present, routes to the start of the long search (fullSearchHandlers).
 *
 * @param {Object} handlerInput
 * @param {Object} attributes
 */
async function moveOn (handlerInput, attributes) {
  let message;
  attributes[constants.PREVIOUS_STATE] = attributes['STATE'];

  // First check that all the profile fields have values: Scores, Cost, Degree, Major, and Home
  if (
    (attributes[constants.SAT] === undefined || attributes[constants.SAT] == null) &&
    (attributes[constants.ACT] === undefined || attributes[constants.ACT] == null)
  ) {
    attributes[constants.STATE] = constants.STATES.SCORES;
    let introScores = await handlerInput.jrm.render(ri("INTRODUCTION_SCORES"))
    message = helpers.getPromptMessage(
      attributes,
      introScores
    );
  } else if (attributes[constants.COST] === undefined || attributes[constants.COST] === null) {
    let introCost = await handlerInput.jrm.render(ri("INTRODUCTION_COST"))
    attributes[constants.STATE] = constants.STATES.COST;
    message = helpers.getPromptMessage(
      attributes,
      introCost
    );
  } else if (attributes[constants.DEGREE] === undefined || attributes[constants.DEGREE] === null) {
    let introDegree = await handlerInput.jrm.render(ri("INTRODUCTION_DEGREE"));
    attributes[constants.STATE] = constants.STATES.DEGREE;
    message = helpers.getPromptMessage(
      attributes,
      introDegree
    );
  } else if (
    attributes[constants.MAJOR_CATEGORY] === undefined ||
    attributes[constants.MAJOR_CATEGORY] === null
  ) {
    attributes[constants.STATE] = constants.STATES.MAJOR;
    let profileMajor = await handlerInput.jrm.render(ri("PROFILE_MAJOR"));
    message = helpers.getPromptMessage(
      attributes,
      profileMajor
    );
  } else if (attributes[constants.HOME] === undefined || attributes[constants.HOME] === null) {
    attributes[constants.STATE] = constants.STATES.HOME;
    let introHome = await handlerInput.jrm.render(ri("INTRODUCTION_HOME"));
    message = helpers.getPromptMessage(
      attributes,
      introHome
    );
  } else {
    attributes[constants.STATE] = constants.STATES.START;
    attributes[constants.PROFCOMPLETE] = true;
    let profComplete = await handlerInput.jrm.render(ri("PROFILE_COMPLETE"));
    let welcomeMenu = await handlerInput.jrm.render(ri("WELCOME_MENU"));
    message = helpers.getPromptMessage(
      attributes,
      profComplete +
        ' ' +
      welcomeMenu
    );
  }

  // Save to both the session attributes for this session and persist to DynamoDB in case of session loss
  helpers.saveUser(handlerInput, attributes, 'session');
  helpers.saveUser(handlerInput, attributes, 'persistent');

  return handlerInput.responseBuilder.speak(message).reprompt(message).getResponse();
}

function allNull (attributes) {
  return (
    (attributes[constants.SAT] === undefined || attributes[constants.SAT] == null) &&
    (attributes[constants.ACT] === undefined || attributes[constants.ACT] == null) &&
    (attributes[constants.COST] === undefined || attributes[constants.COST] === null) &&
    (attributes[constants.DEGREE] === undefined || attributes[constants.DEGREE] === null) &&
    (attributes[constants.MAJOR_CATEGORY] === undefined ||
      attributes[constants.MAJOR_CATEGORY] === null) &&
    (attributes[constants.HOME] === undefined || attributes[constants.HOME] === null)
  );
}

module.exports = {
  /**
   * Handles a "yes" response to the LaunchRequest welcome message asking the user
   * if they want to finish their profile.
   */
  ProfileYesHandler: {
    canHandle (handlerInput) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      return (
        attributes[constants.STATE] === constants.STATES.PROFILE &&
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent'
      );
    },
    handle (handlerInput) {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, YesIntent`);

      attributes[constants.INTRO_MESSAGE] = '';

      return moveOn(handlerInput, attributes);
    }
  },
  /**
   * Handles a "yes" response to asking if the user wants to enter a major or
   * their home zip code.
   */
  ProfileItemYesHandler: {
    canHandle (handlerInput) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      return (
        (attributes[constants.STATE] === constants.STATES.MAJOR ||
          attributes[constants.STATE] === constants.STATES.HOME) &&
        (handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
          handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent')
      );
    },
    handle: async (handlerInput) => {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, YesIntent`);

      if (attributes[constants.STATE] === constants.STATES.MAJOR) {
        let constantMajor = await handlerInput.jrm.render(ri(constants.MAJOR));
        attributes[constants.INTRO_MESSAGE] = constantMajor;
      } else if (attributes[constants.STATE] === constants.STATES.HOME) {
        let homeZipCode = await handlerInput.jrm.render(ri("HOME_ZIP_CODE"));
        attributes[constants.INTRO_MESSAGE] = homeZipCode;
      }

      return handlerInput.responseBuilder
        .speak(attributes[constants.INTRO_MESSAGE])
        .reprompt(attributes[constants.INTRO_MESSAGE])
        .getResponse();
    }
  },
  /**
   * List off the profile items for a user when invoking the ListProfileIntent.
   * Null items are default to the speech for no preference.
   */
  ProfileReviewHandler: {
    canHandle (handlerInput) {
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'ListProfileIntent'
      );
    },
    handle: async (handlerInput) => {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, ListProfileIntent`);

      attributes[constants.STATE] = constants.STATES.PROFILE;

      // Check if their profile exists first. Prompt to fill out profile.
      if (allNull(attributes)) {
        let welcomeBackNoProfile = await handlerInput.jrm.render(ri("WELCOME_BACK_NO_PROFILE"));
        return helpers.simpleDisplayResponse(
          handlerInput,
          attributes,
          welcomeBackNoProfile
        );
      } else {
        let score;
        let summaryScoreNo = await handlerInput.jrm.render(ri("SUMMARY_SCORE_NO"));
        let summaryScore = await handlerInput.jrm.render(ri("SUMMARY_SCORE_NO", {"score": constants.SAT, "number": attributes[constants.SAT]}));
        if (attributes[constants.SAT]) {
          score = helpers.noContent(attributes[constants.SAT])
            ? summaryScoreNo
            : summaryScore
          } else if (attributes[constants.ACT]) {
          score = helpers.noContent(attributes[constants.ACT])
            ? summaryScoreNo
            : summaryScore
          } else {
          score = summaryScoreNo;
          }
        
        let summaryCostNo = await handlerInput.jrm.render(ri("SUMMARY_COST_NO"));
        let summaryCost = await handlerInput.jrm.render(ri("SUMMARY_COST", {"currency": attributes[constants.COST]}));
        const cost = helpers.noContent(attributes[constants.COST])
          ? summaryCostNo
          : summaryCost;
        let summaryDegreeNo = await handlerInput.jrm.render(ri("SUMMARY_DEGREE_NO"));
        let summaryDegree = await handlerInput.jrm.render(ri("SUMMARY_DEGREE", {"degree": attributes[constants.DEGREE]}));
        const degree = helpers.noContent(attributes[constants.DEGREE])
          ? summaryDegreeNo
          : summaryDegree;
        let summaryMajorNo = await handlerInput.jrm.render(ri("SUMMARY_MAJOR_NO"));
        let summaryMajor = await handlerInput.jrm.render(ri("SUMMARY_MAJOR", {"major": attributes[constants.MAJOR_CATEGORY]}));
        const major = helpers.noContent(attributes[constants.MAJOR_CATEGORY])
          ? summaryMajorNo
          : summaryMajor;
        let summaryHomeNo = await handlerInput.jrm.render(ri("SUMMARY_HOME_NO"));
        let summaryHome = await handlerInput.jrm.render(ri("SUMMARY_HOME", {"zipcode": attributes[constants.HOME]}));
        const home = helpers.noContent(attributes[constants.HOME])
          ? summaryHomeNo
          : summaryHome;

        let summaryProfile = await handlerInput.jrm.render(ri("SUMMARY_PROFILE"));
        attributes[constants.INTRO_MESSAGE] =
          summaryProfile +
          score +
          cost +
          degree +
          major +
          home;
        let summaryPrompt = await handlerInput.jrm.render(ri("SUMMARY_PROMPT"));
        const message = helpers.getPromptMessage(
          attributes,
          summaryPrompt
        );

        return helpers.buildProfileTemplate(handlerInput, attributes, message);
      }
    }
  },
  /**
   * Handles the ChangeProfileIntent for updating variables in their profile. ChangeProfileIntent
   * is reached from the RefineSearchIntent or by a "change" utterance at any point in the skill.
   * The value of the PROFILE slot is used to determine which introduction message to respond to
   * start the flow for filling the variable.
   */
  ChangeProfileHandler: {
    canHandle (handlerInput) {
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'ChangeProfileIntent'
      );
    },
    handle: async (handlerInput) => {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, ChangeProfileIntent`);

      const intentObj = handlerInput.requestEnvelope.request.intent;

      if (
        !intentObj ||
        !intentObj.slots ||
        !intentObj.slots.PROFILE ||
        !intentObj.slots.PROFILE.value ||
        intentObj.slots.PROFILE.resolutions.resolutionsPerAuthority[0].status.code ===
          'ER_SUCCESS_NO_MATCH'
      ) {
        attributes[constants.STATE] = constants.STATES.PROFILE;
        helpers.saveUser(handlerInput, attributes, 'session');
        
        let profileUpdate = await handlerInput.jrm.render(ri("PROFILE_UPDATE"));
        return handlerInput.responseBuilder
          .speak(profileUpdate)
          .reprompt(profileUpdate)
          .getResponse();
      } else {
        const criteria = helpers.getSlotResolution(handlerInput, 'PROFILE');
        let message;

        switch (criteria) {
          case 'score': {
            if (attributes[constants.SAT]) {
              let scoreChangeSAT = await handlerInput.jrm.render(ri("SCORE_CHANGE",{"score": constants.SAT, "number": helpers.noPreferenceDialog(handlerInput, attributes, constants.SAT)}));
              attributes[constants.SCORES] === constants.SAT
                ? '<say-as interpret-as="date" format="y">' + number + '</say-as>'
                : number;
              attributes[constants.INTRO_MESSAGE] = 
                scoreChangeSAT
            } else if (attributes[constants.ACT]) {
              let scoreChangeACT = await handlerInput.jrm.render(ri("SCORE_CHANGE",{"score": constants.ACT, "number": helpers.noPreferenceDialog(handlerInput, attributes, constants.ACT)}));
              attributes[constants.INTRO_MESSAGE] = 
                scoreChangeACT;
            } else {
              attributes[constants.INTRO_MESSAGE] = '';
            }

            attributes[constants.STATE] = constants.STATES.SCORES;
            message = await handlerInput.jrm.render(ri("INTRODUCTION_SCORES_SHORT"));
            break;
          }
          case 'cost': {
            if (
              attributes[constants.COST] &&
              attributes[constants.COST] !== constants.NO_PREFERENCE
            ) {
              let costChange = await handlerInput.jrm.render(ri("COST_CHANGE", {"currency": attributes[constants.COST]}));
              attributes[constants.INTRO_MESSAGE] = 
                costChange;
            } else {
              attributes[constants.INTRO_MESSAGE] = '';
            }

            attributes[constants.STATE] = constants.STATES.COST;
            message = await handlerInput.jrm.render(ri("INTRODUCTION_COST"));
            break;
          }
          case 'degree': {
            if (attributes[constants.DEGREE]) {
              let degreeChange = await handlerInput.jrm.render(ri("DEGREE_CHANGE", {"degree": helpers.noPreferenceDialog(handlerInput, attributes, constants.DEGREE)}));
              attributes[constants.INTRO_MESSAGE] = 
                degreeChange;
            } else {
              attributes[constants.INTRO_MESSAGE] = '';
            }

            attributes[constants.STATE] = constants.STATES.DEGREE;
            message = await handlerInput.jrm.render(ri("INTRODUCTION_DEGREE"));
            break;
          }
          case 'major': {
            if (attributes[constants.MAJOR_CATEGORY]) {
              let majorChange = await handlerInput.jrm.render(ri("MAJOR_CHANGE", {"major": helpers.noPreferenceDialog(handlerInput, attributes, constants.MAJOR_CATEGORY)}));
              attributes[constants.INTRO_MESSAGE] = 
                majorChange;
            } else {
              attributes[constants.INTRO_MESSAGE] = '';
            }

            attributes[constants.STATE] = constants.STATES.MAJOR;
            message = await handlerInput.jrm.render(ri(constants.MAJOR));
            break;
          }
          case 'home': {
            if (attributes[constants.HOME]) {
              let homeChange = await handlerInput.jrm.render(ri("HOME_CHANGE", {"zipcode": helpers.noPreferenceDialog(handlerInput, attributes, constants.HOME)}));
              attributes[constants.INTRO_MESSAGE] = 
                homeChange;
            } else {
              attributes[constants.INTRO_MESSAGE] = '';
            }

            attributes[constants.STATE] = constants.STATES.HOME;
            message = await handlerInput.jrm.render(ri("HOME_ZIP_CODE"));
            break;
          }
          default: {
            let profileNotFound = await handlerInput.jrm.render(ri("PROFILE_ITEM_NOT_FOUND"));
            attributes[constants.INTRO_MESSAGE] = 
              profileNotFound;
            message = '';
          }
        }

        helpers.saveUser(handlerInput, attributes, 'session');

        return handlerInput.responseBuilder
          .speak(helpers.getPromptMessage(attributes, message))
          .reprompt(helpers.getPromptMessage(attributes, message))
          .getResponse();
      }
    }
  },
  /**
   * Evaluates the slot value for TEST to determine if the user said SAT, ACT, or BOTH.
   * The handler then starts the flow for soliciting the score. If the user said BOTH
   * it will start with SAT and then ask for ACT.
   */
  ScoresHandler: {
    canHandle (handlerInput) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'TestScoresIntent' &&
        attributes[constants.STATE] === constants.STATES.SCORES
      );
    },
    handle: async (handlerInput) => {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, TestScoresIntent`);

      let selection;

      if (attributes[constants.SCORES]) {
        selection = attributes[constants.SCORES];
      } else if (helpers.getSlotResolution(handlerInput, constants.SCORES)) {
        selection = helpers.getSlotResolution(handlerInput, constants.SCORES);
      }

      console.info('SCORE Type: ', selection);
      let message;
      switch (selection) {
        case constants.SAT: {
          attributes[constants.SCORES] = constants.SAT;
          message = 'INTRODUCTION_SAT';
          break;
        }
        case constants.ACT: {
          attributes[constants.SCORES] = constants.ACT;
          message = 'INTRODUCTION_ACT';
          break;
        }
        case 'BOTH': {
          attributes[constants.SCORES] = 'BOTH';
          message = 'INTRODUCTION_SAT';
          break;
        }
        default: {
          message = 'SCORE_HELP';
        }
      }

      helpers.saveUser(handlerInput, attributes, 'session');

      let promptMsg = await handlerInput.jrm.render(ri(message));
      return handlerInput.responseBuilder
        .speak(promptMsg)
        .reprompt(promptMsg)
        .getResponse();
    }
  },
  /**
   * Evaluates the slot value for DEGREE to Bachelor's or Associate's. If neither is
   * provided then the skill will search for all degree types.
   */
  DegreeHandler: {
    canHandle (handlerInput) {
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'DegreeIntent'
      );
    },
    handle: async (handlerInput) => {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, DegreeIntent`);

      const selection = helpers.getSlotResolution(handlerInput, constants.DEGREE);

      switch (selection) {
        case "bachelor's": {
          attributes[constants.DEGREE] = constants.DEGREE_FOUR;
          break;
        }
        case "associate's": {
          attributes[constants.DEGREE] = constants.DEGREE_TWO;
          break;
        }
        default: {
          let degreeHelpMsg = await handlerInput.jrm.render(ri("DEGREE_HELP")); 
          let degreeIntroMsg = await handlerInput.jrm.render(ri("DEGREE_HELP")); 
          return handlerInput.responseBuilder
            .speak(degreeHelpMsg)
            .reprompt(degreeIntroMsg)
            .getResponse();
        }
      }

      helpers.saveUser(handlerInput, attributes, 'session');

      let degreeConfirm = await handlerInput.jrm.render(ri("DEGREE_CONFIRM", {"degree": selection})); 

      attributes[constants.INTRO_MESSAGE] = 
        degreeConfirm
      return moveOn(handlerInput, attributes);
    }
  },
  /**
   * Evaluates the slot value for MAJOR and then sets the value for the Major's ID for querying
   * the API and the synonym/value of the slot input for communicating the user's selection.
   */
  MajorHandler: {
    canHandle (handlerInput) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();

      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'SearchByMajorIntent' &&
        attributes[constants.STATE] === constants.STATES.MAJOR
      );
    },
    handle: async (handlerInput) => {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, MajorIntent`);

      const intentObj = handlerInput.requestEnvelope.request.intent;

      if (
        !intentObj ||
        !intentObj.slots ||
        !intentObj.slots[constants.MAJOR] ||
        !intentObj.slots[constants.MAJOR].value
      ) {
        helpers.saveUser(handlerInput, attributes, 'session');

        let promptMsg = await handlerInput.jrm.render(ri(constants.MAJOR)); 
        return handlerInput.responseBuilder
          .speak(promptMsg)
          .reprompt(promptMsg)
          .getResponse();
      }

      const userInput = handlerInput.requestEnvelope.request.intent.slots[constants.MAJOR].value;

      // Save both the search friendly ID for school majors and the program that the major matches to
      attributes[constants.MAJOR_ID] = helpers.getSlotResolutionId(handlerInput, constants.MAJOR);
      attributes[constants.MAJOR_CATEGORY] = helpers.getSlotResolution(
        handlerInput,
        constants.MAJOR
      );
      
      let majorConfirmMsg = await handlerInput.jrm.render(ri(MAJOR_CONFIRM, {"major": userInput, field: attributes[constants.MAJOR_CATEGORY]})); 
      attributes[constants.INTRO_MESSAGE] = 
        majorConfirmMsg

      return moveOn(handlerInput, attributes);
    }
  },
  /**
   * Central handler for the AMAZON.NoIntent for profile STATES. Additional
   * logic for contextual responses in the scenario that the user says BOTH to the
   * score but then responds "no" to individual requests for SAT or ACT. If a user
   * response "no" then the profile item is set to NO_PREFERENCE or 0 and that
   * profile variable is not solicited again.
   */
  ProfileNoHandler: {
    canHandle (handlerInput) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      return (
        (attributes[constants.STATE] === constants.STATES.SCORES ||
          attributes[constants.STATE] === constants.STATES.COST ||
          attributes[constants.STATE] === constants.STATES.DEGREE ||
          attributes[constants.STATE] === constants.STATES.MAJOR ||
          attributes[constants.STATE] === constants.STATES.HOME) &&
        (handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
          (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent' ||
            handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NextIntent'))
      );
    },
    handle: async (handlerInput) => {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, AMAZON.NoIntent`);

      switch (attributes[constants.STATE]) {
        case constants.STATES.SCORES: {
          if (attributes[constants.SCORES]) {
            if (attributes[constants.SCORES] === 'BOTH') {
              attributes[constants.SAT] = constants.NO_PREFERENCE;
              attributes[constants.SCORES] = constants.ACT;
              
              let introductionAct = await handlerInput.jrm.render(ri("INTRODUCTION_ACT")); 
              return handlerInput.responseBuilder
                .speak(introductionAct)
                .reprompt(introductionAct)
                .getResponse();
            } else if (attributes[constants.SCORES] === constants.SAT) {
              let noSatScore = await handlerInput.jrm.render(ri("NO_SAT_SCORE")); 
              attributes[constants.INTRO_MESSAGE] = 
              noSatScore
            } else if (attributes[constants.SCORES] === constants.ACT) {
              let noActScore = await handlerInput.jrm.render(ri("NO_ACT_SCORE")); 
              attributes[constants.INTRO_MESSAGE] = 
                noActScore
            } else {
              let noScore = await handlerInput.jrm.render(ri("NO_SCORE")); 
              attributes[constants.INTRO_MESSAGE] = 
              noScore
            }
          }
          attributes[constants.ACT] = attributes[constants.SAT] = constants.NO_PREFERENCE;
          break;
        }
        case constants.STATES.COST: {
          attributes[constants.COST] = constants.NO_PREFERENCE;
          let introNoPreference = await handlerInput.jrm.render(ri("INTRODUCTION_NO_PREFERENCE")); 
          attributes[constants.INTRO_MESSAGE] = 
            introNoPreference
          break;
        }
        case constants.STATES.DEGREE: {
          attributes[constants.DEGREE] = constants.NO_PREFERENCE;
          let introNoPreference = await handlerInput.jrm.render(ri("INTRODUCTION_NO_PREFERENCE")); 
          attributes[constants.INTRO_MESSAGE] = 
            introNoPreference
          break;
        }
        case constants.STATES.MAJOR: {
          attributes[constants.MAJOR_CATEGORY] = constants.NO_PREFERENCE;
          let majorNone = await handlerInput.jrm.render(ri("MAJOR_NONE")); 
          attributes[constants.INTRO_MESSAGE] = majorNone
          break;
        }
        case constants.STATES.HOME: {
          attributes[constants.HOME] = constants.NO_PREFERENCE;
          let homeNone = await handlerInput.jrm.render(ri("HOME_NONE")); 
          attributes[constants.INTRO_MESSAGE] = 
          homeNone
          break;
        }
      }

      return moveOn(handlerInput, attributes);
    }
  },
  /**
   * Central handler for evaluating numeric responses for profile STATES. The handler checks
   * for valid SAT scores, ACT scores, cost in currency, and a five digit home zip code.
   */
  ProfileNumberHandler: {
    canHandle (handlerInput) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'NumberIntent' &&
        ((attributes[constants.STATE] === constants.STATES.SCORES &&
          attributes[constants.SCORES]) ||
          attributes[constants.STATE] === constants.STATES.COST ||
          attributes[constants.STATE] === constants.STATES.HOME)
      );
    },
    handle: async (handlerInput) => {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, NumberIntent`);

      const intentObj = handlerInput.requestEnvelope.request.intent;
      const number = parseInt(intentObj.slots.NUMBER.value);

      if (attributes[constants.STATE] === constants.STATES.SCORES) {
        // SAT Score range: 400 - 1600
        // ACT Score range: 1 - 36
        if (attributes[constants.SCORES] === constants.SAT) {
          let validSATScore = !Number.isNaN(number) && (number >= 400 && number <= 1600);

          if (!validSATScore) {
            return numberError(handlerInput, attributes, number);
          }

          attributes[constants.SAT] = number;
        } else if (attributes[constants.SCORES] === constants.ACT) {
          let validACTScore = !Number.isNaN(number) && (number >= 1 && number <= 36);

          if (!validACTScore) {
            return numberError(handlerInput, attributes, number);
          }

          attributes[constants.ACT] = number;
        } else {
          let validSATScore = !Number.isNaN(number) && (number >= 400 && number <= 1600);

          if (!validSATScore) {
            return numberError(handlerInput, attributes, number);
          }

          attributes[constants.SAT] = number;
          attributes[constants.SCORES] = constants.ACT;

          let introAct = await handlerInput.jrm.render(ri("INTRODUCTION_ACT"));
          return handlerInput.responseBuilder
            .speak(introAct)
            .reprompt(introAct)
            .getResponse();
        }

        const ssml =
          attributes[constants.SCORES] === constants.SAT
            ? '<say-as interpret-as="date" format="y">' + number + '</say-as>'
            : number;

        let scoreConfirm = await handlerInput.jrm.render(ri("SCORE_CONFIRM", {"score": attributes[constants.SCORES], "number": ssml}));
        attributes[constants.INTRO_MESSAGE] = 
          scoreConfirm
        delete attributes[constants.SCORES];
      } else if (attributes[constants.STATE] === constants.STATES.COST) {
        let validCost = !isNaN(number) && number >= 0;

        if (!validCost) {
          numberError(handlerInput, attributes, number);
        }

        attributes[constants.COST] = number;
        let costConfirm = await handlerInput.jrm.render(ri("COST_CONFIRM", {"currency": number}));
        attributes[constants.INTRO_MESSAGE] = 
          costConfirm;
      } else if (attributes[constants.STATE] === constants.STATES.HOME) {
        let validZipCode = !Number.isNaN(number) && number.length === 5;
        if (!validZipCode) {
          numberError(handlerInput, attributes, number);
        }

        let homeZipConfirm = await handlerInput.jrm.render(ri("HOME_ZIP_CODE_CONFIRM", {"zipcode": number}));
        attributes[constants.INTRO_MESSAGE] = 
          homeZipConfirm
        attributes[constants.HOME] = number;
        console.info('Setting zip code to: ' + number);
      }

      return moveOn(handlerInput, attributes);
    }
  }
};
