'use strict';

const MONGO_URI = 'mongodb://localhost/mongoose-plugin-increment';
process.env.MONGO_URI = MONGO_URI;

const _ = require('lodash');
const mongoose = require('mongoose');
const expect = require('chai').expect;
const Promise = require('bluebird');

const CastError = mongoose.Error.CastError;
const ValidationError = mongoose.Error.ValidationError;
const ValidatorError = mongoose.Error.ValidatorError;

const increment = require('../increment');
const models = require('./models');

describe('Unit Testing ->', () => {
  before((done) => {
    mongoose.connect(MONGO_URI);

    mongoose.connection.on('connected', () => {
      mongoose.connection.db.dropDatabase();
      done();
    });
    mongoose.connection.on('error', done);
  });

  after((done) => {
    mongoose.connection.close(done);
  });

  describe('Create Schema', () => {
    it('should throw error when `options` is missing', (done) => {
      const TestSchema = new mongoose.Schema({
        label: {
          type: String,
          required: true,
        },
      });

      try {
        TestSchema.plugin(increment);
        done('Not supposed to happend');
      }
      catch (error) {
        expect(error).that.is.an.instanceof(Error)
          .to.have.property('message', 'Mongoose Increment Plugin: require `options` parameter');
        done();
      }
    });

    it('should throw error when `options.modelName` is missing', (done) => {
      const TestSchema = new mongoose.Schema({
        label: {
          type: String,
          required: true,
        },
      });

      try {
        TestSchema.plugin(increment, { });
        done('Not supposed to happend');
      }
      catch (error) {
        expect(error).that.is.an.instanceof(Error)
          .to.have.property('message', 'Mongoose Increment Plugin: require `options.modelName` parameter');
        done();
      }
    });

    it('should throw error when `options.fieldName` is missing', (done) => {
      const TestSchema = new mongoose.Schema({
        label: {
          type: String,
          required: true,
        },
      });

      try {
        TestSchema.plugin(increment, { modelName: 'Test' });
        done('Not supposed to happend');
      }
      catch (error) {
        expect(error).that.is.an.instanceof(Error)
          .to.have.property('message', 'Mongoose Increment Plugin: require `options.fieldName` parameter');
        done();
      }
    });

    it('should throw error when `options.start` is not an integer', (done) => {
      const TestSchema = new mongoose.Schema({
        label: {
          type: String,
          required: true,
        },
      });

      try {
        TestSchema.plugin(increment, {
          modelName: 'Test',
          fieldName: 'increment_field',
          start: 12.12,
        });
        done('Not supposed to happend');
      }
      catch (error) {
        expect(error).that.is.an.instanceof(Error)
          .to.have.property('message', 'Mongoose Increment Plugin: require `options.start` parameter must be an integer');
        done();
      }
    });

    it('should throw error when `options.increment` is not an integer', (done) => {
      const TestSchema = new mongoose.Schema({
        label: {
          type: String,
          required: true,
        },
      });

      try {
        TestSchema.plugin(increment, {
          modelName: 'Test',
          fieldName: 'increment_field',
          increment: '12',
        });
        done('Not supposed to happend');
      }
      catch (error) {
        expect(error).that.is.an.instanceof(Error)
          .to.have.property('message', 'Mongoose Increment Plugin: require `options.increment` parameter must be an integer');
        done();
      }
    });

    it('should add field `increment_field` to mongoose schema', () => {
      const TestSchema = new mongoose.Schema({
        label: {
          type: String,
          required: true,
        },
      });
      expect(TestSchema.paths.increment_field).to.not.exist;
      TestSchema.plugin(increment, {
        modelName: 'Test',
        fieldName: 'increment_field',
      });
      expect(TestSchema.paths.increment_field).to.exist;
    });

    it('should add method `nextSequence` to mongoose schema', () => {
      const TestSchema = new mongoose.Schema({
        label: {
          type: String,
          required: true,
        },
      });
      expect(TestSchema.methods.nextSequence).to.not.exist;
      TestSchema.plugin(increment, {
        modelName: 'Test',
        fieldName: 'increment_field',
      });
      expect(TestSchema.methods.nextSequence).to.exist;
    });

    it('should add method `parseSequence` to mongoose schema', () => {
      const TestSchema = new mongoose.Schema({
        label: {
          type: String,
          required: true,
        },
      });
      expect(TestSchema.methods.parseSequence).to.not.exist;
      TestSchema.plugin(increment, {
        modelName: 'Test',
        fieldName: 'increment_field',
      });
      expect(TestSchema.methods.parseSequence).to.exist;
    });

    it('should add static `resetSequence` to mongoose schema', () => {
      const TestSchema = new mongoose.Schema({
        label: {
          type: String,
          required: true,
        },
      });
      expect(TestSchema.statics.resetSequence).to.not.exist;
      TestSchema.plugin(increment, {
        modelName: 'Test',
        fieldName: 'increment_field',
      });
      expect(TestSchema.statics.resetSequence).to.exist;
    });
  });

  describe('Usage', () => {
    describe('Default Options', () => {
      let savedDoc;

      it('should save `increment_field` field with `1` as value by default 1/2', (done) => {
        const doc = new models.Default({ label: 'label_1' });

        doc.save()
          .then((res) => {
            expect(res).that.is.an('object')
              .to.have.property('increment_field', '1');
            savedDoc = doc;
            done();
          }).catch(done);
      });

      it('should return correct parsed sequence', () => {
        expect(savedDoc.parseSequence()).to.eql({
          prefix: '',
          counter: '1',
          suffix: '',
        });
      });

      it('should save `increment_field` field with `2` as value by default', (done) => {
        const doc = new models.Default({ label: 'label_2' });

        doc.save()
          .then((res) => {
            expect(res).that.is.an('object')
              .to.have.property('increment_field', '2');
            expect(doc.parseSequence()).to.eql({
              prefix: '',
              counter: '2',
              suffix: '',
            });
            done();
          }).catch(done);
      });

      it('should set `increment_field` field with `3` when call method `nextSequence`', (done) => {
        const doc = new models.Default({ label: 'label_3' });

        doc.nextSequence()
          .then(() => {
             expect(doc).that.is.an('object')
              .to.have.property('increment_field', '3');
            done();
          }).catch(done);
      });

      it('should not changed `increment_field` is doc is not new', (done) => {
        expect(savedDoc).that.is.an('object')
          .to.have.property('increment_field', '1');
        savedDoc.label = 'label_4';

        savedDoc.save()
          .then((res) => {
            expect(res).that.is.an('object')
              .to.have.property('increment_field', '1');
            done();
          }).catch(done);
      });

      it('should not set `increment_field` if doc is new and `increment_field` is not undefined', (done) => {
        const doc = new models.Default({ label: 'label_5', increment_field: 99 });

        doc.save()
          .then((res) => {
            expect(res).that.is.an('object')
              .to.have.property('increment_field', '99');
            done();
          }).catch(done);
      });

      it('should reset sequence and delete the first doc created', (done) => {
        models.Default.resetSequence()
          .then(() => {
            return savedDoc.remove(done);
          }).catch(done);
      });

      it('should save `increment_field` field with `1` as value by default 2/2', (done) => {
        const doc = new models.Default({ label: 'label_6' });

        doc.save()
          .then((res) => {
            expect(res).that.is.an('object')
              .to.have.property('increment_field', '1');
            expect(doc.parseSequence()).to.eql({
              prefix: '',
              counter: '1',
              suffix: '',
            });
            savedDoc = doc;
            done();
          }).catch(done);
      });
    });

    describe('Basic Suffix/Prefix And Start Options', () => {
      let savedDoc;

      it('should reset sequence', (done) => {
        models.BasicSuffixPrefix.resetSequence()
          .then(() => {
            done();
          }).catch(done);
      });

      it('should save `increment_field` field with `P500S` as value by default 1/2', (done) => {
        const doc = new models.BasicSuffixPrefix({ label: 'label_1' });

        doc.save()
          .then((res) => {
            expect(res).that.is.an('object')
              .to.have.property('increment_field', 'P500S');
            savedDoc = doc;
            done();
          }).catch(done);
      });

      it('should return correct parsed sequence', () => {
        expect(savedDoc.parseSequence()).to.eql({
          prefix: 'P',
          counter: '500',
          suffix: 'S',
        });
      });

      it('should save `increment_field` field with `P501S` as value by default', (done) => {
        const doc = new models.BasicSuffixPrefix({ label: 'label_2' });

        doc.save()
          .then((res) => {
            expect(res).that.is.an('object')
              .to.have.property('increment_field', 'P501S');
            expect(doc.parseSequence()).to.eql({
              prefix: 'P',
              counter: '501',
              suffix: 'S',
            });
            done();
          }).catch(done);
      });

      it('should set `increment_field` field with `P502S` when call method `nextSequence`', (done) => {
        const doc = new models.BasicSuffixPrefix({ label: 'label_3' });

        doc.nextSequence()
          .then(() => {
             expect(doc).that.is.an('object')
              .to.have.property('increment_field', 'P502S');
            done();
          }).catch(done);
      });

      it('should not changed `increment_field` is doc is not new', (done) => {
        expect(savedDoc).that.is.an('object')
          .to.have.property('increment_field', 'P500S');
        savedDoc.label = 'label_4';

        savedDoc.save()
          .then((res) => {
            expect(res).that.is.an('object')
              .to.have.property('increment_field', 'P500S');
            done();
          }).catch(done);
      });

      it('should not set `increment_field` if doc is new and `increment_field` is not undefined', (done) => {
        const doc = new models.BasicSuffixPrefix({ label: 'label_5', increment_field: 99 });

        doc.save()
          .then((res) => {
            expect(res).that.is.an('object')
              .to.have.property('increment_field', '99');
            done();
          }).catch(done);
      });

      it('should reset sequence and delete the first doc created', (done) => {
        models.BasicSuffixPrefix.resetSequence()
          .then(() => {
            return savedDoc.remove(done);
          }).catch(done);
      });

      it('should save `increment_field` field with `P500S` as value by default 2/2', (done) => {
        const doc = new models.BasicSuffixPrefix({ label: 'label_6' });

        doc.save()
          .then((res) => {
            expect(res).that.is.an('object')
              .to.have.property('increment_field', 'P500S');
            expect(doc.parseSequence()).to.eql({
              prefix: 'P',
              counter: '500',
              suffix: 'S',
            });
            done();
          }).catch(done);
      });
    });

    describe('Function Suffix/Prefix And Start And Increment Options', () => {
      let savedDoc;

      it('should save `increment_field` field with `P-TRUE-300-S-TRUE` as value by default 1/2', (done) => {
        const doc = new models.FunctionSuffixPrefix({ label: 'label_1', flag: true });

        doc.save()
          .then((res) => {
            expect(res).that.is.an('object')
              .to.have.property('increment_field', 'P-TRUE-300-S-TRUE');
            savedDoc = doc;
            done();
          }).catch(done);
      });

      it('should return correct parsed sequence', () => {
        expect(savedDoc.parseSequence()).to.eql({
          prefix: 'P-TRUE-',
          counter: '300',
          suffix: '-S-TRUE',
        });
      });

      it('should save `increment_field` field with `P-FALSE-303-S-FALSE` as value by default', (done) => {
        const doc = new models.FunctionSuffixPrefix({ label: 'label_2', flag: false  });

        doc.save()
          .then((res) => {
            expect(res).that.is.an('object')
              .to.have.property('increment_field', 'P-FALSE-303-S-FALSE');
            expect(doc.parseSequence()).to.eql({
              prefix: 'P-FALSE-',
              counter: '303',
              suffix: '-S-FALSE',
            });
            done();
          }).catch(done);
      });

      it('should set `increment_field` field with `P-TRUE-306-S-TRUE` when call method `nextSequence`', (done) => {
        const doc = new models.FunctionSuffixPrefix({ label: 'label_3', flag: true  });

        doc.nextSequence()
          .then(() => {
             expect(doc).that.is.an('object')
              .to.have.property('increment_field', 'P-TRUE-306-S-TRUE');
            done();
          }).catch(done);
      });

      it('should not changed `increment_field` is doc is not new', (done) => {
        expect(savedDoc).that.is.an('object')
          .to.have.property('increment_field', 'P-TRUE-300-S-TRUE');
        savedDoc.label = 'label_4';

        savedDoc.save()
          .then((res) => {
            expect(res).that.is.an('object')
              .to.have.property('increment_field', 'P-TRUE-300-S-TRUE');
            done();
          }).catch(done);
      });

      it('should not set `increment_field` if doc is new and `increment_field` is not undefined', (done) => {
        const doc = new models.FunctionSuffixPrefix({ label: 'label_5', flag: true, increment_field: 99 });

        doc.save()
          .then((res) => {
            expect(res).that.is.an('object')
              .to.have.property('increment_field', '99');
            done();
          }).catch(done);
      });

      it('should reset sequence and delete the first doc created', (done) => {
        models.FunctionSuffixPrefix.resetSequence()
          .then(() => {
            return savedDoc.remove(done);
          }).catch(done);
      });

      it('should save `increment_field` field with `P-TRUE-300-S-TRUE` as value by default 2/2', (done) => {
        const doc = new models.FunctionSuffixPrefix({ label: 'label_6', flag: true });

        doc.save()
          .then((res) => {
            expect(res).that.is.an('object')
              .to.have.property('increment_field', 'P-TRUE-300-S-TRUE');
            expect(doc.parseSequence()).to.eql({
              prefix: 'P-TRUE-',
              counter: '300',
              suffix: '-S-TRUE',
            });
            done();
          }).catch(done);
      });
    });
  });
});


