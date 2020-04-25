"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var MinHash_1 = require("./MinHash");
var LSH_1 = require("./LSH");
var LSHMinHash = /** @class */ (function (_super) {
    __extends(LSHMinHash, _super);
    /**
     * Instantiates a LSH instance that internally uses MinHash,
     * with s stages (or bands) and b buckets (per stage), for sets out of a
     * dictionary of n elements.
     *
     * Attention: the number of buckets should be chosen such that we have at
     * least 100 items per bucket.
     *
     * @param s stages
     * @param b buckets (per stage)
     * @param n dictionary size
     */
    function LSHMinHash(s, b, n) {
        var _this = _super.call(this, s, b) || this;
        _this.THRESHOLD = 0.5;
        var signature_size = _this.computeSignatureSize(s, n);
        _this.mh = new MinHash_1.MinHash(signature_size, null, n);
        return _this;
    }
    /**
     * Compute the size of the signature according to "Mining of Massive
     * Datasets" p88.
     * It can be shown that, using MinHash, the probability that the
     * signatures of 2 sets with Jaccard similarity s agree in all the
     * rows of at least one stage (band), and therefore become a candidate
     * pair, is 1−(1−s^R)^b
     * where R = signature_size / b (number of rows in a stage/band)
     * Thus, the curve that shows the probability that 2 items fall in the
     * same bucket for at least one of the stages, as a function of their
     * Jaccard index similarity, has a S shape.
     * The threshold (the value of similarity at which the probability of
     * becoming a candidate is 1/2) is a function of the number of stages
     * (s, or bands b in the book) and the signature size:
     * threshold ≃ (1/s)^(1/R)
     * Hence the signature size can be computed as:
     * R = ln(1/s) / ln(threshold)
     * signature_size = R * b
     */
    LSHMinHash.prototype.computeSignatureSize = function (s, n) {
        var r = Math.ceil(Math.log(1.0 / s) / Math.log(this.THRESHOLD)) + 1;
        return r * s;
    };
    /**
     * Bin this vector to corresponding buckets.
     * @param vector
     * @return
     */
    LSHMinHash.prototype.hash = function (vector) {
        // return hashSignature(vector);
        return this.hashSignature(this.mh.signature(vector));
    };
    /**
     * Get the coefficients used by internal hashing functions.
     * @return
     */
    LSHMinHash.prototype.getCoefficients = function () {
        return this.mh.getCoefficients();
    };
    return LSHMinHash;
}(LSH_1.LSH));

module.exports = LSHMinHash;