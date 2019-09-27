'use strict';

const Component = require('@serverless/aws-s3');
const { Context, extractInputs, extractState, handlerWrapper } = require('./utils');

function handler(event) {
  const inputs = extractInputs(event);
  // NOTE: apparently OldResourceProperties is only passed-in when
  // dealing with Update requests --> https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/crpg-ref-requests.html
  // therefore we re-use the inputs as 'state' when dealing with `Delete` requests
  let state = {};
  if (event.RequestType === 'Update') {
    state = extractState(event);
  } else if (event.RequestType === 'Delete') {
    state = inputs;
  }

  const config = {}; // used to configure our context

  const context = new Context(state, config);
  const component = new Component(undefined, context);
  return component.init().then(() => {
    if (event.RequestType === 'Create') {
      return create(component, inputs);
    } else if (event.RequestType === 'Update') {
      return update(component, inputs);
    } else if (event.RequestType === 'Delete') {
      return remove(component);
    }
    throw new Error(`Unhandled RequestType ${event.RequestType}`);
  });
}

function create(component, inputs) {
  return component.default(inputs);
}

// TODO: check if the name changes in order to do a replacement
function update(component, inputs) {
  return component.default(inputs);
}

function remove(component) {
  return component.remove();
}

module.exports = {
  handler: handlerWrapper(handler, 'ComponentsViaCustomResourceS3'),
  // TODO: remove this export since it's only used in local tests
  handlerLocalTest: handler,
};
