'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isFunction = require('./utils/is-function');

var Identity = function () {
  function Identity(publicKey, sign, verify) {
    (0, _classCallCheck3.default)(this, Identity);

    if (!publicKey) {
      throw new Error('Invalid public key');
    }

    if (!isFunction(sign)) {
      throw new Error('Signing function is invalid');
    }

    if (!isFunction(verify)) {
      throw new Error('Signature verification function is invalid');
    }

    this._publicKey = publicKey;
    this._sign = sign;
    this._verify = verify;
  }

  /**
  * This is only used as a fallback to the clock id when necessary
  * @return {string} public key hex encoded
  */


  (0, _createClass3.default)(Identity, [{
    key: 'signEntry',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(data) {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                return _context.abrupt('return', this._sign(data));

              case 4:
                _context.prev = 4;
                _context.t0 = _context['catch'](0);

                console.error(_context.t0);
                throw new Error('Could not sign entry');

              case 8:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[0, 4]]);
      }));

      function signEntry(_x) {
        return _ref.apply(this, arguments);
      }

      return signEntry;
    }()
  }, {
    key: 'verifySignature',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(signature, key, data) {
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.prev = 0;
                return _context2.abrupt('return', this._verify(signature, key, data));

              case 4:
                _context2.prev = 4;
                _context2.t0 = _context2['catch'](0);

                console.error(_context2.t0);
                throw new Error('Could not validate signature');

              case 8:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[0, 4]]);
      }));

      function verifySignature(_x2, _x3, _x4) {
        return _ref2.apply(this, arguments);
      }

      return verifySignature;
    }()
  }, {
    key: 'id',
    get: function get() {
      return this._publicKey;
    }
  }, {
    key: 'publicKey',
    get: function get() {
      return this._publicKey;
    }
  }]);
  return Identity;
}();

module.exports = Identity;