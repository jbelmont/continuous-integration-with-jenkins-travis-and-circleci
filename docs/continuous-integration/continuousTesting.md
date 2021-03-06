# Continuous Testing

* [Automate Unit Tests](#automate-unit-tests)
* [Automate Component Tests](#automate-component-tests)
* [Automate System Tests](#automate-system-tests)
* [Automate Functional Tests](#automate-functional-tests)
* [Categorize Developer Tests](#categorize-developer-tests)
* [Run faster tests first](#run-faster-tests-first)
* [Write Tests for Defects](#write-tests-for-defects)
* [Make Component Tests Repeatable](#make-component-tests-repeatable)
* [Limit Test Cases to One Asset](#limit-test-cases-to-one-asset)

## Automate Unit Tests

* Unit tests verify the behavior of small elements in a software system which can be a single class/function
* Some unit tests will employ mocks, which are simple objects that substitute more complicated functions/classes
* Key aspect for unit tests is to have no relianze on outside dependencies like databases
    * This both increase the time to setup and run unit tests and make your code too coupled
* Unit tests can be written early in the development cycle
* Unit tests are alse an efficient way to debug while coding

Example Unit Test using Ava.js

```javascript
test('check error object from errorHandler with proper arguments', t => {
  t.plan(1);
  const foo = require('../helpers').foo();
  const actual = errorHandler.generateError({
    err: foo,
    moduleName: 'foo',
    statusCode: 'foo error'
  });
  const expected = {
    statusCode: 'foo error',
    message: 'Foo Error: Foo',
    errorLineAndColumn: 'foo:4:10)'
  };
  t.deepEqual(actual, expected, `should return ${expected}`);
});
```

## Automate Component Tests

* Component/Integration/Subsystem tests verify portions of a system
    * May require fully installed system or external dependencies
        * Databases
        * file systems
        * network endpoints
* Integration tests are usually longer running tests than Unit Tests

Example Integration Test using Ava.js, Supertest and Nock

```javascript
let postScope, payload, deleteScope;
test.before(() => {
  const requestGetHeaders = {
    reqheaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };

  payload = {
    'user': {
      'email': 'bigkahuna@surfsup.com',
      'first_name': 'Big',
      'gender': 'Male',
      'id': 57,
      'last_name': 'Kahuna'
    }
  };

  postScope = nock(requestURL, requestGetHeaders)
              .get(addUserUrl)
              .reply(201, payload);

  deleteScope = nock(requestURL)
                .delete(removeUserUrl)
                .reply(204);
});

test.after('cleanup', () => {
  nock.cleanAll();
});

test.cb('add user url should return 201 response and the newly added user', t => {
  t.plan(3);
  const created = responseCodes['created'];
  const req = request.agent(requestURL);
  req
    .get(addUserUrl)
      .set({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      })
      .expect(res => {
        t.is(res.status, created, '201 Status Code should be returned');
        t.deepEqual(res.body, payload);
      })
      .end(() => {
        t.is(postScope.isDone(), true, `POST ${addUserUrl} Nock Spy called`);
        t.end();
      });
});
```

* Integration level tests typically use more dependencies than unit tests
    * Integration tests don't use as many dependencies as a System Test though

## Automate functional tests

* Functional tests can be automated using tools like Selenium and nightwatchjs
* Functional tests operate froma user's perspective and are typically the longest running tests in your test suite

## Automate System Tests

* System tests are longer to run than integration/component tests and usually involve multiple components

## Categorize Developer Tests

* By categorizing your tests into distinct "buckets" you can run slower running tests
    * at different intervals in your automated test suite

## Run faster tests first

* Run your unit tests prior to running component, system, and functional tests.
* Make sure to categorize your tests

## Write Tests for Defects

* Increase your code coverage by writing tests based on new defects
    * Ensure that the defect does not surface again.
    * This is also known as a regression test case

## Make Component Tests Repeatable

* Use database testing frameworks to make certain that the data is at a "known" state
    * This helps make Integration Tests repeatable

## Limit Test Case assertions if possible

* Spend less time tracking down the cause of a test failure by limiting your automated tests to 1 to 3 assertions
