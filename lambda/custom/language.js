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
'use strict';
const SKILL_NAME = 'U.S. College Finder';

module.exports = Object.freeze({
  'en-US': {
    translation: {
      LABEL_NAME: SKILL_NAME,
      WELCOME_SHORT: 'Welcome back to ' + SKILL_NAME + '. ',
      WELCOME_LONG:
        'Welcome to ' +
        SKILL_NAME +
        ", I can help you find a college in the United States that's right for you using your personal preferences and test scores. ",
      WELCOME_LISTEN: "Say 'Yes' to get started or 'No' to exit.",
      WELCOME_TOP_PICK: 'My current top pick for you is %%SCHOOL%%. ',
      WELCOME_MENU:
        'You can search for schools by major or location, hear your favorites list, or look up a specific school. Which would you like to do?',
      SEARCH:
        'You can search over 3000 colleges by major, location, or ask about a school by name. Which would you like?',
      WELCOME_BACK_NO_PROFILE:
        "To get the best college matches, I'll need to know a little more about you. Would you like to finish your profile now?",
      WELCOME_BACK_INCOMPLETE_PROFILE:
        "It looks like you're not done filling out your profile. Do you want to finish it now?",
      WELCOME_HELP:
        'This skill will help you narrow down your selection of schools in the United States using a curated set of criteria. If you get stuck at any time just ask Alexa for help.',
      WELCOME_HELP_LISTEN: 'Are you ready to get started?',

      GENERIC_ERROR: "I didn't quite get that. ",
      NOT_AVAILABLE: 'Information Not Available',

      // Hints
      HINT: [
        'search for school',
        'search for schools in Washington',
        'search for computer science schools',
        'tell me my favorites'
      ],
      PROFILE_HINT: 'change profile',

      // Profile
      PROFILE_COMPLETE: "That's all for your profile.",
      PROFILE_ERROR:
        "I'm not sure about that. We're filling out your profile right now. You can finish it, or search for a school. Which would you like?",
      PROFILE_ITEM_NOT_FOUND:
        "That's not part of your profile. You can set your major, test scores, cost, home zip code, and degree. Which would you like?",
      NO_PREFERENCE_TEXT: 'No preference',
      PROFILE_UPDATE:
        'You can change your scores, degree, major, cost, or zip code. Which would you like to change?',

      // Profile - Score
      INTRODUCTION_SCORES:
        'To make searching easier, let\'s build your student profile. You can ask me to skip any of these questions if you\'re not sure or don\'t have a preference. OK. First question. You can save your <say-as interpret-as="spell-out">SAT</say-as> score or <say-as interpret-as="spell-out">ACT</say-as> score. Which one do you have?',
      INTRODUCTION_SCORES_SHORT:
        'Would you like to provide an <say-as interpret-as="spell-out">SAT</say-as> score or <say-as interpret-as="spell-out">ACT</say-as> score?',
      INTRODUCTION_ACT:
        'Ok. What is your cumulative <say-as interpret-as="spell-out">ACT</say-as> score?',
      INTRODUCTION_SAT: 'Ok. What is your <say-as interpret-as="spell-out">SAT</say-as> score?',
      NO_SCORE: 'Ok, you can always come back later to add your test scores.',
      NO_SAT_SCORE:
        'Ok, you can always come back later to add your <say-as interpret-as="spell-out">SAT</say-as> score.',
      NO_ACT_SCORE:
        'Ok, you can always come back later to add your <say-as interpret-as="spell-out">ACT</say-as> score.',
      SCORE_CONFIRM:
        'I\'ve noted your <say-as interpret-as="spell-out">%%SCORE%%</say-as> score of <say-as interpret-as="date" format="y">%%NUMBER%%</say-as>. ',
      SCORE_HELP:
        'Say <say-as interpret-as="spell-out">SAT<say-as>, <say-as interpret-as="spell-out">ACT<say-as>, or say no score if you don\'t know your score or don\'t have a score yet. Would you like to provide an <say-as interpret-as="spell-out">SAT</say-as> score, <say-as interpret-as="spell-out">ACT</say-as> score, or no score?',
      SCORE_NUMBER_HELP:
        'Please say your score number or say "none" if you don\'t have a score yet. What is your score?',
      SCORE_NUMBER_ERROR:
        'That\'s not a valid score. Please provide a <say-as interpret-as="spell-out">%%SCORE%%</say-as> score between %%RANGELOW%% and %%RANGEHIGH%%. What is your score?',
      SCORE_ERROR:
        'I didn\'t quite get that. I can store an <say-as interpret-as="spell-out">SAT<say-as> or <say-as interpret-as="spell-out">ACT<say-as> score. Which score do you have?',
      SCORE_CHANGE:
        'Your stored <say-as interpret-as="spell-out">%%SCORE%%</say-as> score is <say-as interpret-as="date" format="y">%%NUMBER%%</say-as>.',

      // Profile - Cost
      INTRODUCTION_COST:
        'I can limit your picks to a maximum annual cost for tuition and fees. What is the max amount you want to pay annually in <say-as interpret-as="spell-out">US</say-as> dollars?',
      NO_COST: "Ok, I won't filter results by cost.",
      COST_CONFIRM:
        'I\'ve saved your preferred max tuition and fees of <say-as interpret-as="unit">$%%CURRENCY%%</say-as>.',
      COST_HELP:
        'The cost is the average annual in-state net price for federal financial aid recipients, after aid from the school, state, or federal government. What is the max amount you want to pay annually in <say-as interpret-as="spell-out">US</say-as> dollars?',
      COST_NUMBER_ERROR:
        '%%NUMBER%% is not a valid amount. What is the max you want to pay in tuition and fees annually?',
      COST_ERROR:
        "I can't do that. I can store a max amount for your annual tuition and fees. You can also skip this question if you have no preference. What is the max amount you want to pay annually in <say-as interpret-as='spell-out'>US</say-as> dollars?",
      COST_CHANGE: 'Ok. <say-as interpret-as="unit">$%%CURRENCY%%</say-as>.',

      // Profile - Degree
      INTRODUCTION_DEGREE: "Do you want to pursue a bachelor's degree, or associate's degree?",
      DEGREE_CONFIRM: 'Schools that offer %%DEGREE%% degrees it is.',
      DEGREE_NO_PREFERENCE: "I'll expand my search to schools with both degree types.",
      DEGREE_HELP:
        "I filter schools that offer associate's degrees, bachelor's degrees, or search without a preference. Do you want to pursue a bachelor's degree, or associate's degree?",
      DEGREE_ERROR:
        "I'm not sure about that. I can search for associate's degrees, bachelor's degrees, or search without a preference. Which would you prefer?",
      DEGREE_CHANGE: 'Your current stored degree type is %%DEGREE%%.',

      // Profile - Major
      PROFILE_MAJOR: 'Do you know your major?',
      MAJOR: 'What field of study would you like to major in?',
      MAJOR_NONE: "Okay, I've noted undecided for you.",
      MAJOR_CONFIRM: "%%MAJOR%% is part of %%FIELD%%. I'll save that program to your profile.",
      MAJOR_HELP:
        'If you know your major, I can store it in your profile to limit future searches to your preferred field of study. What major would you like to search for?',
      MAJOR_ERROR:
        "I'm not sure about that one. If you're having trouble finding a particular major, try searching for a more generic one. What major would you like to search for?",
      MAJOR_CHANGE: 'Your current program of study is %%MAJOR%%.',

      // Profile - Home
      INTRODUCTION_HOME:
        'Would you like to store the zip code for your home address to search for schools within a specified distance?',
      HOME_ZIP_CODE: 'What is the five digit zip code for your home address?',
      HOME_ZIP_CODE_CONFIRM:
        'Home zip code set as <say-as interpret-as="digits">%%ZIP_CODE%%</say-as>.',
      HOME_NONE: 'Ok. You can always come back and add your home zip code later.',
      HOME_HELP:
        "To narrow down your search I'll look for schools by distance from your home zip code. You can also skip this question if you have no preference.",
      HOME_ZIP_CODE_ERROR: "That's not a valid zip code. What is your five digit home zip code?",
      HOME_ERROR: 'Please provide your five digit home zip code.',
      HOME_CHANGE:
        'You current stored zip code is <say-as interpret-as="digits">%%ZIP_CODE%%</say-as>.',

      // Profile Summary
      SUMMARY_PROFILE: 'You have set the following for your profile: ',
      SUMMARY_SCORE_NO:
        'No <say-as interpret-as="spell-out">SAT</say-as> or <say-as interpret-as="spell-out">ACT</say-as> score is saved. ',
      SUMMARY_SCORE: '<say-as interpret-as="spell-out">%%SCORE%%</say-as> score of %%NUMBER%%. ',
      SUMMARY_COST_NO: 'No max tuition and fees set. ',
      SUMMARY_COST: 'Tuition and fees of <say-as interpret-as="unit">$%%CURRENCY%%</say-as>. ',
      SUMMARY_MAJOR_NO: 'No major set. ',
      SUMMARY_MAJOR: 'Major in the field of %%MAJOR%%. ',
      SUMMARY_HOME_NO: 'And no zip code set. ',
      SUMMARY_HOME: 'And a zip code of <say-as interpret-as="digits">%%ZIP_CODE%%</say-as>. ',
      SUMMARY_DEGREE_NO: 'No degree set. ',
      SUMMARY_DEGREE: 'A degree preference of %%DEGREE%%. ',
      SUMMARY_PROMPT: 'You can change your profile or go back. Which would you like to do?',

      // Language for full search
      START:
        'You can search for schools by major, location, or ask about a school by name. Which would you like?',
      START_LISTEN:
        'Say search by major, search by location, or search for specific school. Which would you like?',
      START_HELP:
        'You can search for colleges starting with your chosen major, your desired location, or look up a specific college by name. Which would you like to do?',
      SEARCH_ERROR: "I didn't quite understand you. We're refining your search right now.",
      REFINE_SEARCH_UNACCEPTED:
        "That's not a valid option. You can refine your search or start over. Which would you like to do?",

      INTRODUCTION_NO_PREFERENCE: 'Ok, you have no preference.',

      INTRODUCTION_MAJOR: 'What major would you like to search for?',
      INTRODUCTION_MAJOR_PROFILE:
        'Do you want to limit your search to schools with %%MAJOR%% majors?',

      INTRODUCTION_COST_CONFIRM:
        'Do you want to limit your search to schools under <say-as interpret-as="unit">$%%COST%%</say-as>?',
      INTRODUCTION_SCORE_CONFIRM:
        'You saved your <say-as interpret-as="spell-out">%%SCORE%%</say-as>. Do you want to include it in your search?',
      INTRODUCTION_HOME_CONFIRM: 'Do you want to use the zip code stored in your profile?',

      INTRODUCTION_LOCATION_STATES: 'In which state would you like to study?',
      INTRODUCTION_LOCATION_STATES_VALUE: "Ok, I'll look for schools in %%STATES%%.",

      INTRODUCTION_LOCATION_ZIP_CODE_DISTANCE:
        "What's the maximum distance from your zip code you want to search?",
      INTRODUCTION_LOCATION_ZIP_CODE_DISTANCE_VALUE:
        "Ok, I'll search for schools within %%DISTANCE%% miles.",

      INTRODUCTION_SCHOOL_TYPE: 'Do you prefer a public or a private school?',
      INTRODUCTION_SCHOOL_TYPE_PUBLIC: "I've noted your preference for a public school.",
      INTRODUCTION_SCHOOL_TYPE_PRIVATE: "I've noted your preference for a private school.",
      INTRODUCTION_SCHOOL_TYPE_HELP:
        'By understanding your preference for public or private schools, I can narrow down your school search results. You can also skip this question if you have no preference. Do you prefer a public or private school?',

      INTRODUCTION_SCHOOL_SIZE: 'Are you interested in a small, medium, or large school?',
      INTRODUCTION_SCHOOL_SIZE_SMALL: "Ok, I'll search for only small-sized schools.",
      INTRODUCTION_SCHOOL_SIZE_MEDIUM: "Ok, I'll search for only medium-sized schools.",
      INTRODUCTION_SCHOOL_SIZE_LARGE: "Ok, I'll search for only large-sized schools.",
      INTRODUCTION_SCHOOL_SIZE_NO_PREFERENCE: "Ok, I'll search for schools of all sizes.",
      INTRODUCTION_SCHOOL_SIZE_HELP:
        'School size is often a deciding factor for potential students, some students want a personal feel and others want the options offered by a larger school. Are you interested in a small, medium, or large school?',

      // Basic search
      SEARCH_BY_SEARCH: 'Want to search again?',
      SEARCH_BY_SEARCH_RESULTS: 'The following schools were found... %%SCHOOL_LIST%%',
      SEARCH_BY_NO_RESULTS: "I didn't find any schools like that. Want to search again?",
      SEARCH_MORE_ONE:
        'You can refine your search or hear the first %%NUMBER%% results. Which would you like?',
      SEARCH_FEW_RESULTS: 'You can refine your search or hear your results. Which would you like?',

      // Basic search - Search by Name
      SEARCH_BY_NAME_SCHOOL_NAME: 'Searching for %%SCHOOL_NAME%%.',
      SEARCH_BY_NAME_PROMPT: 'What school would you like more information about?',
      SEARCH_BY_NAME_SEARCH_ERROR: 'The search for %%SCHOOL_NAME%% failed, please try again later.',

      // Basic search - Search by State/Region
      SEARCH_BY_LOCATION: 'Searching for schools in %%LOCATION%%.',
      SEARCH_BY_LOCATION_PROMPT: 'In what state or region would you like to search for schools?',
      SEARCH_BY_LOCATION_REFINE:
        'I found <say-as interpret-as="number">%%COUNT%%</say-as> schools in %%LOCATION%%. ',
      SEARCH_BY_LOCATION_SEARCH_ERROR: 'The search for %%LOCATION%% failed. ',
      REGION_LIST:
        'The available regions are New England, Mid-Atlantic, Great Lakes, Plains, Southeast, Southwest, Far West, and Rocky Mountains.',

      LOCATION_HELP:
        'You can ask me for a state, or for a region like New England, Mid-Atlantic, Great Lakes, Plains, Southeast, Southwest, Far West, or Rocky Mountains. Which state or region would you like to search for?',

      // Basic search - Search by Major
      SEARCH_BY_MAJOR: 'Searching for %%MAJOR%%.',
      SEARCH_BY_MAJOR_PROMPT: 'Okay, what major would you like to search for?',
      SEARCH_BY_MAJOR_SEARCH_ERROR: 'The search for %%MAJOR%% failed. ',
      SEARCH_BY_MAJOR_REFINE:
        'I found <say-as interpret-as="number">%%COUNT%%</say-as> schools for %%MAJOR%%. ',

      // Full search
      RESULTS_TITLE: 'Search Results',
      REVIEW_ERROR: 'Unable to get your results, please try again soon.',
      REVIEW_RESULTS_ONE:
        'You now have one result. You can hear your result, search for a school by name, or review your favorites list. Which would you like?',
      REVIEW_RESULTS:
        'You now have <say-as interpret-as="number">%%COUNT%%</say-as> results. You can hear the first %%NUMBER%% schools, search for a school by name, or review your favorites list. Which would you like?',
      REVIEW_REPROMPT:
        'You can hear your results, refine your search, search for a school, or review your favorites. Which would you like?',
      REVIEW_NO_RESULTS:
        'I didn’t find any schools like that. You can refine your search or start over. Which would you like?',

      // Results
      LIST_SCHOOLS_INTRO: 'Here are your search results. ',
      LIST_SCHOOLS_INTRO_ONE: 'Here is your search result. ',
      LIST_SCHOOLS_PROMPT:
        'You can hear details about one of these, or hear more results. Which would you like?',
      LIST_SCHOOLS_END_OF_LIST:
        "That's the end of your results. Would you like to hear them again?",
      LIST_SCHOOLS_NO_ITEMS_PROMPT: "I didn't find any results. Would you like to search again?",
      LIST_SCHOOLS_NO_ITEMS_REPROMPT: 'Would you like to refine your search?',
      LIST_SCHOOLS_HELP:
        'This list is filtered by the preferences you set in your profile. You can ask to hear more information about a school on your list. Want to hear your list again?',

      // Reset search
      RESET_PROMPT: 'Are you sure you want to reset your search?',
      RESET_HELP:
        'Resetting your search will allow you to change your results. Are you sure you want to reset your search?',
      RESET_CONFIRM: "Ok. I've reset your search.",

      // Favorites list
      FAVORITES_TITLE: 'Favorite Schools',
      FAVORITES_HELP:
        'You can add up to 12 schools to your favorites list from your search results. To add schools, you can search for one by name, location, or major. Which would you like to do?',
      FAVORITES_OVERVIEW: 'You have %%COUNT%% schools on this list.',
      FAVORITES_OVERVIEW_ONE: 'You have %%COUNT%% school on this list.',
      FAVORITES_EMPTY:
        "There aren't any favorites on your list yet. To add schools, you can search for one by name, location, or major. Which would you like to do?",
      FAVORITES_NO_MORE_ITEMS:
        "That's the end of your favorites list. Would you like to hear it again?",
      FAVORITES_CURRENT_ITEM_PROMPT:
        'You can hear more information about a school or remove a school from your list. Which would you like to do?',
      FAVORITES_CURRENT_ITEM_REPROMPT:
        'You can hear more information about %%SCHOOL_NAME%%, remove it from your list or hear the next school. Which would you like?',
      FAVORITES_REMOVE_CONFIRM: 'Removed %%SCHOOL_NAME%% from your list.',
      FAVORITES_FROM_SEARCH:
        'You can hear your results again or list your favorites. Which would you like to do?',
      FAVORITES_ADD_PROMPT: 'Would you like to add this school to your favorites list?',
      FAVORITES_ADDED:
        'Added %%SCHOOL%% to your list. You can hear your results again or list your favorites. Which would you like to do?',
      FAVORITES_NOT_FOUND: 'That school was not found. Please try again.',
      FAVORITES_DUPLICATE:
        '%%SCHOOL%% is already in your list. You can search for another school by name or view your favorites. Which would you like to do?',

      FAVORITES_DELETE_ERROR:
        "I didn't quite understand. You can delete a school from your favorites using the school's name or number in the list. Which school would you like to delete?",
      FAVORITES_ADD_ERROR:
        'I had a problem adding a school for you. Try searching by name again just in case.',
      FAVORITES_ERROR:
        "I'm not sure about that. I can read your list of favorites, remove a school from your list, or you can search for a school to add. Which do you want to do?",

      // School details
      MORE_INFORMATION_ERROR:
        "I can't get that information right now. You can hear your results again or search for a school by name. Which would you like to do?",
      MORE_INFORMATION_OVERVIEW:
        '%%SCHOOL_NAME%% is a school in %%CITY%%, %%STATE%%. In 2015, in-state tuition was <say-as interpret-as="unit">$%%TUITION_IN_STATE%%</say-as> and out-of-state tuition was <say-as interpret-as="unit">$%%TUITION_OUT_OF_STATE%%</say-as>.',
      MORE_INFORMATION_CARD:
        'Location: %%STATE%%\n2015 Tuition (In-State): $%%TUITION_IN_STATE%%\n2014 Tuition (Out-Of-State): $%%TUITION_OUT_OF_STATE%%\n',
      MORE_INFORMATION_SAVE_PROMPT:
        'You can save this school to your favorites list or go back. Which would you like to do?',
      MORE_INFORMATION_FAV_PROMPT:
        'You can go back or look up a school. Which would you like to do?',

      // Error handling
      ERROR_NOT_UNDERSTOOD: "I didn't catch that. ",
      ERROR_CANT: "I don't know that one. ",
      ERROR_INVALID_VALUE: "That's not a valid value. ",

      GOODBYE: 'Thank you for using College Finder.'
    }
  }
});
