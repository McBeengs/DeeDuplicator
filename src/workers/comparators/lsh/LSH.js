"use strict";
exports.__esModule = true;
/**
 * Implementation of Locality Sensitive Hashing (LSH) principle, as described in
 * Leskovec, Rajaraman &amp; Ullman (2014), "Mining of Massive Datasets",
 * Cambridge University Press.
 *
 */
var LSH = /** @class */ (function () {
    function LSH(stages, buckets) {
        this.LARGE_PRIME = 433494437;
        this.DEFAULT_STAGES = 3;
        this.DEFAULT_BUCKETS = 10;
        this.stages = this.DEFAULT_STAGES;
        this.buckets = this.DEFAULT_BUCKETS;
        this.stages = stages;
        this.buckets = buckets;
    }
    /**
     * Hash a signature.
     * The signature is divided in s stages (or bands). Each stage is hashed to
     * one of the b buckets.
     * @param signature
     * @return An vector of s integers (between 0 and b-1)
     */
    LSH.prototype.hashSignature = function (signature) {
        // Create an accumulator for each stage
        var hash = new Array(this.stages);
        // Number of rows per stage
        var rows = Math.floor(signature.length / this.stages);
        for (var i = 0; i < signature.length; i++) {
            var stage = Math.floor(Math.min(i / rows, this.stages - 1));
            if (hash[stage] === undefined || hash[stage] === null) {
                hash[stage] = 0;
            }
            var calc = Math.floor((hash[stage] + signature[i] * this.LARGE_PRIME) % this.buckets);
            if (isNaN(calc)) { // Very very big hashes
                calc = Math.floor(hash[stage] % this.buckets);
            }
            hash[stage] = calc;
        }
        return hash;
    };
    return LSH;
}());
exports.LSH = LSH;
