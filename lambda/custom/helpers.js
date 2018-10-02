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
*********************************************************************/
const constants = require('./constants');
const config = require('./config');
const lang = require('./language');
const http = require('https');

const states = [
  ['Arizona', 'AZ'],
  ['Alabama', 'AL'],
  ['Alaska', 'AK'],
  ['Arizona', 'AZ'],
  ['Arkansas', 'AR'],
  ['California', 'CA'],
  ['Colorado', 'CO'],
  ['Connecticut', 'CT'],
  ['Delaware', 'DE'],
  ['Florida', 'FL'],
  ['Georgia', 'GA'],
  ['Hawaii', 'HI'],
  ['Idaho', 'ID'],
  ['Illinois', 'IL'],
  ['Indiana', 'IN'],
  ['Iowa', 'IA'],
  ['Kansas', 'KS'],
  ['Kentucky', 'KY'],
  ['Kentucky', 'KY'],
  ['Louisiana', 'LA'],
  ['Maine', 'ME'],
  ['Maryland', 'MD'],
  ['Massachusetts', 'MA'],
  ['Michigan', 'MI'],
  ['Minnesota', 'MN'],
  ['Mississippi', 'MS'],
  ['Missouri', 'MO'],
  ['Montana', 'MT'],
  ['Nebraska', 'NE'],
  ['Nevada', 'NV'],
  ['New Hampshire', 'NH'],
  ['New Jersey', 'NJ'],
  ['New Mexico', 'NM'],
  ['New York', 'NY'],
  ['North Carolina', 'NC'],
  ['North Dakota', 'ND'],
  ['Ohio', 'OH'],
  ['Oklahoma', 'OK'],
  ['Oregon', 'OR'],
  ['Pennsylvania', 'PA'],
  ['Rhode Island', 'RI'],
  ['South Carolina', 'SC'],
  ['South Dakota', 'SD'],
  ['Tennessee', 'TN'],
  ['Texas', 'TX'],
  ['Utah', 'UT'],
  ['Vermont', 'VT'],
  ['Virginia', 'VA'],
  ['Washington', 'WA'],
  ['West Virginia', 'WV'],
  ['Wisconsin', 'WI'],
  ['Wyoming', 'WY']
];

module.exports = {
  /**
   * Check if a variable has no content or is set to zero.
   *
   * @param {String} item
   */
  noContent (item) {
    return item === undefined || item === null || item === constants.NO_PREFERENCE;
  },
  /**
   * Gets the root value of the slot even if synonyms are provided.
   *
   * @param {Object} handlerInput
   * @param {String} slot
   * @returns {String} The root value of the slot
   */
  getSlotResolution (handlerInput, slot) {
    let slots = handlerInput.requestEnvelope.request.intent.slots;
    if (
      slots[slot] &&
      slots[slot].resolutions &&
      slots[slot].resolutions.resolutionsPerAuthority[0] &&
      slots[slot].resolutions.resolutionsPerAuthority[0].values[0] &&
      slots[slot].resolutions.resolutionsPerAuthority[0].values[0].value
    ) {
      return slots[slot].resolutions.resolutionsPerAuthority[0].values[0].value.name;
    } else {
      return false;
    }
  },

  /**
   * Determines if a valid slot value was provided in order to fill CanHandleIntentRequest
   *
   * @param {Object} filledSlots
   * @returns {Object} slot name with isValidated boolean
   */
  getSlotValidation (filledSlots) {
    const slotValues = {};

    Object.keys(filledSlots).forEach(item => {
      const name = filledSlots[item].name;

      if (
        filledSlots[item] &&
        filledSlots[item].resolutions &&
        filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
        filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
        filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code
      ) {
        switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
          case 'ER_SUCCESS_MATCH':
            slotValues[name] = {
              isValidated: true
            };
            break;
          case 'ER_SUCCESS_NO_MATCH':
            slotValues[name] = {
              isValidated: false
            };
            break;
          default:
            break;
        }
      } else {
        slotValues[name] = {
          isValidated: false
        };
      }
    }, this);

    return slotValues;
  },

  /**
   * Gets the ID for the slot for API search values that are not user friendly.
   *
   * @param {Object} handlerInput
   * @param {String} slot
   * @returns {String} The id for the given slot
   */
  getSlotResolutionId (handlerInput, slot) {
    let slots = handlerInput.requestEnvelope.request.intent.slots;
    if (
      slots[slot] &&
      slots[slot].resolutions &&
      slots[slot].resolutions.resolutionsPerAuthority[0] &&
      slots[slot].resolutions.resolutionsPerAuthority[0].values[0] &&
      slots[slot].resolutions.resolutionsPerAuthority[0].values[0].value
    ) {
      return slots[slot].resolutions.resolutionsPerAuthority[0].values[0].value.id;
    } else {
      return false;
    }
  },

  /**
   * Checks to see if a Profile attribute exists and if it has a 0 value. Returns
   * a dialog string to indicate the user didn't select a value for that attribute.
   *
   * @param {Object} handlerInput
   * @param {Object} attributes
   * @param {String} value
   */
  noPreferenceDialog (handlerInput, attributes, value) {
    if (attributes[value] && attributes[value] === constants.NO_PREFERENCE) {
      return module.exports.getMessage(handlerInput, 'NO_PREFERENCE_TEXT');
    } else {
      return attributes[value];
    }
  },

  /**
   * Parses the user's locale and returns the matching language string for the
   * label in language.js.
   *
   * @param {Object} handlerInput
   * @param {String} label The variable name for the language string in language.js
   * @returns {String} The localized Alexa response for the given type
   */
  getMessage (handlerInput, label) {
    let locale = handlerInput.requestEnvelope.request.locale;

    // Default all english locales to the US language set
    locale = locale.includes('en-') ? 'en-US' : locale;

    return lang[locale].translation[label];
  },

  /**
   * Saves the current attributes objects to either the session or to DynamoDB.
   *
   * @param {Object} handlerInput
   * @param {Object} attributes
   * @param {String} mode The save type of persistent or session
   */
  saveUser (handlerInput, attributes, mode) {
    if (mode === 'session') {
      handlerInput.attributesManager.setSessionAttributes(attributes);
    } else if (mode === 'persistent') {
      console.info('Saving to Dynamo: ', attributes);

      if (attributes[constants.FIRST_RUN]) {
        attributes[constants.FIRST_RUN] = false;
      }

      handlerInput.attributesManager.setSessionAttributes(attributes);
      handlerInput.attributesManager.setPersistentAttributes(attributes);
      return handlerInput.attributesManager.savePersistentAttributes();
    }
  },

  clearUser (handlerInput) {
    let attributes = handlerInput.attributesManager.getSessionAttributes();
    console.info('Clearing Dynamo: ', attributes);

    for (const key of attributes) {
      attributes[key] = undefined;
    }

    handlerInput.attributesManager.setSessionAttributes(attributes);
    handlerInput.attributesManager.setPersistentAttributes(attributes);
    return handlerInput.attributesManager.savePersistentAttributes();
  },


  /**
   * Helper function to clear out temporary search attributes on
   * session exit.
   *
   * @param {Object} attributes
   */
  clearSessionAttributes (attributes) {
    let session = attributes;

    delete session['isInitialized'];
    delete session[constants.SEARCH];
    delete session[constants.SEARCH_INTENT];
    delete session[constants.LOCATION_REGION];
    delete session[constants.REGION_ID];
    delete session[constants.LOCATION_STATE];
    delete session[constants.SCHOOL_MAJOR];
    delete session[constants.SCHOOL_MAJOR_ID];
    delete session[constants.CURRENT_SLOT];
    delete session[constants.STATE];

    return session;
  },

  /**
   * Concatenates two language strings together for contextual messaging.
   *
   * @param {Object} attributes
   * @param {String} promptMessage The variable name for the language string in language.js
   * @returns {String} The combined message to be spoken by Alexa
   */
  getPromptMessage (attributes, promptMessage) {
    let intro = ' ';
    if (attributes[constants.INTRO_MESSAGE]) {
      intro = attributes[constants.INTRO_MESSAGE];
      attributes[constants.PREVIOUS_INTRO_MESSAGE] = attributes[constants.INTRO_MESSAGE];
      attributes[constants.INTRO_MESSAGE] = promptMessage;
    }
    if (intro.length > 1) {
      intro = `${intro}<break time="500ms"/>`;
    }
    return `${intro} ${promptMessage}`;
  },

  /**
   * Matches the user supplied school name with the school's location in the
   * SEARCH_RESULTS array. Returns false if the school is not present in the array.
   *
   * @param {Object} handlerInput
   * @param {Object} attributes
   * @returns {Boolean} If the school is present in the SEARCH_RESULTS array.
   */
  currentResult (handlerInput, attributes) {
    if (attributes[constants.SEARCH_RESULTS]) {
      let list, id;

      if (attributes[constants.STATE] === constants.STATES.FAVORITES) {
        list = attributes[constants.LIST];
        id = constants.CURRENT_FAVORITE_ID;
      } else {
        list = attributes[constants.SEARCH_RESULTS];
        id = constants.CURRENT_SCHOOL_ID;
      }

      if (list === undefined || list.length < 1) {
        return false;
      }

      for (var i = 0; i < list.length; i++) {
        if (list[i].id === module.exports.getSlotResolutionId(handlerInput, 'SCHOOL_NAME')) {
          attributes[id] = list[i].id;
          attributes[constants.LIST_ITEM] = i;
          return true;
        } else {
          return false;
        }
      }
    }
  },

  /**
   * Converts a state name to and from the corresponding state abbreviation.
   *
   * @param {String} input
   * @param {String} to The type of conversion
   * @returns {String} The state abbreviation or full state name
   */
  abbrState (input, to) {
    if (to == 'abbr' || !to) {
      input = input.replace(
        /\w\S*/g,
        txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
      for (let i = 0; i < states.length; i++) {
        if (states[i][0] == input) {
          return states[i][1];
        }
      }
    } else if (to == 'name') {
      input = input.toUpperCase();
      for (let i = 0; i < states.length; i++) {
        if (states[i][1] == input) {
          return states[i][0];
        }
      }
    }
  },
  /**
   * Checks to see if the Display interface is supported by the user's device.
   *
   * @param {Object} handlerInput
   * @return {Boolean}
   */
  hasDisplay: function (handlerInput) {
    return (
      handlerInput.requestEnvelope.context &&
      handlerInput.requestEnvelope.context.System &&
      handlerInput.requestEnvelope.context.System.device &&
      handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
      handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display
    );
  },
  /**
   * Creates a simple tempalte with a background image and the skill name.
   * Randomly adds a hint to the response object.
   *
   * @param {Object} handlerInput
   * @param {Object} attributes
   * @param {String} message
   */
  simpleDisplayResponse: function (handlerInput, attributes, message) {
    const template = {
      type: 'BodyTemplate6',
      token: 'Main',
      backButton: 'HIDDEN',
      backgroundImage: {
        sources: [
          {
            url: config.MAIN_IMAGE
          }
        ]
      },
      textContent: {
        primaryText: {
          text: module.exports.getMessage(handlerInput, 'LABEL_NAME'),
          type: 'PlainText'
        }
      }
    };
    module.exports.saveUser(handlerInput, attributes, 'session');
    handlerInput.responseBuilder.speak(message).reprompt(message);

    if (module.exports.hasDisplay(handlerInput)) {
      const hints = module.exports.getMessage(handlerInput, 'HINT');
      const hint = hints[Math.floor(Math.random() * hints.length)];
      handlerInput.responseBuilder.addRenderTemplateDirective(template).addHintDirective(hint);
    }

    return handlerInput.responseBuilder.getResponse();
  },
  /**
   * Central function for dictating details about a school,
   * detecting the presence of a display, and rendering a template
   * if there is a display.
   *
   * @param {Object} handlerInput
   * @param {Object} attributes
   * @param {Object} school
   */
  moreInfoResponse: function (handlerInput, attributes, school) {
    let more = 'MORE_INFORMATION_SAVE_PROMPT';
    // Determine if this is the favorites or result list
    if (attributes[constants.STATE] === constants.STATES.FAVORITES) {
      more = 'MORE_INFORMATION_FAV_PROMPT';
    }

    attributes[constants.CURRENT_SCHOOL_ID] = school.id;
    attributes[constants.CURRENT_SCHOOL] = school;
    const state = module.exports.abbrState(school['school.state'], 'name');

    attributes[constants.INTRO_MESSAGE] = module.exports
      .getMessage(handlerInput, 'MORE_INFORMATION_OVERVIEW')
      .replace('%%SCHOOL_NAME%%', school['school.name'].replace('&', 'and'))
      .replace('%%CITY%%', school['school.city'])
      .replace('%%STATE%%', state)
      .replace('%%TUITION_IN_STATE%%', school['2015.cost.tuition.in_state'])
      .replace('%%TUITION_OUT_OF_STATE%%', school['2015.cost.tuition.out_of_state']);

    const message = module.exports.getPromptMessage(
      attributes,
      module.exports.getMessage(handlerInput, more)
    );

    module.exports.saveUser(handlerInput, attributes, 'session');
    handlerInput.responseBuilder.speak(message).reprompt(message);

    if (module.exports.hasDisplay(handlerInput)) {
      handlerInput.responseBuilder.addRenderTemplateDirective(
        module.exports.buildSchoolTemplate(
          module.exports.getMessage(handlerInput, 'NOT_AVAILABLE'),
          school
        )
      );
    }

    return handlerInput.responseBuilder.getResponse();
  },
  /**
   * Builds a template for displaying college data on a screen device.
   *
   * @param {String} nullText
   * @param {Object] school
   * @return {Object}
   */
  buildSchoolTemplate: function (nullText, school) {
    const schoolName = school['school.name'].replace('&', '&amp;');
    const city = school['school.city'];
    const state = school['school.state'];
    const tuitionInState =
      school['2015.cost.tuition.in_state'] === null
        ? nullText
        : '$' + school['2015.cost.tuition.in_state'].toLocaleString('en');
    const tuitionOutOfState =
      school['2015.cost.tuition.out_of_state'] === null
        ? nullText
        : '$' + school['2015.cost.tuition.out_of_state'].toLocaleString('en');
    const gradRate =
      school['2015.completion.completion_rate_4yr_150nt'] === null
        ? nullText
        : (school['2015.completion.completion_rate_4yr_150nt'] * 100).toFixed(2) + '%';
    const salary =
      school['2013.earnings.10_yrs_after_entry.median'] === null
        ? nullText
        : '$' + school['2013.earnings.10_yrs_after_entry.median'].toLocaleString('en');
    const students =
      school['2015.student.size'] === null
        ? nullText
        : school['2015.student.size'].toLocaleString('en');

    const backgroundImage = config.BACKGROUND_IMAGE;

    const primaryText = `<b><font size="6">${schoolName}</font></b><br /><b>${city}, ${state}</b><br/>${students} undergraduate students`;

    const secondaryText =
      '<br/><b>2015 In-State Tuition/Fees:</b> ' +
      tuitionInState +
      '<br/><b>2015 Out-of-State Tuition/Fees:</b> ' +
      tuitionOutOfState +
      '<br/><b>Graduation Rate:</b> ' +
      gradRate +
      '<br/><b>Median Salary:</b> ' +
      salary;

    const template = {
      type: 'BodyTemplate1',
      token: 'School',
      backButton: 'HIDDEN',
      backgroundImage: {
        sources: [
          {
            url: backgroundImage
          }
        ]
      },
      textContent: {
        primaryText: {
          text: primaryText,
          type: 'RichText'
        },
        secondaryText: {
          text: secondaryText,
          type: 'RichText'
        }
      }
    };

    return template;
  },

  /**
   * Builds display template for list of schools in results or favorites.
   *
   * @param {Array} schools
   * @param {Integer} start
   * @param {Integer} end
   * @param {String} title
   */
  buildListTemplate (schools, title) {
    let schoolItems = [];
    const backgroundImage = config.BACKGROUND_IMAGE_2;
    let start = 0;

    schools.forEach(school => {
      const schoolName = school['school.name'].replace('&', '&amp;');
      const city = school['school.city'];
      const state = school['school.state'];
      const tuitionInState =
        school['2015.cost.tuition.in_state'] === null ||
        school['2015.cost.tuition.in_state'] === undefined
          ? '-'
          : '$' + school['2015.cost.tuition.in_state'].toLocaleString('en');
      const primaryText = `<b><font size='5'>${schoolName}</font></b>`;
      const secondaryText = city + ', ' + state;
      const tertiaryText = tuitionInState;

      let schoolItem = {
        token: start,
        textContent: {
          primaryText: {
            type: 'RichText',
            text: primaryText
          },
          secondaryText: {
            type: 'PlainText',
            text: secondaryText
          },
          tertiaryText: {
            type: 'PlainText',
            text: tertiaryText
          }
        }
      };
      schoolItems.push(schoolItem);
      start += 1;
    });

    const template = {
      type: 'ListTemplate1',
      token: 'Results',
      backButton: 'HIDDEN',
      backgroundImage: {
        sources: [
          {
            url: backgroundImage
          }
        ]
      },
      title: title,
      listItems: schoolItems
    };
    return template;
  },

  /**
   * Builds basic template for listing off the profile variables on a display.
   *
   * @param {Object} handlerInput
   * @param {Object} attributes
   * @param {String} message
   */
  buildProfileTemplate (handlerInput, attributes, message) {
    const noPreference = module.exports.getMessage(handlerInput, 'NO_PREFERENCE_TEXT');
    let score;
    if (attributes[constants.SAT]) {
      score = module.exports.noContent(attributes[constants.SAT])
        ? noPreference
        : `${constants.SAT} - ${attributes[constants.SAT]}`;
    } else if (attributes[constants.ACT]) {
      score = module.exports.noContent(attributes[constants.ACT])
        ? noPreference
        : `${constants.ACT} - ${attributes[constants.ACT]}`;
    } else {
      score = noPreference;
    }
    const cost = module.exports.noContent(attributes[constants.COST])
      ? noPreference
      : attributes[constants.COST];
    const degree = module.exports.noContent(attributes[constants.DEGREE])
      ? noPreference
      : attributes[constants.DEGREE];
    const major = module.exports.noContent(attributes[constants.MAJOR_CATEGORY])
      ? noPreference
      : attributes[constants.MAJOR_CATEGORY];
    const home = module.exports.noContent(attributes[constants.HOME])
      ? noPreference
      : attributes[constants.HOME];

    const primaryText = `Score: ${score} <br/>Cost: ${cost} USD <br/>Degree: ${degree} <br/>Major: ${major} <br/>Zip Code: ${home}`;

    const template = {
      type: 'BodyTemplate1',
      token: 'School',
      backButton: 'HIDDEN',
      backgroundImage: {
        sources: [
          {
            url: config.MAIN_IMAGE
          }
        ]
      },
      textContent: {
        primaryText: {
          text: primaryText,
          type: 'RichText'
        }
      }
    };

    module.exports.saveUser(handlerInput, attributes, 'session');
    handlerInput.responseBuilder.speak(message).reprompt(message);

    if (module.exports.hasDisplay(handlerInput)) {
      handlerInput.responseBuilder
        .addRenderTemplateDirective(template)
        .addHintDirective(module.exports.getMessage(handlerInput, 'PROFILE_HINT'));
    }

    return handlerInput.responseBuilder.getResponse();
  },

  /**
   * HTTP GET request to the College Scorecard API with a given URL query.
   *
   * @param {String} url
   * @param {Function} callback
   */
  getSchools (url, callback) {
    let req = http
      .get(url, res => {
        res.setEncoding('utf8');
        let body = '';

        res.on('data', function (data) {
          body += data;
        });

        res.on('end', function () {
          try {
            let parsed = JSON.parse(body);
            callback(null, parsed);
          } catch (err) {
            console.error('Unable to parse response as JSON', err);
            callback(err);
          }
        });
      })
      .on('error', function (err) {
        console.error('Error with the request:', err.message);
        callback(err);
      });

    req.end();
  }
};
