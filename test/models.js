'use strict';

const mongoose = require('mongoose');

function createTestModels(increment) {
  const DefaultSchema = new mongoose.Schema({
    label: {
      type: String,
      required: true,
    },
  });

  DefaultSchema.plugin(increment, {
    modelName: 'Default',
    fieldName: 'increment_field',
  });

  const ResetUniqueSchema = new mongoose.Schema({
    label: {
      type: String,
      required: true,
    },
  });

  ResetUniqueSchema.plugin(increment, {
    modelName: 'ResetUniqueSchema',
    fieldName: 'increment_field',
    unique: false,
    resetAfter: 2,
  });

  const StringSchema = new mongoose.Schema({
    label: {
      type: String,
      required: true,
    },
  });

  StringSchema.plugin(increment, {
    type: String,
    modelName: 'DefaultString',
    fieldName: 'increment_field',
  });

  const BasicSuffixPrefixSchema = new mongoose.Schema({
    label: {
      type: String,
      required: true,
    },
  });

  BasicSuffixPrefixSchema.plugin(increment, {
    modelName: 'BasicSuffixPrefix',
    fieldName: 'increment_field',
    start: 500,
    prefix: 1,
    suffix: 9,
  });

  const BasicStringSuffixPrefixSchema = new mongoose.Schema({
    label: {
      type: String,
      required: true,
    },
  });

  BasicStringSuffixPrefixSchema.plugin(increment, {
    type: String,
    modelName: 'BasicStringSuffixPrefix',
    fieldName: 'increment_field',
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
    type: String,
    modelName: 'FunctionSuffixPrefix',
    fieldName: 'increment_field',
    start: 300,
    increment: 3,
    prefix: (doc) => {  return doc.flag ? 'P-TRUE-' : 'P-FALSE-' },
    suffix: (doc) => {  return doc.flag ? '-S-TRUE' : '-S-FALSE' },
  });

  const FunctionSuffixPrefixVersionSchema = new mongoose.Schema({
    label: {
      type: String,
      required: true,
    },
    flag: {
      type: Boolean,
      required: true,
    },
  });

  FunctionSuffixPrefixVersionSchema.plugin(increment, {
    type: String,
    modelName: 'FunctionSuffixPrefixVersion',
    fieldName: 'increment_field',
    start: 300,
    increment: 3,
    prefix: (doc) => {  return doc.flag ? 'P-TRUE-' : 'P-FALSE-' },
    suffix: (doc) => {  return doc.flag ? 'S-TRUE' : 'S-FALSE' },
    hasVersion: true,
  });

  return {
    Default: mongoose.model('Default', DefaultSchema),
    ResetUniqueSchema: mongoose.model('ResetUnique', ResetUniqueSchema),
    String: mongoose.model('String', StringSchema),
    BasicSuffixPrefix: mongoose.model('BasicSuffixPrefix', BasicSuffixPrefixSchema),
    BasicStringSuffixPrefix: mongoose.model('BasicStringSuffixPrefix', BasicStringSuffixPrefixSchema),
    FunctionSuffixPrefix: mongoose.model('FunctionSuffixPrefix', FunctionSuffixPrefixSchema),
    FunctionSuffixPrefixVersion: mongoose.model('FunctionSuffixPrefixVersion', FunctionSuffixPrefixVersionSchema),
  };
}

module.exports = createTestModels;