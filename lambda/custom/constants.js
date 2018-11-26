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
module.exports = Object.freeze({
  // define the application states to handle the different interactions
  STATES: {
    PROFILE: '_PROFILE_MODE',
    START: '_START_MODE',
    SCORES: '_TEST_SCORES_MODE',
    COST: '_MAX_COST_MODE',
    DEGREE: '_DEGREE_DURATION_MODE',
    MAJOR: '_MAJOR_MODE',
    HOME: '_HOME_ZIP_MODE',
    REFINE_SEARCH: '_REFINE_SEARCH_MODE',
    LIST_SCHOOLS: '_LIST_SCHOOLS_MODE',
    FAVORITES: '_FAVORITES_LIST_MODE',
    MORE_INFORMATION: '_MORE_INFORMATION_MODE',
    SEARCH_BY_NAME: '_SEARCH_BY_NAME',
    SEARCH_BY_LOCATION: '_SEARCH_BY_LOCATION',
    SEARCH_BY_MAJOR: '_SEARCH_BY_MAJOR',
    REFINE_NO: '_REFINE_SEARCH_NO_INTENT'
  },

  // API Parameters
  FIELDS:
    '&_fields=id,school.name,school.city,school.state,latest.cost.tuition.in_state,latest.cost.tuition.out_of_state,' +
    'latest.admissions.admission_rate.overall,latest.student.size,latest.completion.completion_rate_4yr_150nt,' +
    'latest.earnings.10_yrs_after_entry.median',
  SORTBYSIZE: '&_sort=latest.student.size:desc',
  LIMITCOST: '&latest.cost.tuition.in_state__range=0.0..100000.0',
  SEARCHPAGING: '&per_page=12',
  RECORD_LIMIT: 12,
  PER_PAGE: 3,

  // State variables
  STATE: 'SKILL_STATE',
  INTRO_MESSAGE: 'INTRO_MESSAGE',
  PREVIOUS_INTRO_MESSAGE: 'PREVIOUS_INTRO_MESSAGE',
  PREVIOUS_STATE: 'PREVIOUS_STATE',
  PREVIOUS_INTENT: 'PREVIOUS_INTENT',
  SEARCH: 'SEARCH',
  NO_PREFERENCE: 0,
  CURRENT_SLOT: 'SLOT',
  FIRST_RUN: 'FIRST_RUN',

  // User information
  SCORES: 'SCORES',
  SAT: 'SAT',
  ACT: 'ACT',
  HOME: 'HOME',
  SEARCH_TYPE: 'SEARCH_TYPE',
  COST: 'COST',
  DEGREE: 'DEGREE',
  DEGREE_TWO: "ASSOCIATE'S",
  DEGREE_FOUR: "BACHELOR'S",
  MAJOR_ID: 'PROFILE_MAJOR_ID',
  MAJOR_CATEGORY: 'PROFILE_MAJOR_CATEGORY',
  PROFCOMPLETE: 'PROFILE_COMPLETE',

  // Search by criteria
  TEXT: 'SEARCH_BY_TEXT',

  // Confirmation and dialog states
  CONFIRMED: 'CONFIRMED',
  NONE: 'NONE',
  DENIED: 'DENIED',
  STARTED: 'STARTED',
  COMPLETE: 'COMPLETE',
  IN_PROGRESS: 'IN PROGRESS',

  // Search criteria
  SEARCH_INTENT: 'SEARCH_INTENT',
  LOCATION: 'LOCATION',
  LOCATION_STATE: 'STATE',
  STATE_ID: 'STATE_ID',
  LOCATION_REGION: 'REGION',
  REGION_ID: 'REGION_ID',
  DISTANCE: 'DISTANCE',
  TYPE: 'TYPE',
  SCHOOL_TYPE_PUBLIC: 'PUBLIC',
  SCHOOL_TYPE_PRIVATE: 'PRIVATE',
  SIZE: 'SIZE',
  SCHOOL_SIZE_SMALL: 'SMALL',
  SCHOOL_SIZE_MEDIUM: 'MEDIUM',
  SCHOOL_SIZE_LARGE: 'LARGE',
  SEARCH_MAJOR: 'SEARCH_MAJOR_PREFERENCE',
  MAJOR: 'MAJOR',
  SCHOOL_MAJOR_ID: 'MAJOR_ID',

  // Results variables
  CURRENT_SCHOOL_ID: 'CURRENT_SCHOOL_ID',
  CURRENT_SCHOOL: 'CURRENT_SCHOOL',
  SEARCH_RESULTS_TOTAL: 'SEARCH_RESULTS_TOTAL',
  SEARCH_RESULTS: 'SEARCH_RESULTS',
  LIST_ITEM: 'LIST_ITEM',
  SEARCH_PAGE: 'SEARCH_PAGE',

  // Favorites list variables
  LIST: 'FAVORITES_LIST',
  CURRENT_FAVORITE_ID: 'CURRENT_FAVORITE_ID',
  LIST_PAGE: 'FAVORITES_CURRENT_PAGE'
});
