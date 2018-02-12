'use strict';

/**
 * Mongoose plugin
 */
const _ = require('lodash');
const Promise = require('bluebird');

const mongooseIncrement = function(mongoose) {
  /**
   * Setup counter schema and model
   *
   * @type {mongoose}
   */
  const CounterSchema = new mongoose.Schema({
    model: {
      type: String,
      require: true,
    },
    field: {
      type: String,
      require: true,
    },
    count: {
      type: Number,
      default: 0,
    },
  });

  const Counter = mongoose.model('_Counter', CounterSchema);

  /**
   * Reset counter sequence start
   *
   * @param {Object} options Mongoose plugin options
   * @return {Promise} Promise fulfilled when sequence has been reset
   */
  function resetSequence(options) {
    return Counter.findOneAndUpdate(
      { model: options.model, field: options.field },
      { count: options.start - options.increment },
      { new: true, upsert: true });
  }

  /**
   * Calculate the current count
   *
   * @param {Object} options Counter options
   * @param {Number} count current count increment
   * @param {Object} resource Mongoose model instance
   *
   * @return {Number} new count
   */
  function calculateCount(options, count, resource) {
    let value = '';

    if (_.isFunction(options.prefix)) {
      value += options.prefix(resource);
    }
    else if (options.prefix) {
      value += options.prefix.toString();
    }

    value += count;

    if (options.hasVersion) {
      value += `${options.delimiterVersion}${options.startVersion}${options.delimiterVersion}`;
    }

    if (_.isFunction(options.suffix)) {
      value += options.suffix(resource);
    }
    else if (options.suffix) {
      value += options.suffix.toString();
    }

    return value;
  }

  /**
   * Retrieve the next sequence in the counter and update field
   *
   * @param {Object} options Counter options
   * @param {Object} resource Mongoose model instance
   * @param {Function} next Callback handler
   */
  function nextCount(options, resource, next) {
    if (!resource.isNew || !_.isUndefined(resource[options.field])) {
      return next();
    }
    return Counter.findOne({
      model: options.model,
      field: options.field,
    }).then((item) => {
      let promise = Promise.resolve(item);
      if (!item) {
        promise = initCounter(options);
      }
      promise.then((counter) => {
        counter.count += options.increment;

        if (options.resetAfter > 0 && counter.count > options.resetAfter) {
          counter.count = options.start;
        }

        resource[options.field] = calculateCount(options, counter.count, resource);

        return counter.save(next);
      });
    }).catch(next);
  }

  /**
   * Parse the sequence to get the prefix, counter and suffix
   *
   * @param {Object} options Counter options
   *
   * @return {Object} sequence parsed
   */
  function parseSequence(options) {
    const parsed = {
      prefix: '',
      counter: '',
      suffix: '',
    };

    if (_.isFunction(options.prefix)) {
      parsed.prefix = options.prefix(this);
    }
    else if (options.prefix) {
      parsed.prefix = options.prefix.toString();
    }

    if (_.isFunction(options.suffix)) {
      parsed.suffix = options.suffix(this);
    }
    else if (options.suffix) {
      parsed.suffix = options.suffix.toString();
    }

    let counter = this[options.field];

    if (_.isNumber(this[options.field])) {
      counter = String(counter);
    }

    parsed.counter = counter.substring(parsed.prefix.length, counter.length - parsed.suffix.length);

    if (_.isNumber(this[options.field])) {
      parsed.counter = Number(parsed.counter);
    }

    if (options.hasVersion) {
      const tab = parsed.counter.split(options.delimiterVersion);

      parsed.counter = tab[0];
      parsed.version = tab[1];
    }

    return parsed;
  }

  /**
   * Retrieve the next sequence in the counter and update field
   *
   * @param {Object} options Counter options
   * @return {Promise} Promise fulfilled when increment field has been setted
   */
  function nextSequence(options) {
    const resource = this;
    return new Promise((resolve, reject) => {
      nextCount(options, resource, (err) =>
        (err ? reject(err) : resolve())
      );
    });
  }

  /**
   * Set the next version from the current document version
   *
   * @param {Object} options Counter options
   * @return {Number} new version counter
   */
  function nextVersion(options) {
    const opts = _.cloneDeep(options);
    const parsedSequence = this.parseSequence(options);

    opts.startVersion = Number(parsedSequence.version) + 1;

    this[options.field] = calculateCount(opts, parsedSequence.counter, this);

    return this[options.field];
  }

  /**
   * Create a new counter for the current model
   *
   * @param {Object} options Counter options
   * @return {Object} counter mongoose doc
   */
  function initCounter(options) {
    const newCount = new Counter({
      model: options.model,
      field: options.field,
      count: options.start - options.increment,
    });

    return newCount.save();
  }

  /**
   * Mongoose plugin, adds a counter for a given `model` and `field`, also add
   * the autoincrement field into the schema.
   *
   * @param {Object} schema Mongoose schema
   * @param {Options} options Additional options for autoincremented field
   *   @property {String}           modelName            mongoose model name
   *   @property {String}           fieldName            mongoose increment field name
   *   @property {Integer}          [start]              start number for counter, default `1`
   *   @property {Integer}          [increment]          number to increment counter, default `1`
   *   @property {String/Function}  [prefix]             counter prefix, default ``
   *   @property {String/Function}  [suffix]             counter suffix, default ``
   *   @property {Boolean}          [unique]             unique field, default `true`
   *   @property {Integer}          [resetAfter]         reset counter, default `0`
   *   @property {Boolean}          [hasVersion]         has version, default `false`
   *   @property {Integer}          [startVersion]       start number for version, default `1`
   *   @property {String}           [delimiterVersion]   delimiter for version counter, default `-`
   */
  return function plugin(schema, options) {
    if (!_.isPlainObject(options)) {
      throw new Error('Mongoose Increment Plugin: require `options` parameter');
    }
    if (!_.isString(options.modelName)) {
      throw new Error('Mongoose Increment Plugin: require `options.modelName` parameter');
    }
    if (!_.isString(options.fieldName)) {
      throw new Error('Mongoose Increment Plugin: require `options.fieldName` parameter');
    }
    if (options.start && !_.isInteger(options.start)) {
      throw new Error('Mongoose Increment Plugin: require `options.start` parameter must be an integer');
    }
    if (options.increment && !_.isInteger(options.increment)) {
      throw new Error('Mongoose Increment Plugin: require `options.increment` parameter must be an integer');
    }
    if (options.startVersion && !_.isInteger(options.startVersion)) {
      throw new Error('Mongoose Increment Plugin: require `options.startVersion` parameter must be an integer');
    }

    const opts = {
      model: options.modelName,
      field: options.fieldName,
      start: options.start || 1,
      increment: options.increment || 1,
      prefix: options.prefix || '',
      suffix: options.suffix || '',
      type: options.type || Number,
      unique: options.unique,
      resetAfter: options.resetAfter || 0,
      hasVersion: options.hasVersion || false,
      startVersion: options.startVersion || 1,
      delimiterVersion: options.delimiterVersion || '-',
    };

    if (opts.unique !== false) opts.unique = true;

    const fieldSchema = {};

    fieldSchema[opts.field] = {
      type: opts.type,
      require: true,
      unique: opts.unique,
    };

    schema.add(fieldSchema);

    schema.methods.nextSequence = _.partial(nextSequence, opts);
    schema.methods.parseSequence = _.partial(parseSequence, opts);

    if (opts.hasVersion) {
      schema.methods.nextVersion = _.partial(nextVersion, opts);
    }

    schema.statics.resetSequence = _.partial(resetSequence, opts);

    schema.pre('save', function preSave(next) {
      nextCount(opts, this, next);
    });
  }
}

module.exports = mongooseIncrement;
