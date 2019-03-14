[![Build Status](https://travis-ci.org/alexa/skill-sample-nodejs-college-finder.svg?branch=master)](https://travis-ci.org/alexa/skill-sample-nodejs-college-finder)

## Alexa Sample: College Finder (Node.js)

This is a complex and useful Node.js sample skill with examples of DynamoDB integration, display templates, dialog management, state management, contextual help and errors, and entity resolution.

## Getting Started

### Data Source
This skill queries the College Scorecard API public dataset. For more information view the documentation on the College Scorecard [site](https://collegescorecard.ed.gov/data/documentation/). 

### Jargon.

make sure you install jargon for multi-language support by running this in the folder skill_root\lambda\custom:

`npm i --save @jargon/alexa-skill-sdk`
`yarn add @jargon/alexa-skill-sdk`

### Environment Variables

The skill references environment variables in the config.js file for instance specific data. In order to successfully deploy and launch the skill you need to add the following environment variables to your deployment:

1. **SKILL_ID** - The application ID for the skill
2. **API_KEY** - Request a key for the College Scorecard api on the api.data.gov [website](https://api.data.gov/signup/). 
3. **MAIN_IMAGE**, **LIST_IMAGE**, **GRAD_IMAGE** - These are all images that appear as backgrounds throughout the skill for devices with displays. You can find example images in the config.js file. 

Here is how to add those variables using the aws command line:

`aws lambda update-function-configuration --function-name ask-custom-University-Finder-default --environment Variables={SKILL_ID=amzn1.ask.skill.9307124e-4e1f-4be3-acf2-7555243989d3,LIST_IMAGE=https://s3.amazonaws.com/college-finder-display/list.jpg,API_KEY=kE8zKQcd5Hajuv15LBuE044KcBqWCbZcvJTJV0U4,GRAD_IMAGE=https://s3.amazonaws.com/college-finder-display/charles-deloye-660433-unsplash.jpg,MAIN_IMAGE=https://s3.amazonaws.com/college-finder-display/main.jpg}`


## Testing the Skill

Take a look at the unit-tests and end-to-end tests provided for this skill by [Bespoken](https://bespoken.io). 

* The unit-tests ensure the code is working correctly
* End-to-end tests ensure the skill as a whole is working right
* Read more [here](/test)

## License

This sample is licensed under the Amazon Software License.
