[![Build Status](https://travis-ci.org/jkelvie/alexa-sample-college-finder-nodejs.svg?branch=master)](https://travis-ci.org/jkelvie/alexa-sample-college-finder-nodejs)
[![codecov](https://codecov.io/gh/jkelvie/alexa-sample-college-finder-nodejs/branch/master/graph/badge.svg)](https://codecov.io/gh/jkelvie/alexa-sample-college-finder-nodejs)


## Alexa Sample: College Finder (Node.js)

This is a complex Node.js sample skill with examples of DynamoDB integration, display templates, dialog management, state management, contextual help and errors, and entity resolution.

## Getting Started

### Data Source
This skill queries the College Scorecard API public dataset. For more information view the documentation on the College Scorecard [site](https://collegescorecard.ed.gov/data/documentation/). 

### Environment Variables

The skill references environment variables in the config.js file for instance specific data. In order to successfully deploy and launch the skill you need to add the following environment variables to your deployment:

1. **SKILL_ID** - The application ID for the skill
2. **API_KEY** - Request a key for the College Scorecard api on the api.data.gov [website](https://api.data.gov/signup/). 
3. **MAIN_IMAGE**, **LIST_IMAGE**, **GRAD_IMAGE** - These are all images that appear as backgrounds throughout the skill for devices with displays. You can find example images in the config.js file. 

## License

This library is licensed under the Amazon Software License.
