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
  // Alexa Skill ID
  APPID: process.env.SKILL_ID,
  // DynamoDB Table name
  TABLE_NAME: 'CollegeFinderUsers',
  // College Scorecard API details
  API_URI: `https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key=${
    process.env.API_KEY
  }`,
  // Images for displays
  BACKGROUND_IMAGE: process.env.MAIN_IMAGE, // https://unsplash.com/photos/cXUOQWdRV4I
  BACKGROUND_IMAGE_2: process.env.LIST_IMAGE, // https://unsplash.com/photos/PdDBTrkGYLo
  MAIN_IMAGE: process.env.GRAD_IMAGE // https://unsplash.com/photos/2RouMSg9Rnw
});
