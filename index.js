const fs = require('fs')

const insomnia = JSON.parse(fs.readFileSync('insomnia.json').toString('utf-8'))
const config = JSON.parse(fs.readFileSync('config.json').toString('utf-8'))

// set our base content
let output = {
  openapi: '3.0.1',
  info: {
    description: config.description,
    version: config.version,
    title: config.title
  },
  paths: {},
  components: {
    schemas: {}
  }
}

// get the resources array
const resources = insomnia.resources

// our folders are going to be the ID as the key, with the name as the value
// this is so we can match our children to their parents really fast
let folders = {}
for (let item of resources) {
  if (item._type === "request_group") {
    folders[item._id] = item.name
  }
}

function isEmpty(obj) {
  for(var prop in obj) {
    if(obj.hasOwnProperty(prop)) { return false }
  }
  return JSON.stringify(obj) === JSON.stringify({});
}

/*******************************************
**************** Schemas *******************
*******************************************/

// create a schema for each component
function createComponentSchemas() {
  for (let x in folders) {
    output.components.schemas[folders[x]] = {
      description: "",
      type: "object",
      properties: {}
    }

    let component = config.components[folders[x]]

    // for every key in the components for that folder
    for (let y in component) {
      if (typeof component[y] !== "object") {
        output.components.schemas[folders[x]].properties[y] = {
          type: typeof component[y]
        }
      }
    }
  }
}


createComponentSchemas()



/*****************************************
**************** Paths *******************
*****************************************/

function createPath(item) {
  // add the path name
  if (output.paths[item.name] === undefined) {
    output.paths[item.name] = {}
  }

  let method = item.method.toLowerCase()

  // add the method on the path, converted to lower case
  output.paths[item.name][method] = {
    // associate it with its parent folder
    tags: [folders[item.parentId]],
    // give it a uniqe ID
    operationId: item._id,
    responses: {
      '200': {
        description: "successful operation",
        content: {
          "application/json": {
            schema: {
              "$ref": '#/components/schemas/' + folders[item.parentId]
            }
          }
        }
      },
      '400': {
        description: "Invalid input",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                err: {
                  type: "string"
                }
              }
            }
          }
        }
      }
    }
  }

  // capture anything in curly braces
  let findPathVariables = /{(.+?)}/
  // run a regex on our path
  let variables = findPathVariables.exec(item.name)

  // if there are variables in the route
  if (variables) {
    output.paths[item.name][method].parameters = [{
      name: variables[1],
      in: "path",
      description: "",
      schema: {
        type: "string"
      },
      required: true
    }]

    // we know there is also a chance to mess up those variables,
    // so add in the option to have a 404 error
    output.paths[item.name][method].responses["404"] = {
      description: variables[1] + " does not exist",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              err: {
                type: "string"
              }
            }
          }
        }
      }
    }
  }
}

// create a schema for each thing that we ever post/put/patch to the database
function createBodySchemas(item) {
  let results = {
    type: "object",
    properties: {}
  }
  let body = JSON.parse(item.body.text)
  for (let x in body) {
    if (typeof body[x] !== "object") {
      results.properties[x] = {
        type: typeof body[x]
      }
    }
  }
  return results
}


function createRequestBody(item) {
  let method = item.method.toLowerCase()

  if (method !== "delete") {
    // set our request body to true
    output.paths[item.name][method].requestBody = {
      required: true,
      content: {}
    }

    if (!isEmpty(item.body) && item.body) {
      // set our schema to the content of our body
      output.paths[item.name][method].requestBody.content[item.body.mimeType] = {
        schema: {}
      }

      output.paths[item.name][method].requestBody.content[item.body.mimeType].schema = createBodySchemas(item)
    }
  }
}


// for every item we have
for (let item of resources) {
  //if the item is a request type
  if (item._type === "request") {

    createPath(item)

    // if the body is not empty
    if (!isEmpty(item.body)) {
      createRequestBody(item)
    }
  }
}


/*************************************************
**************** Write to File *******************
*************************************************/

// write to our output file
const outputFile = fs.writeFile('docs.json', JSON.stringify(output, null, 2), function(err) {
  if (err) {
    console.log(err);
  }
  console.log("Saved the output file");
})
