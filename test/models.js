'use strict';

const mongoose = require('mongoose');
const increment = require('../increment');

const DefaultSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
});

DefaultSchema.plugin(increment, {
  modelName: 'Default',
  field: 'increment_field',
});

const BasicSuffixPrefixSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
});

BasicSuffixPrefixSchema.plugin(increment, {
  modelName: 'BasicSuffixPrefix',
  field: 'increment_field',
  start: 500,
  prefix: 'P',
  suffix: 'S',
});

const FunctionSuffixPrefixSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  flag: {
    type: Boolean,
    required: true,
  },
});

FunctionSuffixPrefixSchema.plugin(increment, {
  modelName: 'FunctionSuffixPrefix',
  field: 'increment_field',
  start: 300,
  increment: 3,
  prefix: (doc) => {  return doc.flag ? 'P-TRUE-' : 'P-FALSE-' },
  suffix: (doc) => {  return doc.flag ? '-S-TRUE' : '-S-FALSE' },
});

module.exports = {
  Default: mongoose.model('Default', DefaultSchema),
  BasicSuffixPrefix: mongoose.model('BasicSuffixPrefix', BasicSuffixPrefixSchema),
  FunctionSuffixPrefix: mongoose.model('FunctionSuffixPrefix', FunctionSuffixPrefixSchema),
};