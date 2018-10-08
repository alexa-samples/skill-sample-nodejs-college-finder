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

Description: Handlers for listing schools in the SEARCH_RESULTS
or FAVORITES_LIST arrays. The results are offered in sets of three
schools. The user can move forward in the result list, go back, start
over or get details about a school by it's numeric position in the
list. If a user says the school name then the SearchByNameIntent
in basicSearchHandlers.js handles the school name and lists details.
*********************************************************************/
const constants = require('./constants');
const helpers = require('./helpers');

/**
 * Central logic for item not found messages.
 *
 * @param {Object} handlerInput
 * @param {Object} attributes
 */
function notFound (handlerInput, attributes) {
  helpers.saveUser(handlerInput, attributes, 'session');

  return handlerInput.responseBuilder
    .speak(helpers.getMessage(handlerInput, 'FAVORITES_NOT_FOUND'))
    .reprompt(helpers.getMessage(handlerInput, 'FAVORITES_NOT_FOUND'))
    .getResponse();
}

/**
 * Handles forward and backward paging of the lists. Formats Alexa's
 * response to list three schools at a time until the end of the list.
 *
 * @param {Object} handlerInput
 * @param {Object} attributes
 */
function pageResults (handlerInput, attributes) {
  console.info('Paging Results');
  let page;
  let schools;
  let end;
  let prompt;
  let title;

  // Determine if this is the favorites or result list
  if (attributes[constants.STATE] === constants.STATES.FAVORITES) {
    page = attributes[constants.LIST_PAGE];
    schools = attributes[constants.LIST];
    end = 'FAVORITES_NO_MORE_ITEMS';
    prompt = 'FAVORITES_CURRENT_ITEM_PROMPT';
    title = 'FAVORITES_TITLE';
  } else {
    page = attributes[constants.SEARCH_PAGE];
    schools = attributes[constants.SEARCH_RESULTS];
    end = 'LIST_SCHOOLS_END_OF_LIST';
    prompt = 'LIST_SCHOOLS_PROMPT';
    title = 'RESULTS_TITLE';
  }

  // If there are no more results, start back at the beginning of the list.
  if (page * constants.PER_PAGE > schools.length) {
    helpers.saveUser(handlerInput, attributes, 'session');

    return handlerInput.responseBuilder
      .speak(helpers.getMessage(handlerInput, end))
      .reprompt(helpers.getMessage(handlerInput, end))
      .getResponse();
  }

  const endStatement =
    page * constants.PER_PAGE < schools.length
      ? helpers.getMessage(handlerInput, prompt)
      : helpers.getMessage(handlerInput, end);

  // Create the message for the current set of schools
  const max = Math.min((page + 1) * constants.PER_PAGE, schools.length);
  let message;
  let schoolList = '';
  let num = constants.PER_PAGE * page;

  while (num < max) {
    const name = schools[num]['school.name'].replace('&', 'and');
    schoolList += `${num + 1}. ${name}. `;
    num += 1;
  }

  // If this is the first page then speak the number of results first
  if (page === 0) {
    message = helpers.getPromptMessage(attributes, `${schoolList} ${endStatement}`);
  } else {
    message = `${schoolList} ${endStatement}`;
  }

  helpers.saveUser(handlerInput, attributes, 'session');
  handlerInput.responseBuilder.speak(message).reprompt(message);

  if (helpers.hasDisplay(handlerInput)) {
    handlerInput.responseBuilder.addRenderTemplateDirective(
      helpers.buildListTemplate(schools, helpers.getMessage(handlerInput, title))
    );
  }

  return handlerInput.responseBuilder.getResponse();
}

/**
 * Helper function for removing an item from a results/favorites list.
 *
 * @param {Array} items
 * @param {String} search
 */
function removeSchool (items, search) {
  let schools = items;

  const current = schools.findIndex(found => {
    school = found['school.name'];
    return found.id === search;
  });

  if (current && current !== undefined) {
    schools.splice(current, 1);
  }

  return schools;
}

module.exports = {
  /**
   * Handler for the ListSchoolsIntent and the ListFavoritesIntent. Checks to see
   * if there are any school results and then prepares the starting variables
   * for pageResults() to process the list.
   */
  ListsHandler: {
    canHandle (handlerInput) {
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        (handlerInput.requestEnvelope.request.intent.name === 'ListSchoolsIntent' ||
          handlerInput.requestEnvelope.request.intent.name === 'ListFavoritesIntent')
      );
    },
    handle (handlerInput) {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, ListSchools`);

      attributes[constants.PREVIOUS_INTENT] = handlerInput.requestEnvelope.request.intent.name;

      let schools;
      let empty;
      let intro;

      if (handlerInput.requestEnvelope.request.intent.name === 'ListFavoritesIntent') {
        schools = attributes[constants.LIST] === undefined ? [] : attributes[constants.LIST];
        attributes[constants.STATE] = constants.STATES.FAVORITES;
        attributes[constants.LIST_PAGE] = 0;
        empty = 'FAVORITES_EMPTY';
        intro = 'FAVORITES_OVERVIEW';
      } else {
        schools =
          attributes[constants.SEARCH_RESULTS] === undefined
            ? []
            : attributes[constants.SEARCH_RESULTS];
        attributes[constants.STATE] = constants.STATES.LIST_SCHOOLS;
        attributes[constants.SEARCH_PAGE] = 0;
        empty = 'LIST_SCHOOLS_NO_ITEMS_PROMPT';
        intro = 'LIST_SCHOOLS_INTRO';
      }

      // No results. Prompt to do a search.
      if (schools === undefined || schools.length < 1) {
        helpers.saveUser(handlerInput, attributes, 'session');

        return handlerInput.responseBuilder
          .speak(helpers.getMessage(handlerInput, empty))
          .reprompt(helpers.getMessage(handlerInput, empty))
          .getResponse();
      } else {
        intro = schools.length === 1 ? `${intro}_ONE` : intro;

        attributes[constants.SEARCH_PAGE] = 0;

        if (handlerInput.requestEnvelope.request.intent.name === 'ListFavoritesIntent') {
          attributes[constants.INTRO_MESSAGE] = helpers
            .getMessage(handlerInput, intro)
            .replace('%%COUNT%%', schools.length);
        } else {
          attributes[constants.INTRO_MESSAGE] = helpers.getMessage(handlerInput, intro);
        }

        return pageResults(handlerInput, attributes);
      }
    }
  },
  /**
   * Handler for the AMAZON.PreviousIntent if the user is either in the LIST_SCHOOLS STATE
   * or the MORE_INFORMATION STATE. If the user was listening to details about a school
   * then previous takes them back to the point in the results they were at, otherwise Alexa lists
   * the prior page of schools.
   */
  PreviousListHandler: {
    canHandle (handlerInput) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'AMAZON.PreviousIntent' &&
        (attributes[constants.STATE] === constants.STATES.LIST_SCHOOLS ||
          attributes[constants.STATE] === constants.STATES.MORE_INFORMATION ||
          attributes[constants.STATE] === constants.STATES.FAVORITES)
      );
    },
    handle (handlerInput) {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, AMAZON.PreviousIntent for Lists`);

      let schools;
      let empty = 'LIST_SCHOOLS_NO_ITEMS_PROMPT';

      if (attributes[constants.STATE] === constants.STATES.FAVORITES) {
        schools = attributes[constants.LIST];
        empty = 'FAVORITES_EMPTY';
      } else if (attributes[constants.STATE] === constants.STATES.LIST_SCHOOLS) {
        schools = attributes[constants.LIST];
        attributes[constants.SEARCH_PAGE] = Math.max(0, attributes[constants.SEARCH_PAGE] - 1);
      } else {
        schools = attributes[constants.SEARCH_RESULTS];
        attributes[constants.INTRO_MESSAGE] = '';
        attributes[constants.STATE] = constants.STATES.LIST_SCHOOLS;
      }

      // End of the list, prompt to go back to beginning or new search
      if (
        !schools ||
        attributes[constants.STATE] === constants.STATES.SEARCH_BY_NAME ||
        attributes[constants.SEARCH] === constants.STATES.SEARCH_BY_NAME
      ) {
        attributes[constants.PREVIOUS_STATE] = attributes[constants.STATE];
        attributes[constants.STATE] = constants.STATES.START;

        helpers.saveUser(handlerInput, attributes, 'session');

        return handlerInput.responseBuilder
          .speak(helpers.getMessage(handlerInput, 'WELCOME_MENU'))
          .reprompt(helpers.getMessage(handlerInput, 'WELCOME_MENU'))
          .getResponse();
      } else if (schools.length < 1) {
        helpers.saveUser(handlerInput, attributes, 'session');

        return handlerInput.responseBuilder
          .speak(helpers.getMessage(handlerInput, empty))
          .reprompt(helpers.getMessage(handlerInput, empty))
          .getResponse();
      }

      helpers.saveUser(handlerInput, attributes, 'session');

      return pageResults(handlerInput, attributes);
    }
  },
  /**
   * Handler for the AMAZON.NextIntent if the user is in the LIST_SCHOOLS STATE.
   * Increments the SEARCH_PAGE by one and sends to pageResults() to list the next
   * three schools.
   */
  NextListHandler: {
    canHandle (handlerInput) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NextIntent' ||
          handlerInput.requestEnvelope.request.intent.name === 'AMAZON.MoreIntent' ||
          handlerInput.requestEnvelope.request.intent.name === 'MoreInformationIntent') &&
        (attributes[constants.STATE] === constants.STATES.LIST_SCHOOLS ||
          attributes[constants.STATE] === constants.STATES.FAVORITES)
      );
    },
    handle (handlerInput) {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, AMAZON.NextIntent`);

      if (attributes[constants.STATE] === constants.STATES.FAVORITES) {
        attributes[constants.LIST_PAGE] += 1;
      } else {
        attributes[constants.SEARCH_PAGE] += 1;
      }

      helpers.saveUser(handlerInput, attributes, 'session');

      return pageResults(handlerInput, attributes);
    }
  },
  /**
   * Handler for the AMAZON.YesIntent if the user has reached the end of the list of schools.
   * Resets the SEARCH_PAGE to 0 and starts listing the schools from the beginning.
   */
  ResultsYesHandler: {
    canHandle (handlerInput) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent' &&
        (attributes[constants.STATE] === constants.STATES.LIST_SCHOOLS ||
          attributes[constants.STATE] === constants.STATES.FAVORITES)
      );
    },
    handle (handlerInput) {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, AMAZON.YesIntent`);

      if (attributes[constants.STATE] === constants.STATES.FAVORITES) {
        attributes[constants.LIST_PAGE] = 0;
      } else {
        attributes[constants.SEARCH_PAGE] = 0;
      }

      attributes[constants.INTRO_MESSAGE] = '';
      attributes[constants.PREVIOUS_INTRO_MESSAGE] = '';
      helpers.saveUser(handlerInput, attributes, 'session');

      return pageResults(handlerInput, attributes);
    }
  },
  /**
   * Handler for the NumberIntent in the LIST_SCHOOLS and FAVORITES STATES. If a user requests
   * more information about a school by its numeric order in the list. Lists the details
   * about the corresponding school in the SEARCH_RESULTS array.
   */
  ResultsNumberHandler: {
    canHandle (handlerInput) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'NumberIntent' &&
        (attributes[constants.STATE] === constants.STATES.LIST_SCHOOLS ||
          attributes[constants.STATE] === constants.STATES.FAVORITES ||
          attributes[constants.STATE] === constants.STATES.MORE_INFORMATION)
      );
    },
    handle (handlerInput) {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, AMAZON.NumberIntent`);

      const intentObj = handlerInput.requestEnvelope.request.intent;
      let number = Number(intentObj.slots.NUMBER.value) - 1;
      let schools;

      if (attributes[constants.STATE] === constants.STATES.FAVORITES) {
        schools = attributes[constants.LIST];
        empty = 'FAVORITES_EMPTY';
      } else {
        schools = attributes[constants.SEARCH_RESULTS];
        attributes[constants.STATE] = constants.STATES.MORE_INFORMATION;
        empty = 'LIST_SCHOOLS_NO_ITEMS_PROMPT';
      }

      if (schools === undefined || schools.length < 1) {
        helpers.saveUser(handlerInput, attributes, 'session');

        return handlerInput.responseBuilder
          .speak(helpers.getMessage(handlerInput, empty))
          .reprompt(helpers.getMessage(handlerInput, empty))
          .getResponse();
      }

      if (number < 0 || number > schools.length) {
        attributes[constants.INTRO_MESSAGE] = helpers.getMessage(
          handlerInput,
          'ERROR_INVALID_VALUE'
        );

        attributes[constants.SEARCH_PAGE] -= 1;
        return pageResults(handlerInput, attributes);
      }

      return helpers.moreInfoResponse(handlerInput, attributes, schools[number]);
    }
  },
  /**
   * Handler for adding a school to the favorites list from either SearchByNameIntent or
   * ListSchoolsIntent results.
   */
  AddFavoriteHandler: {
    canHandle (handlerInput) {
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'AddToFavoritesIntent'
      );
    },
    handle (handlerInput) {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, AddToFavoritesIntent`);

      attributes[constants.PREVIOUS_INTENT] = handlerInput.requestEnvelope.request.intent.name;

      let schools =
        attributes[constants.LIST] && attributes[constants.LIST] !== undefined
          ? attributes[constants.LIST]
          : [];
      const list = attributes[constants.SEARCH_RESULTS];
      let school;

      // First check for duplicates
      const duplicate = schools.find(school => {
        return school.id === attributes[constants.CURRENT_SCHOOL_ID];
      });

      if (duplicate && duplicate !== undefined) {
        return handlerInput.responseBuilder
          .speak(
            helpers
              .getMessage(handlerInput, 'FAVORITES_DUPLICATE')
              .replace('%%SCHOOL%%', duplicate['school.name'])
          )
          .reprompt(
            helpers
              .getMessage(handlerInput, 'FAVORITES_DUPLICATE')
              .replace('%%SCHOOL%%', duplicate['school.name'])
          )
          .getResponse();
      }

      if (attributes[constants.CURRENT_SCHOOL_ID] === attributes[constants.CURRENT_SCHOOL].id) {
        school = attributes[constants.CURRENT_SCHOOL];
      } else {
        const item = list.find(listItem => {
          return list.id === attributes[constants.CURRENT_SCHOOL_ID];
        });

        if (item && item !== undefined) {
          school = item;
        }
      }

      if (school.id) {
        if (schools.length >= constants.RECORD_LIMIT) {
          schools.pop();
        }

        schools.unshift(school);

        let message = helpers
          .getMessage(handlerInput, 'FAVORITES_ADDED')
          .replace('%%SCHOOL%%', school['school.name'].replace('&', 'and'));
        attributes[constants.LIST] = schools;

        helpers.saveUser(handlerInput, attributes, 'session');
        helpers.saveUser(handlerInput, attributes, 'persistent');

        return handlerInput.responseBuilder
          .speak(message)
          .reprompt(message)
          .getResponse();
      } else {
        return notFound(handlerInput, attributes);
      }
    }
  },
  /**
   * Handler for deleting a school from the favorites list via either ListFavoritesIntent or
   * ListSchoolsIntent results.
   */
  DeleteFavoriteHandler: {
    canHandle (handlerInput) {
      return (
        handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name === 'DeleteFromFavoritesIntent'
      );
    },
    handle (handlerInput) {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, DeleteFromFavoritesIntent`);

      attributes[constants.PREVIOUS_INTENT] = handlerInput.requestEnvelope.request.intent.name;

      const intentObj = handlerInput.requestEnvelope.request.intent;
      let schools = attributes[constants.LIST];
      let school;

      // The list is empty so there is nothing to delete
      if (attributes[constants.LIST] === undefined || attributes[constants.LIST].length < 1) {
        return handlerInput.responseBuilder
          .speak(helpers.getMessage(handlerInput, 'FAVORITES_EMPTY'))
          .reprompt(helpers.getMessage(handlerInput, 'FAVORITES_EMPTY'))
          .getResponse();
      } else {
        if (
          !intentObj ||
          !intentObj.slots ||
          ((!intentObj.slots.NUMBER || !intentObj.slots.NUMBER.value) &&
            (!intentObj.slots.SCHOOL || !intentObj.slots.SCHOOL.value))
        ) {
          if (attributes[constants.CURRENT_SCHOOL_ID]) {
            schools = removeSchool(schools, attributes[constants.CURRENT_SCHOOL_ID]);
          } else if (attributes[constants.CURRENT_FAVORITE_ID]) {
            schools = removeSchool(schools, attributes[constants.CURRENT_FAVORITE_ID]);
          } else {
            helpers.saveUser(handlerInput, attributes, 'session');

            return notFound(handlerInput, attributes);
          }
        } else {
          if (intentObj.slots['NUMBER'] && intentObj.slots['NUMBER'].value) {
            let number = parseInt(intentObj.slots['NUMBER'].value);
            number -= 1;

            if (number < 0 || number > schools.length) {
              return notFound(handlerInput, attributes);
            }
            school = schools[number]['school.name'];
            schools.splice(schools[number], 1);
          } else if (intentObj.slots.SCHOOL && intentObj.slots.SCHOOL.value) {
            const current = schools.findIndex(found => {
              school = found['school.name'];
              return found.id === helpers.getSlotResolutionId(handlerInput, 'SCHOOL_NAME');
            });

            if (current && current !== undefined) {
              schools.splice(current, 1);
            } else {
              return notFound(handlerInput, attributes);
            }
          } else {
            helpers.saveUser(handlerInput, attributes, 'session');

            return notFound(handlerInput, attributes);
          }
        }

        attributes[constants.INTRO_MESSAGE] = helpers
          .getMessage(handlerInput, 'FAVORITES_REMOVE_CONFIRM')
          .replace('%%SCHOOL_NAME%%', school.replace('&', 'and'));
        attributes[constants.LIST] = schools;

        if (attributes[constants.STATE] === constants.STATES.LIST_SCHOOLS) {
          message = helpers.getPromptMessage(
            attributes,
            helpers.getMessage(handlerInput, 'FAVORITES_FROM_SEARCH')
          );
        } else {
          // Create the message for the current set of schools
          let schoolList = '';
          const page = attributes[constants.LIST_PAGE];
          let num = constants.PER_PAGE * page;
          const max = Math.min((page + 1) * constants.PER_PAGE, schools.length);

          while (num < max) {
            schoolList += `${num + 1}. ${schools[num]['school.name']}. `;
            num++;
          }

          message = helpers.getPromptMessage(
            attributes,
            helpers
              .getMessage(handlerInput, 'FAVORITES_OVERVIEW')
              .replace('%%COUNT%%', schools.length) +
              ' ' +
              schoolList
          );
        }

        helpers.saveUser(handlerInput, attributes, 'session');
        helpers.saveUser(handlerInput, attributes, 'persistent');

        return handlerInput.responseBuilder
          .speak(message)
          .reprompt(message)
          .getResponse();
      }
    }
  },
  /**
   * Handler for when a touch is registered on a display when listing favorites
   * or search results.
   */
  ResultsTouchHandler: {
    canHandle (handlerInput) {
      const attributes = handlerInput.attributesManager.getSessionAttributes();
      return (
        handlerInput.requestEnvelope.request.type === 'Display.ElementSelected' &&
        (attributes[constants.STATE] === constants.STATES.LIST_SCHOOLS ||
          attributes[constants.STATE] === constants.STATES.FAVORITES)
      );
    },
    handle (handlerInput) {
      let attributes = handlerInput.attributesManager.getSessionAttributes();
      console.info(`${attributes[constants.STATE]}, ListDisplayTouch`);

      let schools;
      // Determine if this is the favorites or result list
      if (attributes[constants.STATE] === constants.STATES.FAVORITES) {
        schools = attributes[constants.LIST];
      } else {
        schools = attributes[constants.SEARCH_RESULTS];
      }

      return helpers.moreInfoResponse(
        handlerInput,
        attributes,
        schools[parseInt(handlerInput.requestEnvelope.request.token)]
      );
    }
  }
};
