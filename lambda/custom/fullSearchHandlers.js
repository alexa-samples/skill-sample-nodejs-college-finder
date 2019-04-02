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

Description: Handlers for doing a full search through dialog
management and refining the search by changing a search variable.

Current search variables - type (public/private), size, location
(state/region or include home zip), distance from home zip (conditional),
major (use profile or enter one), include cost from profile (boolean),
include profile degree (boolean), include profile sat/act score (boolean)
*********************************************************************/
const constants = require('./constants');
const helpers = require('./helpers');
const config = require('./config');

/**
 * Helper function for setting the remaining location parameters that were not
 * chosen by the user to be skipped in search.
 *
 * @param {Object} intentObj
 * @param {String} type
 */
function zeroOutLocation (intentObj, type) {
  console.info('Zeroing out location for location type of: ', type);
  switch (type.toString().toUpperCase()) {
    case constants.LOCATION_STATE: {
      intentObj.slots[constants.LOCATION].value = type;
      intentObj.slots[constants.LOCATION_REGION].value = constants.NO_PREFERENCE;
      intentObj.slots[constants.HOME].value = constants.NO_PREFERENCE;
      intentObj.slots[constants.DISTANCE].value = constants.NO_PREFERENCE;
      intentObj.slots[constants.LOCATION_REGION].confirmationStatus = constants.CONFIRMED;
      intentObj.slots[constants.HOME].confirmationStatus = constants.CONFIRMED;
      intentObj.slots[constants.DISTANCE].confirmationStatus = constants.CONFIRMED;
      break;
    }
    case constants.LOCATION_REGION: {
      intentObj.slots[constants.LOCATION].value = type;
      intentObj.slots[constants.LOCATION_STATE].value = constants.NO_PREFERENCE;
      intentObj.slots[constants.HOME].value = constants.NO_PREFERENCE;
      intentObj.slots[constants.DISTANCE].value = constants.NO_PREFERENCE;
      intentObj.slots[constants.LOCATION_STATE].confirmationStatus = constants.CONFIRMED;
      intentObj.slots[constants.HOME].confirmationStatus = constants.CONFIRMED;
      intentObj.slots[constants.DISTANCE].confirmationStatus = constants.CONFIRMED;
      break;
    }
    case constants.HOME || 'ZIP CODE': {
      intentObj.slots[constants.LOCATION].value = type;
      intentObj.slots[constants.LOCATION_STATE].value = constants.NO_PREFERENCE;
      intentObj.slots[constants.LOCATION_REGION].value = constants.NO_PREFERENCE;
      intentObj.slots[constants.LOCATION_STATE].confirmationStatus = constants.CONFIRMED;
      intentObj.slots[constants.LOCATION_REGION].confirmationStatus = constants.CONFIRMED;
      break;
    }
    default: {
      intentObj.slots[constants.LOCATION].value = constants.NO_PREFERENCE;
      intentObj.slots[constants.LOCATION_STATE].value = constants.NO_PREFERENCE;
      intentObj.slots[constants.HOME].value = constants.NO_PREFERENCE;
      intentObj.slots[constants.DISTANCE].value = constants.NO_PREFERENCE;
      intentObj.slots[constants.LOCATION_STATE].confirmationStatus = constants.CONFIRMED;
      intentObj.slots[constants.HOME].confirmationStatus = constants.CONFIRMED;
      intentObj.slots[constants.DISTANCE].confirmationStatus = constants.CONFIRMED;
      intentObj.slots[constants.LOCATION_REGION].value = constants.NO_PREFERENCE;
      intentObj.slots[constants.LOCATION_REGION].confirmationStatus = constants.CONFIRMED;
    }
  }

  // All location based slots should now be confirmed and skipped
  intentObj.slots[constants.LOCATION].confirmationStatus = constants.CONFIRMED;

  return intentObj;
}

/**
 * Helper function for calling Alexa to manually confirm a slot value and saving
 * dialog state to the attributes.
 *
 * @param {Object} handlerInput
 * @param {Object} attributes
 * @param {String} prompt
 * @param {String} slot
 */
function confirmSlotManual (handlerInput, attributes, prompt, slot) {
  attributes[constants.CURRENT_SLOT] = slot;
  attributes[constants.SEARCH_INTENT] = handlerInput.requestEnvelope.request.intent;
  attributes[constants.STATE] = constants.STATES.REFINE_SEARCH;

  helpers.saveUser(handlerInput, attributes, 'session');

  return handlerInput.responseBuilder
    .speak(prompt)
    .reprompt(prompt)
    .addConfirmSlotDirective(slot, attributes[constants.SEARCH_INTENT])
    .getResponse();
}

/**
 * Helper function for calling Alexa to manually elicity a slot value and saving
 * dialog state to the attributes.
 *
 * @param {Object} handlerInput
 * @param {Object} attributes
 * @param {String} prompt
 * @param {String} slot
 */
function nextSlotManual (handlerInput, attributes, prompt, slot) {
  attributes[constants.CURRENT_SLOT] = slot;
  attributes[constants.SEARCH] = handlerInput.requestEnvelope.request.intent;
  attributes[constants.STATE] = constants.STATES.REFINE_SEARCH;

  helpers.saveUser(handlerInput, attributes, 'session');

  return handlerInput.responseBuilder
    .speak(prompt)
    .reprompt(prompt)
    .addElicitSlotDirective(slot, attributes[constants.SEARCH])
    .getResponse();
}

/**
 * Helper function for calling Alexa to take over soliciting slot
 * values for the dialog and confirming based on developer console
 * configuration.
 *
 * @param {Object} handlerInput
 * @param {Object} attributes
 * @param {String} intent
 */
function nextSlotDelegate (handlerInput, attributes, intent) {
  attributes[constants.SEARCH_INTENT] = intent;
  attributes[constants.STATE] = constants.STATES.REFINE_SEARCH;
  handlerInput.requestEnvelope.request.intent = intent;

  helpers.saveUser(handlerInput, attributes, 'session');

  return handlerInput.responseBuilder.addDelegateDirective(intent).getResponse();
}

/**
 * Helper to build the URL with fields for calling the College Scorecard API.
 * Any no preference values set by the user are translated to skipped fields for
 * search.
 *
 * @param {Object} attributes
 */
function getSearchData (attributes) {
  let url = config.API_URI;
  const intentObj = attributes[constants.SEARCH_INTENT].slots;

  // Location can be zip code, state, or region
  if (intentObj[constants.LOCATION].value.toUpperCase() === constants.HOME) {
    url += `&_zip=${intentObj[constants.HOME].value}&_distance=${
      intentObj[constants.DISTANCE].value
    }`;
  } else if (intentObj[constants.LOCATION].value.toUpperCase() === constants.LOCATION_STATE) {
    url += `&school.state=${helpers.abbrState(intentObj[constants.LOCATION_STATE].value)}`;
  } else if (intentObj[constants.LOCATION].value.toUpperCase() === constants.LOCATION_REGION) {
    const regionID = intentObj[constants.LOCATION_REGION].resolutions
      ? intentObj[constants.LOCATION_REGION].resolutions.resolutionsPerAuthority[0].values[0].value
          .id
      : attributes[constants.REGION_ID];
    url += `&school.region_id=${regionID}`;
  }

  // School ownership is private (2-4) or public (1)
  if (intentObj[constants.TYPE].value.toUpperCase() === constants.SCHOOL_TYPE_PRIVATE) {
    url += '&school.ownership__range=2..4';
  } else if (intentObj[constants.TYPE].value.toUpperCase() === constants.SCHOOL_TYPE_PUBLIC) {
    url += '&school.ownership=1';
  }

  // School carnegie size is small (1,2,5,7,8,9,10,11), medium (3,12,13,14), or large (4,5,15,16,17)
  if (intentObj[constants.SIZE].value.toUpperCase() === constants.SCHOOL_SIZE_SMALL) {
    url += '&school.carnegie_size_setting=1,2,6,7,8,9,10,11';
  } else if (intentObj[constants.SIZE].value.toUpperCase() === constants.SCHOOL_SIZE_MEDIUM) {
    url += '&school.carnegie_size_setting=3,12,13,14';
  } else if (intentObj[constants.SIZE].value.toUpperCase() === constants.SCHOOL_SIZE_LARGE) {
    url += '&school.carnegie_size_setting=4,5,15,16,17';
  }

  // School degrees awarded is associates (2), bachelors (3-5), or all
  if (intentObj[constants.DEGREE].value) {
    if (intentObj[constants.DEGREE].value.toUpperCase() === constants.DEGREE_FOUR) {
      url += '&school.degrees_awarded.highest=3';
    } else if (intentObj[constants.DEGREE].value.toUpperCase() === constants.DEGREE_TWO) {
      url += '&school.degrees_awarded.highest=2';
    } else {
      url += '&school.degrees_awarded.highest__range=2..5';
    }
  }

  // Cost tution in state is a range value from 0 to the max tuition/fees the user entered
  if (parseFloat(intentObj[constants.COST].value) > 0) {
    url += '&latest.cost.tuition.in_state__range=0..' + intentObj[constants.COST].value;
  } else {
    url += constants.LIMITCOST;
  }

  // SAT or ACT scores are a range value
  if (intentObj[constants.SCORES].value === constants.SAT) {
    url += `&latest.admissions.sat_scores.average.overall__range=400..${parseFloat(
      attributes[constants.SAT]
    )}`;
  } else if (intentObj[constants.SCORES].value === constants.ACT) {
    url += `&latest.admissions.act_scores.25th_percentile.cumulative__range=1..
      ${parseFloat(attributes[constants.ACT])}`;
  }

  // Major is set using major ID
  if (
    intentObj[constants.MAJOR].value !== constants.NO_PREFERENCE &&
    attributes[constants.SCHOOL_MAJOR_ID]
  ) {
    url += `&latest.academics.program_percentage.${
      attributes[constants.SCHOOL_MAJOR_ID]
    }__range=0.1..1.0`;
  }

  // set our return variables
  url += constants.FIELDS;

  console.info('URL for API: ' + url);

  return url;
}

module.exports = {
  /**
   * Handles utterances for the RefineSearchIntent by concatenating a summary of all
   * of the values that are set for search criteria and prompting if they want to change
   * one of these values.
   */
  FillSearchHandler: {
    canHandle (handlerInput) {
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'RefineSearchIntent' &&
        handlerInput.requestEnvelope.request.dialogState !== 'COMPLETED'
      );
    },
    handle (handlerInput) {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, RefineSearchIntent`);

      const intentRequest = handlerInput.requestEnvelope.request;
      let intentObj;
      let prompt;

      // The user gave a no response during dialog management so lets get them started again
      if (attributes[constants.STATE] === constants.STATES.REFINE_NO) {
        intentObj = attributes[constants.SEARCH_INTENT];

        if (!attributes[constants.CURRENT_SLOT]) {
          attributes[constants.CURRENT_SLOT] = constants.LOCATION;
        }

        if (attributes[constants.CURRENT_SLOT] === constants.LOCATION) {
          intentObj = zeroOutLocation(intentObj, 0);
          attributes[constants.CURRENT_SLOT] = constants.MAJOR;
        } else {
          intentObj.slots[attributes[constants.CURRENT_SLOT]].value = constants.NO_PREFERENCE;
          intentObj.slots[attributes[constants.CURRENT_SLOT]].confirmationStatus =
            constants.CONFIRMED;
        }

        return nextSlotDelegate(handlerInput, attributes, intentObj);
      } else {
        intentObj = intentRequest.intent;
      }

      attributes[constants.STATE] = constants.STATES.REFINE_SEARCH;

      if (
        attributes[constants.COST] &&
        attributes[constants.COST] !== '0' &&
        attributes[constants.COST] !== 0
      ) {
        intentObj.slots[constants.COST].value = attributes[constants.COST];
      } else {
        intentObj.slots[constants.COST].value = constants.NO_PREFERENCE;
        intentObj.slots[constants.COST].confirmationStatus = constants.CONFIRMED;
      }

      if (attributes[constants.DEGREE]) {
        intentObj.slots[constants.DEGREE].value = attributes[constants.DEGREE];
      } else {
        intentObj.slots[constants.DEGREE].value = constants.NO_PREFERENCE;
      }

      intentObj.slots[constants.DEGREE].confirmationStatus = constants.CONFIRMED;

      if (attributes[constants.HOME]) {
        intentObj.slots[constants.HOME].value = attributes[constants.HOME];
      }

      if (attributes[constants.SAT]) {
        intentObj.slots[constants.SCORES].value = constants.SAT;
      } else if (attributes[constants.ACT]) {
        intentObj.slots[constants.SCORES].value = constants.ACT;
      } else {
        intentObj.slots[constants.SCORES].value = constants.NO_PREFERENCE;
        intentObj.slots[constants.SCORES].confirmationStatus = constants.CONFIRMED;
      }

      // Start of slot filling should either solicit a major or a location
      if (
        handlerInput.requestEnvelope.request.dialogState === constants.STARTED &&
        attributes[constants.SEARCH]
      ) {
        attributes[constants.PREVIOUS_INTENT] = attributes[constants.SEARCH];

        // Check to see if this is already a search by location or major to prefill slots
        if (
          attributes[constants.SEARCH] === constants.STATES.SEARCH_BY_LOCATION &&
          (attributes[constants.LOCATION_REGION] || attributes[constants.LOCATION_STATE])
        ) {
          if (attributes[constants.LOCATION_REGION]) {
            intentObj = zeroOutLocation(intentObj, constants.LOCATION_REGION);
            intentObj.slots[constants.LOCATION_REGION].value =
              attributes[constants.LOCATION_REGION];
            intentObj.slots[constants.LOCATION_REGION].confirmationStatus = constants.CONFIRMED;
          } else if (attributes[constants.LOCATION_STATE]) {
            intentObj = zeroOutLocation(intentObj, constants.LOCATION_STATE);
            intentObj.slots[constants.LOCATION_STATE].value = attributes[constants.LOCATION_STATE];
            intentObj.slots[constants.LOCATION_STATE].confirmationStatus = constants.CONFIRMED;
          }
          delete attributes[constants.SEARCH];

          // If the user has a major set in their profile ask them if they want to include it
          if (attributes[constants.MAJOR_CATEGORY]) {
            intentObj.slots[constants.MAJOR].value = attributes[constants.MAJOR_CATEGORY];
            prompt = helpers
              .getMessage(handlerInput, 'INTRODUCTION_MAJOR_PROFILE')
              .replace('%%MAJOR%%', attributes[constants.MAJOR_CATEGORY]);

            handlerInput.requestEnvelope.request.intent = intentObj;

            return confirmSlotManual(handlerInput, attributes, prompt, constants.MAJOR);
          } else {
            attributes[constants.CURRENT_SLOT] = constants.MAJOR;

            return nextSlotDelegate(handlerInput, attributes, intentObj);
          }
        } else if (
          attributes[constants.SEARCH] === constants.STATES.SEARCH_BY_MAJOR &&
          attributes[constants.MAJOR]
        ) {
          intentObj.slots[constants.MAJOR].value = attributes[constants.MAJOR];
          intentObj.slots[constants.MAJOR].confirmationStatus = constants.CONFIRMED;

          delete attributes[constants.SEARCH];
          attributes[constants.CURRENT_SLOT] = constants.MAJOR;

          return nextSlotDelegate(handlerInput, attributes, intentObj);
        } else {
          attributes[constants.CURRENT_SLOT] = constants.LOCATION;

          return nextSlotDelegate(handlerInput, attributes, intentObj);
        }
      } else {
        console.info(
          `${attributes[constants.STATE]} ${handlerInput.requestEnvelope.request.dialogState}`
        );

        // Dialog is in progress so loop through the required slots until complete
        for (const slotName in intentObj.slots) {
          if (intentObj.slots.hasOwnProperty(slotName)) {
            const currentSlot = intentObj.slots[slotName];
            console.log('Current slot: ', JSON.stringify(currentSlot));

            if (currentSlot.confirmationStatus === constants.NONE) {
              const validValue = helpers.getSlotResolution(handlerInput, slotName);

              // First check that the value given matches a slot value
              if (validValue) {
                console.log('ER Result: ', validValue);
                intentObj.slots[slotName].confirmationStatus = constants.CONFIRMED;
                intentObj.slots[slotName].value = validValue;
                switch (slotName) {
                  case constants.LOCATION: {
                    // If the user selected zip code, check if there is a stored home zip code and confirm
                    if (
                      validValue.toUpperCase() === constants.HOME &&
                      intentObj.slots[constants.HOME].value
                    ) {
                      intentObj = zeroOutLocation(intentObj, validValue);
                      prompt = helpers.getMessage(handlerInput, 'INTRODUCTION_HOME_CONFIRM');
                      handlerInput.requestEnvelope.request.intent = intentObj;

                      return confirmSlotManual(handlerInput, attributes, prompt, slotName);
                    } else {
                      intentObj = zeroOutLocation(intentObj, validValue);
                    }
                    break;
                  }
                  case constants.MAJOR: {
                    attributes[constants.SCHOOL_MAJOR_ID] = helpers.getSlotResolutionId(
                      handlerInput,
                      slotName
                    );
                    break;
                  }
                  case constants.COST: {
                    prompt = helpers
                      .getMessage(handlerInput, 'INTRODUCTION_COST_CONFIRM')
                      .replace('%%COST%%', currentSlot.value);
                    handlerInput.requestEnvelope.request.intent = intentObj;
                    return confirmSlotManual(handlerInput, attributes, prompt, slotName);
                    break;
                  }
                  case constants.SCORES: {
                    prompt = helpers
                      .getMessage(handlerInput, 'INTRODUCTION_SCORE_CONFIRM')
                      .replace('%%SCORE%%', currentSlot.value);
                    handlerInput.requestEnvelope.request.intent = intentObj;
                    return confirmSlotManual(handlerInput, attributes, prompt, slotName);
                    break;
                  }
                }
                currentSlot.confirmationStatus = constants.CONFIRMED;
                return nextSlotDelegate(handlerInput, attributes, intentObj);
              } else if (currentSlot.value && validValue == false) {
                prompt =
                  helpers.getMessage(handlerInput, 'REFINE_SEARCH_NO_MATCH') +
                  helpers.getMessage(handlerInput, 'INTRODUCTION_' + slotName);
                return nextSlotManual(handlerInput, attributes, prompt, slotName);
              } else {
                return nextSlotDelegate(handlerInput, attributes, intentObj);
              }
            }
          }
        }
      }
    }
  },
  /**
   * Handler for the COMPLETE dialog state of the RefineSearchIntent intent. This handler
   * will perform the API lookup and return an updated short list of schools.
   */
  CompleteSearchHandler: {
    canHandle (handlerInput) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        (handlerInput.requestEnvelope.request.intent.name === 'RefineSearchIntent' ||
          attributes[constants.STATE] === constants.STATES.REFINE_SEARCH) &&
        handlerInput.requestEnvelope.request.dialogState === 'COMPLETED'
      );
    },
    handle (handlerInput) {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, Complete Search`);

      const intentRequest = handlerInput.requestEnvelope.request;
      let intentObj = intentRequest.intent;
      // Double check that all the slots have a value and set to 0 if none
      for (const slotName in intentObj.slots) {
        if (intentObj.slots.hasOwnProperty(slotName)) {
          if (!intentObj.slots[slotName].value) {
            intentObj.slots[slotName].value === constants.NO_PREFERENCE;
          }
        }
      }

      attributes[constants.SEARCH_INTENT] = intentObj;

      const url = getSearchData(attributes);
      console.info('URL for full query: ', url);

      return new Promise(resolve => {
        helpers.getSchools(url, (error, res) => {
          console.info('Search results: ', res);

          if (error) {
            let message = helpers.getPromptMessage(
              attributes,
              helpers.getMessage(handlerInput, 'REVIEW_ERROR')
            );
            resolve(
              handlerInput.responseBuilder
                .speak(message)
                .reprompt(message)
                .getResponse()
            );
          }

          if (!res || !res.results || res.results.length < 1) {
            resolve(
              helpers.simpleDisplayResponse(
                handlerInput,
                attributes,
                helpers.getMessage(handlerInput, 'REVIEW_NO_RESULTS')
              )
            );
          } else {
            const schools = res.results;
            attributes[constants.SEARCH_RESULTS_TOTAL] = res.metadata.total;
            let list = [];
            let number =
              schools.length < constants.RECORD_LIMIT ? res.metadata.total : constants.RECORD_LIMIT;

            // To keep the session object small, only the first 12 items in the array are saved
            for (var i = 0; i < number; i++) {
              list.push(schools[i]);
            }

            attributes[constants.SEARCH_RESULTS] = list;
            attributes[constants.INTRO_MESSAGE] = null;

            let message =
              schools.length > 1
                ? helpers
                    .getMessage(handlerInput, 'REVIEW_RESULTS')
                    .replace('%%COUNT%%', attributes[constants.SEARCH_RESULTS_TOTAL])
                    .replace('%%NUMBER%%', constants.RECORD_LIMIT)
                : helpers.getMessage(handlerInput, 'REVIEW_RESULTS_ONE');

            message = helpers.getPromptMessage(attributes, message);

            delete attributes[constants.STATE];
            attributes[constants.SEARCH] = attributes[constants.PREVIOUS_INTENT];
            helpers.saveUser(handlerInput, attributes, 'session');

            resolve(
              handlerInput.responseBuilder
                .speak(message)
                .reprompt(message)
                .getResponse()
            );
          }
        });
      });
    }
  }
};
