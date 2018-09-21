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

Description: Handlers for all of the one-shot search experiences.
SearchByLocation and SearchByMajor both extend to the RefineSearchIntent
if the user wants to narrow down the list of schools. SearchByName is
also triggered in the MORE_INFORMATION and LIST_SCHOOLS states
when a school is referred to by name.

Current one-shot experiences - SearchByName (fuzzy search by the API
on name), SearchByLocation (state and region), SearchByMajor
 *********************************************************************/
const constants = require('./constants');
const config = require('./config');
const helpers = require('./helpers');

function searchQueryExit (handlerInput, attributes) {
  console.info('Cancel and Stop Handler');

  attributes = helpers.clearSessionAttributes(attributes);
  helpers.saveUser(handlerInput, attributes, 'persistent');

  return handlerInput.responseBuilder.speak(helpers.getMessage(handlerInput, 'GOODBYE'));
}

module.exports = {
  /**
   * Handler for the CanFulfillIntentRequest feature with Alexa to faciliate nameless
   * invocation. If the skill has an intent/slot that matches the utterance of the user
   * it returns true for canFulfill for fulfilling the user's request.
   */
  CFIRBasicSearch: {
    canHandle (handlerInput) {
      console.log("type: " + handlerInput.requestEnvelope.request.type);
      if (handlerInput.requestEnvelope.request.intent) { 
        console.log("intent: " + handlerInput.requestEnvelope.request.intent.name);
      }
      return (
        handlerInput.requestEnvelope.request.type === 'CanFulfillIntentRequest' &&
        (handlerInput.requestEnvelope.request.intent.name === 'SearchByNameIntent' ||
          handlerInput.requestEnvelope.request.intent.name === 'SearchByLocationIntent' ||
          handlerInput.requestEnvelope.request.intent.name === 'SearchByMajorIntent')
      );
    },
    handle (handlerInput) {
      const intentName = handlerInput.requestEnvelope.request.intent.name;
      const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
      const slotValues = helpers.getSlotValues(filledSlots);
      let slot;

      if (
        intentName === 'SearchByNameIntent' &&
        slotValues['SCHOOL_NAME'] &&
        slotValues['SCHOOL_NAME'].isValidated
      ) {
        slot = 'SCHOOL_NAME';
      } else if (intentName === 'SearchByLocationIntent') {
        console.log("slots: " + JSON.stringify(slotValues));
        
        if (
          slotValues[constants.LOCATION_STATE] &&
          slotValues[constants.LOCATION_STATE].isValidated
        ) {
          slot = constants.LOCATION_STATE;
        } else if (
          slotValues[constants.LOCATION_REGION] &&
          slotValues[constants.LOCATION_REGION].isValidated
        ) {
          slot = constants.LOCATION_REGION;
        }
      } else if (
        intentName === 'SearchByMajorIntent' &&
        slotValues[constants.MAJOR] &&
        slotValues[constants.MAJOR].isValidated
      ) {
        slot = constants.MAJOR;
      } else {
        return handlerInput.responseBuilder
          .withCanFulfillIntent({
            canFulfill: 'YES',
            slots: {
              [slot]: {
                canUnderstand: 'YES',
                canFulfill: 'NO'
              }
            }
          })
          .getResponse();
      }

      return handlerInput.responseBuilder
        .withCanFulfillIntent({
          canFulfill: 'YES',
          slots: {
            [slot]: {
              canUnderstand: 'YES',
              canFulfill: 'YES'
            }
          }
        })
        .getResponse();
    }
  },
  /**
   * Starts the specific search (name, location, major) over and asks for a value to search on.
   */
  SearchByStartOver: {
    canHandle (handlerInput) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent' ||
          handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StartOverIntent') &&
        (attributes[constants.STATE] === constants.STATES.SEARCH_BY_LOCATION ||
          attributes[constants.STATE] === constants.STATES.SEARCH_BY_MAJOR ||
          attributes[constants.STATE] === constants.STATES.SEARCH_BY_NAME)
      );
    },
    handle (handlerInput) {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, SearchByStartOver`);

      let prompt;

      switch (attributes[constants.STATE]) {
        case constants.STATES.SEARCH_BY_NAME:
          prompt = 'SEARCH_BY_NAME_PROMPT';
          break;
        case constants.STATES.SEARCH_BY_LOCATION:
          prompt = 'SEARCH_BY_LOCATION_PROMPT';
          break;
        case constants.STATES.SEARCH_BY_MAJOR:
          prompt = 'SEARCH_BY_MAJOR_PROMPT';
          break;
      }

      return helpers.simpleDisplayResponse(
        handlerInput,
        attributes,
        helpers.getMessage(handlerInput, prompt)
      );
    }
  },
  /**
   * Handler for the one-shot utterances for the SearchByNameIntent and for when
   * a user asks for a school by name in the search flow. The handler first checks for
   * a populated SCHOOL_NAME slot, then checks if the school is in the SEARCH_RESULTS, and
   * if there are no SEARCH_RESULTS it uses the fuzzy search in the College Scorecard API
   * to find the closest matching school name.
   */
  SearchByNameHandler: {
    canHandle (handlerInput) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        (handlerInput.requestEnvelope.request.intent.name === 'SearchByNameIntent' &&
          attributes[constants.STATE] !== constants.STATES.REFINE_SEARCH)
      );
    },
    handle (handlerInput) {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, SearchByNameIntent`);

      const intentObj = handlerInput.requestEnvelope.request.intent;

      // If the SCHOOL_NAME slot is not present or populated then ask the user for supply a search string
      if (
        !intentObj ||
        !intentObj.slots ||
        ((!intentObj.slots.SCHOOL_NAME || !intentObj.slots.SCHOOL_NAME.value) &&
          (!intentObj.slots.SEARCHQUERY || !intentObj.slots.SEARCHQUERY.value))
      ) {
        attributes[constants.STATE] = constants.STATES.SEARCH_BY_NAME;

        return helpers.simpleDisplayResponse(
          handlerInput,
          attributes,
          helpers.getMessage(handlerInput, 'SEARCH_BY_NAME_PROMPT')
        );
      } else if (helpers.currentResult(handlerInput, attributes)) {
        // Check to see if there are search results and find the school in that list to avoid an extra API call
        let school;
        if (attributes[constants.STATE] === constants.STATES.FAVORITES) {
          school = attributes[constants.LIST[attributes[constants.LIST_ITEM]]];
        } else {
          school = attributes[constants.SEARCH_RESULTS[attributes[constants.LIST_ITEM]]];
        }

        return helpers.moreInfoResponse(handlerInput, attributes, school);
      } else {
        // No search results or no school found so use the College Scorecard API to do a fuzzy search with the SCHOOL_NAME slot value
        let name = intentObj.slots.SCHOOL_NAME.value
          ? intentObj.slots.SCHOOL_NAME.value
          : intentObj.slots.SEARCHQUERY.value;
        if (name === 'stop' || name === 'exit' || name === 'cancel') {
          return searchQueryExit(handlerInput, attributes);
        } else {
          attributes[constants.INTRO_MESSAGE] = helpers
            .getMessage(handlerInput, 'SEARCH_BY_NAME_SCHOOL_NAME')
            .replace('%%SCHOOL_NAME%%', name); // TODO progressive response
          console.info(`Searching for ${name}`);

          // Search paramaters - school ID, school name, school state, 2015 in-state tuition, 2015 out-of-state tuition
          let url =
            config.API_URI +
            '&school.name=' +
            name +
            constants.FIELDS +
            constants.SORTBYSIZE +
            constants.SEARCHPAGING;

          return new Promise(resolve => {
            helpers.getSchools(url, (error, res) => {
              if (error) {
                let message =
                  helpers.getPromptMessage(
                    attributes,
                    helpers
                      .getMessage(handlerInput, 'SEARCH_BY_NAME_SEARCH_ERROR')
                      .replace('%%SCHOOL_NAME%%', name)
                  ) +
                  ' ' +
                  helpers.getMessage(handlerInput, 'WELCOME_MENU');
                resolve(
                  handlerInput.responseBuilder
                    .speak(message)
                    .reprompt(message)
                    .getResponse()
                );
              }

              if (res === undefined || res.results.length < 1) {
                attributes[constants.STATE] = constants.STATES.SEARCH_BY_NAME;
                resolve(
                  helpers.simpleDisplayResponse(
                    handlerInput,
                    attributes,
                    helpers.getMessage(handlerInput, 'SEARCH_BY_NO_RESULTS')
                  )
                );
              } else {
                // Save the first result in the array to the user's session object
                let school = res.results[0];
                attributes[constants.CURRENT_SCHOOL] = school;
                attributes[constants.CURRENT_SCHOOL_ID] = school.id;
                attributes[constants.PREVIOUS_INTENT] = constants.STATES.SEARCH_BY_NAME;
                attributes[constants.STATE] = constants.STATES.MORE_INFORMATION;

                resolve(helpers.moreInfoResponse(handlerInput, attributes, school));
              }
            });
          });
        }
      }
    }
  },
  /**
   * Handler for the one-shot utterances for the SearchByLocationIntent. The handler stores
   * either a state or a region value and then returns the first 12 schools in the search
   * result for the given location. The user can then list the results or refine the search
   * further using fullSearchIntent dialog management in fullSearchHandlers.js.
   */
  SearchByLocationHandler: {
    canHandle (handlerInput) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'SearchByLocationIntent' &&
        attributes[constants.STATE] !== constants.STATES.REFINE_SEARCH
      );
    },
    handle (handlerInput) {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, SearchByLocationIntent`);

      const intentObj = handlerInput.requestEnvelope.request.intent;

      // Check that the STATE or REGION slots are filled. If not prompt for  location.
      if (
        !intentObj ||
        !intentObj.slots ||
        ((!intentObj.slots[constants.LOCATION_STATE] ||
          !intentObj.slots[constants.LOCATION_STATE].value) &&
          (!intentObj.slots[constants.LOCATION_REGION] ||
            !intentObj.slots[constants.LOCATION_REGION].value))
      ) {
        attributes[constants.STATE] = constants.STATES.SEARCH_BY_LOCATION;

        return helpers.simpleDisplayResponse(
          handlerInput,
          attributes,
          helpers.getMessage(handlerInput, 'SEARCH_BY_LOCATION_PROMPT')
        );
      } else {
        let search;
        let slotText;
        let id;
        delete attributes[constants.LOCATION_REGION];
        delete attributes[constants.LOCATION_STATE];

        // API requires the state abbreviation for search.
        if (intentObj.slots[constants.LOCATION_STATE].value) {
          slotText = helpers.getSlotResolution(handlerInput, constants.LOCATION_STATE);
          id = helpers.getSlotResolutionId(handlerInput, constants.LOCATION_STATE);
          attributes[constants.LOCATION_STATE] = slotText;
          search = `&school.state=${id}`;
        } else {
          // API requires a numeric value for region for search. Grab the slot ID.
          slotText = `the ${intentObj.slots[constants.LOCATION_REGION].value}`;
          attributes[constants.LOCATION_REGION] = intentObj.slots.REGION.value;
          attributes[constants.REGION_ID] = helpers.getSlotResolutionId(
            handlerInput,
            constants.LOCATION_REGION
          );
          search = `&school.region_id=${attributes[constants.REGION_ID]}`;
        }

        attributes[constants.INTRO_MESSAGE] = helpers
          .getMessage(handlerInput, 'SEARCH_BY_LOCATION')
          .replace('%%LOCATION%%', slotText); // TODO progressive response
        console.info(`Searching for ${search}`);

        // Search paramaters - school ID, school name, school state, 2015 in-state tuition, 2015 out-of-state tuition,
        // 2014 admissions rate, and 2015 undergraduate student body size.
        // Limited to only schools with recorded tuition values and sorted by the 2015 undergraduate student size.
        let url =
          config.API_URI +
          search +
          constants.LIMITCOST +
          constants.FIELDS +
          constants.SORTBYSIZE +
          constants.SEARCHPAGING;

        return new Promise(resolve => {
          helpers.getSchools(url, (error, res) => {
            if (error) {
              let message =
                helpers.getPromptMessage(
                  attributes,
                  helpers
                    .getMessage(handlerInput, 'SEARCH_BY_LOCATION_SEARCH_ERROR')
                    .replace('%%LOCATION%%', slotText)
                ) +
                ' ' +
                helpers.getMessage(handlerInput, 'WELCOME_MENU');
              resolve(
                helpers.simpleDisplayResponse(
                  handlerInput,
                  attributes,
                  helpers.getMessage(handlerInput, message)
                )
              );
            } else if (!res || !res.results || res.results.length < 1) {
              attributes[constants.STATE] = constants.STATES.SEARCH_BY_LOCATION;
              resolve(
                helpers.simpleDisplayResponse(
                  handlerInput,
                  attributes,
                  helpers.getMessage(handlerInput, 'SEARCH_BY_NO_RESULTS')
                )
              );
            } else {
              const schools = res.results;

              attributes[constants.SEARCH_RESULTS_TOTAL] = res.metadata.total;
              let list = [];

              // Changes the number for the list schools summary if less than the constants.RECORD_LIMIT
              let number = constants.RECORD_LIMIT;
              if (schools.length < constants.RECORD_LIMIT) {
                number = schools.length;
              }

              // To keep the session object small, only the first 12 items in the array are saved
              for (var i = 0; i < number; i++) {
                list.push(schools[i]);
              }

              attributes[constants.SEARCH_RESULTS] = list;
              attributes[constants.SEARCH] = constants.STATES.SEARCH_BY_LOCATION;
              attributes[constants.STATE] = constants.STATES.LIST_SCHOOLS;
              const message = helpers
                .getMessage(handlerInput, 'SEARCH_BY_LOCATION_REFINE')
                .replace('%%COUNT%%', attributes[constants.SEARCH_RESULTS_TOTAL])
                .replace('%%LOCATION%%', slotText);

              if (schools.length < 2) {
                attributes[constants.INTRO_MESSAGE] =
                  message + helpers.getMessage('SEARCH_FEW_RESULTS');
              } else {
                attributes[constants.INTRO_MESSAGE] =
                  message +
                  helpers.getMessage(handlerInput, 'SEARCH_MORE_ONE').replace('%%NUMBER%%', number);
              }

              resolve(
                helpers.simpleDisplayResponse(
                  handlerInput,
                  attributes,
                  attributes[constants.INTRO_MESSAGE]
                )
              );
            }
          });
        });
      }
    }
  },
  /**
   * Handler for the one-shot utterances for the SearchByMajorIntent. The handler stores
   * the API friendly ID for the major and the synonym value that closest matches the user input
   * for a more personalized response to the user. SCHOOL_MAJOR is a separate value from
   * PROFILE_MAJOR to allow users to search for majors outside what is set in their profile.
   */
  SearchByMajorHandler: {
    canHandle (handlerInput) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'SearchByMajorIntent' &&
        attributes[constants.STATE] !== constants.STATES.REFINE_SEARCH
      );
    },
    handle (handlerInput) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, SearchByMajorIntent`);

      let intentObj = handlerInput.requestEnvelope.request.intent;

      // If no value in the MAJOR slot prompt for a major to search for
      if (
        !intentObj ||
        !intentObj.slots ||
        !intentObj.slots[constants.MAJOR] ||
        !intentObj.slots[constants.MAJOR].value ||
        helpers.getSlotResolutionId(handlerInput, constants.MAJOR) === '0' ||
        helpers.getSlotResolutionId(handlerInput, constants.MAJOR) === 0
      ) {
        attributes[constants.SEARCH] = constants.STATES.SEARCH_BY_MAJOR;
        return helpers.simpleDisplayResponse(
          handlerInput,
          attributes,
          helpers.getMessage(handlerInput, 'SEARCH_BY_MAJOR_PROMPT')
        );
      } else {
        let major = helpers.getSlotResolution(handlerInput, constants.MAJOR);
        let id = helpers.getSlotResolutionId(handlerInput, constants.MAJOR);
        attributes[constants.SCHOOL_MAJOR_ID] = id; // Required for querying the API
        attributes[constants.MAJOR] = major; // User friendly value from entity resolution

        attributes[constants.INTRO_MESSAGE] = helpers
          .getMessage(handlerInput, 'SEARCH_BY_MAJOR')
          .replace('%%MAJOR%%', major); // TODO progressive response
        console.info(`Searching for ${major} with an ID of ${id}`);

        // Each major has it's own percentage variable for the amount of students attending for that major
        let variable = `2015.academics.program_percentage.${id}`;

        // Search paramaters - school ID, school name, school state, 2015 in-state tuition, 2015 out-of-state tuition, 2015 percentage of population attending
        // for the selected major. Limited to 10% or more for the major and sorted by the percentage descending.
        let url = `${config.API_URI}&${variable}__range=0.01..1.0${constants.LIMITCOST}${
          constants.FIELDS
        }&_sort=${variable}:desc${constants.SEARCHPAGING}`;

        return new Promise(resolve => {
          helpers.getSchools(url, (error, res) => {
            console.log(res);
            if (error) {
              let message =
                helpers.getPromptMessage(
                  attributes,
                  helpers
                    .getMessage(handlerInput, 'SEARCH_BY_MAJOR_SEARCH_ERROR')
                    .replace('%%MAJOR%%', major)
                ) +
                ' ' +
                helpers.getMessage(handlerInput, 'WELCOME_MENU');
              resolve(
                helpers.simpleDisplayResponse(
                  handlerInput,
                  attributes,
                  helpers.getMessage(handlerInput, message)
                )
              );
            } else if (!res || !res.results || res.results.length < 1) {
              attributes[constants.STATE] = constants.STATES.SEARCH_BY_MAJOR;
              resolve(
                helpers.simpleDisplayResponse(
                  handlerInput,
                  attributes,
                  helpers.getMessage(handlerInput, 'SEARCH_BY_NO_RESULTS')
                )
              );
            } else {
              const schools = res.results;

              attributes[constants.SEARCH_RESULTS_TOTAL] = res.metadata.total;
              let list = [];

              // Changes the number for the list schools summary if less than the constants.RECORD_LIMIT
              let number = constants.RECORD_LIMIT;
              if (schools.length < constants.RECORD_LIMIT) {
                number = res.metadata.total;
              }

              // To keep the session object small, only the first 12 items in the array are saved
              for (var i = 0; i < constants.RECORD_LIMIT; i++) {
                list.push(schools[i]);
              }

              attributes[constants.SEARCH_RESULTS] = list;
              attributes[constants.SEARCH] = constants.STATES.SEARCH_BY_MAJOR;
              attributes[constants.STATE] = constants.STATES.LIST_SCHOOLS;
              const message = helpers
                .getMessage(handlerInput, 'SEARCH_BY_MAJOR_REFINE')
                .replace('%%COUNT%%', attributes[constants.SEARCH_RESULTS_TOTAL])
                .replace('%%MAJOR%%', major);

              if (schools.length < 2) {
                attributes[constants.INTRO_MESSAGE] =
                  message + helpers.getMessage('SEARCH_FEW_RESULTS');
              } else {
                attributes[constants.INTRO_MESSAGE] =
                  message +
                  helpers.getMessage(handlerInput, 'SEARCH_MORE_ONE').replace('%%NUMBER%%', number);
              }

              resolve(
                helpers.simpleDisplayResponse(
                  handlerInput,
                  attributes,
                  attributes[constants.INTRO_MESSAGE]
                )
              );
            }
          });
        });
      }
    }
  }
};
