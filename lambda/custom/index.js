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

Description: College Finder is a sample skill for querying the
College Scorecard API to match with schools that meet a certain list
of criteria. College Finder uses v2 of the Node.js SDK, DynamoDB
integration, display templates, dialog management, state management,
contextual help and errors, entity resolution,display touch actions,
and is built for easily adding additional language models.

Authors: Stefania Sharp, Will Blaschko, Alison Atwell
*********************************************************************/
'use strict';

// Use the ASK SDK for v2
const Alexa = require('ask-sdk');
const config = require('./config');
const constants = require('./constants');

// Files for each of the handlers
const common = require('./commonHandlers');
const profile = require('./profileHandlers');
const searchBy = require('./basicSearchHandlers');
const results = require('./resultsHandlers');
const search = require('./fullSearchHandlers');

/**
 * If this is the first start of the skill, grab the user's data from Dynamo and
 * set the session attributes to the persistent data.
 */
const GetUserDataInterceptor = {
  process (handlerInput) {
    console.log('Request: ', JSON.stringify(handlerInput));
    let attributes = handlerInput.attributesManager.getSessionAttributes();
    if (
      handlerInput.requestEnvelope.request.type === 'LaunchRequest' ||
      !attributes.isInitialized
    ) {
      return new Promise((resolve, reject) => {
        handlerInput.attributesManager
          .getPersistentAttributes()
          .then(attributes => {
            if (attributes[constants.FIRST_RUN] === undefined) {
              attributes[constants.FIRST_RUN] = true;
            }
            attributes.isInitialized = true;
            handlerInput.attributesManager.setSessionAttributes(attributes);
            resolve();
          })
          .catch(error => {
            reject(error);
          });
      });
    }
  }
};

/**
 * Handlers:
 *
 * Common - LaunchHandler, NoHandler, HelpIntentHandler, CancelAndStopIntentHandler, SessionEndedRequestHandler, UnhandledIntentHandler,
 *          ErrorHandler, CanFulfillIntentErrorHandler, PreviousHandler
 *
 * Profile - ProfileYesHandler, ProfileItemYesHandler, ProfileReviewHandler, ChangeProfileHandler, ScoresHandler, DegreeHandler, MajorHandler,
 *           ProfileNoHandler, ProfileNumberHandler
 *
 * SearchBy - CFIRBasicSearch, SearchByStartOver, SearchByNameHandler, SearchByLocationHandler, SearchByMajorHandler
 *
 * Results - ListsHandler, PreviousListHandler, NextListhandler, ResultsYesHandler, ResultsNumberHandler, ResultsTouchHandler,
 *           AddFavoriteHandler, DeleteFavoriteHandler
 *
 * Search - FillSearchHandler, CompleteSearchHandler
 */

exports.handler = Alexa.SkillBuilders
  .standard()
  .withSkillId(config.APPID)
  .addRequestHandlers(
    common.CancelAndStopIntentHandler,
    common.HelpIntentHandler,
    searchBy.CFIRBasicSearch,
    profile.ProfileYesHandler,
    profile.ScoresHandler,
    profile.DegreeHandler,
    profile.MajorHandler,
    profile.ProfileItemYesHandler,
    profile.ProfileReviewHandler,
    profile.ChangeProfileHandler,
    profile.ProfileNumberHandler,
    profile.ProfileNoHandler,
    searchBy.SearchByStartOver,
    searchBy.SearchByMajorHandler,
    searchBy.SearchByLocationHandler,
    searchBy.SearchByNameHandler,
    common.RegionListIntentHandler,
    results.ResultsNumberHandler,
    results.ResultsTouchHandler,
    results.NextListHandler,
    results.PreviousListHandler,
    results.ResultsYesHandler,
    results.ListsHandler,
    results.AddFavoriteHandler,
    results.DeleteFavoriteHandler,
    search.FillSearchHandler,
    search.CompleteSearchHandler,
    common.NoHandler,
    common.LaunchHandler,
    common.PreviousHandler,
    common.SessionEndedRequestHandler,
    common.UnhandledIntentHandler
  )
  .addRequestInterceptors(GetUserDataInterceptor)
  .addErrorHandlers(common.ErrorHandler, common.CanFulfillIntentErrorHandler)
  .withTableName(config.TABLE_NAME)
  .withAutoCreateTable(true)
  .withDynamoDbClient()
  .lambda();
