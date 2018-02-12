# mongoose-increment
Mongoose plugin to generate incremented field

## Installation

Install via [npm](https://www.npmjs.com/):

```
$ npm install mongoose-increment
```

## Documentation

### Options

* `type`             {Type} field type (optional, default value is `Number`)
* `modelName`        {String} mongoose model name
* `fieldName`        {String} mongoose increment field name
* `start`            {Integer} start number for counter (optional, default `1`)
* `increment`        {Integer} number to increment counter (optional, default `1`)
* `prefix`           {String/Function} counter prefix (optional, default value is an empty `String`)
* `suffix`           {String/Function} counter suffix (optional, default value is an empty `String`)
* `unique`           {Boolean} unique field (optional, default `true`)
* `resetAfter`       {Integer} reset counter (optional, default `0`)
* `hasVersion`       {Boolean} has version (optional, default `false`)
* `startVersion`     {Integer} start number for version (optional, default `1`)
* `delimiterVersion` {String} delimiter for version counter (optional, default `-`)

### Methods

#### instance.nextSequence()

Return a fulfilled promise when increment field has been setted

#### instance.parseSequence()

Return an object which contain instance prefix, suffix and counter.

#### instance.nextVersion() is `hasVersion` is `true`

Set the next version from the current document version.

### Statics

#### Model.resetSequence()

Return a fulfilled promise when sequence has been reset

## Examples

### default option
````javascript
var mongoose = require('mongoose');
var mongooseIncrement = require('mongoose-increment');
var increment = mongooseIncrement(mongoose);

var TestSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
});

TestSchema.plugin(increment, {
  modelName: 'Test_increment',
  fieldName: 'increment_field',
});

var TestIncrement = mongoose.model('Test_increment', TestSchema);

var doc = new TestIncrement({ label: 'label_1' });

doc.save(); // doc saved with `increment_field` === 1
````

### type option
````javascript
var mongoose = require('mongoose');
var mongooseIncrement = require('mongoose-increment');
var increment = mongooseIncrement(mongoose);

var TestSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
});

TestSchema.plugin(increment, {
  type: String,
  modelName: 'Test_increment',
  fieldName: 'increment_field',
});

var TestIncrement = mongoose.model('Test_increment', TestSchema);

var doc = new TestIncrement({ label: 'label_1' });

doc.save(); // doc saved with `increment_field` === '1'
````

### `start` and `increment` set

````javascript
var mongoose = require('mongoose');
var mongooseIncrement = require('mongoose-increment');
var increment = mongooseIncrement(mongoose);

var TestSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
});

TestSchema.plugin(increment, {
  modelName: 'Test_increment',
  fieldName: 'increment_field',
  start: 300,
  increment: 3,
});

var TestIncrement = mongoose.model('Test_increment', TestSchema);

var doc1 = new TestIncrement({ label: 'label_1' });
doc1.save(); // doc saved with `increment_field` === 300
doc1.parseSequence(); // => { prefix: '', counter: 300, suffix: '' }

var doc2 = new TestIncrement({ label: 'label_2' });
doc2.nextSequence(); // `increment_field` === 303
doc1.parseSequence(); // => { prefix: '', counter: 303, suffix: '' }

````

### `resetAfter` and `unique` options
````javascript
var mongoose = require('mongoose');
var mongooseIncrement = require('mongoose-increment');
var increment = mongooseIncrement(mongoose);

var TestSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
});

TestSchema.plugin(increment, {
  modelName: 'Test_increment',
  fieldName: 'increment_field',
  unique: false,
  resetAfter: 2,
});

var TestIncrement = mongoose.model('Test_increment', TestSchema);

var doc1 = new TestIncrement({ label: 'label_1' });

doc1.save(); // doc1 saved with `increment_field` === 1

var doc2 = new TestIncrement({ label: 'label_2' });

doc2.save(); // doc2 saved with `increment_field` === 2

var doc3 = new TestIncrement({ label: 'label_3' });

doc3.save(); // doc3 saved with `increment_field` === 1
````

### `prefix` and `suffix` set
````javascript
var mongoose = require('mongoose');
var mongooseIncrement = require('mongoose-increment');
var increment = mongooseIncrement(mongoose);

var TestSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  flag: {
    type: Boolean,
    required: true,
  },
});

TestSchema.plugin(increment, {
  type: String,
  modelName: 'Test_increment',
  fieldName: 'increment_field',
  prefix: 'P',
  suffix: (doc) => {
    return doc.flag ? 'TRUE' : 'FALSE';
  },
});

var TestIncrement = mongoose.model('Test_increment', TestSchema);

var doc1 = new TestIncrement({ label: 'label_1', flag: true });
doc1.save(); // doc saved with `increment_field` === 'P1TRUE'
doc1.parseSequence(); // => { prefix: 'P', counter: '1', suffix: 'TRUE' }

TestIncrement.resetSequence();

var doc2 = new TestIncrement({ label: 'label_1', flag: false });
doc2.save(); // doc saved with `increment_field` === 'P1FALSE'
doc2.parseSequence(); // => { prefix: 'P', counter: '1', suffix: 'FALSE' }
````

### `hasVersion` true
````javascript
var mongoose = require('mongoose');
var mongooseIncrement = require('mongoose-increment');
var increment = mongooseIncrement(mongoose);

var TestSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
});

TestSchema.plugin(increment, {
  modelName: 'Test_increment',
  fieldName: 'increment_field',
  hasVersion: true,
  startVersion: 0,
});

var TestIncrement = mongoose.model('Test_increment', TestSchema);

var doc = new TestIncrement({ label: 'label_1' });

doc.save(); // doc saved with `increment_field` === 1-0-
````

## Note

Inspired by [mongoose-auto-increment](https://github.com/chevex-archived/mongoose-auto-increment)

## Contributing

This project is a work in progress and subject to API changes, please feel free to contribute
